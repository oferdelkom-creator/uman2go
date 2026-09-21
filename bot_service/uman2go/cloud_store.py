import base64
import json
import os
import sqlite3
import tempfile
import urllib.request
import uuid
import zlib
from contextlib import closing
from pathlib import Path

class Busy(Exception):
    pass

def encode_database(path):
    with closing(sqlite3.connect(path)) as db:
        raw = db.serialize()
    if len(raw)>32*1024*1024:
        raise ValueError('MVP capacity exceeded')
    encoded=base64.b64encode(zlib.compress(raw)).decode()
    if len(encoded)>5000000:
        raise ValueError('MVP capacity exceeded')
    return encoded

def restore_database(path, encoded):
    stream=zlib.decompressobj()
    raw=stream.decompress(base64.b64decode(encoded,validate=True),32*1024*1024+1)
    if len(raw)>32*1024*1024 or not stream.eof:
        raise ValueError('Invalid database snapshot')
    # A serialized WAL database must be restored through backup, not written as bytes.
    # Switch header read/write mode to rollback journal for the in-memory source.
    raw=raw[:18]+b'\x01\x01'+raw[20:]
    with closing(sqlite3.connect(':memory:')) as source, closing(sqlite3.connect(path)) as target:
        source.deserialize(raw)
        if source.execute('PRAGMA quick_check').fetchone()[0]!='ok':
            raise ValueError('Invalid database snapshot')
        source.backup(target)

class CloudStore:
    def __init__(self):
        self.owner=str(uuid.uuid4())
        self.url=os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')+'/rest/v1/rpc/'
        self.key=os.environ['SUPABASE_SERVICE_ROLE_KEY']

    def rpc(self, name, body):
        req=urllib.request.Request(self.url+name,data=json.dumps(body).encode(),headers={
            'apikey':self.key,'Authorization':'Bearer '+self.key,'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=8) as r:
                data=r.read()
                return json.loads(data) if data else None
        except Exception:
            raise RuntimeError('Cloud persistence unavailable') from None

    def __enter__(self):
        state=self.rpc('uman_bot_acquire',{'owner_id':self.owner})
        if state is None:
            raise Busy()
        self.revision=state['revision']
        self.tmp=tempfile.TemporaryDirectory(prefix='uman-cloud-')
        self.path=Path(self.tmp.name)/'state.db'
        try:
            if not state['snapshot']:
                raise RuntimeError('Cloud data migration is required')
            restore_database(self.path,state['snapshot'])
        except BaseException:
            self.__exit__(None,None,None)
            raise
        return self

    def save(self):
        self.revision=self.rpc('uman_bot_save',{'owner_id':self.owner,'expected_revision':self.revision,'new_snapshot':encode_database(self.path)})

    def __exit__(self,*args):
        try:
            self.rpc('uman_bot_release',{'owner_id':self.owner})
        finally:
            self.tmp.cleanup()
