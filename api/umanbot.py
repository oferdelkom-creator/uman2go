"""Vercel entrypoint. Public static assets; authenticated application/webhook endpoints."""
import hmac
import json
import mimetypes
import os
from pathlib import Path
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs,urlparse
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'bot_service'))
from uman2go.cloud_store import CloudStore,Busy
from uman2go.miniapp import MiniApp,WEB,authenticate
from uman2go.service import Service,InvalidAction
from uman2go.runtime import Worker
from uman2go.telegram import Telegram
from uman2go.db import connect

VERSION='uman2go-fleet-1'
ORIGIN='https://uman2go-live.vercel.app'
ENDPOINT=ORIGIN+'/api/umanbot'

def equal_secret(value):
    secret=os.getenv('UMAN_CLOUD_SECRET','')
    return len(secret)>=32 and hmac.compare_digest(value or '',secret)

def settings():
    token=os.environ['TELEGRAM_BOT_TOKEN']
    if not token.startswith('8800984991:'):
        raise RuntimeError('Wrong bot identity')
    return token,{int(x) for x in os.environ['ADMIN_TELEGRAM_IDS'].split(',')}

def static_asset(name):
    if name=='setup.js':
        return b"document.querySelector('#access').addEventListener('change',async e=>{const f=e.target.files[0];if(f){document.querySelector('[name=secret]').value=(await f.text()).trim();document.querySelector('#loaded').textContent='Access file loaded';}});document.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const p=document.querySelector('#loaded');p.textContent='Running...';try{const r=await fetch('?r=ops',{method:'POST',body:new URLSearchParams(new FormData(e.target))});p.textContent=JSON.stringify(await r.json(),null,2);}catch(err){p.textContent='Request failed';}});",'text/javascript'
    if name not in ('index.html','app.js','notifications.js','style.css','favicon.svg','leaflet.js','leaflet.css'):
        raise KeyError(name)
    data=(WEB/name).read_text(encoding='utf-8')
    if name=='index.html':
        for file in ('app.js','notifications.js','style.css','favicon.svg','leaflet.js','leaflet.css'):
            data=data.replace('/'+file,'/api/umanbot?r='+file)
        data=data.replace('href="/"','href="/api/umanbot"')
    if name=='app.js':
        data=data.replace("async function request(url,body){", "async function request(url,body){url='/api/umanbot?r='+url.split('/').pop();")
    return data.encode(),mimetypes.guess_type(name)[0] or 'text/plain'

