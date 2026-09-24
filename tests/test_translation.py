import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
import sqlite3
from uman2go.runtime import Worker
from uman2go.translation import LANGS, PHRASES, translate, prepare, protect, restore, notice
from uman2go.telegram import TelegramError
from tests.test_mvp import Harness


class TranslationTests(unittest.TestCase):
    def test_paid_translation_and_durable_once_only_attempt(self):
        with patch.dict('os.environ', {'LINGOBRIDGE_GOOGLE_TRANSLATION_API_KEY': 'test-only'}):
            db = sqlite3.connect(':memory:', isolation_level=None)
            db.row_factory = sqlite3.Row
            db.execute('CREATE TABLE outbox(id INTEGER PRIMARY KEY,payload TEXT)')
            source = 'My car is 148AA, phone +380939317660, price 300 UAH'
            payload = {'chat_id': 20, 'text': 'Driver\n' + source, '_translation': {'source': source, 'prefix': 'Driver', 'target': 'he'}}
            db.execute('INSERT INTO outbox VALUES (1,?)', (json.dumps(payload),))
            calls = []
            def persist():
                saved = json.loads(db.execute('SELECT payload FROM outbox').fetchone()[0])
                self.assertNotIn('_translation', saved)
                calls.append('save')
            def provider(text, target):
                self.assertEqual(['save'], calls)
                self.assertNotIn('+380939317660', text)
                calls.append('provider')
                return 'הרכב ⟦LB0⟧ טלפון ⟦LB1⟧ מחיר ⟦LB2⟧ UAH'
            row = db.execute('SELECT * FROM outbox').fetchone()
            result = prepare(db, row, persist, provider)
            self.assertEqual(['save','provider','save'], calls)
            self.assertIn(source, result['text'])
            self.assertIn('הרכב 148AA', result['text'])
            self.assertEqual('complete', db.execute('SELECT state FROM translation_attempts').fetchone()[0])
            self.assertEqual(result, prepare(db, db.execute('SELECT * FROM outbox').fetchone(), persist, provider))
            self.assertEqual(['save','provider','save'], calls)
            self.assertIn('Google', notice('he'))
            db.close()

    def test_paid_failure_and_persistence_failure_do_not_retry(self):
        for failure in ('provider', 'save'):
            with patch.dict('os.environ', {'LINGOBRIDGE_GOOGLE_TRANSLATION_API_KEY': 'test-only'}):
                db = sqlite3.connect(':memory:', isolation_level=None)
                db.row_factory = sqlite3.Row
                db.execute('CREATE TABLE outbox(id INTEGER PRIMARY KEY,payload TEXT)')
                payload = {'text': 'Driver\nNew text', '_translation': {'source':'New text', 'prefix':'Driver','target':'he'}}
                db.execute('INSERT INTO outbox VALUES (1,?)', (json.dumps(payload),))
                provider = Mock(side_effect=TimeoutError())
                persist = Mock(side_effect=RuntimeError() if failure == 'save' else None)
                if failure == 'save':
                    with self.assertRaises(RuntimeError):
                        prepare(db, db.execute('SELECT * FROM outbox').fetchone(), persist, provider)
                    provider.assert_not_called()
                else:
                    result = prepare(db, db.execute('SELECT * FROM outbox').fetchone(), persist, provider)
                    self.assertIn('New text', result['text'])
                    provider.assert_called_once()
                    prepare(db, db.execute('SELECT * FROM outbox').fetchone(), persist, provider)
                    provider.assert_called_once()
                db.close()

    def test_protected_identifiers_and_invalid_provider_results(self):
        text = '148AA AA148BB +380939317660 https://example.com/a?id=7 x@example.com 300.00'
        masked, values = protect(text)
        self.assertEqual(text, restore(masked, values))
        self.assertNotIn('148', masked)
        for bad in ('missing tokens', masked + ' 999', masked + ' ⟦LB0⟧', masked + ' ⟦LB99⟧'):
            with self.assertRaises(ValueError): restore(bad, values)

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
