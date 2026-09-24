import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uman2go.cloud_store import CloudStore,Busy,encode_database,restore_database
from uman2go.db import connect
from tests.test_mvp import Harness

class CloudTests(unittest.TestCase):
    def test_snapshot_preserves_wal_and_complete_trip(self):
        with tempfile.TemporaryDirectory() as d:
            h=Harness(Path(d)/'source.db')
            h.driver(); rid=h.booking(); h.bid(10,rid,'165')
            h.send(20,data=f'choose:{rid}:10')
            for step in ('arrived','in_progress','completed'):
                h.send(10,data=f'move:{rid}:{step}')
            restore_database(Path(d)/'target.db',encode_database(h.path))
            db=connect(Path(d)/'target.db')
            r=db.execute('SELECT * FROM rides').fetchone()
            self.assertEqual(('completed',16500),(r['status'],r['price']))
            self.assertEqual(1,db.execute('SELECT COUNT(*) FROM ride_distance').fetchone()[0])
            db.close()

    def test_busy_has_no_temporary_database_or_commit(self):
        with patch.dict('os.environ',{'NEXT_PUBLIC_SUPABASE_URL':'https://example.test','SUPABASE_SERVICE_ROLE_KEY':'test'}):
            store=CloudStore()
            with patch.object(store,'rpc',return_value=None) as rpc:
                with self.assertRaises(Busy):
                    with store: self.fail()
                rpc.assert_called_once()

    def test_corrupt_snapshot_releases_lease(self):
        with patch.dict('os.environ',{'NEXT_PUBLIC_SUPABASE_URL':'https://example.test','SUPABASE_SERVICE_ROLE_KEY':'test'}):
            store=CloudStore()
            with patch.object(store,'rpc',side_effect=[{'revision':2,'snapshot':'bad'},None]) as rpc:
                with self.assertRaises(Exception):
                    with store: self.fail()
                self.assertEqual('uman_bot_release',rpc.call_args.args[0])
