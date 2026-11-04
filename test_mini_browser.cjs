// Run with Playwright installed: node test_mini_browser.cjs [base URL]
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8011/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 async function context(staticMode=false){
   const c=await browser.newContext({viewport:{width:390,height:844}});
   if(staticMode)await c.route('**/api/mini/**',route=>route.fulfill({status:404,body:'Not found'}));
   const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'mini.html');
   await page.waitForFunction(()=>!document.getElementById('mode-notice').textContent.includes('확인 중'));
   return {c,page};
 }
 try {
   for(const staticMode of [true,false]){
     const {c,page}=await context(staticMode);
     await page.locator('[data-action=start]').first().click();
     await page.locator('#signup-form [name=name]').fill('테스트 농장 🌾');
     if(!staticMode){await page.locator('[name=email]').fill(`browser-${Date.now()}@example.com`);await page.locator('[name=password]').fill('test-password-123');}
     await page.locator('#join-submit').click();
     await page.locator('#studio').waitFor({state:'visible'});
     assert.equal(await page.locator('label[for="avatar-camera-input"]').isVisible(),true);
     assert.equal(await page.locator('label[for="avatar-file-input"]').isVisible(),true);
     const svgBytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000"><rect width="1400" height="1000" fill="#ee6248"/><circle cx="700" cy="500" r="350" fill="#faf9f5"/></svg>');
     await page.locator('#avatar-file-input').setInputFiles({name:'camera-shot.svg',mimeType:'image/svg+xml',buffer:svgBytes});
     await page.waitForFunction(()=>document.getElementById('avatar-upload-meta').textContent.startsWith('PNG ·'));
     const avatarSrc=await page.locator('#preview img.avatar').getAttribute('src');
     assert.ok(avatarSrc.startsWith('data:image/png;base64,'));
     const pngSize=Buffer.from(avatarSrc.split(',')[1],'base64').length;
     assert.ok(pngSize>0 && pngSize<=600*1024,`PNG size ${pngSize} must be <= 600KB`);
     assert.equal(await page.locator('label[for="cover-camera-input"]').isVisible(),true);
     assert.equal(await page.locator('label[for="cover-file-input"]').isVisible(),true);
     await page.locator('#cover-file-input').setInputFiles({name:'cover-banner.svg',mimeType:'image/svg+xml',buffer:svgBytes});
     await page.waitForFunction(()=>document.getElementById('cover-upload-meta').textContent.startsWith('PNG ·'));
     const coverSrc=await page.locator('#preview .home-cover img.cover-img').getAttribute('src');
     assert.ok(coverSrc.startsWith('data:image/png;base64,'));
     const coverSize=Buffer.from(coverSrc.split(',')[1],'base64').length;
     assert.ok(coverSize>0 && coverSize<=600*1024,`Cover PNG size ${coverSize} must be <= 600KB`);
     await page.locator('#profile-form [name=bgStyle]').selectOption('dots');
     await page.locator('#profile-form [name=btnShape]').selectOption('pill');
     await page.locator('#profile-form [name=badgeText]').fill('🌿 오늘 수확한 제철 농산물 오픈!');
     await page.locator('[data-action=add-link]').click();
     const inputs=page.locator('#link-fields input');
     await inputs.nth(0).fill('내 쇼핑몰');await inputs.nth(1).fill('https://example.com/shop');
     await page.locator('[data-action=add-product]').click();
     const products=page.locator('#product-fields input');
     await products.nth(0).fill('정성껏 기른 사과');await products.nth(1).fill('20,000원');await products.nth(4).fill('https://example.com/apple');
     await page.locator('#profile-form [type=submit]').click();
     await page.waitForFunction(()=>document.getElementById('save-status').textContent==='저장 완료');
     // Regression: after saving, field listeners must still update the active profile.
     await products.nth(1).fill('25,000원');
     await page.locator('[data-action=share]').click();
     await page.locator('#share-dialog').waitFor({state:'visible'});
     const url=await page.locator('#share-url').inputValue();
     assert.equal(url.includes('#home='),staticMode);
     const visitor=await browser.newContext({viewport:{width:390,height:844}});
     if(staticMode)await visitor.route('**/api/mini/**',route=>route.fulfill({status:404,body:'Not found'}));
     const view=await visitor.newPage();view.on('pageerror',e=>errors.push(e.message));await view.goto(url);
     await view.locator('#public-home h1').waitFor();
     assert.equal(await view.locator('#public-home h1').textContent(),'테스트 농장 🌾');
     assert.equal(await view.locator('#public-home .welcome-sticker').textContent(),'🌿 오늘 수확한 제철 농산물 오픈!');
     assert.ok((await view.locator('#public-home .home-cover img.cover-img').getAttribute('src')).startsWith('data:image/png;base64,'));
     assert.ok((await view.locator('#public-home').textContent()).includes('25,000원'));
     assert.equal(await view.locator('.product a').getAttribute('href'),'https://example.com/apple');
     assert.equal(await view.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     if(process.env.MINI_SCREENSHOT)await view.screenshot({path:process.env.MINI_SCREENSHOT,fullPage:true});
     await visitor.close();await c.close();
     console.log(`PASS: ${staticMode?'Pages snapshot':'authenticated account'} create, edit after save, shop link, independent visitor, mobile width`);
   }
   assert.deepEqual(errors,[]);console.log('PASS: no browser JavaScript errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
