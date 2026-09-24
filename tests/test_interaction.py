import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from uman2go.service import Service
from uman2go.runtime import Worker
from .test_mvp import Harness

class InteractionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.h = Harness(Path(self.temp.name) / 'db.sqlite3')
        self.h.driver()
        self.rid = self.h.booking()
        self.h.bid(10, self.rid)
        self.h.send(20, data=f'choose:{self.rid}:10')

    def tearDown(self):
        self.temp.cleanup()

    def relays(self):
        return self.h.rows('SELECT * FROM outbox WHERE ride_id IS NOT NULL AND discarded=0')

    def complete(self):
        for status in ('arrived', 'in_progress', 'completed'):
            self.h.send(10, data=f'move:{self.rid}:{status}')

    def gps(self, uid=10, mid=100, lat=48.75, edited=False, live=True):
        loc = {'latitude': lat, 'longitude': 30.2}
        if live:
            loc['live_period'] = 900
        update = self.h.update(uid, message_id=mid, location=loc)
        if edited:
            update['edited_message'] = update.pop('message')
        self.h.service.process(update)

    def test_text_relay_and_reply_both_directions(self):
        self.h.send(10, data=f'chat:{self.rid}')
        self.h.send(10, 'I am outside the hotel')
        self.h.send(20, '/message Coming in 2 minutes')
        rows = self.relays()
        self.assertEqual([20, 10], [json.loads(r['payload'])['chat_id'] for r in rows])
        self.assertIn('I am outside', json.loads(rows[0]['payload'])['text'])
        self.assertEqual(f'chat:{self.rid}', json.loads(rows[0]['payload'])['reply_markup']['inline_keyboard'][0][0]['callback_data'])

    def test_voice_and_photo_relay_without_forward_identity(self):
        self.h.send(10, data=f'chat:{self.rid}')
        self.h.send(10, voice={'file_id': 'voice-id'})
        self.h.send(20, data=f'chat:{self.rid}')
        self.h.send(20, photo=[{'file_id': 'small'}, {'file_id': 'large'}], caption='Entrance')
        rows = self.relays()
        self.assertEqual(['sendVoice', 'sendPhoto'], [r['method'] for r in rows])
        self.assertEqual('large', json.loads(rows[1]['payload'])['photo'])

    def test_foreign_user_cannot_read_or_message(self):
        for data in (f'chat:{self.rid}', f'gps:{self.rid}', f'where:{self.rid}'):
            self.h.send(99, data=data)
        self.h.send(99, '/message attack')
        self.assertEqual([], self.relays())

    def test_start_exits_chat_mode(self):
        self.h.send(10, data=f'chat:{self.rid}')
        self.h.send(10, '/start')
        self.h.send(10, 'Do not send this')
        self.assertEqual([], self.relays())

    def test_gps_updates_and_pending_coalescing(self):
        self.gps()
        self.gps(lat=48.8, edited=True)
        locations = self.h.rows('SELECT * FROM ride_locations')
        self.assertEqual(48.8, locations[0]['latitude'])
        rows = self.relays()
        self.assertEqual(1, len(rows))
        self.assertEqual('sendLocation', rows[0]['method'])
        self.assertEqual(48.8, json.loads(rows[0]['payload'])['latitude'])
        self.assertEqual(20, json.loads(rows[0]['payload'])['chat_id'])

    def test_passenger_gps_and_where_latest(self):
        self.gps(uid=20)
        self.h.send(10, '/where')
        self.assertTrue(all(json.loads(r['payload'])['chat_id'] == 10 for r in self.relays()))

    def test_gps_stop_ignores_old_stream_until_new_share(self):
        self.gps()
        self.h.send(10, '/stopgps')
        self.gps(lat=49, edited=True)
        self.assertEqual([], self.h.rows('SELECT * FROM ride_locations'))
        self.assertEqual([], self.relays())
        self.gps(mid=101, lat=49.1)
        self.assertEqual(49.1, self.h.rows('SELECT * FROM ride_locations')[0]['latitude'])

    def test_unrecognized_location_edit_is_not_shared(self):
        self.gps(edited=True)
        self.assertEqual([], self.relays())

    def test_completion_disables_pending_chat_gps_and_prompts_rating(self):
        self.gps()
        self.h.send(10, '/message old message')
        self.complete()
        self.assertEqual([], self.relays())
        self.assertEqual([], self.h.rows('SELECT * FROM ride_locations'))
        payloads = [json.loads(r['payload']) for r in self.h.rows("SELECT * FROM outbox WHERE method='sendMessage'")]
        self.assertTrue(any('rate:1:5' in json.dumps(p) for p in payloads))

    def test_old_live_stream_not_sent_to_new_passenger(self):
        self.gps()
        self.complete()
        self.h.send(10, data='available:1')
        rid = self.h.booking(uid=21)
        self.h.bid(10, rid)
        self.h.send(21, data=f'choose:{rid}:10')
        self.gps(edited=True, lat=50)
        self.assertEqual([], self.relays())

    def test_cancel_closes_communication(self):
        self.h.send(10, '/message pending')
        self.h.send(20, '/cancel')
        self.h.send(10, data=f'chat:{self.rid}')
        self.assertEqual([], self.relays())

    def test_only_completed_trip_passenger_can_rate_once(self):
        self.h.send(20, data=f'rate:{self.rid}:5')
        self.assertEqual([], self.h.rows('SELECT * FROM ratings'))
        self.complete()
        for uid, stars in ((10, 5), (99, 5), (20, 0), (20, 6)):
            self.h.send(uid, data=f'rate:{self.rid}:{stars}')
        self.assertEqual([], self.h.rows('SELECT * FROM ratings'))
        self.h.send(20, data=f'rate:{self.rid}:4')
        self.h.send(20, data=f'rate:{self.rid}:1')
        ratings = self.h.rows('SELECT * FROM ratings')
        self.assertEqual(1, len(ratings))
        self.assertEqual(4, ratings[0]['stars'])

    def test_rating_persists_and_shown_with_future_offer(self):
        self.complete()
        self.h.send(20, data=f'rate:{self.rid}:5')
        self.h.service = Service(self.h.path, {900})
        self.h.send(10, data='available:1')
        rid = self.h.booking(uid=21)
        self.h.bid(10, rid)
        payloads = [json.loads(r['payload']) for r in self.h.rows("SELECT * FROM outbox WHERE method='sendMessage'")]
        self.assertTrue(any('5.0/5' in p['text'] and '1 ratings' in p['text'] and p['chat_id'] == 21 for p in payloads))

    def test_rate_command_recovers_missed_prompt(self):
        self.complete()
        before = len(self.h.rows('SELECT * FROM outbox'))
        self.h.send(20, '/rate')
        self.assertGreater(len(self.h.rows('SELECT * FROM outbox')), before)
        payload = json.loads(self.h.rows("SELECT * FROM outbox WHERE json_extract(payload,'$.chat_id')=20 ORDER BY id DESC LIMIT 1")[0]['payload'])
        self.assertIn('rate:1:5', json.dumps(payload))

    def test_delivery_rechecks_ride_authorization(self):
        self.h.send(10, '/message pending')
        db = sqlite3.connect(self.h.path)
        db.execute("UPDATE rides SET status='completed' WHERE id=?", (self.rid,))
        db.commit()
        db.close()
        class API:
            calls = []
            def call(api, method, payload):
                api.calls.append((method, payload))
        api = API()
        for _ in range(5):
            Worker(self.h.path, api).flush()
        self.assertFalse(any('pending' in p.get('text', '') for _, p in api.calls if p.get('chat_id') == 20))
        self.assertEqual([], self.relays())

