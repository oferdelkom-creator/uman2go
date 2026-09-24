import json
import tempfile
import unittest
import uuid
from unittest.mock import patch, Mock
from pathlib import Path
from uman2go.db import connect
from uman2go.miniapp import MiniApp
from tests.test_mvp import Harness
from uman2go.runtime import Worker


class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'test.db'
        self.h = Harness(self.path)
        self.app = MiniApp(self.path, admins={900})

    def tearDown(self):
        self.tmp.cleanup()

    def state(self, uid):
        return self.app.snapshot({'id': uid, 'first_name': f'User {uid}'})

    def act(self, uid, action, **kw):
        return self.app.act({'id': uid, 'first_name': f'User {uid}'},
                            {'action': action, 'request_id': str(uuid.uuid4()), **kw})

    def test_private_inbox_and_read_persistence_without_gps(self):
        self.h.booking(uid=20)
        mine = self.state(20)['notifications']['items']
        self.assertTrue(mine)
        self.assertFalse(self.state(21)['notifications']['items'])
        nid = mine[0]['id']
        with self.assertRaises(ValueError):
            self.act(21, 'notification_read', notification_id=nid)
        db = connect(self.path)
        db.execute('DELETE FROM location_access WHERE user_id=20')
        db.close()
        self.act(20, 'notification_read', notification_id=nid)
        self.assertTrue(self.state(20)['gps_required'])
        fresh = MiniApp(self.path, admins={900}).snapshot({'id': 20})
        self.assertTrue(next(x for x in fresh['notifications']['items'] if x['id'] == nid)['read'])

    def test_pending_driver_action_requires_admin_and_owned_card(self):
        self.h.driver(10, approve=False)
        cards = self.state(900)['notifications']['items']
        card = next(x for x in cards if x['approve_driver'] == 10)
        with self.assertRaises(ValueError):
            self.act(10, 'notification_approve', notification_id=card['id'])
        self.act(900, 'notification_approve', notification_id=card['id'])
        self.assertEqual('approved', self.state(10)['driver']['approval'])
        with self.assertRaises(ValueError):
            self.act(900, 'notification_approve', notification_id=card['id'])

    def test_audit_for_web_and_bot_actions_without_poll_spam_or_replay(self):
        self.h.send(20, '/start')
        def alerts():
            return [x for x in self.state(900)['notifications']['items'] if 'פעילות במערכת' in x['text']]
        before = len(alerts())
        for _ in range(3): self.state(20)
        self.assertEqual(before, len(alerts()))
        body = {'action': 'location', 'request_id': str(uuid.uuid4()), 'latitude': 48.75, 'longitude': 30.23}
        self.app.act({'id': 20}, body)
        self.app.act({'id': 20}, body)
        self.assertEqual(before + 1, len(alerts()))
        self.assertNotIn('48.75', alerts()[0]['text'])
        update = self.h.update(20, '/status')
        self.h.service.process(update)
        self.h.service.process(update)
        self.assertEqual(before + 2, len(alerts()))

    def test_driver_receives_request_quote_acceptance_and_cancellation(self):
        self.h.driver(10)
        rid = self.h.booking()
        inbox = self.state(10)['notifications']['items']
        self.assertTrue(any('New ride offer' in x['text'] for x in inbox))
        self.h.bid(10, rid, '300')
        self.assertTrue(any('300.00' in x['text'] for x in self.state(20)['notifications']['items']))
        self.h.send(20, data=f'choose:{rid}:10')
        self.assertEqual('accepted', self.state(10)['ride']['status'])
        self.h.send(20, data=f'cancel:{rid}')
        self.assertTrue(any('cancelled' in x['text'].lower() and f'#{rid}' in x['text'] for x in self.state(10)['notifications']['items']))

    def test_unassigned_driver_also_receives_cancellation(self):
        self.h.driver(10)
        rid = self.h.booking()
        self.h.send(20, data=f'cancel:{rid}')
        self.assertTrue(any('cancelled' in x['text'].lower() and f'#{rid}' in x['text'] for x in self.state(10)['notifications']['items']))
        self.assertFalse(self.state(10)['jobs'])

    def test_notifications_do_not_request_silent_telegram_delivery(self):
        self.h.send(20, '/start')
        messages = self.h.rows("SELECT payload FROM outbox WHERE method='sendMessage'")
        self.assertTrue(all(json.loads(x['payload']).get('disable_notification') is False for x in messages))

    def test_untrusted_name_cannot_create_approve_action(self):
        self.h.driver(10, approve=False)
        db = connect(self.path)
        self.h.service.send(db, 900, 'Random name /approve 10')
        db.close()
        self.assertIsNone(self.state(900)['notifications']['items'][0]['approve_driver'])

    def test_delivery_budget_leaves_remaining_messages_durable(self):
        self.h.send(20, '/start')
        api = Mock()
        with patch('uman2go.runtime.time.monotonic', side_effect=[0, 0, 21]):
            Worker(self.path, api, batch_limit=25).flush(max_seconds=20)
        self.assertEqual(1, api.call.call_count)
        self.assertGreater(self.h.rows('SELECT COUNT(*) n FROM outbox WHERE sent_at IS NULL')[0]['n'], 0)
