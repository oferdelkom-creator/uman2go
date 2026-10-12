import json
import tempfile
import unittest
from pathlib import Path
from .test_mvp import Harness
from uman2go.miniapp import MiniApp
from uman2go.db import connect

class SalesTaxiTests(unittest.TestCase):
    def test_start_draft_only_sends_review_button_without_ride_or_gps(self):
        with tempfile.TemporaryDirectory() as tmp:
            h = Harness(Path(tmp) / 'state.db')
            token = 'a' * 48
            h.service.process(h.update(20, '/start taxi_' + token))
            self.assertEqual([], h.rows('select * from rides'))
            self.assertEqual([], h.rows('select * from location_access'))
            payload = next(json.loads(r['payload']) for r in h.rows('select payload from outbox') if 'web_app' in r['payload'])
            self.assertEqual('https://www.uman2go.com/api/umanbot?draft=' + token,
                payload['reply_markup']['inline_keyboard'][0][0]['web_app']['url'])

    def test_handoff_request_requires_gps_and_replay_creates_one_ride(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = MiniApp(Path(tmp) / 'state.db')
            user = {'id': 20, 'first_name': 'Test', 'language_code': 'he'}
            body = {'action': 'book', 'request_id': 'taxi-' + 'b' * 48,
                'destination': 'Pushkina Street 20, Uman', 'passengers': 3}
            with self.assertRaisesRegex(ValueError, 'GPS_REQUIRED'):
                app.act(user, body)
            app.act(user, {'action': 'location', 'request_id': 'gps-test-001', 'latitude': 48.75, 'longitude': 30.22})
            first = app.act(user, body)
            again = app.act(user, body)
            self.assertEqual(first['ride']['id'], again['ride']['id'])
            self.assertEqual(3, first['ride']['passengers'])
            self.assertEqual('searching', first['ride']['status'])
            self.assertEqual([], first['offers'])
            with self.assertRaises(ValueError):
                app.act(user, {**body, 'passengers': 4})
            db = connect(app.path)
            self.assertEqual(1, db.execute('select count(*) from rides').fetchone()[0])
            db.close()
