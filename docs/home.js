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
  {id:'coffee',role:'local',label:'로컬 크리에이터',name:'파도 로스터리',region:'강원 · 강릉',bio:'바다 옆 작은 로스터리. 커피 한 잔에 동네의 이야기를 담아요.',tags:['로컬 커피','동네 이야기'],image:photo('photo-1495474472287-4d71bcdd2085'),theme:'ocean',symbol:'⌂'}
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
