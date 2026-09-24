import tempfile
import unittest
from pathlib import Path
from .test_mvp import Harness

class CompanyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.h=Harness(Path(self.temp.name)/'db.sqlite3')
    def tearDown(self):self.temp.cleanup()
    def company(self,uid=50,approved=True):
        h=self.h; h.send(uid,'/company'); h.send(uid,'Kyiv fleet')
        h.send(uid,contact={'user_id':uid,'phone_number':'+380501111111'})
        cid=h.rows('SELECT id FROM companies WHERE owner_id=?',(uid,))[0]['id']
        if approved:h.send(900,f'/approvecompany {cid}')
        return cid
    def join(self,owner=50,driver=10):
        h=self.h; h.send(owner,data='company:invite');h.send(owner,str(driver))
        inv=h.rows('SELECT id FROM company_invites ORDER BY id DESC')[0]['id']
        h.send(driver,data=f'companyjoin:{inv}:yes');return inv
    def test_consent_and_wrong_recipient(self):
        h=self.h;self.company();h.driver()
        h.send(50,data='company:invite');h.send(50,'10')
        self.assertFalse(h.rows('SELECT * FROM company_members'))
        inv=h.rows('SELECT id FROM company_invites')[0]['id']
        h.send(20,data=f'companyjoin:{inv}:yes')
        self.assertFalse(h.rows('SELECT * FROM company_members'))
        h.send(10,data=f'companyjoin:{inv}:yes')
        self.assertEqual(h.rows('SELECT driver_id FROM company_members')[0]['driver_id'],10)
    def test_unapproved_and_foreign_owner_cannot_manage(self):
        h=self.h;cid=self.company(approved=False);h.driver()
        h.send(50,data='company:invite');h.send(50,'10')
        self.assertFalse(h.rows('SELECT * FROM company_invites'))
        h.send(900,f'/approvecompany {cid}');self.join()
        self.company(60);h.send(60,data='company:offline:10')
        self.assertEqual(h.rows('SELECT available FROM drivers WHERE id=10')[0]['available'],1)
        h.send(50,data='company:offline:10')
        self.assertEqual(h.rows('SELECT available FROM drivers WHERE id=10')[0]['available'],0)
    def test_company_assignment_snapshot_and_leave(self):
        h=self.h;cid=self.company();h.driver();self.join()
        rid=h.booking();h.bid(10,rid);h.send(20,data=f'choose:{rid}:10')
        self.assertEqual(h.rows('SELECT company_id FROM company_rides WHERE ride_id=?',(rid,))[0]['company_id'],cid)
        h.send(10,'/leavecompany')
        self.assertFalse(h.rows('SELECT * FROM company_members'))
        self.assertEqual(len(h.rows('SELECT * FROM company_rides')),1)
    def test_join_does_not_expose_old_rides(self):
        h=self.h;self.company();h.driver()
        rid=h.booking();h.bid(10,rid);h.send(20,data=f'choose:{rid}:10')
        for state in ('arrived','in_progress','completed'):h.send(10,data=f'move:{rid}:{state}')
        self.join()
        self.assertFalse(h.rows('SELECT * FROM company_rides'))
    def test_foreign_phone_and_unauthorized_approval(self):
        h=self.h;h.send(50,'/company');h.send(50,'Test company')
        h.send(50,contact={'user_id':60,'phone_number':'+380501111111'})
        self.assertFalse(h.rows('SELECT * FROM companies'))
        h.send(50,contact={'user_id':50,'phone_number':'+380501111111'})
        h.send(50,'/approvecompany 1')
        self.assertEqual(h.rows('SELECT status FROM companies')[0]['status'],'pending')