class handler(BaseHTTPRequestHandler):
    def log_message(self,*args):
        pass

    def reply(self,status,data,kind='application/json'):
        raw=data if isinstance(data,bytes) else json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        for key,value in {'Content-Type':kind+'; charset=utf-8','Content-Length':str(len(raw)),
            'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',
            'Content-Security-Policy':"default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; base-uri 'none'; object-src 'none'"}.items():
            self.send_header(key,value)
        self.end_headers()
        self.wfile.write(raw)

    def route(self):
        return parse_qs(urlparse(self.path).query).get('r',['index.html'])[0]

    def do_GET(self):
        route=self.route()
        if route=='health':
            return self.reply(200,{'release':VERSION})
        if route=='config':
            return self.reply(200,{'demo':False})
        if route=='setup':
            page=b'''<!doctype html><meta charset="utf-8"><title>UMAN2GO Deployment</title><h1>UMAN2GO deployment</h1><label>Access file <input id="access" type="file"></label><p id="loaded"></p><form method="post" action="?r=ops"><label>Deployment secret <input name="secret" type="password" required autocomplete="off"></label><select name="operation"><option>status</option><option>activate</option><option>pause</option></select><button>Run</button></form><script src="?r=setup.js"></script>'''
            return self.reply(200,page,'text/html')
        if route!='state':
            try:
                raw,kind=static_asset(route)
                return self.reply(200,raw,kind)
            except KeyError:
                return self.reply(404,{'error':'NOT_FOUND'})
        try:
            token,admins=settings()
            user=authenticate(self.headers.get('X-Telegram-Init-Data',''),token)
            with CloudStore() as store:
                result=MiniApp(store.path,admins,token).snapshot(user)
                store.save()
            self.reply(200,result)
        except PermissionError:
            self.reply(401,{'error':'OPEN_IN_TELEGRAM'})
        except Exception:
            self.reply(503,{'error':'TEMPORARILY_UNAVAILABLE'})

    def do_POST(self):
        route=self.route()
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=16000:
                return self.reply(400,{'error':'INVALID_BODY'})
            raw=self.rfile.read(size)
            if route=='ops':
                body={k:v[0] for k,v in parse_qs(raw.decode()).items()}
                if not equal_secret(body.get('secret')):
                    return self.reply(403,{'error':'DENIED'})
                return self.ops(body.get('operation'))
            if route=='paused':
                return self.reply(503,{'error':'MIGRATION_IN_PROGRESS'})
            token,admins=settings()
            if route in ('webhook','drain'):
                key=self.headers.get('X-Telegram-Bot-Api-Secret-Token') if route=='webhook' else self.headers.get('X-UMAN-Secret')
                if not equal_secret(key):
                    return self.reply(403,{'error':'DENIED'})
                user=None
            elif route=='action':
                origin=self.headers.get('Origin')
                if origin and origin not in (ORIGIN,'https://uman2go.com','https://www.uman2go.com'):
                    return self.reply(403,{'error':'DENIED'})
                user=authenticate(self.headers.get('X-Telegram-Init-Data',''),token)
            else:
                return self.reply(404,{'error':'NOT_FOUND'})
            body=json.loads(raw)
            if not isinstance(body,dict):
                raise ValueError()
            with CloudStore() as store:
                app=MiniApp(store.path,admins,token)
                if route=='webhook':
                    if type(body.get('update_id')) is not int:
                        raise ValueError()
                    app.service.process(body)
                    result={'ok':True}
                elif route=='action':
                    result=app.act(user,body)
                else:
                    result={'ok':True}
                # Persist business actions BEFORE network side effects. A retry is idempotent.
                store.save()
                Worker(store.path,Telegram(token,timeout=3),batch_limit=25,persist=store.save).flush(max_seconds=20)
                store.save()
            self.reply(200,result)
        except PermissionError:
            self.reply(401,{'error':'OPEN_IN_TELEGRAM'})
        except (ValueError,KeyError,TypeError,InvalidAction,IndexError) as exc:
            self.reply(400,{'error':'GPS_REQUIRED' if str(exc)=='GPS_REQUIRED' else 'ACTION_UNAVAILABLE'})
        except Exception:
            self.reply(503,{'error':'TEMPORARILY_UNAVAILABLE'})

    def ops(self,operation):
        token,admins=settings()
        api=Telegram(token,timeout=8)
        identity=api.call('getMe',{})
        if identity.get('username')!='UMAN2GO_RidesBot':
            raise ValueError('Wrong bot')
        if operation=='pause':
            api.call('setWebhook',{'url':ENDPOINT+'?r=paused','secret_token':os.environ['UMAN_CLOUD_SECRET'],'drop_pending_updates':False})
            return self.reply(200,{'paused':True})
        with CloudStore() as store:
            Service(store.path,admins)
            db=connect(store.path)
            counts={name:db.execute('SELECT COUNT(*) FROM '+name).fetchone()[0] for name in ('users','rides','drivers')}
            ready=db.execute("SELECT value FROM metadata WHERE key='cloud_ready'").fetchone()
            db.close()
            if operation=='activate':
                if not ready or ready['value']!='1':
                    raise ValueError('Final migration required')
                api.call('setWebhook',{'url':ENDPOINT+'?r=webhook','secret_token':os.environ['UMAN_CLOUD_SECRET'],
                    'allowed_updates':['message','edited_message','callback_query'],'max_connections':1,'drop_pending_updates':False})
                api.call('setChatMenuButton',{'menu_button':{'type':'web_app','text':'UMAN2GO','web_app':{'url':ENDPOINT}}})
                for admin in admins:
                    api.call('setChatMenuButton',{'chat_id':admin,'menu_button':{'type':'web_app','text':'UMAN2GO','web_app':{'url':ENDPOINT}}})
                commands=api.call('getMyCommands',{})
                for command in commands:
                    if command['command']=='driver':
                        command['description']='Drivers / הרשמה וקבלת נסיעות'
                if commands:
                    api.call('setMyCommands',{'commands':commands})
                api.call('setMyDescription',{'description':'UMAN2GO — הזמנת מוניות באוקראינה. משתפים מיקום, בוחרים יעד ומאשרים הצעת מחיר מנהג. התשלום לנהג לאחר ההגעה ליעד. בסיום מתקבל סיכום נסיעה עם מרחק משוער לפי נתוני המיקום שנקלטו. נהגים נרשמים לאחר אישור מנהל. הזמינות תלויה בנהגים באזור.'})
            elif operation!='status':
                raise ValueError('Invalid operation')
        info=api.call('getWebhookInfo',{})
        self.reply(200,{'bot':identity['username'],'release':VERSION,'counts':counts,'operation':operation,'webhook_url':info.get('url'),'pending_updates':info.get('pending_update_count'),'last_error':info.get('last_error_message'),'menu':api.call('getChatMenuButton',{})})


