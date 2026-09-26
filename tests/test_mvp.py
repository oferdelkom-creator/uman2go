import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uman2go.db import connect
from uman2go.service import Service
from uman2go.runtime import Worker, ProcessLock
from uman2go.telegram import TelegramError
from uman2go.i18n import LANGUAGES, ROWS, route_name

class Harness:
    def __init__(self, path):
        self.path = path
        self.service = Service(path, {900})
        self.seq = 0
        self.located = set()

    def update(self, uid, text=None, data=None, **extra):
        self.seq += 1
        sender = {'id': uid, 'first_name': f'User {uid}', 'language_code': 'en'}
        msg = {'chat': {'id': uid, 'type': 'private'}, 'from': sender, **extra}
        if text is not None:
            msg['text'] = text
        return {'update_id': self.seq, **({'callback_query': {'id': f'cb{self.seq}', 'from': sender, 'message': msg, 'data': data}} if data else {'message': msg})}

    def send(self, uid, text=None, data=None, **extra):
        if uid != 900 and uid not in self.located:
            self.located.add(uid)
            self.service.process(self.update(uid, location={'latitude': 47.01, 'longitude': 28.86}, message_id=900000 + uid))
        self.service.process(self.update(uid, text, data, **extra))

    def rows(self, sql, params=()):
        db = connect(self.path)
        try:
            return [dict(r) for r in db.execute(sql, params).fetchall()]
        finally:
            db.close()

    def driver(self, uid=10, seats=4, approve=True, lang='en'):
        self.send(uid, data='lang:' + lang)
        self.send(uid, '/driver')
        self.send(uid, 'Mercedes Vito black')
        self.send(uid, 'AA1234BB')
        self.send(uid, str(seats))
        self.send(uid, contact={'user_id': uid, 'phone_number': '+380501234567'})
        self.send(uid, photo=[{'file_id': 'test_vehicle_photo'}])
        if approve:
            self.send(900, f'/approve {uid}')
            self.send(uid, data='available:1')

    def booking(self, uid=20, passengers=2, route='chisinau_uman', confirm=True, lang='en'):
        self.send(uid, data='lang:' + lang)
        self.send(uid, '/book')
        self.send(uid, location={'latitude': 47.01, 'longitude': 28.86})
        if route:
            self.send(uid, data='route:' + route)
        else:
            self.send(uid, 'Pushkina Street 20, Uman')
        self.send(uid, str(passengers))
        rid = self.rows('SELECT id FROM rides WHERE passenger_id=? ORDER BY id DESC', (uid,))[0]['id']
        if confirm:
            self.send(uid, data=f'confirm:{rid}')
        return rid

    def bid(self, driver, rid, price='125.50'):
        self.send(driver, data=f'accept:{rid}')
        self.send(driver, price)

class MVPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.h = Harness(Path(self.temp.name) / 'db.sqlite3')

    def tearDown(self):
        self.temp.cleanup()

    def ride(self, rid=1):
        return self.h.rows('SELECT * FROM rides WHERE id=?', (rid,))[0]

    def test_full_trip_all_four_languages(self):
        for i, lang in enumerate(LANGUAGES):
            driver, passenger = 10 + i, 20 + i
            self.h.driver(driver, lang=lang)
            rid = self.h.booking(passenger, lang=lang)
            self.h.bid(driver, rid)
            self.assertEqual('searching', self.ride(rid)['status'])
            self.assertIsNone(self.ride(rid)['driver_id'])
            self.h.send(passenger, data=f'choose:{rid}:{driver}')
            self.assertEqual(12550, self.ride(rid)['price'])
            self.assertEqual('UAH', self.ride(rid)['currency'])
            self.assertIn('₴ (UAH)', self.h.service.money(self.ride(rid), lang))
            self.assertEqual(driver, self.ride(rid)['driver_id'])
            for status in ('arrived', 'in_progress', 'completed'):
                self.h.send(driver, data=f'move:{rid}:{status}')
                self.assertEqual(status, self.ride(rid)['status'])

    def test_multiple_quotes_passenger_selects_price(self):
        self.h.driver(10)
        self.h.driver(11)
        rid = self.h.booking()
        self.h.bid(10, rid, '150')
        self.h.bid(11, rid, '110')
        self.h.send(20, data=f'choose:{rid}:11')
        self.assertEqual((11, 11000), (self.ride()['driver_id'], self.ride()['price']))
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertEqual(11, self.ride()['driver_id'])

    def test_offer_price_cannot_change_under_old_button(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.bid(10, rid, '150')
        self.h.bid(10, rid, '999')
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertEqual(15000, self.ride()['price'])

    def test_only_owner_can_accept_driver_quote(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.bid(10, rid)
        self.h.send(21, data=f'choose:{rid}:10')
        self.assertIsNone(self.ride()['driver_id'])

    def test_admin_views_and_suspension(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.bid(10, rid)
        for command in ('/admin', '/drivers', '/rides', '/prices', '/health'):
            self.h.send(900, command)
        self.h.send(900, '/reject 10')
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertIsNone(self.ride()['driver_id'])
        self.assertEqual('rejected', self.h.rows('SELECT * FROM drivers')[0]['approval'])

    def test_free_address_same_quote_flow(self):
        self.h.driver()
        rid = self.h.booking(route=None)
        self.h.bid(10, rid, '77.20')
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertEqual(7720, self.ride()['price'])
        self.assertIsNone(self.ride()['route_id'])

    def test_duplicate_update_exactly_once(self):
        rid = self.h.booking(confirm=False)
        update = self.h.update(20, data=f'confirm:{rid}')
        self.h.service.process(update)
        count = len(self.h.rows('SELECT * FROM outbox'))
        self.h.service.process(update)
        self.assertEqual(count, len(self.h.rows('SELECT * FROM outbox')))
        self.assertEqual(1, len(self.h.rows("SELECT * FROM events WHERE action='confirmed'")))

    def test_concurrent_choice_assigns_only_one_driver(self):
        for driver in (10, 11):
            self.h.driver(driver)
        rid = self.h.booking()
        for driver in (10, 11):
            self.h.bid(driver, rid)
        updates = [self.h.update(20, data=f'choose:{rid}:{driver}') for driver in (10, 11)]
        with ThreadPoolExecutor(2) as pool:
            list(pool.map(self.h.service.process, updates))
        self.assertEqual(1, len(self.h.rows("SELECT * FROM offers WHERE status='accepted'")))
        self.assertEqual(1, len(self.h.rows("SELECT * FROM events WHERE action LIKE 'price_accepted:%'")))

    def test_one_driver_cannot_take_two_rides_concurrently(self):
        self.h.driver()
        a, b = self.h.booking(20), self.h.booking(21)
        self.h.bid(10, a)
        self.h.bid(10, b)
        updates = [self.h.update(uid, data=f'choose:{rid}:10') for uid, rid in ((20, a), (21, b))]
        with ThreadPoolExecutor(2) as pool:
            list(pool.map(self.h.service.process, updates))
        self.assertEqual(1, len(self.h.rows("SELECT * FROM rides WHERE status='accepted'")))

    def test_capacity_and_approval_filter(self):
        self.h.driver(10, seats=2)
        self.h.driver(11, seats=8, approve=False)
        self.h.booking(passengers=5)
        self.assertEqual([], self.h.rows('SELECT * FROM offers'))

    def test_no_drivers_late_availability(self):
        self.h.booking()
        self.assertEqual([], self.h.rows('SELECT * FROM offers'))
        self.h.driver()
        self.assertEqual(1, len(self.h.rows('SELECT * FROM offers')))

    def test_unauthorized_admin_and_foreign_booking(self):
        self.h.driver(10, approve=False)
        self.h.send(20, '/approve 10')
        self.assertEqual('pending', self.h.rows('SELECT * FROM drivers')[0]['approval'])
        rid = self.h.booking()
        self.h.send(21, data=f'cancel:{rid}')
        self.assertEqual('searching', self.ride()['status'])

    def test_stale_quote_after_driver_goes_offline(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.bid(10, rid)
        self.h.send(10, data='available:0')
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertIsNone(self.ride()['driver_id'])

    def test_cancellation_invalidates_bids(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.bid(10, rid)
        self.h.send(20, '/cancel')
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertEqual('cancelled', self.ride()['status'])
        self.assertIsNone(self.ride()['driver_id'])

    def test_invalid_prices_dont_create_offer(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.send(10, data=f'accept:{rid}')
        for price in ('-1', '0', 'NaN', 'Infinity', '0.001', 'abc', '100001'):
            self.h.send(10, price)
            self.assertIsNone(self.h.rows('SELECT * FROM offers')[0]['price'])
        self.h.send(10, '50.25')
        self.assertEqual(5025, self.h.rows('SELECT * FROM offers')[0]['price'])

    def test_cannot_skip_status_or_change_another_drivers_trip(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.bid(10, rid)
        self.h.send(20, data=f'choose:{rid}:10')
        self.h.send(10, data=f'move:{rid}:completed')
        self.h.send(11, data=f'move:{rid}:arrived')
        self.assertEqual('accepted', self.ride()['status'])

    def test_restart_retains_conversation_and_offers(self):
        self.h.send(20, '/book')
        self.h.service = Service(self.h.path, {900})
        self.h.send(20, location={'latitude': 47.01, 'longitude': 28.86})
        self.assertEqual('destination', self.h.rows('SELECT * FROM users')[0]['state'])

    def test_foreign_contact_rejected(self):
        for text in ('/driver', 'White bus', 'AB1234', '8'):
            self.h.send(10, text)
        self.h.send(10, contact={'user_id': 11, 'phone_number': '+380501234567'})
        self.assertEqual([], self.h.rows('SELECT * FROM drivers'))

    def test_decline_not_resent_on_toggle(self):
        self.h.driver()
        rid = self.h.booking()
        self.h.send(10, data=f'decline:{rid}')
        self.h.send(10, data='available:0')
        self.h.send(10, data='available:1')
        self.assertEqual('declined', self.h.rows('SELECT * FROM offers')[0]['status'])

    def test_only_one_active_request(self):
        self.h.booking()
        self.h.send(20, '/book')
        self.assertEqual(1, len(self.h.rows('SELECT * FROM rides')))

    def test_future_booking_is_stored_and_shown_to_drivers(self):
        self.h.driver()
        self.h.send(20, data='lang:uk')
        self.h.send(20, data='future_book')
        self.h.send(20, location={'latitude': 47.01, 'longitude': 28.86})
        self.h.send(20, data='route:uman_kyiv')
        self.h.send(20, '2')
        when = (datetime.now(timezone.utc) + timedelta(days=2)).astimezone().strftime('%d.%m.%Y %H:%M')
        self.h.send(20, when)
        ride = self.ride()
        self.assertIsNotNone(ride['scheduled_for'])
        self.h.send(20, data=f'confirm:{ride["id"]}')
        driver_messages = [r['payload'] for r in self.h.rows("SELECT payload FROM outbox WHERE method='sendMessage'") if 'Запланована подача' in r['payload']]
        self.assertTrue(driver_messages)

    def test_future_booking_rejects_bad_or_immediate_time(self):
        self.h.send(20, data='future_book')
        self.h.send(20, location={'latitude': 47.01, 'longitude': 28.86})
        self.h.send(20, data='route:uman_kyiv')
        self.h.send(20, '2')
        self.h.send(20, 'tomorrow')
        self.h.send(20, datetime.now().strftime('%d.%m.%Y %H:%M'))
        self.assertEqual([], self.h.rows('SELECT * FROM rides'))
        self.assertEqual('schedule', self.h.rows('SELECT state FROM users WHERE id=20')[0]['state'])

    def test_nonprivate_updates_ignored(self):
        update = self.h.update(20, '/book')
        update['message']['chat']['type'] = 'group'
        self.h.service.process(update)
        self.assertEqual([], self.h.rows('SELECT * FROM users'))

    def test_malformed_callback_does_not_poison_polling(self):
        self.h.send(20, data='move:1')
        self.h.send(20, data='confirm:bad')
        self.assertEqual(3, len(self.h.rows('SELECT * FROM updates')))

    def test_language_catalog_complete(self):
        for key, values in ROWS.items():
            self.assertEqual(4, len(values), key)
            self.assertTrue(all(values))
        for lang in LANGUAGES:
            self.assertIn('→', route_name(lang, 'kyiv_uman'))

    def test_outbox_retry_and_no_booking_duplication(self):
        self.h.booking()
        class API:
            fail = True
            calls = 0
            def call(api, method, payload):
                api.calls += 1
                if api.fail:
                    raise TelegramError(429, 10)
                return True
        api = API()
        worker = Worker(self.h.path, api)
        worker.flush(now=100)
        self.assertEqual(1, api.calls)
        api.fail = False
        worker.flush(now=101)
        self.assertEqual(1, api.calls)
        worker.flush(now=111)
        self.assertEqual([], self.h.rows('SELECT * FROM outbox WHERE sent_at IS NULL'))
        self.assertEqual(1, len(self.h.rows('SELECT * FROM rides')))

    def test_process_lock(self):
        with ProcessLock(self.h.path):
            with self.assertRaises(ValueError):
                with ProcessLock(self.h.path):
                    self.fail('lock acquired twice')

if __name__ == '__main__':
    unittest.main()

