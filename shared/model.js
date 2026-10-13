/* Shared, deterministic studio model: browser demo and local OBS server. */
(function(g){'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v));
 const text=(v,n=500)=>String(v??'').slice(0,n);
 const num=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
 function config(v={}){return {chat:{count:Math.round(num(v.chat?.count,1,7,4)),duration:num(v.chat?.duration,3,120,20),featuredDuration:num(v.chat?.featuredDuration,0,120,0),popupDuration:num(v.chat?.popupDuration,3,30,8)},info:{topic:text(v.info?.topic,160),names:text(v.info?.names??'Anlex | Moderátor\nHonza | Moderátor',500)},countdown:{title:text(v.countdown?.title??'Za chvíli začínáme',120),seconds:num(v.countdown?.seconds,10,7200,300),endText:text(v.countdown?.endText??'Za okamžik jsme zpátky',120)},outro:{titleBottom:text(v.outro?.titleBottom??'POKEC',80),guests:text(v.outro?.guests??'Jiří Trsek\nHonza Škopek',600)},accent:/^#[0-9a-f]{6}$/i.test(v.accent)?v.accent:'#147eff'};}
 function initial(){const c=config();return {version:1,revision:0,muted:false,activeProfile:'pokec',config:c,profiles:[{id:'pokec',name:'Pokec',config:clone(c)},{id:'rozhovor',name:'Rozhovor',config:config({...c,outro:{titleBottom:'ROZHOVOR',guests:''},info:{names:'Moderátor | Metrobus\nHost | Host pořadu',topic:''}})},{id:'special',name:'Speciál',config:config({...c,outro:{titleBottom:'SPECIÁL',guests:''}})}],chat:{visible:false,messages:[],featured:null,popup:null,queue:[]},info:{topicVisible:false,namesVisible:false,topic:'',names:''},countdown:{visible:false,title:'',endText:'',endsAt:0},outro:{visible:false,run:0,settings:null}};}
 function msg(v,now){return {id:text(v.id||'message-'+now,100),author:text(v.author||'Divák',60),text:text(v.text,500),at:now,avatar:typeof v.avatar==='string'&&/^https:\/\//.test(v.avatar)?text(v.avatar,1000):null,amount:text(v.amount,80),kind:v.kind==='membership'?'membership':'money',membership:!!v.membership};}
 function tick(s,now=Date.now()){let changed=false;if(s.chat.featured?.until&&s.chat.featured.until<=now){s.chat.featured=null;changed=true;}if(s.chat.popup&&s.chat.popup.until<=now){s.chat.popup=null;changed=true;}if(!s.chat.popup&&s.chat.queue.length&&!s.outro.visible&&!s.countdown.visible&&!s.muted){s.chat.popup={...s.chat.queue.shift(),at:now,until:now+s.config.chat.popupDuration*1000};changed=true;}return changed;}
 function reduce(state,a,now=Date.now()){const s=clone(state),p=a.payload||{};
 switch(a.type){
 case 'config':s.config=config(p);break;
 case 'chat.visible':s.chat.visible=!!p.visible;if(p.visible)s.muted=false;break;
 case 'chat.add':{const m=msg(p,now);if(!m.text&&!m.amount&&!m.membership)break;if(s.chat.messages.some(x=>x.id===m.id))break;s.chat.messages.push(m);s.chat.messages=s.chat.messages.slice(-200);if(!s.muted&&(m.amount||m.membership)&&s.chat.queue.length<30)s.chat.queue.push(m);break;}
 case 'chat.feature':{const m=s.chat.messages.find(x=>x.id===p.id);if(m){s.muted=false;s.chat.featured={...m,until:s.config.chat.featuredDuration?now+s.config.chat.featuredDuration*1000:0};}break;}
 case 'chat.hideFeatured':s.chat.featured=null;break;
 case 'chat.clear':s.chat.messages=[];s.chat.featured=null;break;
 case 'chat.clearPopups':s.chat.popup=null;s.chat.queue=[];break;
 case 'info.topic':s.info.topicVisible=!!p.visible;if(p.visible){s.muted=false;s.info.topic=s.config.info.topic;};break;
 case 'info.names':s.info.namesVisible=!!p.visible;if(p.visible){s.muted=false;s.info.names=s.config.info.names;};break;
 case 'countdown.start':s.muted=false;s.countdown={visible:true,title:s.config.countdown.title,endText:s.config.countdown.endText,endsAt:now+s.config.countdown.seconds*1000};s.outro.visible=false;break;
 case 'countdown.hide':s.countdown.visible=false;break;
 case 'outro.start':s.muted=false;s.outro={visible:true,run:now,settings:clone(s.config.outro)};s.countdown.visible=false;break;
 case 'outro.hide':s.outro.visible=false;break;
 case 'all.hide':s.muted=true;s.chat.visible=false;s.chat.featured=null;s.chat.popup=null;s.chat.queue=[];s.info.topicVisible=false;s.info.namesVisible=false;s.outro.visible=false;s.countdown.visible=false;break;
 case 'profile.save':{const name=text(p.name,60).trim();if(!name)throw Error('Zadej název profilu.');const existing=s.profiles.find(x=>x.id===p.id);if(existing){existing.name=name;existing.config=clone(s.config);}else{if(s.profiles.length>=30)throw Error('Nejvýše 30 profilů.');s.profiles.push({id:text(p.newId,100)||'profile-'+now,name,config:clone(s.config)});}break;}
 case 'profile.apply':{const profile=s.profiles.find(x=>x.id===p.id);if(!profile)throw Error('Profil neexistuje.');s.config=config(profile.config);s.activeProfile=profile.id;/* live content intentionally stays until Show */break;}
 case 'profile.delete':if(p.id===s.activeProfile)throw Error('Aktivní profil nelze smazat.');s.profiles=s.profiles.filter(x=>x.id!==p.id);break;
 default:throw Error('Neznámá akce: '+a.type);
 }tick(s,now);s.revision++;return s;}
 g.StudioModel={initial,config,reduce,tick,clone};if(typeof module!=='undefined')module.exports=g.StudioModel;
})(typeof window==='undefined'?globalThis:window);
