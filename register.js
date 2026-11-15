/* Accessible three-step onboarding, using the same storage as mini.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('creator-signup');
  const storageKey = 'hongboya-mini-v1:' + new URL('.', location.href).pathname;
  const roles = {producer:'생산자',maker:'제조사 · 메이커',creative:'콘텐츠 크리에이터',local:'로컬 크리에이터'};
  const icons = {producer:'🌾',maker:'🧵',creative:'✦',local:'⌂'};
  const titles = ['어떤 이야기를 만드나요?', '나의 공간을 저장하는 방법', '이제, 나를 홍보할 시간.'];
  const descriptions = ['활동명과 분야만 정하면 첫 준비는 끝이에요.', '어디서 다시 만나도, 나의 이야기를 이어갈 수 있도록.', '입력한 정보를 확인하고 나만의 공간을 열어보세요.'];
  let step = 0, server = false, ready = false, busy = false;
  function render() {
    document.querySelectorAll('[data-step]').forEach(section => {
      section.hidden = Number(section.dataset.step) !== step;
      section.querySelectorAll('input').forEach(input => { input.disabled = section.hidden; });
    });
    document.querySelectorAll('.join-progress li').forEach((li, i) => {
      li.classList.toggle('active', i <= step);
      if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('step-title').textContent = titles[step];
    $('step-description').textContent = descriptions[step];
    $('join-back').hidden = step === 0;
    $('join-next').textContent = step === 2 ? (server ? '가입하고 나의 공간 만들기 ↗' : '이 기기에서 나의 공간 만들기 ↗') : '다음 단계 →';
    $('join-next').disabled = !ready || busy;
    $('registration-error').textContent = '';
    if (!server) for (const name of ['email', 'password']) form.elements[name].disabled = true;
    if (step === 2) {
      $('review-name').textContent = form.elements.name.value.trim();
      $('review-role').textContent = roles[form.querySelector('[name="role"]:checked').value];
      $('review-region').textContent = form.elements.region.value.trim() || '아직 정하지 않았어요';
      $('review-mode').textContent = server ? '이메일 계정에 저장' : '이 브라우저에 저장';
      try { $('existing-home').hidden = server || !localStorage.getItem(storageKey); } catch { /* save reports errors */ }
    }
  }
  form.addEventListener('input', () => {
    $('creator-name-count').textContent = form.elements.name.value.length + ' / 60';
    $('join-art-name').textContent = form.elements.name.value.trim() || '나의 작은 브랜드';
    $('join-art-avatar').textContent = icons[form.querySelector('[name="role"]:checked').value];
  });
  $('join-back').addEventListener('click', () => { if (!busy) { step--; render(); $('step-title').focus(); } });
  $('password-toggle').addEventListener('click', () => {
    const input = form.elements.password, visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    $('password-toggle').textContent = visible ? '숨기기' : '보기';
    $('password-toggle').setAttribute('aria-label', visible ? '비밀번호 숨기기' : '비밀번호 표시');
    $('password-toggle').setAttribute('aria-pressed', String(visible));
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || busy || !form.reportValidity()) return;
    if (step === 0 && !form.elements.name.value.trim()) { $('registration-error').textContent = '활동명을 입력해 주세요.'; return; }
    if (step < 2) { step++; render(); $('step-title').focus(); return; }
    busy = true; $('join-next').disabled = true; $('join-back').disabled = true;
    $('join-next').textContent = '나의 공간을 만들고 있어요…';
    try {
      const role = form.querySelector('[name="role"]:checked').value;
      const profile = {name:form.elements.name.value.trim(),role,region:form.elements.region.value.trim(),bio:'',theme:'forest',links:[],products:[],roomTheme:{producer:'farm',maker:'atelier',creative:'studio',local:'cafe'}[role],minime:{producer:'farmer',maker:'maker',creative:'creator',local:'barista'}[role]};
      if (server) {
        const response = await fetch('api/mini/signup', {method:'POST',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value.trim(),password:form.elements.password.value,profile})});
        const data = await response.json();
        if (!response.ok) throw Error(data.error || '가입을 완료하지 못했어요. 다시 시도해 주세요.');
        form.elements.password.value = '';
      } else {
        if (localStorage.getItem(storageKey) && !confirm('기존 미니홈피를 새로 만들까요? 이전 내용은 스튜디오에서 백업할 수 있습니다.')) return;
        localStorage.setItem(storageKey, JSON.stringify(profile));
      }
      location.assign('mini.html?studio=1');
    } catch (error) {
      $('registration-error').textContent = error.name === 'TimeoutError' ? '서버 응답이 지연되고 있어요. 가입이 완료됐을 수 있으니 스튜디오 로그인을 확인해 주세요.' : error.message;
    } finally {
      busy = false; $('join-next').disabled = false; $('join-back').disabled = false;
      $('join-next').textContent = server ? '가입하고 나의 공간 만들기 ↗' : '이 기기에서 나의 공간 만들기 ↗';
    }
  });
  async function init() {
    try {
      const response = await fetch('api/mini/status', {signal:AbortSignal.timeout(6000)});
      server = response.ok && (await response.json()).accounts === true;
    } catch { server = false; }
    $('registration-account').hidden = !server;
    for (const name of ['email','password']) form.elements[name].required = server;
    $('registration-mode').textContent = server ? '계정 저장 모드 · 이메일로 가입하면 다른 기기에서도 로그인해 편집할 수 있어요.' : '기기 저장 모드 · 현재 사이트는 이 브라우저에 저장해요. 이메일·비밀번호 없이 시작하며, 공유 링크에는 생성 시점의 내용이 담깁니다. 수정 후 새 링크를 공유해 주세요.';
    ready = true; render();
  }
  init();
})();
