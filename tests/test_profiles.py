import tempfile
import unittest
from pathlib import Path
from .test_mvp import Harness

class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.h = Harness(Path(self.temp.name) / 'db.sqlite3')
    def tearDown(self):
        self.temp.cleanup()
    def test_edit_revokes_approval_and_rechecks_capacity(self):
        h=self.h
        h.driver()
        h.send(10, data='profile:seats')
        h.send(10, '3')
        d=h.rows('SELECT * FROM drivers')[0]
        self.assertEqual((d['seats'], d['approval'], d['available']), (3,'pending',0))
        h.send(900, '/approve 10')
        h.send(10, data='available:1')
        rid=h.booking(passengers=4)
        self.assertFalse(h.rows('SELECT * FROM offers WHERE ride_id=?',(rid,)))
    def test_photo_required_and_invalid_input_preserves_state(self):
        h=self.h
        h.driver(approve=False)
        h.send(10, data='profile:photo')
        h.send(10, 'not a photo')
        self.assertEqual(h.rows('SELECT state FROM users WHERE id=10')[0]['state'],'profile_photo')
        h.send(10, photo=[{'file_id':'new_photo'}])
        self.assertEqual(h.rows('SELECT photo_id FROM drivers')[0]['photo_id'],'new_photo')
    def test_profile_locked_during_assigned_ride(self):
        h=self.h
        h.driver()
        rid=h.booking()
        h.bid(10,rid)
        h.send(20,data=f'choose:{rid}:10')
        h.send(10,data='profile:seats')
        self.assertNotEqual(h.rows('SELECT state FROM users WHERE id=10')[0]['state'],'profile_seats')
    def test_invite_no_gps_does_not_enable_registration(self):
        h=self.h
        h.service.process(h.update(40,'/start driver'))
        self.assertFalse(h.rows('SELECT * FROM drivers WHERE id=40'))
        self.assertTrue(any('Own a vehicle' in r['payload'] for r in h.rows('SELECT payload FROM outbox')))
