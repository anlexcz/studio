const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const original=JSON.parse(fs.readFileSync('outro/settings.json','utf8'));
(async()=>{
 const server=spawn('python3',['-m','http.server','8765','--directory','_site']);
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/outro/');
  await page.waitForFunction(()=>!document.querySelector('#save').disabled);
  await page.locator('#guest-rows input').nth(0).fill('Anlex');
  await page.locator('#guest-rows input').nth(1).fill('Honza');
  await page.locator('#refresh-preview').click();
  await page.waitForFunction(()=>document.querySelector('#preview').contentDocument?.querySelector('#guestsList')?.textContent.includes('Anlex'));
  const smallHeight=await page.frameLocator('#preview').locator('.guests-block').evaluate(e=>e.getBoundingClientRect().height);
  for(const name of ['Třetí účinkující','Čtvrtý účinkující']){await page.locator('#add-guest').click();await page.locator('#guest-rows input').last().fill(name);}
  await page.locator('#add-joke').click();await page.locator('#joke-rows input').last().fill('Tohle je testovací hláška.');
  await page.locator('#refresh-preview').click();
  await page.waitForFunction(()=>document.querySelector('#preview').contentDocument?.querySelector('#guestsList')?.children.length===4);
  const bigHeight=await page.frameLocator('#preview').locator('.guests-block').evaluate(e=>e.getBoundingClientRect().height);assert(bigHeight>smallHeight);
  const csv='Jméno,Handle,E-mail,Předplatné\n"Jan, Novák",jan,private@example.test,Standard\n,nickname,secret@example.test,Midibus\n';
  await page.locator('#csv-file').setInputFiles({name:'podporovatele-metrobuscz-2026-10-14.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  await page.waitForFunction(()=>document.querySelector('#supporter-summary').textContent.includes('2 podporovatelů'));
  assert.equal(await page.locator('#supporter-list .supporter-row').count(),2);
  assert(!await page.evaluate(()=>localStorage.getItem(OutroData.draftKey).includes('@example.test')));
  let savedSettings,savedRows=[],denied=false;const calls=[];
  await page.route('https://api.github.com/repos/anlexcz/studio/**',async route=>{
   const req=route.request(),path=req.url().replace('https://api.github.com/repos/anlexcz/studio','');calls.push({path,method:req.method(),body:req.postDataJSON()});
   assert.equal(req.headers().authorization,'Bearer TEST_ONLY');
   if(denied){await route.fulfill({status:401,contentType:'application/json',body:'{}'});return;}
   let data;
   if(path==='/git/ref/heads/main')data={object:{sha:'HEAD'}};
   else if(path.startsWith('/contents/'))data={content:Buffer.from(JSON.stringify(original)).toString('base64')};
   else if(path==='/git/commits/HEAD')data={tree:{sha:'BASE'}};
   else if(path.startsWith('/git/trees/BASE'))data={tree:[{path:'outro/podporovatele-metrobuscz-2026-10-13.csv'}]};
   else if(path==='/git/trees'){const body=req.postDataJSON();savedSettings=JSON.parse(body.tree.find(f=>f.path.endsWith('settings.json')).content);savedRows=body.tree;assert(!JSON.stringify(body).includes('@example.test'));data={sha:'TREE'};}
   else if(path==='/git/commits')data={sha:'NEXT'};
   else if(path==='/git/refs/heads/main'){assert.deepEqual(req.postDataJSON(),{sha:'NEXT',force:false});data={};}
   else throw Error('Unexpected path '+path);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.locator('#github-token').fill('TEST_ONLY');await page.locator('#save').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Uloženo.'));
  assert.equal(await page.locator('#github-token').inputValue(),'');
  assert.equal(savedRows.length,2);assert.equal(savedSettings.guests[0],'Anlex');assert(savedSettings.easterEggs.includes('Tohle je testovací hláška.'));
  assert(!await page.evaluate(()=>localStorage.getItem(OutroData.draftKey).includes('TEST_ONLY')));
  fs.mkdirSync('review',{recursive:true});await page.screenshot({path:'review/outro-settings-desktop.png',fullPage:true});
  // A fresh browser profile (like OBS) sees the published settings, not local storage.
  const fresh=await browser.newContext({viewport:{width:1920,height:1080}});
  await fresh.route('**/outro/settings.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(savedSettings)}));
  const supporters=[{name:'Jan, Novák',tier:'standard'},{name:'nickname',tier:'midibus'}];
  await fresh.route('**/outro/supporters.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({supporters})}));
  const obs=await fresh.newPage();await obs.goto('http://127.0.0.1:8765/outro/outro.html?still=1&preview=photo');
  await obs.waitForFunction(()=>document.querySelector('#app')&&!document.querySelector('#app').classList.contains('hidden'));
  assert.equal(await obs.locator('#guestsList>div').count(),4);assert.equal(await obs.locator('.supporter').count(),2);assert.equal(await obs.locator('a').count(),0);
  assert((await obs.locator('#guestsList').textContent()).includes('Anlex'));
  await obs.screenshot({path:'review/outro-editor-published-preview.png'});await fresh.close();
  denied=true;await page.locator('#github-token').fill('TEST_ONLY');await page.locator('#save').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('GitHub odmítl'));
  assert.equal(await page.locator('#github-token').inputValue(),'');assert.equal(await page.locator('#save').isEnabled(),true);
  const mobileContext=await browser.newContext({viewport:{width:390,height:844}});const mobile=await mobileContext.newPage();
  await mobile.goto('http://127.0.0.1:8765/outro/');await mobile.waitForFunction(()=>!document.querySelector('#save').disabled);
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await mobile.screenshot({path:'review/outro-settings-mobile.png',fullPage:true});await mobileContext.close();
  assert.deepEqual(errors,[]);console.log('PASS: editor, dynamic guest height, CSV privacy, atomic publish, OBS profile, token clearing, mobile layout');
 } finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
