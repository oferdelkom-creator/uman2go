import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uman2go.runtime import run
from uman2go.db import ROUTES
from tests.test_mvp import Harness

class ReleaseTests(unittest.TestCase):
    def test_wrong_bot_cannot_change_settings_or_database(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'untouched.db'
            with patch('uman2go.runtime.Telegram') as factory:
                api = factory.return_value
                api.call.return_value = {'username': 'SwitchAppCarsBot'}
                with self.assertRaisesRegex(ValueError, 'restricted'):
                    run(path, 'test', {900}, 'UAH')
                api.call.assert_called_once_with('getMe', {})
                self.assertFalse(path.exists())

    def test_all_six_route_buttons_and_free_text(self):
        with tempfile.TemporaryDirectory() as folder:
            h = Harness(Path(folder) / 'test.db')
            h.send(20, '/book')
            h.send(20, location={'latitude': 47.01, 'longitude': 28.86})
            payloads = [json.loads(r['payload']) for r in h.rows('SELECT payload FROM outbox')]
            callbacks = {b['callback_data'] for p in payloads for row in p.get('reply_markup', {}).get('inline_keyboard', []) for b in row}
            self.assertEqual(6, len(ROUTES))
            self.assertTrue({'route:' + r for r in ROUTES} <= callbacks)
            h.send(20, 'Custom destination street 14')
            h.send(20, '3')
            ride = h.rows('SELECT * FROM rides')[0]
            self.assertIsNone(ride['route_id'])
            self.assertEqual('Custom destination street 14', ride['destination'])
            self.assertIsNone(ride['price'])
