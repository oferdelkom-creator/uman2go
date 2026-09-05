const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync('app/api/notify/apartment-offer/route.ts','utf8');
function handler(dbError=null,mailOK=true){
  let inserts=0,sends=0;
  const exports={};
  const context={exports,Response,AbortSignal,URL,Date:class extends Date {static now(){return Date.parse('2026-09-05T12:00:00Z')}},console:{error(){}},process:{env:{RESEND_API_KEY:'test-not-real'}},fetch:async()=>{sends++;return {ok:mailOK,status:mailOK?200:403}},require:(name)=>name.includes('supabase')?{createAdminClient:()=>({from:()=>({insert:async()=>{inserts++;return {error:dbError}}})})}:{EMAIL_FROM:'test@example.com',ADMIN_EMAIL:'test@example.com'}};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
  return {post:exports.POST,counts:()=>({inserts,sends})};
}
const valid={id:'a1234567-1234-4234-8234-123456789abc',full_name:'Test',email:'owner@example.com',area:'Example address',capacity:'4',asking_price:'800',consent:'on'};
function request(body,origin='https://example.com'){return new Request('https://example.com/api/notify/apartment-offer',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})}
test('rejects invalid fields before writing',async()=>{const h=handler();assert.equal((await h.post(request({...valid,email:'invalid'}))).status,400);assert.equal(h.counts().inserts,0)});
test('rejects cross-origin posts',async()=>{const h=handler();assert.equal((await h.post(request(valid,'https://other.example'))).status,403)});
test('saves before email and distinguishes accepted email',async()=>{const h=handler();assert.deepEqual(await (await h.post(request(valid))).json(),{saved:true,emailAccepted:true});assert.deepEqual(h.counts(),{inserts:1,sends:1})});
test('provider rejection does not pretend notification succeeded',async()=>{const h=handler(null,false);assert.deepEqual(await (await h.post(request(valid))).json(),{saved:true,emailAccepted:false})});
test('database error does not send email',async()=>{const h=handler({code:'42501'});assert.equal((await h.post(request(valid))).status,503);assert.equal(h.counts().sends,0)});
test('duplicate does not overwrite or resend',async()=>{const h=handler({code:'23505'});assert.equal((await (await h.post(request(valid))).json()).saved,true);assert.equal(h.counts().sends,0)});
