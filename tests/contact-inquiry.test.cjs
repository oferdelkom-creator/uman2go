const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');
function load(file, dependencies) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>dependencies[name],console:{error(){}},Request,Response,JSON,Date});
 return exports;
}
const validation = load('lib/contact-inquiry.ts',{});
const body = {id:'e89c4b2a-cb88-4eab-9f33-a8df5c086822',full_name:'Test',email:'test@example.com',message:'<script>alert(1)</script>'};
function setup({saveError=false,duplicate=false,mailError=false}={}) {
 const calls=[];
 const db={from(){return {upsert(){calls.push('save');return {select:async()=>({data:duplicate?[]:[{id:body.id}],error:saveError?{code:'failure'}:null})}},update(value){calls.push(value.email_status);return {eq:async()=>({error:null})}}}}};
 const route=load('app/api/notify/contact-inquiry/route.ts',{
 'next/server':{NextResponse:{json:(data,init)=>Response.json(data,init)}},
 '@/lib/resend':{EMAIL_FROM:'test@example.com',ADMIN_EMAIL:'admin@example.com',resend:{emails:{send:async(value)=>{calls.push('mail');assert.ok(!value.html.includes('<script>'));if(mailError)throw Error();return {error:null}}}}},
 '@/lib/emailTemplate':{renderEmail:x=>x},'@/lib/supabase/admin':{createAdminClient:()=>db},'@/lib/contact-inquiry':validation});
 return {calls,submit:value=>route.POST(new Request('https://example.com/api/notify/contact-inquiry',{method:'POST',body:JSON.stringify(value||body)}))};
}
test('saves before notifying',async()=>{const x=setup();assert.equal((await x.submit()).status,200);assert.deepEqual(x.calls,['save','mail','sent']);});
test('failed save never sends mail or reports success',async()=>{const x=setup({saveError:true});assert.equal((await x.submit()).status,503);assert.deepEqual(x.calls,['save']);});
test('mail failure preserves accepted inquiry and flags follow-up',async()=>{const x=setup({mailError:true});assert.equal((await x.submit()).status,200);assert.deepEqual(x.calls,['save','mail','failed']);});
test('retry does not overwrite or send duplicate email',async()=>{const x=setup({duplicate:true});assert.equal((await x.submit()).status,200);assert.deepEqual(x.calls,['save']);});
test('invalid input is rejected before persistence',async()=>{const x=setup();assert.equal((await x.submit({...body,email:'invalid'})).status,400);assert.deepEqual(x.calls,[]);});

