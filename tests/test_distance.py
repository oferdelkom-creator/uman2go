import json
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch
from tests.test_mvp import Harness
from uman2go.db import connect
from uman2go.distance import meters_between

class DistanceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.h=Harness(Path(self.tmp.name)/'db.sqlite3')
        self.h.driver()
        self.rid=self.h.booking()
        self.h.bid(10,self.rid,'165')
        self.h.send(20,data=f'choose:{self.rid}:10')
        self.h.send(10,data=f'move:{self.rid}:arrived')
        self.now=time.time()
        with patch('uman2go.distance.time.time',return_value=self.now):
            self.h.send(10,data=f'move:{self.rid}:in_progress')

    def tearDown(self):
        self.tmp.cleanup()

    def point(self,uid,seconds,lon=30):
        with patch('uman2go.distance.time.time',return_value=self.now+seconds):
            self.h.send(uid,location={'latitude':48,'longitude':lon},date=self.now+seconds)

    def row(self):
        return self.h.rows('SELECT * FROM ride_distance')[0]

    def test_distance_and_receipt_persist_without_changing_fare(self):
        self.point(10,1)
        self.point(10,61,30.01)
        self.assertAlmostEqual(744, self.row()['meters'],delta=2)
        with patch('uman2go.distance.time.time',return_value=self.now+70):
            self.h.send(10,data=f'move:{self.rid}:completed')
        self.assertIsNone(self.row()['last_lat'])
        self.assertEqual(16500,self.h.rows('SELECT price FROM rides')[0]['price'])
        self.h.send(20,'/stopgps')
        self.h.send(20,'/receipt')
        text=json.loads(self.h.rows("SELECT payload FROM outbox WHERE json_extract(payload,'$.chat_id')=20 ORDER BY id DESC LIMIT 1")[0]['payload'])['text']
        self.assertIn('0.74 km',text)
        self.assertIn('165.00',text)
        self.assertIn('arrival at the destination',text)
        self.h.send(21,f'/receipt {self.rid}')
        text=json.loads(self.h.rows("SELECT payload FROM outbox WHERE json_extract(payload,'$.chat_id')=21 ORDER BY id DESC LIMIT 1")[0]['payload'])['text']
        self.assertNotIn('0.74',text)

    def test_passenger_duplicates_old_points_and_jumps_not_counted(self):
        self.point(20,1)
        self.assertEqual(0,self.row()['samples'])
        self.point(10,2)
        self.point(10,2,30.01)
        self.point(10,1,30.02)
        self.point(10,3,35)
        self.assertEqual(0,self.row()['meters'])
        self.assertEqual(1,self.row()['samples'])
        self.assertEqual(1,self.row()['partial'])
        self.point(10,62,30.01)
        self.assertAlmostEqual(744,self.row()['meters'],delta=2)

    def test_gaps_and_stopgps_do_not_bridge_missing_track(self):
        self.point(10,1)
        self.point(10,200,31)
        self.assertEqual(0,self.row()['meters'])
        self.assertEqual(1,self.row()['partial'])
        self.h.send(10,'/stopgps')
        self.point(10,210,32)
        self.assertEqual(0,self.row()['meters'])

    def test_no_gps_reports_unavailable_not_zero(self):
        self.h.send(10,data=f'move:{self.rid}:completed')
        db=connect(self.h.path)
        text=self.h.service.distance_text(db,20,self.h.service.ride(db,self.rid))
        db.close()
        self.assertIn('unavailable',text)

    def test_haversine_reference(self):
        self.assertAlmostEqual(111195,meters_between(0,0,0,1),delta=2)
