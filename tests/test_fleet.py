import json
import tempfile
import unittest
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from uman2go.db import connect
from uman2go.service import Service
from uman2go.service import InvalidAction
from uman2go.miniapp import MiniApp
from tests.test_mvp import Harness


class FleetTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.path=Path(self.tmp.name)/'fleet.db'; self.h=Harness(self.path)
        self.h.driver(10)
        self.h.send(10,'/company'); self.h.send(10,'Denis fleet')
        self.h.send(10,contact={'user_id':10,'phone_number':'+380501234567'})
        self.h.send(900,'/approvecompany 1'); self.h.send(900,'/fleet_enable 10')
        self.first=self.h.rows('SELECT id FROM fleet_vehicles')[0]['id']
        self.app=MiniApp(self.path,{900})

    def tearDown(self): self.tmp.cleanup()

    def act(self,uid,action,**values):
        return self.app.act({'id':uid,'first_name':f'Test {uid}'},{'request_id':str(uuid.uuid4()),'action':action,**values})

    def second(self):
        self.h.send(10,data='fleet:add')
        for value in ('Toyota red','BB2222CC','4','Second driver'): self.h.send(10,value)
        vid=self.h.rows('SELECT id FROM fleet_vehicles ORDER BY id DESC')[0]['id']
        self.h.send(900,f'/fleet_approve {vid}')
        self.h.send(10,data=f'fleet:available:{vid}:1')
        return vid

    def quote(self,passenger,vid,price='300'):
        rid=self.h.booking(uid=passenger)
        self.act(10,'fleet_quote',ride_id=rid,vehicle_id=vid,price=price)
        return rid

    def choose(self,passenger,rid,vid,price=30000):
        return self.act(passenger,'choose',ride_id=rid,driver_id=10,fleet_vehicle_id=vid,expected_price=price)

    def test_enable_preserves_driver_and_requires_owner_admin(self):
        self.assertEqual(10,self.h.rows('SELECT owner_id FROM fleet_accounts')[0]['owner_id'])
        self.assertEqual('approved',self.h.rows('SELECT approval FROM drivers')[0]['approval'])
        self.assertEqual(1,len(self.h.rows('SELECT * FROM drivers')))
        self.h.send(900,'/fleet_enable 10')
        self.assertEqual(1,len(self.h.rows('SELECT * FROM fleet_vehicles')))
        self.h.driver(11); self.h.send(11,'/fleet_enable 11'); self.h.send(900,'/fleet_enable 11')
        self.assertEqual(1,len(self.h.rows('SELECT * FROM fleet_accounts')))

    def test_owner_enters_second_vehicle_without_second_telegram_identity(self):
        before=len(self.h.rows('SELECT * FROM users'))
        vid=self.second()
        self.assertEqual(before,len(self.h.rows('SELECT * FROM users')))
        self.assertEqual('Second driver',self.h.rows('SELECT driver_name FROM fleet_vehicles WHERE id=?',(vid,))[0]['driver_name'])
        self.h.send(10,data='fleet:add'); self.h.send(10,'Third car')
        self.assertEqual(2,len(self.h.rows('SELECT * FROM fleet_vehicles')))

    def test_two_parallel_rides_and_scoped_chat_no_manager_gps(self):
        vid=self.second(); one=self.quote(20,self.first); two=self.quote(21,vid)
        self.choose(20,one,self.first); self.choose(21,two,vid)
        self.assertEqual(2,len(self.h.rows("SELECT * FROM rides WHERE status='accepted'")))
        Service(self.path,{900}) # migration must remain safe with two active fleet rides
        state=self.app.snapshot({'id':10})
        self.assertEqual({one,two},{r['id'] for r in state['fleet']['rides']})
        self.act(10,'message',ride_id=two,text='Only passenger two')
        row=self.h.rows("SELECT * FROM outbox WHERE ride_id=? AND method='sendMessage' ORDER BY id DESC LIMIT 1",(two,))[0]
        self.assertEqual(21,json.loads(row['payload'])['chat_id'])
        self.h.send(10,location={'latitude':48.75,'longitude':30.2},message_id=777)
        self.assertFalse(self.h.rows('SELECT * FROM ride_locations WHERE user_id=10'))
        self.assertEqual('Second driver',self.app.snapshot({'id':21})['ride']['assigned_driver']['name'].split(' · ')[0])
        self.assertEqual(2,len(self.h.rows('SELECT * FROM company_rides')))
        for target in ('arrived','in_progress','completed'): self.act(10,'move',ride_id=one,status=target)
        self.assertEqual('accepted',self.h.rows('SELECT status FROM rides WHERE id=?',(two,))[0]['status'])

    def test_same_vehicle_cannot_be_booked_twice_concurrently(self):
        one=self.quote(20,self.first); two=self.quote(21,self.first)
        def accept(args):
            try:self.choose(*args);return True
            except (ValueError,InvalidAction):return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(accept,[(20,one,self.first),(21,two,self.first)]))
        self.assertEqual(1,sum(results))
        self.assertEqual(1,len(self.h.rows("SELECT * FROM rides WHERE status='accepted'")))

    def test_stale_price_vehicle_and_unauthorized_actions_rejected(self):
        vid=self.second(); rid=self.quote(20,self.first)
        self.act(10,'fleet_quote',ride_id=rid,vehicle_id=vid,price='350')
        with self.assertRaises(ValueError): self.choose(20,rid,self.first)
        self.h.send(99,'/start')
        with self.assertRaises(ValueError): self.act(99,'fleet_quote',ride_id=rid,vehicle_id=vid,price='1')
        with self.assertRaises(ValueError): self.act(99,'fleet_available',vehicle_id=vid,available=True)
        self.choose(20,rid,vid,35000)
        with self.assertRaises(ValueError):self.act(99,'message',ride_id=rid,text='foreign')

    def test_pending_vehicle_cannot_quote(self):
        self.act(10,'fleet_add',vehicle='Red car',plate='BB1234',seats=4,driver='Alex')
        vid=self.h.rows('SELECT id FROM fleet_vehicles ORDER BY id DESC')[0]['id']
        rid=self.h.booking(uid=20)
        with self.assertRaises(ValueError):self.act(10,'fleet_quote',ride_id=rid,vehicle_id=vid,price='100')
        self.h.send(10,f'/fleet_approve {vid}')
        self.assertEqual('pending',self.h.rows('SELECT approval FROM fleet_vehicles WHERE id=?',(vid,))[0]['approval'])

    def test_second_free_car_keeps_receiving_offers_and_seats_checked(self):
        vid=self.second(); one=self.quote(20,self.first); self.choose(20,one,self.first)
        two=self.h.booking(uid=21)
        self.assertTrue(self.h.rows("SELECT * FROM offers WHERE ride_id=? AND driver_id=10 AND status='offered'",(two,)))
        self.act(10,'fleet_quote',ride_id=two,vehicle_id=vid,price='300')
        large=self.h.booking(uid=22,passengers=5)
        with self.assertRaises(ValueError):self.act(10,'fleet_quote',ride_id=large,vehicle_id=vid,price='300')

    def test_remote_dispatcher_requires_no_vehicle_gps(self):
        db=connect(self.path);db.execute('DELETE FROM location_access WHERE user_id=10');db.close()
        self.assertFalse(self.app.snapshot({'id':10})['gps_required'])
        rid=self.quote(20,self.first)
        self.assertTrue(self.app.snapshot({'id':20})['offers'])
        self.choose(20,rid,self.first)
        self.act(10,'move',ride_id=rid,status='arrived')
        self.act(10,'message',ride_id=rid,text='Your car has arrived')
        with self.assertRaises(ValueError):self.act(10,'book',destination='Somewhere',passengers=1)
