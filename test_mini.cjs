const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function browser() {
 const nodes = new Map();
 const element = id => nodes.get(id) || nodes.set(id, {addEventListener(){},textContent:'',hidden:false,elements:{}}).get(id);
 const context = {window:{},document:{getElementById:element,addEventListener(){}},location:{href:'https://test.github.io/site/mini.html',pathname:'/site/mini.html',search:'',hash:''},URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,btoa,atob,AbortSignal,fetch:async()=>{throw Error('Static hosting');}};
 vm.runInNewContext(fs.readFileSync('mini.js','utf8'),context);
 return context.window.HongboyaMini;
}
const author = browser(), visitor = browser();
const input = {name:'나의 농장 🌾',bio:'직접 만든 가치\n공유하는 이야기',role:'producer',theme:'forest',links:[{title:'나의 SNS',url:'https://example.com/social'}],products:[{title:'수확한 토마토',price:'20,000원',image:'',url:'https://example.com/tomato'}]};
const pack = author.encode(input);
assert.equal(visitor.decode(pack).name,input.name);
assert.equal(visitor.decode(pack).products[0].url,input.products[0].url);
assert.equal(visitor.decode(pack).links[0].url,input.links[0].url);
assert.throws(()=>visitor.decode('not-a-valid-pack'));
assert.throws(()=>author.normalize({...input,links:[{title:'unsafe',url:'javascript:alert(1)'}]}));
assert.throws(()=>author.normalize({...input,products:Array(13).fill(input.products[0])}));
assert.equal(author.normalize({...input,email:'private@example.com',password:'secret'}).email,undefined);
assert.equal(author.normalize({...input,password:'secret'}).password,undefined);
const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
assert.equal(author.normalize({...input,image:validPng}).image,validPng);
assert.throws(()=>author.normalize({...input,image:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD='}));
const hugePng = 'data:image/png;base64,' + Buffer.alloc(600 * 1024 + 32, 1).toString('base64');
assert.throws(()=>author.normalize({...input,image:hugePng}));
console.log('PASS: independent-browser snapshot, Unicode, products, channels, invalid links, PNG<=600KB validation, private field exclusion');
