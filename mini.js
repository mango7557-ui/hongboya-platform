/* Mini homes use authenticated server storage when available; Pages uses portable snapshots. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const storageKey = 'hongboya-mini-v1:' + new URL('.', location.href).pathname;
 const roles = {producer:'🌾 생산자',maker:'🛠 제조사 · 메이커',creative:'✦ 크리에이티브',local:'📍 로컬 크리에이터'};
 let server = false, ready = false, profile = null, userId = '', login = false, sharedUrl = '', publicProfile = null;
 const blank = () => ({name:'',bio:'',region:'',image:'',role:'local',theme:'coral',links:[],products:[]});
 const safeURL = value => {
   if (!value) return '';
   const url = new URL(String(value));
   if (!['https:','http:'].includes(url.protocol) || url.username || url.password || String(value).length > 1000) throw Error('https:// 또는 http://로 시작하는 링크를 입력하세요.');
   return url.href;
 };
 function normalize(raw) {
   if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('미니홈피 정보가 올바르지 않습니다.');
   const p = blank();
   for (const [key,max] of [['name',60],['bio',400],['region',60]]) p[key] = String(raw[key] || '').trim().slice(0,max);
   if (!p.name) throw Error('활동명을 입력하세요.');
    p.role = Object.hasOwn(roles,raw.role) ? raw.role : 'local';
   p.theme = ['coral','forest','violet','ocean'].includes(raw.theme) ? raw.theme : 'coral';
   p.image = safeURL(raw.image);
   for (const [key,max] of [['links',8],['products',12]]) {
     if (!Array.isArray(raw[key] || []) || (raw[key] || []).length > max) throw Error('링크는 8개, 상품은 12개까지 등록할 수 있습니다.');
     p[key] = (raw[key] || []).map(row => {
       if (!row || typeof row !== 'object') throw Error('잘못된 항목입니다.');
       const result = {title:String(row.title || '').trim().slice(0,80),url:safeURL(row.url)};
       if (!result.title || !result.url) throw Error('각 링크와 상품의 제목·주소를 모두 입력하세요.');
       if (key === 'products') Object.assign(result,{price:String(row.price || '').slice(0,60),image:safeURL(row.image),description:String(row.description || '').slice(0,200)});
       return result;
     });
   }
   return p;
 }
 function encode(p) {const result=btoa(Array.from(new TextEncoder().encode(JSON.stringify(normalize(p))), b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');if(result.length>40000)throw Error('공유 주소가 너무 깁니다. 소개나 링크 길이를 줄여주세요.');return result;}
 function decode(s) {
   if (s.length > 40000) throw Error('공유 링크가 너무 깁니다.');
   return normalize(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))));
 }
 // Pure helpers are also used by the cross-browser sharing tests.
 window.HongboyaMini = {normalize,encode,decode,safeURL};
 function element(tag, text, cls) { const el=document.createElement(tag); if(text !== undefined)el.textContent=text; if(cls)el.className=cls; return el; }
 function outbound(title, url, cls) {const a=element('a',title,cls);a.href=safeURL(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
 function image(url, alt, cls) {const img=element('img',undefined,cls);img.src=safeURL(url);img.alt=alt;img.referrerPolicy='no-referrer';img.loading='lazy';img.addEventListener('error',()=>img.replaceWith(element('div','✦',cls || 'product-art')));return img;}
 function render(p, target) {
   target.replaceChildren();target.className='mini-home '+p.theme;
   target.append(element('div','','home-cover'));
   try{target.append(p.image ? image(p.image,p.name,'avatar') : element('div',roles[p.role]?.split(' ')[0] || '✦','avatar'));}catch{target.append(element('div','✦','avatar'));}
   target.append(element('span',(roles[p.role] || roles.local)+(p.region?' · '+p.region:''),'pill'),element('h1',p.name || '나의 미니홈피'),element('p',p.bio || '내가 만든 가치와 이야기를 소개해보세요.','bio'));
   const links=element('div',undefined,'home-links');
   for(const row of p.links) if(row.title && row.url) {try{links.append(outbound(row.title+' ↗',row.url));}catch{}}
   if(!links.children.length)links.append(element('p','아직 연결된 채널이 없습니다.','empty'));
   target.append(links,element('h2','나의 미니샵'));
   const products=element('div',undefined,'home-products');
   for(const row of p.products){
     const card=element('article',undefined,'product');
     try{card.append(row.image?image(row.image,row.title):element('div','✦','product-art'));}catch{card.append(element('div','✦','product-art'));}
     card.append(element('h3',row.title || '상품명'),element('p',row.price),element('p',row.description));
     if(row.url){try{card.append(outbound('구매 · 예약하기 ↗',row.url));}catch{}}
     products.append(card);
   }
   target.append(products.children.length?products:element('p','새로운 아이템을 준비하고 있어요.','empty'));
   target.append(element('p','구매·결제·배송은 연결된 판매처에서 진행됩니다.','muted'));
   const brand=element('a','나도 홍보야 미니홈피 만들기 ↗','pill');brand.href='mini.html';target.append(brand);
 }
 function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
 function show(view){for(const id of ['landing','studio','public-view'])$(id).hidden=id!==view;}
 async function api(path,method='GET',body){
   const res=await fetch('api/mini/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
   const data=await res.json();if(!res.ok)throw Error(data.error || '요청을 처리하지 못했습니다.');return data;
 }
 function fillEditor(){
   const f=$('profile-form');for(const key of ['name','role','region','bio','image','theme'])f.elements[key].value=profile[key] || '';
   fields('links');fields('products');render(profile,$('preview'));$('form-error').textContent='';
 }
 function fields(key){
   const target=$(key==='links'?'link-fields':'product-fields');target.replaceChildren();
   profile[key].forEach((row,i)=>{
     const card=element('div',undefined,'entry');card.append(element('b',(key==='links'?'링크 ':'상품 ')+(i+1)));
     const specs=key==='links'?[['title','채널 이름','text',80],['url','채널 주소','url',1000]]:[['title','상품 이름','text',80],['price','가격 / 혜택','text',60],['description','상품 설명','text',200],['image','상품 이미지 주소 (선택)','url',1000],['url','구매 / 예약 주소','url',1000]];
     for(const [field,title,type,max] of specs){const label=element('label',title),input=element('input');input.value=row[field] || '';input.type=type;input.maxLength=max;input.required=['title','url'].includes(field);input.addEventListener('input',()=>{row[field]=input.value;dirty();});label.append(input);card.append(label);}
     const actions=element('div',undefined,'actions');
     for(const [label,delta] of [['↑ 위로',-1],['↓ 아래로',1]]){const b=element('button',label);b.type='button';b.disabled=i+delta<0 || i+delta>=profile[key].length;b.onclick=()=>{[profile[key][i],profile[key][i+delta]]=[profile[key][i+delta],profile[key][i]];fields(key);dirty();};actions.append(b);}
     const del=element('button','삭제');del.type='button';del.onclick=()=>{profile[key].splice(i,1);fields(key);dirty();};actions.append(del);card.append(actions);target.append(card);
   });
 }
 function dirty(){render(profile,$('preview'));$('save-status').textContent='저장되지 않은 변경 내용';}
 async function save(){
   const valid=normalize(profile);
   if(server){const data=await api('me','PUT',valid);userId=data.id;}
   else localStorage.setItem(storageKey,JSON.stringify(valid));
   $('save-status').textContent='저장 완료';return valid;
 }
 async function dashboard(){
   if(server){try{const me=await api('me');userId=me.id;profile=normalize(me.profile);}catch{openJoin(true);return;}}
   else{const stored=localStorage.getItem(storageKey);if(!stored){openJoin(false);return;}profile=normalize(JSON.parse(stored));}
   $('save-mode').textContent=server?'계정에 저장됩니다. 공유 주소는 수정 후에도 동일합니다.':'이 기기에 저장됩니다. 공유 링크에는 생성 시점의 내용이 담겨요. 수정한 뒤에는 새 링크를 공유하세요.';
   show('studio');fillEditor();
 }
 function openJoin(isLogin=false){login=isLogin && server;$('join-title').textContent=login?'다시 만나 반가워요.':'나의 작은 가게를 열어볼까요?';$('join-mode').textContent=server?'이메일로 가입하면 계정과 나만의 미니홈피가 함께 만들어집니다.':'현재 GitHub Pages에서는 기기 저장 모드로 시작합니다. 계정 가입은 서버 연결 후 이용할 수 있습니다. 비밀번호는 수집하지 않습니다.';$('account-fields').hidden=!server;$('login-toggle').hidden=!server;$('join-name-label').hidden=login;$('join-role-label').hidden=login;$('signup-form').elements.name.required=!login;for(const name of ['email','password'])$('signup-form').elements[name].required=server;$('signup-form').elements.password.autocomplete=login?'current-password':'new-password';$('join-submit').textContent=login?'로그인':server?'가입하고 미니홈피 만들기':'이 기기에서 미니홈피 만들기';$('login-toggle').textContent=login?'처음인가요? 계정 만들기':'이미 계정이 있나요? 로그인';$('join-error').textContent='';if(!$('onboarding').open)$('onboarding').showModal();}
 async function share(){
   await save();const url=new URL('mini.html',location.href);if(server)url.searchParams.set('u',userId);else url.hash='home='+encode(profile);
   sharedUrl=url.href;$('share-url').value=sharedUrl;$('open-shared').href=sharedUrl;
   $('share-note').textContent=server?'같은 링크에서 저장한 최신 내용이 표시됩니다.':'방문자는 별도 가입 없이 이 링크에 담긴 미니홈피를 볼 수 있어요. 내용 수정 시 새 링크를 공유하세요. 이 링크는 긴 주소이며, 계정형 짧은 주소는 서버 연결이 필요합니다.';
   $('share-dialog').showModal();
 }
 async function copy(url){try{await navigator.clipboard.writeText(url);toast('링크를 복사했어요. SNS 프로필이나 채팅방에 붙여넣으세요.');}catch{const t=element('textarea');t.value=url;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('복사할 주소를 직접 선택해 주세요.');toast('링크를 복사했어요.');}}
 async function native(url,p){if(!navigator.share)return copy(url);try{await navigator.share({title:p.name+' · 홍보야',text:p.bio.slice(0,120),url});}catch(e){if(e.name!=='AbortError')throw e;}}
 function backup(){const blob=new Blob([JSON.stringify(normalize(profile),null,2)],{type:'application/json'}),a=element('a');a.href=URL.createObjectURL(blob);a.download='hongboya-mini-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 async function publicPage(p){publicProfile=normalize(p);show('public-view');render(publicProfile,$('public-home'));document.title=publicProfile.name+' · 홍보야 미니홈피';}
  const example={...blank(),name:'초록의 작은 농장',bio:'정성껏 기른 제철 먹거리.\n땅에서 시작된 이야기를 당신의 식탁까지 전합니다.\n이 페이지는 미니홈피 디자인 예시입니다.',role:'producer',theme:'forest',region:'전남 · 예시',links:[],products:[]};
  function syncThemeButton(){
    const isDark=document.documentElement?.dataset?.theme==='dark';
    const btn=$('mini-theme-toggle');
    if(btn){btn.textContent=isDark?'☀️ 라이트':'🌙 다크';btn.setAttribute?.('aria-pressed',String(isDark));}
  }
  syncThemeButton();
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    if(b.dataset.action==='theme-toggle'){
      const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
      document.documentElement.dataset.theme=next;
      try{localStorage.setItem('hongboya-theme',next);}catch(err){}
      syncThemeButton();
      return;
    }
    if(!ready){toast('저장 방식을 확인하고 있어요. 잠시 후 다시 눌러주세요.');return;}
   try{switch(b.dataset.action){
     case 'start':openJoin();break;case 'dashboard':await dashboard();break;
     case 'close':b.closest('dialog').close();break;case 'login-toggle':openJoin(!login);break;
     case 'example':await publicPage(example);break;
     case 'add-link':if(profile.links.length>=8)throw Error('링크는 8개까지 등록할 수 있습니다.');profile.links.push({title:'',url:''});fields('links');dirty();break;
     case 'add-product':if(profile.products.length>=12)throw Error('상품은 12개까지 등록할 수 있습니다.');profile.products.push({title:'',url:'',price:'',image:'',description:''});fields('products');dirty();break;
     case 'share':await share();break;case 'copy':await copy(sharedUrl);break;case 'native':await native(sharedUrl,profile);break;
     case 'copy-public':{const u=new URL('mini.html',location.href);u.hash='home='+encode(publicProfile);await copy(location.search.includes('u=')?location.href:u.href);break;}
     case 'native-public':{const u=new URL('mini.html',location.href);u.hash='home='+encode(publicProfile);await native(location.search.includes('u=')?location.href:u.href,publicProfile);break;}
     case 'backup':backup();break;case 'logout':if(server)await api('logout','POST',{});profile=null;userId='';show('landing');break;
   }}catch(error){toast(error.message);}
 });
 $('profile-form').addEventListener('input',e=>{if(['name','role','region','bio','image','theme'].includes(e.target.name)){profile[e.target.name]=e.target.value;dirty();}});
 $('profile-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await save();$('form-error').textContent='';toast('미니홈피를 저장했어요.');}catch(error){$('form-error').textContent=error.message;}finally{b.disabled=false;}});
 $('signup-form').addEventListener('submit',async e=>{
   e.preventDefault();const f=e.target,b=$('join-submit');b.disabled=true;
   try{const p={...blank(),name:f.elements.name.value,role:f.elements.role.value};
     if(server){await api(login?'login':'signup','POST',{email:f.elements.email.value,password:f.elements.password.value,profile:p});f.elements.password.value='';}
     else{if(localStorage.getItem(storageKey)&&!confirm('이 기기의 기존 미니홈피를 새로 만들까요? 기존 내용은 백업 후 진행하세요.'))return;localStorage.setItem(storageKey,JSON.stringify(normalize(p)));}
     $('onboarding').close();await dashboard();toast(login?'로그인했어요.':'나의 미니홈피와 미니샵이 만들어졌어요!');
   }catch(error){$('join-error').textContent=error.message;}finally{b.disabled=false;}
 });
 $('import-file').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>50000)throw Error('백업 파일이 너무 큽니다.');const imported=normalize(JSON.parse(await file.text()));if(!confirm('현재 편집 내용을 백업 파일 내용으로 바꿀까요?'))return;profile=imported;fillEditor();dirty();toast('백업을 불러왔어요. 저장 버튼을 눌러 적용하세요.');}catch(error){toast(error.message);}finally{e.target.value='';}});
 async function init(){
   try{server=(await api('status')).accounts===true;}catch{server=false;}
   ready=true;
   $('mode-notice').textContent=server?'계정 저장 모드 · 가입하면 나의 미니홈피와 미니샵이 자동으로 생성됩니다.':'기기 저장 모드 · 지금 만들고 공유할 수 있어요. 계정 동기화와 고정 주소는 회원 서버 연결이 필요합니다.';
   const params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
    try{if(hash.has('home'))await publicPage(decode(hash.get('home')));else if(params.has('u')){if(!server)throw Error('이 미니홈피의 계정 서버에 연결할 수 없습니다.');await publicPage(await api('public/'+encodeURIComponent(params.get('u'))));}else if(params.has('start'))openJoin();else if(params.has('studio'))await dashboard();}catch(error){show('public-view');$('public-home').replaceChildren(element('h2','미니홈피를 열 수 없어요'),element('p',error.message));}
 }
 init();
})();
