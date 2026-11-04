const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base=process.argv[2] || 'http://127.0.0.1:8012/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:1000});await page.goto(base);
   await page.locator('.creator-card').first().waitFor();
   assert.equal(await page.locator('.creator-card').count(),4);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
   await page.locator('[data-filter=maker]').click();assert.equal(await page.locator('.creator-card').count(),1);
   await page.locator('[data-filter=all]').click();await page.locator('#creator-search').fill('강릉');assert.equal(await page.locator('.creator-card').count(),1);
   await page.locator('#creator-search').fill('no-matching-creator');assert.equal(await page.locator('#empty-state').isVisible(),true);
   await page.locator('#reset-search').click();await page.locator('.card-button').first().click();await page.locator('#creator-preview').waitFor({state:'visible'});
   const href=await page.locator('#open-demo').getAttribute('href');const visitor=await context.newPage();await visitor.goto(new URL(href,base).href);
   await visitor.locator('#public-home h1').waitFor();assert.equal(await visitor.locator('#public-home h1').textContent(),'초록의 작은 농장');await visitor.close();
   await page.keyboard.press('Escape');assert.equal(await page.locator('#creator-preview').isVisible(),false);
   await page.locator('.faq-list summary').first().click();assert.equal(await page.locator('.faq-list details').first().getAttribute('open'),'');
   if(width<760){await page.locator('#menu-toggle').click();assert.equal(await page.locator('#mobile-menu').isVisible(),true);await page.locator('#mobile-menu a').first().click();assert.equal(await page.locator('#mobile-menu').isVisible(),false);}
   await page.locator('.hero-buttons a').first().click();await page.locator('#onboarding').waitFor({state:'visible'});
   console.log(`PASS: ${width}px layout, filters, search, empty state, independent preview, FAQ, navigation, create CTA`);
  }
  for(const [width,name] of [[1440,'desktop'],[390,'mobile']]){await page.setViewportSize({width,height:1000});await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.locator('.hero-photo img').evaluate(img=>img.decode().catch(()=>{}));if(process.env.HOME_SCREENSHOT_DIR)await page.screenshot({path:process.env.HOME_SCREENSHOT_DIR+`/hongboya-home-${name}.png`,fullPage:true});}
  assert.deepEqual(errors,[]);console.log('PASS: no browser JavaScript errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
