(() => {
 'use strict';
 const params=new URLSearchParams(location.search);
 // Preserve previously shared item URLs and the original item-registration entry point.
 if(params.has('poster_id')||params.has('brand_id')){location.replace('gallery.html'+location.search+location.hash);return;}
 if(params.get('open_studio')==='1'){location.replace('mini.html?start=1');return;}
 const photo=(id)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80`;
 const creators=[
  {id:'farm',role:'producer',label:'생산자',name:'초록의 작은 농장',region:'전남 · 해남',bio:'땅의 시간과 농부의 정성을 담아, 제철의 맛을 전해요.',tags:['제철 농산물','산지 이야기'],image:photo('photo-1542838132-92c53300491e'),theme:'forest',symbol:'🌾'},
  {id:'pottery',role:'maker',label:'제조사 · 메이커',name:'온기 도자기',region:'경기 · 이천',bio:'손으로 빚은 작은 온기. 일상의 식탁을 조금 더 다정하게.',tags:['수제 도자기','작업실'],image:photo('photo-1578749556568-bc2c40e68b61'),theme:'coral',symbol:'🧵'},
  {id:'studio',role:'creative',label:'콘텐츠 크리에이터',name:'데일리 스튜디오',region:'온라인 · 어디서나',bio:'아이디어를 일상으로. 나의 영감을 나누는 디지털 작업실.',tags:['디자인','디지털 콘텐츠'],image:photo('photo-1499750310107-5fef28a66643'),theme:'violet',symbol:'✦'},
   {id:'coffee',role:'local',label:'로컬 크리에이터',name:'파도 로스터리',region:'강원 · 강릉',bio:'바다 옆 작은 로스터리. 커피 한 잔에 동네의 이야기를 담아요.',tags:['로컬 커피','동네 이야기'],image:photo('photo-1495474472287-4d71bcdd2085'),theme:'ocean',symbol:'⌂'},
   {id:'citrus',role:'producer',label:'생산자',name:'귤빛 과수원',region:'제주 · 서귀포',bio:'제주의 햇살을 머금은 감귤. 수확의 기쁨을 함께 나눠요.',tags:['제주 감귤','과수원'],image:photo('photo-1557800636-894a64c1696f'),theme:'forest',symbol:'🌾'},
   {id:'leather',role:'maker',label:'제조사 · 메이커',name:'결 가죽공방',region:'서울 · 성수',bio:'한 땀 한 땀 쌓이는 시간. 오래 곁에 두는 가죽 소품을 만들어요.',tags:['가죽 소품','핸드메이드'],image:photo('photo-1627123424574-724758594e93'),theme:'coral',symbol:'🧵'},
   {id:'writing',role:'creative',label:'콘텐츠 크리에이터',name:'문장 수집실',region:'온라인 · 글쓰기',bio:'일상의 작은 발견을 글로 담아요. 나만의 이야기를 함께 써요.',tags:['글쓰기','전자책'],image:photo('photo-1455390582262-044cdead277a'),theme:'violet',symbol:'✦'},
   {id:'bookshop',role:'local',label:'로컬 크리에이터',name:'골목의 책방',region:'전북 · 전주',bio:'책 한 권으로 만나는 동네. 취향을 나누는 작은 책방이에요.',tags:['독립서점','북클럽'],image:photo('photo-1507842217343-583bb7270b66'),theme:'ocean',symbol:'⌂'},
   {id:'apple',role:'producer',label:'생산자',name:'아침 사과밭',region:'경북 · 청송',bio:'차가운 새벽 공기와 따뜻한 햇빛이 키운 사과를 소개해요.',tags:['사과','농부의 일상'],image:photo('photo-1560806887-1e4cd0b6cbd6'),theme:'forest',symbol:'🌾'},
   {id:'wood',role:'maker',label:'제조사 · 메이커',name:'나무의 시간',region:'경기 · 양평',bio:'나무의 결을 살린 생활 소품. 자연의 편안함을 일상에 더해요.',tags:['목공','생활 소품'],image:photo('photo-1452860606245-08befc0ff44b'),theme:'coral',symbol:'🧵'},
   {id:'photo',role:'creative',label:'콘텐츠 크리에이터',name:'빛을 담는 작업실',region:'온라인 · 사진',bio:'지나가는 순간을 오래 남도록. 사진과 보정 노하우를 나눠요.',tags:['사진','프리셋'],image:photo('photo-1516035069371-29a1b244cc32'),theme:'violet',symbol:'✦'},
   {id:'bakery',role:'local',label:'로컬 크리에이터',name:'아침의 빵집',region:'부산 · 영도',bio:'동네에 퍼지는 갓 구운 빵 냄새. 매일의 작은 행복을 구워요.',tags:['동네 빵집','수제 베이커리'],image:photo('photo-1509440159596-0249088772ff'),theme:'ocean',symbol:'⌂'},
   {id:'garden',role:'producer',label:'생산자',name:'계절의 텃밭',region:'충남 · 홍성',bio:'계절에 맞춰 천천히 자란 채소. 밭에서 식탁으로 이어지는 이야기.',tags:['제철 채소','텃밭'],image:photo('photo-1540420773420-3366772f4999'),theme:'forest',symbol:'🌾'},
   {id:'flowers',role:'maker',label:'제조사 · 메이커',name:'꽃결 아틀리에',region:'경기 · 수원',bio:'꽃과 손길로 만드는 특별한 하루. 마음을 전하는 오브제를 빚어요.',tags:['플라워','수제 오브제'],image:photo('photo-1490750967868-88aa4486c946'),theme:'coral',symbol:'🧵'},
   {id:'music',role:'creative',label:'콘텐츠 크리에이터',name:'작은 소리 스튜디오',region:'온라인 · 음악',bio:'당신의 콘텐츠에 어울리는 소리. 일상에 영감을 더하는 음악을 만들어요.',tags:['음악','사운드 콘텐츠'],image:photo('photo-1511379938547-c1f69419868d'),theme:'violet',symbol:'✦'},
   {id:'stay',role:'local',label:'로컬 크리에이터',name:'숲옆 작은 쉼',region:'강원 · 양양',bio:'잠시 멈추고 동네를 느껴요. 숲 가까이에서 발견하는 여행의 여유.',tags:['로컬 여행','공간'],image:photo('photo-1441974231531-c6227db76b6e'),theme:'ocean',symbol:'⌂'}
 ];
 const $=id=>document.getElementById(id);
 const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 let active='all';
 function image(src,alt){const el=make('img');el.src=src;el.alt=alt;el.loading='lazy';el.width=700;el.height=600;el.addEventListener('error',()=>{el.hidden=true;el.parentElement.style.background='linear-gradient(140deg,#e4e8d6,#d4d9c2)';});return el;}
 function render(){
  const query=$('creator-search').value.trim().toLocaleLowerCase();
  const list=creators.filter(c=>(active==='all'||c.role===active)&&[c.name,c.region,c.bio,c.label,...c.tags].join(' ').toLocaleLowerCase().includes(query));
  $('creator-grid').replaceChildren();$('result-count').textContent=`${list.length}개의 공간`;$('empty-state').hidden=list.length>0;
  for(const c of list){const card=make('article',undefined,'creator-card');const cover=make('div',undefined,'card-image');cover.append(image(c.image,c.name+' 미니홈피의 분위기를 보여주는 이미지'),make('span',c.label,'card-label'),make('span','↗','card-arrow'));const body=make('div',undefined,'card-body');body.append(make('div',c.region+' · 디자인 예시','card-meta'),make('h3',c.name),make('p',c.bio));const tags=make('div',undefined,'tags');for(const tag of c.tags)tags.append(make('span','#'+tag));const button=make('button',undefined,'card-button');button.dataset.preview=c.id;button.setAttribute('aria-label',c.name+' 미니홈피 미리보기');button.append(make('span','미니홈피 미리보기'),make('span','↗'));body.append(tags,button);card.append(cover,body);$('creator-grid').append(card);}
 }
 function select(role){active=role;document.querySelectorAll('[data-filter]').forEach(b=>{const match=b.dataset.filter===role;b.classList.toggle('active',match);b.setAttribute('aria-pressed',String(match));});render();}
 function preview(id){
  const c=creators.find(c=>c.id===id);if(!c)return;
  const container=$('preview-content');container.replaceChildren(image(c.image,c.name+' 디자인 예시'));container.append(make('p',c.symbol+' '+c.label+' · '+c.region));const title=make('h2',c.name);title.id='preview-title';container.append(title,make('p',c.bio),make('p','이 공간은 디자인 예시입니다. 실제 판매자·상품 정보가 아니며, 나의 공간에서는 쇼핑몰과 SNS 주소를 직접 연결할 수 있어요.'));
  const profile={name:c.name,bio:c.bio+'\n\n홍보야 미니홈피 디자인 예시입니다.',region:c.region,role:c.role,theme:c.theme,image:c.image,links:[],products:[]};
  const encoded=btoa(Array.from(new TextEncoder().encode(JSON.stringify(profile)),b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  $('open-demo').href='mini.html#home='+encoded;$('creator-preview').showModal();
 }
 document.addEventListener('click',e=>{const p=e.target.closest('[data-preview]');if(p)preview(p.dataset.preview);const f=e.target.closest('[data-filter]');if(f)select(f.dataset.filter);const c=e.target.closest('[data-category]');if(c){$('creator-search').value='';select(c.dataset.category);}});
 $('search-form').addEventListener('submit',e=>{e.preventDefault();render();});$('creator-search').addEventListener('input',render);
 $('reset-search').addEventListener('click',()=>{$('creator-search').value='';select('all');});
 $('close-preview').addEventListener('click',()=>$('creator-preview').close());
 $('creator-preview').addEventListener('click',e=>{if(e.target===$('creator-preview')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 $('menu-toggle').addEventListener('click',()=>{const expanded=$('menu-toggle').getAttribute('aria-expanded')==='true';$('menu-toggle').setAttribute('aria-expanded',String(!expanded));$('menu-toggle').setAttribute('aria-label',expanded?'메뉴 열기':'메뉴 닫기');$('mobile-menu').hidden=expanded;});
 $('mobile-menu').addEventListener('click',e=>{if(e.target.closest('a')){$('mobile-menu').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');$('menu-toggle').setAttribute('aria-label','메뉴 열기');}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('mobile-menu').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');}});
 render();
})();
