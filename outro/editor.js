(async function() {
  'use strict';
  const $ = id => document.getElementById(id);
  const fields = [
    ['titleTop','Značka'],['titleBottom','Název pořadu'],['guestsTitle','Nadpis účinkujících'],
    ['ctaLeadTitle','Výzva k pokračování'],['forendorsText','Text k Forendors'],['forendorsLink','Adresa Forendors v obraze'],
    ['socialsTitle','Nadpis sociálních sítí'],['supportersTitle','Nadpis podporovatelů'],
    ['supportersSubtitle','Podtitulek podporovatelů'],['supportersThanks','Poděkování'],['footer','Výrobní titulek']
  ];
  let original, settings, publishedSupporters, supporters, upload = null, dirty = false, busy = false, previewTimer, sessionToken = "";
  function status(text, type='') { $('status').textContent=text; $('status').className='notice '+type; }
  function lines(id) { return [...$(id).querySelectorAll('input')].map(e=>e.value.trim()).filter(Boolean); }
  function collect() {
    const next = {...settings,guests:lines('guest-rows'),easterEggs:lines('joke-rows'),easterEggRotateMs:Number($('rotation').value)*1000};
    for (const [key] of fields) next[key] = $('field-'+key).value.trim();
    return OutroData.validate(next);
  }
  function draft() {
    const next=collect();
    localStorage.setItem(OutroData.draftKey,JSON.stringify({settings:next,supporters,upload,base:original}));
    return next;
  }
  function changed() {
    dirty=true; $('draft-state').textContent='Rozpracované změny';
    try { draft(); status('Změny jsou připravené v náhledu. Pro vysílání je ulož na GitHub.'); clearTimeout(previewTimer); previewTimer=setTimeout(()=>refresh(),450); }
    catch(e) { status(e.message,'error'); }
  }
  function row(container,value,max,label) {
    const wrapper=document.createElement('div');wrapper.className='edit-row';
    const input=document.createElement('input');input.value=value;input.maxLength=max;input.setAttribute('aria-label',label);input.addEventListener('input',changed);
    const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Odebrat '+label);remove.addEventListener('click',()=>{wrapper.remove();changed();});
    wrapper.append(input,remove);$(container).append(wrapper);return input;
  }
  function render() {
    $('guest-rows').replaceChildren();settings.guests.forEach(v=>row('guest-rows',v,80,'jméno účinkujícího'));
    $('joke-rows').replaceChildren();settings.easterEggs.forEach(v=>row('joke-rows',v,180,'hlášku'));
    $('rotation').value=settings.easterEggRotateMs/1000;
    $('text-fields').replaceChildren();
    for (const [key,label] of fields) {
      const block=document.createElement('div'), l=document.createElement('label'), input=document.createElement(key==='forendorsText'?'textarea':'input');
      l.htmlFor='field-'+key;l.textContent=label;input.id='field-'+key;input.value=settings[key];input.maxLength=200;input.addEventListener('input',changed);block.append(l,input);$('text-fields').append(block);
    }
    renderSupporters();
  }
  function renderSupporters() {
    const standard=supporters.filter(v=>v.tier==='standard').length;
    $('supporter-summary').textContent=`${supporters.length} podporovatelů · ${standard} Standard · ${supporters.length-standard} Midibus\n${upload?'Připraveno k uložení: '+upload.source:'Publikovaný export: '+publishedSupporters.source}`;
    $('supporter-list').replaceChildren();
    for (const supporter of supporters) {
      const r=document.createElement('div');r.className='supporter-row';const name=document.createElement('span'),tier=document.createElement('span');name.textContent=supporter.name;tier.textContent=supporter.tier==='standard'?'Standard':'Midibus';r.append(name,tier);$('supporter-list').append(r);
    }
    $('discard-upload').hidden=!upload;
  }
  function refresh(still=true) {
    try {
      draft();
      $('preview').src='outro.html?draft=1'+(still?'&still=1':'')+($('photo').checked?'&preview=photo':'')+'&v='+Date.now();
    } catch(e) { status(e.message,'error'); }
  }
  const screen=$('preview').parentElement;
  const observer=new ResizeObserver(()=>{$('preview').style.transform=`scale(${screen.clientWidth/1920})`;});observer.observe(screen);
  async function load(restoreDraft=true) {
    const responses=await Promise.all([fetch('settings.json?v='+Date.now(),{cache:'no-store'}),fetch('supporters.json?v='+Date.now(),{cache:'no-store'})]);
    if(responses.some(r=>!r.ok)) throw new Error('Publikované nastavení se nepodařilo načíst.');
    original=OutroData.validate(await responses[0].json());settings=structuredClone(original);publishedSupporters=await responses[1].json();supporters=publishedSupporters.supporters;upload=null;dirty=false;
    const saved=restoreDraft?JSON.parse(localStorage.getItem(OutroData.draftKey)||'null'):null;
    if(saved) {
      const pending = OutroData.canonical(saved.settings)!==OutroData.canonical(saved.base||original)||!!saved.upload;
      if(pending) {
        settings=OutroData.validate(saved.settings);upload=saved.upload||null;supporters=upload?saved.supporters:supporters;
        if(saved.base&&OutroData.canonical(saved.base)!==OutroData.canonical(original))original=saved.base;
        dirty=true;
      }
    }
    render();refresh();$('save').disabled=false;$('draft-state').textContent=dirty?'Rozpracované změny':'Publikovaná verze';status(dirty?'Obnovil jsem rozpracované změny z tohoto prohlížeče.':'Nastavení je načtené. Uprav obsah a zkontroluj náhled.');
  }
  async function importFile(file) {
    if(!file)return;
    try {
      if(file.size>5*1024*1024)throw new Error('CSV je příliš velké. Maximum je 5 MB.');
      const next=OutroData.importSupporters(await file.text(),file.name);
      if(publishedSupporters.date&&next.date<publishedSupporters.date)throw new Error('Tento export je starší než aktuální seznam. Nahraj novější.');
      upload=next;supporters=next.supporters;renderSupporters();changed();refresh();
      status(`Načetl jsem ${supporters.length} podporovatelů. E-maily ani platební údaje se neukládají.`,'success');
    } catch(e) { status(e.message,'error'); }
    finally {$('csv-file').value='';}
  }
  $('add-guest').addEventListener('click',()=>{if($('guest-rows').children.length>=8){status('V outru může být nejvýše 8 účinkujících.','error');return;}row('guest-rows','',80,'jméno účinkujícího').focus();});
  $('add-joke').addEventListener('click',()=>{row('joke-rows','',180,'hlášku').focus();});
  $('rotation').addEventListener('input',changed);
  $('csv-file').addEventListener('change',e=>importFile(e.target.files[0]));
  const zone=$('drop-zone');zone.addEventListener('click',e=>{if(e.target.id!=='csv-file')$('csv-file').click();});zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('csv-file').click();}});
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag');});zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag');importFile(e.dataTransfer.files[0]);});
  $('discard-upload').addEventListener('click',()=>{upload=null;supporters=publishedSupporters.supporters;renderSupporters();changed();refresh();});
  $('photo').addEventListener('change',()=>refresh());$('refresh-preview').addEventListener('click',()=>refresh());$('play-preview').addEventListener('click',()=>refresh(false));
  $('reset').addEventListener('click',async()=>{localStorage.removeItem(OutroData.draftKey);try{await load(false);}catch(e){status(e.message,'error');}});
  $('disconnect').addEventListener('click',()=>{sessionToken='';$('github-token').value='';$('github-token').placeholder='Token jen pro repozitář studio';$('disconnect').hidden=true;status('GitHub je odpojen.');});
  $('save').addEventListener('click',async()=>{
    if(busy)return;
    let token=$('github-token').value.trim()||sessionToken;
    if(!token){$('github-token').focus();status('Pro uložení vlož token do pole GitHub token. Návod je pod ním.');return;}
    busy=true;$('reset').disabled=true;$('github-token').disabled=true;document.querySelectorAll('.controls>.card:not(.publish)').forEach(e=>e.inert=true);$('save').disabled=true;$('save').textContent='Ukládám…';$('save-result').replaceChildren();
    try {
      const next=draft();const result=await OutroData.publish({settings:next,original,upload,token});
      sessionToken=token;$('disconnect').hidden=false;$('github-token').placeholder='Připojeno do zavření stránky';original=structuredClone(next);settings=next;
      if(upload)publishedSupporters={source:upload.source,date:upload.date,supporters};upload=null;dirty=false;draft();renderSupporters();$('draft-state').textContent='Uloženo na GitHub';
      status('Uloženo. GitHub teď publikuje změny; po dokončení obnov zdroj v OBS.','success');
      const a=document.createElement('a');a.href='https://github.com/anlexcz/studio/actions';a.target='_blank';a.rel='noopener';a.textContent='Zkontrolovat publikování ↗';$('save-result').append(a);
    } catch(e) { sessionToken='';$('disconnect').hidden=true;status(e.message,'error'); }
    finally {token='';$('github-token').value='';busy=false;$('reset').disabled=false;$('github-token').disabled=false;document.querySelectorAll('.controls>.card:not(.publish)').forEach(e=>e.inert=false);$('save').disabled=false;$('save').textContent='Uložit na GitHub';}
  });
  try {await load();}catch(e){status(e.message,'error');}
})();
