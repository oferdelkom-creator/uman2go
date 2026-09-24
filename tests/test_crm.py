import json
import tempfile
import unittest
from pathlib import Path
from .test_mvp import Harness

class CRMTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.h = Harness(Path(self.temp.name) / 'db.sqlite3')

    def tearDown(self):
        self.temp.cleanup()

    def test_first_acquisition_source_is_preserved(self):
        self.h.service.process(self.h.update(20, '/start facebook'))
        self.h.send(20, '/start telegram')
        self.h.send(20, '/start')
        rows = self.h.rows('SELECT * FROM customers')
        self.assertEqual(1, len(rows))
        self.assertEqual('facebook', rows[0]['source'])
        self.assertEqual(0, rows[0]['subscribed'])

    def test_subscription_explicit_and_can_revoke_without_gps(self):
        self.h.send(20, '/subscribe')
        self.assertEqual(1, self.h.rows('SELECT * FROM customers')[0]['subscribed'])
        self.h.send(20, '/stopgps')
        self.h.send(20, '/unsubscribe')
        self.assertEqual(0, self.h.rows('SELECT * FROM customers')[0]['subscribed'])

    def test_admin_tags_and_notes_not_editable_by_customers(self):
        self.h.send(20, '/start')
        self.h.send(900, '/tag 20 returning')
        self.h.send(900, '/note 20 Needs child seat')
        self.h.send(20, '/tag 20 vip')
        self.h.send(20, '/note 20 overwrite')
        row = self.h.rows('SELECT * FROM customers')[0]
        self.assertEqual('returning', row['tag'])
        self.assertEqual('Needs child seat', row['note'])
        self.h.send(900, '/customer 20')
        self.h.send(900, '/customers')

    def test_community_urls_validate_and_are_opt_in_links(self):
        self.h.send(900, '/setcommunity facebook https://evil.example/groups/anything')
        self.assertEqual([], self.h.rows("SELECT * FROM metadata WHERE key='community_facebook'"))
        self.h.send(900, '/setcommunity facebook https://www.facebook.com/groups/example')
        self.h.send(900, '/setcommunity telegram https://t.me/example')
        self.h.send(20, '/community')
        payload = json.loads(self.h.rows("SELECT payload FROM outbox WHERE json_extract(payload,'$.chat_id')=20 ORDER BY id DESC LIMIT 1")[0]['payload'])
        self.assertEqual(2, len(payload['reply_markup']['inline_keyboard']))
        self.assertEqual(0, self.h.rows('SELECT * FROM customers')[0]['subscribed'])
        self.h.send(20, '/setcommunity telegram https://t.me/attacker')
        self.assertEqual('https://t.me/example', self.h.rows("SELECT value FROM metadata WHERE key='community_telegram'")[0]['value'])
