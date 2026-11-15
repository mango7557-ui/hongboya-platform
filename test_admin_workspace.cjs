const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:8023/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'admin.html',{waitUntil:'domcontentloaded'});await page.locator('.poster-draft').waitFor({state:'attached'});
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1000});
   for(let tab=0;tab<4;tab++){
    await page.locator('#tab-btn-'+tab).click();
    const panels=page.locator('.workspace-panel:visible');
    assert.ok(await panels.count()>0);
    const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('.workspace-panel *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+3}).slice(0,8).map(el=>el.tagName+'#'+el.id)}));
    assert.ok(overflow.scroll<=width,JSON.stringify({tab,...overflow}));
    for(const panel of await panels.all()){
     const button=panel.locator(':scope > .workspace-heading > .workspace-collapse');
     if(await button.count()){
      await button.click();assert.equal(await button.getAttribute('aria-expanded'),'false');
      const id=await panel.getAttribute('id');await page.locator('.admin-section-index a[href="#'+id+'"]').click();
      assert.equal(await button.getAttribute('aria-expanded'),'true');
     }
    }
    if(process.env.ADMIN_SCREENSHOT_DIR && (width===1440||width===390)){
     await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:process.env.ADMIN_SCREENSHOT_DIR+`/workspace-${tab}-${width}.png`,fullPage:false});
    }
   }
   console.log(`PASS: admin all sections ${width}px, collapse/section navigation, no overflow`);
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('#tab-btn-1').click();
  await page.locator('#lm-pc-first').fill('0');
  await page.locator('[onclick="saveLoadMoreConfig()"]').click();
  assert.equal(await page.locator('#lm-pc-first').evaluate(el=>el.validity.valid),false);
  await page.locator('#lm-pc-first').fill('7');
  await page.locator('[onclick="saveLoadMoreConfig()"]').click();
  await page.waitForFunction(()=>document.getElementById('workspace-write-status').dataset.state==='saved');
  await page.reload();await page.locator('#lm-pc-first').waitFor();await page.waitForFunction(()=>document.getElementById('lm-pc-first').value==='7');
  await page.route('**/tables/site_config/**',r=>r.request().method()==='PATCH'?r.fulfill({status:500,contentType:'application/json',body:'{"error":"test failure"}'}):r.continue());
  await page.locator('#lm-pc-first').fill('8');await page.locator('[onclick="saveLoadMoreConfig()"]').click();
  await page.waitForFunction(()=>document.getElementById('workspace-write-status').dataset.state==='error');
  await page.unroute('**/tables/site_config/**');
  console.log('PASS: invalid settings blocked, settings persist after reload, failed save is shown');
  await page.locator('#tab-btn-3').click();await page.locator('#new-poster-brand').fill('작은 공방 검증');
  assert.equal(await page.locator('.poster-draft h3').textContent(),'작은 공방 검증');
  await page.locator('#new-poster-order').fill('0');
  await page.locator('#new-poster-img').evaluate(el=>{el.value='https://example.com/test.jpg';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#add-poster-btn').click();await page.waitForFunction(()=>document.getElementById('new-poster-brand').value==='');
  const saved=await page.evaluate(async()=>{const r=await fetch('tables/poster_settings');return(await r.json()).data.find(p=>p.brand_name==='작은 공방 검증');});
  assert.equal(saved.order_idx,0);
  await page.evaluate(async id=>{await fetch('tables/poster_settings/'+id,{method:'DELETE'});},saved.id);
  await page.locator('#tab-btn-0').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-btn-1').getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);console.log('PASS: live draft, item creation with zero order, keyboard tabs, no JavaScript errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
