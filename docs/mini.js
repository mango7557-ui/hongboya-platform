/* Mini homes use authenticated server storage when available; Pages uses portable snapshots. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const storageKey = 'hongboya-mini-v1:' + new URL('.', location.href).pathname;
 const roles = {producer:'🌾 생산자',maker:'🛠 제조사 · 메이커',creative:'✦ 크리에이티브',local:'📍 로컬 크리에이터'};
 const MOODS = {
   sunny:'☀️ 기분좋음',harvest:'🌾 수확중',hot:'🔥 주문폭주',
   sale:'💝 특가오픈',work:'☕ 작업중',new:'🎉 신상출시'
 };
 const BGM_PRESETS = {
   sunny:{label:'프리스타일 - Y (홍보야 Acoustic Ver.)',notes:[523.25,659.25,783.99,659.25,587.33,698.46,783.99,698.46]},
   breeze:{label:'산지의 아침 (Green Farm Music Box)',notes:[587.33,739.99,880,739.99,659.25,783.99,987.77,783.99]},
   lofi:{label:'성수동 작업실의 오후 (Lo-Fi Piano)',notes:[440,523.25,659.25,783.99,392,493.88,587.33,698.46]},
   cafe:{label:'강릉 파도소리 로컬 카페 BGM',notes:[493.88,659.25,783.99,987.77,523.25,659.25,783.99,1046.5]}
 };
 const ROOM_THEMES = {
   farm:{title:'🌿 햇살 농원 온실룸',window:'☀️ 맑음 · 산지직송'},
   atelier:{title:'🏺 성수 공방 작업실',window:'🧶 핸드메이드 제작중'},
   studio:{title:'💻 크리에이터 데스크',window:'✨ 아이디어 스케치'},
   cafe:{title:'☕ 해변 로컬 카페룸',window:'🌊 파도소리 로스터리'},
   hanok:{title:'🌸 따스한 한옥 마당룸',window:'🏮 전통 로컬의 정성'}
 };
 const MINIMES = {
   farmer:{emoji:'👩‍🌾',label:'농부 미니미'},
   maker:{emoji:'🧑‍🎨',label:'장인 미니미'},
   creator:{emoji:'🧑‍💻',label:'크리에이터 미니미'},
   barista:{emoji:'🧑‍🍳',label:'로컬 바리스타'},
   cat:{emoji:'🐱',label:'고양이 점장'},
   dog:{emoji:'🐶',label:'강아지 매니저'}
 };
 const ROOM_PROPS = {
   box:{emoji:'📦',label:'직거래 택배함'},
   plant:{emoji:'🪴',label:'반려 화분'},
   basket:{emoji:'🍎',label:'수확 바구니'},
   lamp:{emoji:'🕯️',label:'감성 조명'},
   speaker:{emoji:'🎸',label:'음악 스피커'},
   coffee:{emoji:'☕',label:'따뜻한 커피'},
   sign:{emoji:'🪧',label:'OPEN 입간판'},
   balloon:{emoji:'🎈',label:'축하 풍선'}
 };
 let server = false, ready = false, profile = null, userId = '', login = false, sharedUrl = '', publicProfile = null, activeCyTab = 'all', bgmTimer = null, bgmCtx = null;
 const blank = () => ({name:'',bio:'',region:'',image:'',coverImage:'',badgeText:'',bgStyle:'clean',btnShape:'rounded',mood:'sunny',bgmPreset:'sunny',bgmTitle:'',roomTheme:'farm',minime:'farmer',minimeMsg:'',roomProps:['box','plant','sign'],guestbook:[],role:'local',theme:'coral',links:[],products:[]});
 const MAX_PROFILE_PNG_BYTES = 600 * 1024;
 const pngDataUrlBytes = value => {
   const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(value || '').trim());
   if (!m) return -1;
   const b64 = m[1];
   const pad = b64.endsWith('==') ? 2 : (b64.endsWith('=') ? 1 : 0);
   return Math.floor((b64.length * 3) / 4) - pad;
 };
 const safeURL = value => {
   if (!value) return '';
   const url = new URL(String(value));
   if (!['https:','http:'].includes(url.protocol) || url.username || url.password || String(value).length > 1000) throw Error('https:// 또는 http://로 시작하는 링크를 입력하세요.');
   return url.href;
 };
 const safeImageURL = value => {
   if (!value) return '';
   const raw = String(value).trim();
   if (raw.startsWith('data:')) {
     const bytes = pngDataUrlBytes(raw);
     if (bytes <= 0) throw Error('업로드 이미지는 PNG 형식이어야 합니다.');
     if (bytes > MAX_PROFILE_PNG_BYTES) throw Error('업로드 이미지는 600KB 이하여야 합니다.');
     return raw;
   }
   return safeURL(raw);
 };
 function normalize(raw) {
   if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('미니홈피 정보가 올바르지 않습니다.');
   const p = blank();
   for (const [key,max] of [['name',60],['bio',400],['region',60],['badgeText',40],['bgmTitle',60],['minimeMsg',50]]) p[key] = String(raw[key] || '').trim().slice(0,max);
   if (!p.name) throw Error('활동명을 입력하세요.');
    p.role = Object.hasOwn(roles,raw.role) ? raw.role : 'local';
   p.theme = ['coral','forest','violet','ocean','amber','rose'].includes(raw.theme) ? raw.theme : 'coral';
   p.bgStyle = ['clean','dots','grid','soft'].includes(raw.bgStyle) ? raw.bgStyle : 'clean';
   p.btnShape = ['rounded','pill','sharp'].includes(raw.btnShape) ? raw.btnShape : 'rounded';
   p.mood = Object.hasOwn(MOODS,raw.mood) ? raw.mood : 'sunny';
   p.bgmPreset = Object.hasOwn(BGM_PRESETS,raw.bgmPreset) ? raw.bgmPreset : 'sunny';
   p.roomTheme = Object.hasOwn(ROOM_THEMES,raw.roomTheme) ? raw.roomTheme : 'farm';
   p.minime = Object.hasOwn(MINIMES,raw.minime) ? raw.minime : 'farmer';
   if (Array.isArray(raw.roomProps)) {
     p.roomProps = [...new Set(raw.roomProps.filter(k => Object.hasOwn(ROOM_PROPS,k)))].slice(0,8);
   }
   if (Array.isArray(raw.guestbook)) {
     if (raw.guestbook.length > 12) throw Error('일촌평은 12개까지 등록할 수 있습니다.');
     p.guestbook = raw.guestbook.map(g => ({
       nick: String(g?.nick || '일촌').trim().slice(0,24) || '일촌',
       text: String(g?.text || '').trim().slice(0,120)
     })).filter(g => g.text);
   }
   p.image = safeImageURL(raw.image);
   p.coverImage = safeImageURL(raw.coverImage);
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
 function encode(p) {const result=btoa(Array.from(new TextEncoder().encode(JSON.stringify(normalize(p))), b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');if(result.length>2000000)throw Error('공유 주소가 너무 깁니다. 소개나 링크 길이를 줄여주세요.');return result;}
 function decode(s) {
   if (s.length > 2000000) throw Error('공유 링크가 너무 깁니다.');
   return normalize(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))));
 }
 // Pure helpers are also used by the cross-browser sharing tests.
 window.HongboyaMini = {normalize,encode,decode,safeURL,safeImageURL,pngDataUrlBytes,MAX_PROFILE_PNG_BYTES};
 function element(tag, text, cls) { const el=document.createElement(tag); if(text !== undefined)el.textContent=text; if(cls)el.className=cls; return el; }
 function outbound(title, url, cls) {const a=element('a',title,cls);a.href=safeURL(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
 function image(url, alt, cls) {const img=element('img',undefined,cls);img.src=['avatar','cover-img'].includes(cls)?safeImageURL(url):safeURL(url);img.alt=alt;img.referrerPolicy='no-referrer';img.loading='lazy';img.addEventListener('error',()=>img.replaceWith(element('div','✦',cls || 'product-art')));return img;}
 function toggleBgm(presetKey,btnEl){
   if(bgmTimer){
     clearInterval(bgmTimer);bgmTimer=null;
     if(bgmCtx){try{bgmCtx.close();}catch{}bgmCtx=null;}
     document.querySelectorAll('.cy-bgm-btn').forEach(b=>{b.textContent='▶ 재생';});
     return;
   }
   const AudioContextCls=window.AudioContext||window.webkitAudioContext;
   if(!AudioContextCls){toast('이 브라우저는 오르골 재생을 지원하지 않습니다.');return;}
   bgmCtx=new AudioContextCls();
   const notes=(BGM_PRESETS[presetKey]||BGM_PRESETS.sunny).notes;
   let step=0;
   const playNote=()=>{
     if(!bgmCtx)return;
     const osc=bgmCtx.createOscillator(),gain=bgmCtx.createGain();
     osc.type='triangle';
     osc.frequency.value=notes[step%notes.length];
     gain.gain.setValueAtTime(0.001,bgmCtx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.11,bgmCtx.currentTime+0.03);
     gain.gain.exponentialRampToValueAtTime(0.0001,bgmCtx.currentTime+0.42);
     osc.connect(gain);gain.connect(bgmCtx.destination);
     osc.start();osc.stop(bgmCtx.currentTime+0.44);
     step++;
   };
   playNote();
   bgmTimer=setInterval(playNote,460);
   document.querySelectorAll('.cy-bgm-btn').forEach(b=>{b.textContent='⏸ 정지';});
   if(btnEl)btnEl.textContent='⏸ 정지';
 }
 function render(p, target) {
   target.replaceChildren();
   const bgCls=p.bgStyle && p.bgStyle!=='clean'?` bg-${p.bgStyle}`:'';
   const shapeCls=p.btnShape && p.btnShape!=='rounded'?` shape-${p.btnShape}`:'';
   target.className=`mini-home ${p.theme || 'coral'}${bgCls}${shapeCls}`;

   // 1. 싸이월드 상단 TODAY / TOTAL 카운터 & BGM 주크박스 바
   const statusBar=element('div',undefined,'cy-statusbar');
   const seed=(p.name||'홍보야').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
   const todayCnt=42+(seed%180)+(p.products?.length||0)*9;
   const totalCnt=1200+seed*17+(p.links?.length||0)*130;
   const counter=element('span',undefined,'cy-counter');
   counter.innerHTML=`TODAY <b>${todayCnt}</b> · TOTAL ${totalCnt.toLocaleString()}`;
   const bgmWrap=element('div',undefined,'cy-bgm');
   const presetObj=BGM_PRESETS[p.bgmPreset]||BGM_PRESETS.sunny;
   bgmWrap.append(element('span','💿'),element('span',p.bgmTitle||presetObj.label,'cy-bgm-title'));
   const bgmBtn=element('button',bgmTimer?'⏸ 정지':'▶ 재생','cy-bgm-btn');
   bgmBtn.type='button';
   bgmBtn.onclick=()=>toggleBgm(p.bgmPreset,bgmBtn);
   bgmWrap.append(bgmBtn);
   statusBar.append(counter,bgmWrap);
   target.append(statusBar);

   // 2. 상단 커버 배너 & 프로필 아바타
   const cover=element('div','','home-cover');
   if(p.coverImage){try{cover.append(image(p.coverImage,(p.name||'미니홈피')+' 테마 배경','cover-img'));}catch{}}
   target.append(cover);
   try{target.append(p.image ? image(p.image,p.name,'avatar') : element('div',roles[p.role]?.split(' ')[0] || '✦','avatar'));}catch{target.append(element('div','✦','avatar'));}

   // 3. TODAY IS 기분 상태 박스 & 환영 스티커
   const todayBox=element('div',undefined,'cy-today-box');
   const moodLabel=MOODS[p.mood]||MOODS.sunny;
   const em=element('em','TODAY IS... ');
   todayBox.append(em,document.createTextNode(moodLabel));
   target.append(todayBox);
   if(p.badgeText){const stickerWrap=element('div');stickerWrap.append(element('span',p.badgeText,'welcome-sticker'));target.append(stickerWrap);}
   target.append(element('span',(roles[p.role] || roles.local)+(p.region?' · '+p.region:''),'pill'),element('h1',p.name || '나의 미니홈피'),element('p',p.bio || '내가 만든 가치와 이야기를 소개해보세요.','bio'));

   // 4. 싸이월드 다이어리 탭 바
   const tabsBar=element('div',undefined,'cy-tabs');
   for(const [tabKey,tabLabel] of [['all','전체홈'],['room','미니룸'],['shop','미니샵'],['sns','SNS채널'],['guest','일촌평']]){
     const tabBtn=element('button',tabLabel,'cy-tab'+(activeCyTab===tabKey?' active':''));
     tabBtn.type='button';
     tabBtn.onclick=()=>{activeCyTab=tabKey;render(p,target);};
     tabsBar.append(tabBtn);
   }
   target.append(tabsBar);

   // 5. 싸이월드 미니룸 (Mini-Room) 섹션
   if(activeCyTab==='all' || activeCyTab==='room'){
     const roomMeta=ROOM_THEMES[p.roomTheme]||ROOM_THEMES.farm;
     const minimeMeta=MINIMES[p.minime]||MINIMES.farmer;
     const miniroom=element('section',undefined,'cy-miniroom');
     const roomHead=element('div',undefined,'cy-miniroom-head');
     roomHead.append(element('span','🏠 MINI ROOM · '+roomMeta.title),element('span',minimeMeta.emoji+' '+minimeMeta.label));
     const stage=element('div',undefined,`cy-room-stage room-${p.roomTheme||'farm'}`);
     const wall=element('div',undefined,'cy-room-wall');
     wall.append(element('span',roomMeta.window,'cy-room-window'),element('span','HONGBOYA ROOM','cy-room-window'));
     const minimeWrap=element('div',undefined,'cy-minime-wrap');
     const speechText=p.minimeMsg||`${p.name||'우리 가게'}에 오신 걸 환영해요! ♥`;
     minimeWrap.append(element('div',speechText,'cy-speech'),element('div',minimeMeta.emoji,'cy-minime-avatar'),element('span',minimeMeta.label,'cy-minime-name'));
     const floor=element('div',undefined,'cy-props-floor');
     const propsList=Array.isArray(p.roomProps)&&p.roomProps.length?p.roomProps:['box','plant','sign'];
     for(const propKey of propsList){
       const propInfo=ROOM_PROPS[propKey];
       if(propInfo)floor.append(element('span',`${propInfo.emoji} ${propInfo.label}`,'cy-prop-item'));
     }
     stage.append(wall,minimeWrap,floor);
     miniroom.append(roomHead,stage);
     target.append(miniroom);
   }

   // 6. 나의 쇼핑몰 & SNS 링크
   if(activeCyTab==='all' || activeCyTab==='sns'){
     const links=element('div',undefined,'home-links');
     for(const row of p.links) if(row.title && row.url) {try{links.append(outbound(row.title+' ↗',row.url));}catch{}}
     if(!links.children.length)links.append(element('p','아직 연결된 채널이 없습니다.','empty'));
     target.append(links);
   }

   // 7. 나의 미니샵 상품
   if(activeCyTab==='all' || activeCyTab==='shop'){
     target.append(element('h2','나의 미니샵'));
     const products=element('div',undefined,'home-products');
     for(const row of p.products){
       const card=element('article',undefined,'product');
       try{card.append(row.image?image(row.image,row.title):element('div','✦','product-art'));}catch{card.append(element('div','✦','product-art'));}
       card.append(element('h3',row.title || '상품명'),element('p',row.price),element('p',row.description));
       if(row.url){try{card.append(outbound('구매 · 예약하기 ↗',row.url));}catch{}}
       products.append(card);
     }
     target.append(products.children.length?products:element('p','새로운 아이템을 준비하고 있어요.','empty'));
   }

   // 8. 싸이월드 일촌평 (What Friends Say)
   if(activeCyTab==='all' || activeCyTab==='guest'){
     const ilchon=element('section',undefined,'cy-ilchon');
     ilchon.append(element('h2','💬 What Friends Say (일촌평)'));
     const form=element('div',undefined,'cy-ilchon-form');
     const nickIn=element('input');nickIn.name='ilchonNick';nickIn.maxLength=20;nickIn.placeholder='일촌명 (예: 단골이웃)';
     const textIn=element('input');textIn.name='ilchonText';textIn.maxLength=100;textIn.placeholder='따뜻한 응원이나 구매 후기 일촌평을 남겨주세요!';
     const addBtn=element('button','일촌평 등록');addBtn.type='button';
     addBtn.onclick=()=>{
       const nick=(nickIn.value.trim()||'일촌 팬').slice(0,20);
       const text=textIn.value.trim().slice(0,100);
       if(!text){toast('일촌평 내용을 입력해주세요.');return;}
       p.guestbook=Array.isArray(p.guestbook)?p.guestbook:[];
       p.guestbook.unshift({nick,text});
       p.guestbook=p.guestbook.slice(0,12);
       if(p===profile){fields('guestbook');dirty();}
       else render(p,target);
       toast('💬 일촌평이 등록되었어요!');
     };
     form.append(nickIn,textIn,addBtn);
     const list=element('div',undefined,'cy-ilchon-list');
     const entries=(p.guestbook&&p.guestbook.length)?p.guestbook:[
       {nick:'일촌 단골',text:`${p.name||'이곳'}의 정성이 담긴 상품 항상 응원합니다! ♥`},
       {nick:'이웃 크리에이터',text:'미니룸 너무 예뻐요! 일촌 맺고 직거래 구경하고 갑니다 :)'}
     ];
     for(const g of entries){
       const item=element('div',undefined,'cy-ilchon-item');
       item.append(element('b',g.nick),element('span',g.text),element('small','일촌'));
       list.append(item);
     }
     ilchon.append(form,list);
     target.append(ilchon);
   }

   target.append(element('p','구매·결제·배송은 연결된 판매처에서 진행됩니다.','muted'));
   const brand=element('a','나도 홍보야 미니홈피 만들기 ↗','pill');brand.href='mini.html';target.append(brand);
 }
 function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
 function show(view){for(const id of ['landing','studio','public-view'])$(id).hidden=id!==view;}
 async function api(path,method='GET',body){
   const res=await fetch('api/mini/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
   const data=await res.json();if(!res.ok)throw Error(data.error || '요청을 처리하지 못했습니다.');return data;
 }
 function syncAvatarUploadUI(){
   const thumb=$('avatar-upload-thumb'),meta=$('avatar-upload-meta'),clearBtn=$('avatar-clear-btn'),f=$('profile-form');
   if(!profile)return;
   const imgVal=profile.image || '';
   if(f?.elements?.image){
     f.elements.image.value=imgVal.startsWith('data:image/png;base64,')?'':imgVal;
     f.elements.image.placeholder=imgVal.startsWith('data:image/png;base64,')?'업로드된 PNG 이미지 사용 중 (URL 입력 시 대체)':'https://... (선택)';
   }
   if(!imgVal){
     if(thumb){thumb.hidden=true;thumb.removeAttribute?.('src');}
     if(meta)meta.textContent='미등록';
     if(clearBtn)clearBtn.hidden=true;
     return;
   }
   if(thumb){thumb.src=imgVal;thumb.hidden=false;}
   if(clearBtn)clearBtn.hidden=false;
   if(meta){
     const bytes=pngDataUrlBytes(imgVal);
     meta.textContent=bytes>0?`PNG · ${(bytes/1024).toFixed(1)}KB / 600KB 이하`:'외부 이미지 URL';
   }
 }
 function syncCoverUploadUI(){
   const thumb=$('cover-upload-thumb'),meta=$('cover-upload-meta'),clearBtn=$('cover-clear-btn'),f=$('profile-form');
   if(!profile)return;
   const coverVal=profile.coverImage || '';
   if(f?.elements?.coverImage){
     f.elements.coverImage.value=coverVal.startsWith('data:image/png;base64,')?'':coverVal;
     f.elements.coverImage.placeholder=coverVal.startsWith('data:image/png;base64,')?'업로드된 PNG 배경 사용 중 (URL 입력 시 대체)':'https://... (선택 · 배경 업로드/프리셋 선택 가능)';
   }
   if(!coverVal){
     if(thumb){thumb.hidden=true;thumb.removeAttribute?.('src');}
     if(meta)meta.textContent='기본 테마 컬러';
     if(clearBtn)clearBtn.hidden=true;
     return;
   }
   if(thumb){thumb.src=coverVal;thumb.hidden=false;}
   if(clearBtn)clearBtn.hidden=false;
   if(meta){
     const bytes=pngDataUrlBytes(coverVal);
     meta.textContent=bytes>0?`PNG · ${(bytes/1024).toFixed(1)}KB / 600KB 이하`:'테마 배경 이미지 적용됨';
   }
 }
 async function resizeImageFileToPng(file,mode='avatar'){
   if(!file)throw Error('이미지 파일을 선택해주세요.');
   if(file.type && !file.type.startsWith('image/'))throw Error('이미지 파일만 업로드할 수 있습니다.');
   const dataUrl=await new Promise((resolve,reject)=>{
     const reader=new FileReader();
     reader.onload=()=>resolve(String(reader.result||''));
     reader.onerror=()=>reject(Error('이미지를 읽지 못했습니다.'));
     reader.readAsDataURL(file);
   });
   const img=await new Promise((resolve,reject)=>{
     const el=new Image();
     el.onload=()=>resolve(el);
     el.onerror=()=>reject(Error('지원하지 않거나 손상된 이미지입니다.'));
     el.src=dataUrl;
   });
   const srcW=img.naturalWidth || img.width || 640;
   const srcH=img.naturalHeight || img.height || 640;
   if(mode==='cover'){
     const ratio=16/9;
     let cropW=srcW,cropH=Math.round(srcW/ratio);
     if(cropH>srcH){cropH=srcH;cropW=Math.round(srcH*ratio);}
     const sx=Math.max(0,Math.floor((srcW-cropW)/2));
     const sy=Math.max(0,Math.floor((srcH-cropH)/2));
     const widths=[960,800,680,580,500,420,360,300,240];
     for(const targetW of widths){
       const w=Math.min(targetW,Math.max(160,cropW));
       const h=Math.max(90,Math.round(w/ratio));
       const canvas=document.createElement('canvas');
       canvas.width=w;canvas.height=h;
       const ctx=canvas.getContext('2d');
       ctx.clearRect(0,0,w,h);
       ctx.drawImage(img,sx,sy,cropW,cropH,0,0,w,h);
       const pngUrl=canvas.toDataURL('image/png');
       const bytes=pngDataUrlBytes(pngUrl);
       if(bytes>0 && bytes<=MAX_PROFILE_PNG_BYTES){
         return {dataUrl:pngUrl,bytes,size:`${w}×${h}`};
       }
     }
     throw Error('배경 이미지를 600KB 이하 PNG로 변환할 수 없습니다.');
   }
   const side=Math.min(srcW,srcH);
   const sx=Math.max(0,Math.floor((srcW-side)/2));
   const sy=Math.max(0,Math.floor((srcH-side)/2));
   const steps=[640,512,420,360,300,256,220,180,150,120,96,72];
   for(const target of steps){
     const size=Math.min(target,Math.max(64,side));
     const canvas=document.createElement('canvas');
     canvas.width=size;canvas.height=size;
     const ctx=canvas.getContext('2d');
     ctx.clearRect(0,0,size,size);
     ctx.drawImage(img,sx,sy,side,side,0,0,size,size);
     const pngUrl=canvas.toDataURL('image/png');
     const bytes=pngDataUrlBytes(pngUrl);
     if(bytes>0 && bytes<=MAX_PROFILE_PNG_BYTES){
       return {dataUrl:pngUrl,bytes,size:`${size}×${size}`};
     }
   }
   throw Error('이미지를 600KB 이하 PNG로 변환할 수 없습니다. 다른 이미지를 선택해주세요.');
 }
 function syncRoomPropsUI(){
   if(!profile)return;
   const activeProps=new Set(Array.isArray(profile.roomProps)?profile.roomProps:['box','plant','sign']);
   document.querySelectorAll?.('#room-props-chips [data-prop]')?.forEach(btn=>{
     const on=activeProps.has(btn.dataset.prop);
     btn.classList.toggle('active',on);
     btn.setAttribute?.('aria-pressed',String(on));
   });
 }
 function fillEditor(){
   const f=$('profile-form');for(const key of ['name','role','region','bio','image','coverImage','theme','bgStyle','btnShape','badgeText','mood','bgmPreset','bgmTitle','roomTheme','minime','minimeMsg'])if(f.elements[key])f.elements[key].value=profile[key] || '';
   syncAvatarUploadUI();
   syncCoverUploadUI();
   syncRoomPropsUI();
   fields('links');fields('products');fields('guestbook');render(profile,$('preview'));$('form-error').textContent='';
 }
 function fields(key){
   const targetId=key==='links'?'link-fields':(key==='products'?'product-fields':'guestbook-fields');
   const target=$(targetId);if(!target)return;target.replaceChildren();
   profile[key]=Array.isArray(profile[key])?profile[key]:[];
   profile[key].forEach((row,i)=>{
     const card=element('div',undefined,'entry');
     const labelPrefix=key==='links'?'링크 ':key==='products'?'상품 ':'일촌평 ';
     card.append(element('b',labelPrefix+(i+1)));
     const specs=key==='links'
       ? [['title','채널 이름','text',80],['url','채널 주소','url',1000]]
       : key==='products'
         ? [['title','상품 이름','text',80],['price','가격 / 혜택','text',60],['description','상품 설명','text',200],['image','상품 이미지 주소 (선택)','url',1000],['url','구매 / 예약 주소','url',1000]]
         : [['nick','일촌 별명','text',24],['text','일촌평 한마디','text',120]];
     for(const [field,title,type,max] of specs){const label=element('label',title),input=element('input');input.value=row[field] || '';input.type=type;input.maxLength=max;input.required=['title','url','text'].includes(field);input.addEventListener('input',()=>{row[field]=input.value;dirty();});label.append(input);card.append(label);}
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
     case 'add-guestbook':profile.guestbook=Array.isArray(profile.guestbook)?profile.guestbook:[];if(profile.guestbook.length>=12)throw Error('일촌평은 12개까지 등록할 수 있습니다.');profile.guestbook.push({nick:'일촌 단골',text:''});fields('guestbook');dirty();break;
     case 'toggle-prop':{
       const propKey=b.dataset.prop;
       if(!Object.hasOwn(ROOM_PROPS,propKey))break;
       const cur=new Set(Array.isArray(profile.roomProps)?profile.roomProps:['box','plant','sign']);
       if(cur.has(propKey))cur.delete(propKey);else cur.add(propKey);
       profile.roomProps=[...cur];
       syncRoomPropsUI();dirty();break;
     }
     case 'clear-avatar':profile.image='';syncAvatarUploadUI();dirty();toast('프로필 이미지를 지웠어요.');break;
     case 'clear-cover':profile.coverImage='';syncCoverUploadUI();dirty();toast('테마 배경 이미지를 지웠어요.');break;
     case 'cover-preset':profile.coverImage=safeImageURL(b.dataset.cover||'');syncCoverUploadUI();dirty();toast('추천 테마 배경을 적용했어요.');break;
     case 'share':await share();break;case 'copy':await copy(sharedUrl);break;case 'native':await native(sharedUrl,profile);break;
     case 'copy-public':{const u=new URL('mini.html',location.href);u.hash='home='+encode(publicProfile);await copy(location.search.includes('u=')?location.href:u.href);break;}
     case 'native-public':{const u=new URL('mini.html',location.href);u.hash='home='+encode(publicProfile);await native(location.search.includes('u=')?location.href:u.href,publicProfile);break;}
     case 'backup':backup();break;case 'logout':if(server)await api('logout','POST',{});profile=null;userId='';show('landing');break;
   }}catch(error){toast(error.message);}
 });
 async function handleAvatarInput(e){
   const file=e.target.files?.[0];
   if(!file)return;
   const meta=$('avatar-upload-meta');
   try{
     if(meta)meta.textContent='PNG 변환·리사이징 중…';
     const {dataUrl,bytes,size}=await resizeImageFileToPng(file,'avatar');
     profile.image=dataUrl;
     syncAvatarUploadUI();
     dirty();
     toast(`프로필 PNG(${size}px · ${(bytes/1024).toFixed(1)}KB)로 자동 변환되었어요.`);
   }catch(error){
     syncAvatarUploadUI();
     toast(error.message);
   }finally{
     e.target.value='';
   }
 }
 async function handleCoverInput(e){
   const file=e.target.files?.[0];
   if(!file)return;
   const meta=$('cover-upload-meta');
   try{
     if(meta)meta.textContent='배경 PNG 변환·리사이징 중…';
     const {dataUrl,bytes,size}=await resizeImageFileToPng(file,'cover');
     profile.coverImage=dataUrl;
     syncCoverUploadUI();
     dirty();
     toast(`테마 배경 PNG(${size}px · ${(bytes/1024).toFixed(1)}KB)로 자동 변환되었어요.`);
   }catch(error){
     syncCoverUploadUI();
     toast(error.message);
   }finally{
     e.target.value='';
   }
 }
 $('avatar-camera-input')?.addEventListener?.('change',handleAvatarInput);
 $('avatar-file-input')?.addEventListener?.('change',handleAvatarInput);
 $('cover-camera-input')?.addEventListener?.('change',handleCoverInput);
 $('cover-file-input')?.addEventListener?.('change',handleCoverInput);
 $('profile-form').addEventListener('input',e=>{if(['name','role','region','bio','image','coverImage','theme','bgStyle','btnShape','badgeText','mood','bgmPreset','bgmTitle','roomTheme','minime','minimeMsg'].includes(e.target.name)){profile[e.target.name]=e.target.value;if(e.target.name==='image')syncAvatarUploadUI();if(e.target.name==='coverImage')syncCoverUploadUI();dirty();}});
 $('profile-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await save();$('form-error').textContent='';toast('미니홈피를 저장했어요.');}catch(error){$('form-error').textContent=error.message;}finally{b.disabled=false;}});
 $('signup-form').addEventListener('submit',async e=>{
   e.preventDefault();const f=e.target,b=$('join-submit');b.disabled=true;
   try{const p={...blank(),name:f.elements.name.value,role:f.elements.role.value};
     if(server){await api(login?'login':'signup','POST',{email:f.elements.email.value,password:f.elements.password.value,profile:p});f.elements.password.value='';}
     else{if(localStorage.getItem(storageKey)&&!confirm('이 기기의 기존 미니홈피를 새로 만들까요? 기존 내용은 백업 후 진행하세요.'))return;localStorage.setItem(storageKey,JSON.stringify(normalize(p)));}
     $('onboarding').close();await dashboard();toast(login?'로그인했어요.':'나의 미니홈피와 미니샵이 만들어졌어요!');
   }catch(error){$('join-error').textContent=error.message;}finally{b.disabled=false;}
 });
 $('import-file').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>900000)throw Error('백업 파일이 너무 큽니다.');const imported=normalize(JSON.parse(await file.text()));if(!confirm('현재 편집 내용을 백업 파일 내용으로 바꿀까요?'))return;profile=imported;fillEditor();dirty();toast('백업을 불러왔어요. 저장 버튼을 눌러 적용하세요.');}catch(error){toast(error.message);}finally{e.target.value='';}});
 async function init(){
   try{server=(await api('status')).accounts===true;}catch{server=false;}
   ready=true;
   $('mode-notice').textContent=server?'계정 저장 모드 · 가입하면 나의 미니홈피와 미니샵이 자동으로 생성됩니다.':'기기 저장 모드 · 지금 만들고 공유할 수 있어요. 계정 동기화와 고정 주소는 회원 서버 연결이 필요합니다.';
   const params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
    try{if(hash.has('home'))await publicPage(decode(hash.get('home')));else if(params.has('u')){if(!server)throw Error('이 미니홈피의 계정 서버에 연결할 수 없습니다.');await publicPage(await api('public/'+encodeURIComponent(params.get('u'))));}else if(params.has('start'))openJoin();else if(params.has('studio'))await dashboard();}catch(error){show('public-view');$('public-home').replaceChildren(element('h2','미니홈피를 열 수 없어요'),element('p',error.message));}
 }
 init();
})();
