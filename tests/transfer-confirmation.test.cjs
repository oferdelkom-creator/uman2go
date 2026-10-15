const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require(process.env.TYPESCRIPT_PATH||'typescript');
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>deps[n],Intl,Date,console});return exports;}
const pricing=load('lib/transfer-pricing.ts');
test('only unambiguous confirmations are accepted',()=>{for(const text of ['כן','מאשר הזמנה','confirm booking','Yes.'])assert.equal(pricing.isTransferConfirmation(text),true);for(const text of ['כן אבל תשנה תאריך','לא','מה המקדמה?','yes but change the car','book please',''])assert.equal(pricing.isTransferConfirmation(text),false);});

function setup(row) {
 const calls=[];
 let updating=false;
 const chain={
  eq(){return chain}, neq(){return chain}, order(){return chain}, limit(){return chain},
  maybeSingle:async()=>({data:row,error:null}), single:async()=>({data:null,error:null}),
  select(){return updating?Promise.resolve({data:[{id:'request'}],error:null}):chain}
 };
 const db={from(){
  updating=false;
  return {select:()=>chain,update(value){updating=true;calls.push(value);return chain}};
 }};
 const lib=load('lib/transfer-reservations.ts',{
  'server-only':{},
  '@/lib/supabase/admin':{createAdminClient:()=>db},
  '@/lib/transfer-pricing':pricing,
  '@/lib/contact-inquiry':{escapeContactHtml:x=>x},
  '@/lib/resend':{resend:{emails:{send:async()=>({error:null})}}}
 });
 return {calls,submit:(text='מאשר הזמנה')=>lib.submitSalesTransferDraft('session',text,'he','2026-10-15T20:00:00Z')};
}
const draft={id:'request',created_at:'2026-10-15T19:00:00Z',expires_at:'2099-01-01T00:00:00Z',status:'draft',total_cents:31500,deposit_cents:3000,driver_balance_cents:28500};
test('explicit later confirmation saves pending supplier, never paid or confirmed',async()=>{const x=setup(draft);const r=await x.submit();assert.equal(r.id,'request');assert.equal(x.calls[0].status,'pending_supplier');assert.equal(x.calls[0].payment_verified_at,undefined);assert.equal(x.calls[0].supplier_approved_at,undefined);});
test('same-turn drafts cannot be submitted',async()=>{const x=setup({...draft,created_at:'2026-10-15T20:00:01Z'});await assert.rejects(x.submit());assert.equal(x.calls.length,0);});
test('questions, changed details and expired drafts do not submit',async()=>{for(const msg of ['כן אבל תשנה רכב','מה המחיר?','no']){const x=setup(draft);await assert.rejects(x.submit(msg));assert.equal(x.calls.length,0);}const x=setup({...draft,expires_at:'2020-01-01T00:00:00Z'});await assert.rejects(x.submit());assert.equal(x.calls.length,0);});
test('retry after submission does not submit twice',async()=>{const x=setup({...draft,status:'pending_supplier'});await x.submit();assert.equal(x.calls.length,0);});
