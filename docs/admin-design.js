/* Navigation and section discovery for the existing admin integrations. */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('admin-section-query');
  const sections = [...document.querySelectorAll('main>[data-tab]')];
  const empty = document.getElementById('admin-search-empty');
  const meta = {
    'admin-consult-section':['상담 접수함','접수 현황을 확인하고 상담 진행 상태를 관리합니다.'],
    'admin-display-section':['갤러리 노출 설정','노출 순서와 기기별 아이템 수를 설정합니다.'],
    'admin-banner-section':['상단 배너','갤러리 첫 화면의 배너와 이동 링크를 관리합니다.'],
    'admin-consult-banner-section':['상담 안내 배너','PC·태블릿에 표시할 상담 안내 이미지를 설정합니다.'],
    'admin-mid-banner1-section':['중간 배너 · 첫 번째','공급업체 카테고리 위에 노출되는 이미지 슬라이드입니다.'],
    'admin-mid-banner-section':['중간 배너 · 두 번째','갤러리 중간 영역의 이미지와 연결을 관리합니다.'],
    'admin-bottom-banner-section':['하단 배너','마지막 방문까지 이어주는 배너를 구성합니다.'],
    'admin-apikey-section':['AI · 공유 서비스 연결','사용할 AI 제공자와 카카오 공유 연결 정보를 관리합니다.'],
    'admin-chatbot-ui-section':['상담 화면 구성','기본 모델과 방문자에게 표시할 컨트롤을 선택합니다.'],
    'admin-assistant-section':['상담 도우미 미리보기','방문자가 경험할 상담 화면과 데이터 연결을 확인합니다.'],
    'admin-common-kb-section':['AI 지식 관리','아이템 데이터와 자주 묻는 질문을 함께 관리합니다.'],
    'admin-poster-section':['아이템 · 브랜드 관리','새 아이템을 등록하고 판매처·연락처·상담 정보를 편집합니다.']
  };
  const headings = ['상담의 시작부터 마무리까지.','브랜드가 보이는 모든 순간.','잘 안내하는 AI, 차근차근.','정성을 담은 아이템을 세상으로.'];
  const descriptions = ['새로운 문의를 확인하고 고객과의 다음 대화를 준비하세요.','갤러리에 적용되는 노출 방식과 배너를 한곳에서 관리하세요.','서비스 연결 → 화면 구성 → 지식 등록 순서로 준비할 수 있어요.','대표 이미지, 이름, 판매처를 준비하고 미리보기로 확인하세요.'];
  const make = (tag, cls, text) => { const el=document.createElement(tag); if(cls)el.className=cls; if(text)el.textContent=text; return el; };
  const workbench=make('section','admin-workbench');
  const intro=make('div'); intro.append(make('span','hb-kicker','YOUR DAILY WORKSPACE'));
  const introTitle=make('h2'), introDescription=make('p');intro.append(introTitle,introDescription);
  const links=make('div','admin-workbench-actions');
  for(const [label,href] of [['사이트 둘러보기 ↗','gallery.html'],['새 크리에이터 가입 ↗','register-bot.html']]){const a=make('a','hb-button',label);a.href=href;links.append(a);}
  workbench.append(intro,links);
  document.querySelector('.admin-welcome').after(workbench);
  const index=make('nav','admin-section-index');index.setAttribute('aria-label','현재 탭의 섹션 바로가기');
  document.getElementById('tab-title-banner').after(index);
  let serial=0;
  for(const section of sections){
    if(!meta[section.id])continue;
    const [title,description]=meta[section.id];
    section.classList.add('workspace-panel');
    const heading=section.firstElementChild;heading.classList.add('workspace-heading');
    const h2=heading.querySelector('h2');
    if(h2 && section.id!=='admin-consult-section'){
      h2.textContent=title;
      const subtitle=h2.parentElement.querySelector('p');if(subtitle)subtitle.textContent=description;
    }
    const num=make('span','workspace-number',String(++serial).padStart(2,'0')+' / '+(section.dataset.tab==='1'?'DISPLAY':section.dataset.tab==='2'?'INTELLIGENCE':section.dataset.tab==='3'?'CONTENTS':'CUSTOMERS'));
    if(h2)h2.before(num);
    [...section.children].slice(1).forEach(child=>{if(!child.classList.contains('fixed'))child.classList.add('workspace-body');});
    section.querySelectorAll('.workspace-body>div[class*="rounded-2xl"]').forEach(card=>card.classList.add('workspace-subcard'));
    section.querySelectorAll('button[onclick^="save"]').forEach(button=>button.classList.add('workspace-save'));
    if(section.id!=='admin-consult-section'){
      const toggle=make('button','workspace-collapse','접기 −');toggle.type='button';toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label',title+' 접기');
      const bodies=[...section.children].slice(1).filter(el=>!el.classList.contains('fixed'));
      bodies.forEach((el,i)=>{if(!el.id)el.id=section.id+'-body-'+i;});toggle.setAttribute('aria-controls',bodies.map(el=>el.id).join(' '));
      toggle.addEventListener('click',()=>{
        const collapsed=section.classList.toggle('is-collapsed');
        toggle.setAttribute('aria-expanded',String(!collapsed));toggle.textContent=collapsed?'펼치기 +':'접기 −';toggle.setAttribute('aria-label',title+(collapsed?' 펼치기':' 접기'));
      });heading.append(toggle);
    }
  }
  // Add labels without changing the existing input IDs and save integrations.
  function labelFields(root){
    root.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(field=>{
      if(field.labels?.length || field.hasAttribute('aria-label'))return;
      let parent=field.parentElement,label;
      for(let n=0;n<3&&parent;n++,parent=parent.parentElement){label=parent.querySelector('label');if(label&&!label.querySelector('input,select,textarea'))break;label=null;}
      if(label && field.id){label.htmlFor=field.id;return;}
      field.setAttribute('aria-label',field.placeholder || field.title || field.id || '설정 입력');
    });
  }
  labelFields(document);
  const list=document.getElementById('poster-list');
  new MutationObserver(()=>labelFields(list)).observe(list,{childList:true});
  const consultHeader=document.querySelector('#admin-consult-section>.workspace-heading');
  const consultHeading=consultHeader.querySelector('h2');consultHeading.tabIndex=0;consultHeading.setAttribute('role','button');consultHeading.setAttribute('aria-controls','consult-body');
  const syncConsult=()=>consultHeading.setAttribute('aria-expanded',String(!document.getElementById('consult-body').classList.contains('hidden')));
  consultHeading.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();consultHeading.click();}});
  new MutationObserver(syncConsult).observe(document.getElementById('consult-body'),{attributes:true,attributeFilter:['class','style']});syncConsult();
  // Report actual write results, including non-2xx failures; never infer success from a click.
  const status=make('div','workspace-live-status');status.id='workspace-write-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const statusText=make('span',null,'필요한 설정을 선택하세요. 변경은 각 항목의 저장 버튼으로 적용합니다.');const clock=make('time');status.append(statusText,clock);document.querySelector('main').append(status);
  let pending=0,failed=false;
  const originalFetch=window.fetch;
  window.fetch=async (resource,options={})=>{
    const url=new URL(resource instanceof Request?resource.url:resource,location.href);
    const method=(options.method||(resource instanceof Request?resource.method:'GET')).toUpperCase();
    const writing=url.origin===location.origin && url.pathname.startsWith(new URL('tables/',location.href).pathname) && ['POST','PUT','PATCH','DELETE'].includes(method);
    if(!writing)return originalFetch(resource,options);
    if(pending===0)failed=false;pending++;status.dataset.state='pending';statusText.textContent='변경 내용을 저장하고 있어요…';
    try{const response=await originalFetch(resource,options);if(!response.ok)failed=true;return response;}
    catch(error){failed=true;throw error;}
    finally{pending--;if(!pending){status.dataset.state=failed?'error':'saved';statusText.textContent=failed?'저장하지 못한 요청이 있어요. 연결 상태와 입력값을 확인한 뒤 다시 저장해 주세요.':'저장 요청이 완료되었습니다.';const now=new Date();clock.dateTime=now.toISOString();clock.textContent=now.toLocaleTimeString('ko-KR');}}
  };
  // A live draft makes the dense poster form understandable before publishing.
  const form=document.getElementById('add-poster-form');
  const compose=make('div','poster-compose');form.before(compose);compose.append(form);
  const draft=make('aside','poster-draft');draft.setAttribute('aria-label','새 아이템 미리보기');
  const art=make('div','poster-draft-art','✳'),draftTitle=make('h3'),draftCategory=make('span','poster-draft-tag');
  draft.append(make('small',null,'ITEM PREVIEW · 등록 전 미리보기'),art,draftTitle,make('p',null,'대표 이미지와 활동명으로 고객에게 첫인사를 건네세요.'),draftCategory);compose.append(draft);
  let imageValue='';
  function previewDraft(){draftTitle.textContent=document.getElementById('new-poster-brand').value.trim()||'나의 첫 아이템';draftCategory.textContent=document.getElementById('new-poster-category').value||'분야를 선택해 주세요';const value=document.getElementById('new-poster-img').value;if(value!==imageValue){imageValue=value;art.replaceChildren();if(value){const img=make('img');img.src=value;img.alt='등록할 아이템 이미지';img.onerror=()=>{art.textContent='✳';};art.append(img);}else art.textContent='✳';}}
  form.addEventListener('input',previewDraft);form.addEventListener('change',previewDraft);form.addEventListener('reset',()=>setTimeout(previewDraft));previewDraft();
  const railLinks = document.createElement('div');
  railLinks.className = 'admin-rail-bottom';
  for (const [label, href] of [['내 미니홈피 스튜디오 ↗','mini.html?studio=1'],['크리에이터 가입 ↗','register-bot.html'],['아이템 갤러리 ↗','gallery.html'],['AI 연결 진단 ↗','check-models.html']]) {
    const a = document.createElement('a'); a.textContent = label; a.href = href; railLinks.append(a);
  }
  document.getElementById('admin-tab-nav').append(railLinks);
  function filter() {
    const query = input.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const section of sections) {
      const matches = section.dataset.tab === String(currentAdminTab) && (!query || section.textContent.toLocaleLowerCase().includes(query));
      section.style.display = matches ? '' : 'none';
      if (matches) count++;
    }
    empty.hidden = count !== 0;
    document.getElementById('admin-section-count').textContent = count + '개 섹션';
    introTitle.textContent=headings[currentAdminTab];introDescription.textContent=descriptions[currentAdminTab];
    index.replaceChildren();let i=0;
    for(const section of sections){if(section.dataset.tab!==String(currentAdminTab)||section.style.display==='none'||!meta[section.id])continue;
      const a=make('a');a.href='#'+section.id;a.append(make('b',null,String(++i).padStart(2,'0')),document.createTextNode(meta[section.id][0]));
      a.addEventListener('click',event=>{event.preventDefault();const toggle=section.querySelector('.workspace-collapse');if(section.classList.contains('is-collapsed'))toggle.click();section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});const title=section.querySelector('h2');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}});index.append(a);
    }
  }
  input.addEventListener('input', filter);
  document.getElementById('admin-tab-nav').addEventListener('click', event => {
    if (event.target.closest('.admin-tab-btn')) { input.value = ''; filter(); }
  });
  const tabButtons=[...document.querySelectorAll('.admin-tab-btn')];
  tabButtons[0].parentElement.setAttribute('role','tablist');
  tabButtons.forEach((button,i)=>{button.setAttribute('role','tab');button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(i+1)%4;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(i+3)%4;else if(event.key==='Home')next=0;else if(event.key==='End')next=3;else return;event.preventDefault();tabButtons[next].click();tabButtons[next].focus();});});
  document.querySelectorAll('#admin-consult-section .flex button, #status-filter').forEach(control => control.addEventListener('click', event => event.stopPropagation()));
  filter();
  window.hongboyaServerAvailable.then(server => {
    document.getElementById('admin-mode-label').textContent = server ? '서버 데이터 관리' : '기기 저장 · 미리보기';
  });
});
