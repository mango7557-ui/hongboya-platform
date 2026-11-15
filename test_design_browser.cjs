// Full-page redesign regression: real account + Pages onboarding, admin sections and responsive routes.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8021/';
const screenshotDir = process.env.DESIGN_SCREENSHOT_DIR;
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    if (!process.env.ITEM_ONLY) {
    for (const staticMode of [true,false]) {
      const context = await browser.newContext({viewport:{width:390,height:900}});
      if (staticMode) await context.route('**/api/mini/**',r=>r.fulfill({status:404,body:'Not found'}));
      const page = await context.newPage(); const errors=[];
      page.on('pageerror', e=>errors.push(e.message));
      await page.goto(base+'register-bot.html');
      await page.waitForFunction(()=>!document.getElementById('join-next').disabled);
      await page.locator('#creator-name').fill('작은 공방 <테스트>');
      await page.locator('[name=role][value=maker]').check();
      await page.locator('#creator-region').fill('서울 성수');
      await page.locator('#join-next').click();
      assert.equal(await page.locator('#registration-account').isVisible(),!staticMode);
      if (!staticMode) {
        await page.locator('#creator-email').fill('design-'+Date.now()+'@example.com');
        await page.locator('#creator-password').fill('design-password-2026');
        await page.locator('#password-toggle').click();
        assert.equal(await page.locator('#creator-password').getAttribute('type'),'text');
      }
      await page.locator('#join-next').click();
      assert.equal(await page.locator('#review-name').textContent(),'작은 공방 <테스트>');
      await page.locator('#join-back').click();
      await page.locator('#join-back').click();
      assert.equal(await page.locator('#creator-name').inputValue(),'작은 공방 <테스트>');
      await page.locator('#join-next').click(); await page.locator('#join-next').click();
      await page.locator('#join-next').click();
      await page.locator('#studio').waitFor({state:'visible'});
      assert.equal(await page.locator('#profile-form [name=name]').inputValue(),'작은 공방 <테스트>');
      assert.equal(await page.locator('#profile-form [name=roomTheme]').inputValue(),'atelier');
      await page.reload(); await page.locator('#studio').waitFor({state:'visible'});
      assert.equal(await page.locator('#profile-form [name=region]').inputValue(),'서울 성수');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'studio overflow');
      assert.deepEqual(errors,[]);
      console.log('PASS: '+(staticMode?'Pages':'server')+' three-step registration, back/edit, field persistence, studio and reload');
      await context.close();
    }
    const context=await browser.newContext(); const page=await context.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(page.url()+': '+e.message));
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:1000});
      for (const route of ['register-bot.html','admin.html','chatbot.html','check-models.html','test-api.html','share.html','item-register.html','gallery.html']) {
        await page.goto(base+route,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('design-system.css')));
        if (route==='register-bot.html') await page.waitForFunction(()=>!document.getElementById('join-next').disabled);
        if (route==='admin.html') await page.locator('.admin-rail-bottom').waitFor({state:'attached'});
        if (route==='gallery.html') await page.locator('#global-header').waitFor();
        const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&getComputedStyle(e).position!=='fixed';}).slice(0,8).map(e=>e.tagName+'#'+e.id+'.'+e.className)}));
        assert.ok(overflow.scroll<=width,route+' '+JSON.stringify(overflow));
        if (route==='admin.html') {
          for (let tab=0;tab<4;tab++) {
            await page.locator('#tab-btn-'+tab).click();
            assert.equal(await page.locator('#tab-btn-'+tab).getAttribute('aria-selected'),'true');
            assert.ok(await page.locator('main>[data-tab="'+tab+'"]:visible').count()>0);
          }
          await page.locator('#admin-section-query').fill('no-such-setting');
          assert.equal(await page.locator('#admin-search-empty').isVisible(),true);
          await page.locator('#admin-section-query').fill('');
          await page.locator('#tab-btn-0').click();
          await page.locator('#admin-consult-section h2').click();
          await page.locator('#empty-state').waitFor({state:'visible'});
          await page.locator('#status-filter').selectOption('완료');
          assert.equal(await page.locator('#consult-body').isVisible(),true);
        }
        if (screenshotDir && width!==320 && ['admin.html','register-bot.html','chatbot.html','gallery.html'].includes(route)) await page.screenshot({path:screenshotDir+'/redesign-'+route.replace('.html','')+'-'+width+'.png',fullPage:route!=='gallery.html'});
      }
      console.log(`PASS: ${width}px eight routes, admin four tabs/search/filter, no horizontal overflow`);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: no page JavaScript errors across redesigned routes');
    await context.close();
    }
    for (const staticMode of [true,false]) {
      const c=await browser.newContext({viewport:{width:390,height:900}});
      if(staticMode) await c.route('**/api/mini/**',r=>r.fulfill({status:404,body:'Not found'}));
      const p=await c.newPage(); await p.goto(base+'item-register.html',{waitUntil:'domcontentloaded'});
      const result=await p.evaluate(async()=>{
        const response=await fetch('tables/poster_settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand_name:'검증용 아이템',creator_name:'작은 공방',price_info:'12,000원',shop_url:'https://example.com/shop',target_link:'https://example.com/shop',item_summary:'직접 만든 작은 물건'})});
        if(!response.ok) throw Error('save failed');
        const item=await response.json();
        return {id:item.id,url:buildHongboShareUrl(item),server:await hongboyaServerAvailable};
      });
      assert.equal(result.server,!staticMode);
      const visitor=await browser.newContext({viewport:{width:390,height:900}});
      const v=await visitor.newPage(); await v.goto(result.url,{waitUntil:'domcontentloaded'});
      await v.locator('#brand-card').waitFor({state:'visible'});
      assert.ok((await v.locator('#brand-card').textContent()).includes('검증용 아이템'));
      assert.equal(await v.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await p.evaluate(async id=>{const r=await fetch('tables/poster_settings/'+id,{method:'DELETE'});if(!r.ok)throw Error('cleanup failed');},result.id);
      await visitor.close();await c.close();
      console.log(`PASS: ${staticMode?'Pages local':'SQLite server'} item persistence, independent shared item page, mobile layout`);
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
