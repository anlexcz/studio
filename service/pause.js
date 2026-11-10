(() => { 'use strict';
const DEFAULT={heading:'DÁVÁME SI KRÁTKOU PŘESTÁVKU',subtitle:'Za chvíli jsme zpět.',footer:'METROBUS · POKEC',showLogo:true,dim:46,glow:62,speed:35};
const bound=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
function apply(input){const s={...DEFAULT,...input};document.getElementById('heading').textContent=String(s.heading).slice(0,120);document.getElementById('subtitle').textContent=String(s.subtitle).slice(0,200);document.getElementById('footerText').textContent=String(s.footer).slice(0,100);document.getElementById('brand').hidden=!s.showLogo;document.documentElement.style.setProperty('--dim',String(bound(s.dim,0,85)/100));document.documentElement.style.setProperty('--glow',String(bound(s.glow,0,100)/100));document.documentElement.style.setProperty('--duration',bound(s.speed,15,90)+'s');}
apply(DEFAULT);
fetch('settings.json?t='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('settings');return r.json()}).then(apply).catch(()=>{});
window.addEventListener('message',e=>{if(e.origin!==location.origin||!e.data||e.data.type!=='metrobus-pause-preview')return;apply(e.data.settings||{});});
})();