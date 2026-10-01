import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from tests.test_mvp import Harness
from uman2go.db import connect
from uman2go.runtime import Worker
from uman2go.miniapp import MiniApp
from uman2go.telegram import TelegramError


class DeliveryP0Tests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.path=Path(self.tmp.name)/'test.db'
        self.h=Harness(self.path)

    def tearDown(self):
        self.tmp.cleanup()

    def test_driver_background_notification_priority_and_duplicate_dispatch(self):
        self.h.driver(10)
        self.h.driver(11)
        self.h.send(11,data='available:0')
        self.h.driver(12,approve=False)
        rid=self.h.booking()
        db=connect(self.path)
        self.h.service.dispatch(db,self.h.service.ride(db,rid))
        db.close()
        api=Mock(); api.call.return_value={'message_id':123}
        persisted=[]
        worker=Worker(self.path,api,batch_limit=1,persist=lambda:persisted.append(True))
        worker.flush()
        method,payload=api.call.call_args.args
        self.assertEqual('sendMessage',method)
        self.assertEqual(10,payload['chat_id'])
        self.assertFalse(payload['disable_notification'])
        self.assertTrue(any('web_app' in b for line in payload['reply_markup']['inline_keyboard'] for b in line))
        rows=self.h.rows("SELECT * FROM outbox WHERE notice_kind='request'")
        self.assertEqual(1,len(rows)); self.assertEqual(123,rows[0]['telegram_message_id'])
        self.assertEqual(2,len(persisted))

    def test_driver_goes_offline_before_delivery(self):
        self.h.driver(); self.h.booking()
        self.h.send(10,data='available:0')
        api=Mock(); Worker(self.path,api,batch_limit=500).flush()
        self.assertFalse(any('New ride offer' in p.get('text','') for _,p in [c.args for c in api.call.call_args_list]))
        self.assertEqual(1,self.h.rows("SELECT discarded FROM outbox WHERE notice_kind='request'")[0]['discarded'])

    def test_quote_updates_snapshot_and_telegram_without_passenger_reopening(self):
        self.h.driver(); rid=self.h.booking()
        app=MiniApp(self.path)
        self.assertFalse(app.snapshot({'id':20})['offers'])
        self.h.bid(10,rid,'345')
        snapshot=app.snapshot({'id':20})
        self.assertEqual(34500,snapshot['offers'][0]['price'])
        # Asking for status does not enqueue a second copy of the same price event.
        self.h.send(20,'/status')
        api=Mock(); Worker(self.path,api,batch_limit=1).flush()
        payload=api.call.call_args.args[1]
        self.assertEqual(20,payload['chat_id']); self.assertIn('345.00',payload['text'])
        self.assertEqual(1,len(self.h.rows("SELECT * FROM outbox WHERE notice_kind='quote'")))

    def test_unknown_telegram_result_is_not_blindly_retried(self):
        self.h.driver(); self.h.booking()
        api=Mock(); api.call.side_effect=TelegramError(0)
        worker=Worker(self.path,api,batch_limit=1,persist=lambda:None)
        worker.flush(now=100)
        row=self.h.rows("SELECT * FROM outbox WHERE notice_kind='request'")[0]
        self.assertEqual(100,row['sending_at'])
        api.reset_mock(); api.call.side_effect=None
        worker.flush(now=500)
        self.assertNotEqual(row['payload'],json.dumps(api.call.call_args.args[1],ensure_ascii=False))

    def test_persist_failure_after_send_does_not_resend_claimed_snapshot(self):
        self.h.driver(); self.h.booking()
        from uman2go.cloud_store import encode_database,restore_database
        checkpoint=[]
        def persist():
            if checkpoint: raise RuntimeError('database temporarily unavailable')
            checkpoint.append(encode_database(self.path))
        api=Mock(); api.call.return_value={'message_id':123}
        with self.assertRaises(RuntimeError): Worker(self.path,api,batch_limit=1,persist=persist).flush()
        restored=Path(self.tmp.name)/'restored.db';restore_database(restored,checkpoint[0])
        api.reset_mock(); Worker(restored,api,batch_limit=1).flush()
        self.assertNotIn('New ride offer',api.call.call_args.args[1].get('text',''))

    def test_active_passenger_still_sees_price_after_gps_expires(self):
        self.h.driver();rid=self.h.booking();self.h.bid(10,rid,'345')
        db=connect(self.path);db.execute('DELETE FROM location_access WHERE user_id=20');db.close()
        state=MiniApp(self.path).snapshot({'id':20})
        self.assertFalse(state['gps_required']);self.assertEqual(34500,state['offers'][0]['price'])
