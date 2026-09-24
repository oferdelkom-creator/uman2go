import hashlib
import hmac
import json
import tempfile
import time
import unittest
import uuid
from pathlib import Path
from urllib.parse import urlencode
from uman2go.miniapp import MiniApp, authenticate, seed_demo
from uman2go.db import connect
from uman2go.service import InvalidAction

class AuthTests(unittest.TestCase):
    token = '123:test-secret'
    def signed(self, **overrides):
        data = {'auth_date':str(int(time.time())), 'user': json.dumps({'id':20,'first_name':'Passenger'}), **overrides}
        key = hmac.new(b'WebAppData',self.token.encode(),hashlib.sha256).digest()
        data['hash'] = hmac.new(key,'\n'.join(f'{k}={v}' for k,v in sorted(data.items())).encode(),hashlib.sha256).hexdigest()
        return urlencode(data)
    def test_valid_telegram_session(self):
        self.assertEqual(20,authenticate(self.signed(),self.token)['id'])
    def test_tampered_or_expired_or_future_session_rejected(self):
        for raw in (self.signed().replace('Passenger','Attacker'),self.signed(auth_date='1'),self.signed(auth_date=str(int(time.time())+900))):
            with self.assertRaises(PermissionError): authenticate(raw,self.token)
    def test_duplicate_keys_rejected(self):
        with self.assertRaises(PermissionError): authenticate(self.signed()+'&auth_date=1',self.token)

class MiniAppTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = MiniApp(Path(self.tmp.name)/'app.sqlite3',demo=True)
        seed_demo(self.app)
        self.p = {'id':20,'first_name':'Passenger','language_code':'he'}
        self.d = {'id':10,'first_name':'Driver','language_code':'he'}
    def tearDown(self): self.tmp.cleanup()
    def act(self,user,action,**values):
        return self.app.act(user,{'request_id':str(uuid.uuid4()),'action':action,**values})
    def book(self):
        self.act(self.p,'location',latitude=48.75,longitude=30.22)
        return self.act(self.p,'book',route='uman_kyiv',passengers=2)['ride']['id']
    def test_gps_required_on_server(self):
        with self.assertRaises(ValueError):self.act(self.p,'book',route='uman_kyiv',passengers=2)
        self.assertTrue(self.app.snapshot(self.p)['gps_required'])
    def test_complete_browser_flow_shares_service(self):
        rid=self.book()
        self.act(self.d,'quote',ride_id=rid,price='1750')
        state=self.app.snapshot(self.p)
        self.assertEqual(175000,state['offers'][0]['price'])
        self.assertNotIn('phone',state['offers'][0])
        state=self.act(self.p,'choose',ride_id=rid,driver_id=10)
        self.assertEqual('accepted',state['ride']['status'])
        self.act(self.p,'message',ride_id=rid,text='I am here')
        self.assertIn('I am here',self.app.snapshot(self.d)['messages'][0]['text'])
        for status in ('arrived','in_progress','completed'):
            self.act(self.d,'move',ride_id=rid,status=status)
        state=self.act(self.p,'rate',ride_id=rid,stars=5)
        self.assertEqual(5,state['history'][0]['stars'])
        self.assertEqual('on_arrival',state['payment'])
        self.assertTrue(state['history'][0]['distance_text'])
    def test_idempotent_booking_and_no_polling_offset_changes(self):
        self.act(self.p,'location',latitude=48,longitude=30)
        body={'request_id':str(uuid.uuid4()),'action':'book','route':'uman_kyiv','passengers':1}
        self.app.act(self.p,body)
        self.app.act(self.p,body)
        db=connect(self.app.path)
        self.assertEqual(1,db.execute('SELECT COUNT(*) FROM rides').fetchone()[0])
        self.assertIsNone(db.execute("SELECT * FROM metadata WHERE key='offset'").fetchone())
        db.close()
        with self.assertRaises(ValueError):self.app.act(self.p,{**body,'passengers':2})
    def test_foreign_passenger_cannot_choose_or_message(self):
        rid=self.book()
        self.act(self.d,'quote',ride_id=rid,price='100')
        other={'id':21,'first_name':'Other'}
        self.act(other,'location',latitude=48,longitude=30)
        with self.assertRaises(InvalidAction):self.act(other,'choose',ride_id=rid,driver_id=10)
        with self.assertRaises(ValueError):self.act(other,'message',ride_id=rid,text='not my trip')
        self.assertIsNone(self.app.snapshot(other)['ride'])
    def test_invalid_booking_rolls_back_every_step(self):
        self.act(self.p,'location',latitude=48,longitude=30)
        with self.assertRaises(ValueError):self.act(self.p,'book',destination='x',passengers=2)
        self.assertIsNone(self.app.snapshot(self.p)['ride'])
    def test_demo_header_does_not_bypass_live_auth(self):
        self.app.demo=False
        with self.assertRaises(PermissionError):self.app.identity({'X-Demo-Role':'driver'})
