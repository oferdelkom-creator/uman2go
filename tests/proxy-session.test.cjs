const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const {NextRequest, NextResponse} = require('next/server');

function loadProxy(user) {
  const source = ts.transpileModule(fs.readFileSync('proxy.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {exports, process, require(name) {
    if (name === 'next/server') return {NextResponse};
    if (name === '@/i18n/routing') return {routing:{}};
    if (name === 'next-intl/middleware') return () => request => {
      const response = NextResponse.rewrite(new URL('/he' + request.nextUrl.pathname, request.url));
      response.headers.set('x-middleware-request-x-next-intl-locale', 'he');
      response.cookies.set('NEXT_LOCALE', 'he');
      return response;
    };
    if (name === '@supabase/ssr') return {createServerClient(url, key, options) {
      return {auth:{async getUser() {
        options.cookies.setAll([{name:'session',value:'refreshed',options:{httpOnly:true,path:'/'}}]);
        return {data:{user}};
      }}};
    }};
    throw new Error(name);
  }});
  return exports.proxy;
}

test('session refresh preserves locale rewrite, locale headers and both cookies', async () => {
  const request = new NextRequest('https://www.uman2go.com/');
  const response = await loadProxy({id:'test-user'})(request);
  assert.equal(response.headers.get('x-middleware-rewrite'), 'https://www.uman2go.com/he/');
  assert.equal(response.headers.get('x-middleware-request-x-next-intl-locale'), 'he');
  assert.equal(response.cookies.get('NEXT_LOCALE').value, 'he');
  assert.equal(response.cookies.get('session').value, 'refreshed');
  assert.equal(request.cookies.get('session').value, 'refreshed');
});
test('expired session still redirects protected pages to login', async () => {
  const response = await loadProxy(null)(new NextRequest('https://www.uman2go.com/owner'));
  assert.equal(response.status,307);
  assert.equal(new URL(response.headers.get('location')).pathname,'/login');
});
