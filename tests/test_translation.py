import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from uman2go.runtime import Worker
from uman2go.translation import LANGS, PHRASES, translate
from uman2go.telegram import TelegramError
from tests.test_mvp import Harness


class TranslationTests(unittest.TestCase):
    def test_all_phrase_directions_and_original_language(self):
        for row in PHRASES:
            for source_index, source in enumerate(row):
                for target_index, target in enumerate(LANGS):
                    self.assertEqual(None if source_index == target_index else row[target_index], translate(source, target))

    def test_no_partial_translation_or_numeric_changes(self):
        for text in ('I am not on my way', 'The car is red, plate AA148BB', '300 UAH +380939317660',
                     'I have arrived at a different address', 'Я в пути, через 5 минут', '<script>alert(1)</script>'):
            self.assertIsNone(translate(text, 'he'))
        self.assertEqual('אני בדרך', translate(' I AM ON MY WAY! ', 'he'))
        self.assertIsNone(translate('I am on my way', 'fr'))

    def test_worker_translation_retry_and_media(self):
        with tempfile.TemporaryDirectory() as tmp:
            h = Harness(Path(tmp) / 'db.sqlite3')
            h.driver(lang='ru')
            rid = h.booking(lang='he')
            h.bid(10, rid)
            h.send(20, data=f'choose:{rid}:10')
            api = Mock()
            worker = Worker(h.path, api, batch_limit=500)
            worker.flush(now=100)
            api.reset_mock()
            h.send(10, '/message Я в пути')
            def fail_relay(method, payload):
                if 'אני בדרך' in payload.get('text', ''):
                    raise TelegramError(503)
            api.call.side_effect = fail_relay
            worker.flush(now=100)
            relay = h.rows('SELECT * FROM outbox WHERE ride_id IS NOT NULL')[-1]
            payload = json.loads(relay['payload'])
            self.assertIn('אני בדרך', payload['text'])
            self.assertIn('Я в пути', payload['text'])
            self.assertNotIn('_translation', payload)
            self.assertIsNone(relay['sent_at'])
            api.reset_mock()
            api.call.side_effect = None
            worker.flush(now=1000)
            self.assertEqual(payload, api.call.call_args_list[0].args[1])
            h.send(20, '/message הגעתי')
            h.send(10, data=f'chat:{rid}')
            h.send(10, voice={'file_id': 'voice-example'})
            worker.flush(now=1000)
            relays = h.rows('SELECT * FROM outbox WHERE ride_id IS NOT NULL')
            self.assertIn('Я прибыл', json.loads(relays[-2]['payload'])['text'])
            self.assertEqual('sendVoice', relays[-1]['method'])
            self.assertNotIn('_translation', json.loads(relays[-1]['payload']))

    def test_cancelled_ride_is_discarded_without_translation(self):
        with tempfile.TemporaryDirectory() as tmp:
            h = Harness(Path(tmp) / 'db.sqlite3')
            h.driver()
            rid = h.booking(lang='he')
            h.bid(10, rid)
            h.send(20, data=f'choose:{rid}:10')
            h.send(10, '/message I am on my way')
            h.send(20, '/cancel')
            api = Mock()
            Worker(h.path, api, batch_limit=500).flush()
            self.assertFalse(any('אני בדרך' in c.args[1].get('text', '') for c in api.call.call_args_list))