class MigrationTests(unittest.TestCase):
    def test_existing_outbox_migrates_without_data_loss(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'legacy.sqlite3'
            db = sqlite3.connect(path)
            db.execute('CREATE TABLE outbox(id INTEGER PRIMARY KEY,method TEXT,payload TEXT,attempts INTEGER DEFAULT 0,next_attempt REAL DEFAULT 0,sent_at TEXT,failed INTEGER DEFAULT 0)')
            db.execute("INSERT INTO outbox(method,payload) VALUES ('sendMessage','{}')")
            db.commit()
            db.close()

            Service(path, {900})
            Service(path, {900})
            db = sqlite3.connect(path)
            self.assertEqual(1, db.execute('SELECT COUNT(*) FROM outbox').fetchone()[0])
            self.assertEqual(0, db.execute('SELECT discarded FROM outbox').fetchone()[0])
            db.close()

class MandatoryGPSTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.h = Harness(Path(self.temp.name) / 'db.sqlite3')

    def tearDown(self):
        self.temp.cleanup()

    def raw(self, uid, text=None, data=None, **extra):
        self.h.service.process(self.h.update(uid, text, data, **extra))

    def test_registration_and_booking_require_location(self):
        self.raw(10, '/driver')
        self.raw(20, '/book')
        self.assertTrue(all(r['state'] == 'home' for r in self.h.rows('SELECT * FROM users')))
        self.assertEqual([], self.h.rows('SELECT * FROM drivers'))
        self.assertEqual([], self.h.rows('SELECT * FROM rides'))
        self.raw(10, location={'latitude': 49, 'longitude': 30})
        self.raw(10, '/driver')
        self.assertEqual('vehicle', self.h.rows('SELECT state FROM users WHERE id=10')[0]['state'])

    def test_text_pickup_cannot_replace_gps(self):
        self.h.send(20, '/book')
        self.h.send(20, 'Chisinau Airport, arrivals')
        self.assertEqual('pickup', self.h.rows('SELECT state FROM users WHERE id=20')[0]['state'])

    def test_expired_driver_not_dispatched_or_assigned(self):
        self.h.driver()
        db = sqlite3.connect(self.h.path)
        db.execute('UPDATE location_access SET updated_at=0 WHERE user_id=10')
        db.commit()
        db.close()
        self.h.booking()
        self.assertEqual([], self.h.rows('SELECT * FROM offers'))
        self.raw(10, data='available:1')
        payload = json.loads(self.h.rows("SELECT payload FROM outbox WHERE json_extract(payload,'$.chat_id')=10 ORDER BY id DESC LIMIT 1")[0]['payload'])
        self.assertIn('GPS', payload['text'])

    def test_stopgps_revokes_access_even_without_trip(self):
        self.h.driver()
        self.h.send(10, '/stopgps')
        self.assertEqual([], self.h.rows('SELECT * FROM location_access WHERE user_id=10'))
        self.assertEqual(0, self.h.rows('SELECT available FROM drivers')[0]['available'])

    def test_admin_can_manage_without_location(self):
        self.raw(900, '/admin')
        payloads = [json.loads(r['payload']) for r in self.h.rows("SELECT payload FROM outbox WHERE method='sendMessage'")]
        self.assertTrue(any('/approve' in p['text'] for p in payloads))

    def test_admin_booking_still_requires_gps(self):
        self.raw(900, '/book')
        self.assertEqual('home', self.h.rows('SELECT state FROM users WHERE id=900')[0]['state'])

    def test_delayed_old_gps_update_does_not_grant_access(self):
        self.raw(20, location={'latitude': 49, 'longitude': 30}, date=1)
        self.raw(20, '/book')
        self.assertEqual([], self.h.rows('SELECT * FROM location_access'))
        self.assertEqual('home', self.h.rows('SELECT state FROM users WHERE id=20')[0]['state'])
