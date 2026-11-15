const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const stored = new Map([['hongboya-preview:/site/', JSON.stringify({poster_settings:[
    {id:'creator-producer-jeju-gamgyul',phone_number:'010-1234-5678',shop_url:'https://example.com'},
    {id:'real-item',phone_number:'010-9999-9999',shop_url:'https://example.org'}
  ]})]]);
  const localStorage = {getItem:key=>stored.get(key) || null,setItem:(key,value)=>stored.set(key,value)};
  const location = {href:'https://example.test/site/gallery.html',origin:'https://example.test'};
  const window = {fetch:async()=>new Response('',{status:404})};
  const context = {window,location,localStorage,URL,Request,Response,AbortSignal,TextEncoder,TextDecoder,Uint8Array,btoa,atob,crypto:require('node:crypto').webcrypto};
  vm.runInNewContext(fs.readFileSync('web-preview.js','utf8'),context);
  const data = await (await window.fetch('tables/poster_settings')).json();
  assert.equal(data.data[0].phone_number,'');
  assert.equal(data.data[0].shop_url,'');
  assert.equal(data.data[0].is_example,true);
  assert.equal(data.data[1].phone_number,'010-9999-9999');
  const response = await window.fetch('tables/consultation_requests',{method:'POST',body:JSON.stringify({phone_number:'test'})});
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/전달할 수 없습니다/);
  assert.equal(JSON.parse(stored.get('hongboya-preview:/site/')).consultation_requests,undefined);
  console.log('PASS: sample contacts hidden, real records preserved, preview consultation rejected');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
