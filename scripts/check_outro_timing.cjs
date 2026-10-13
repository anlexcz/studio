const fs=require('fs'), vm=require('vm'), assert=require('assert');
async function verify(count,height){
 let now=0, jobs=[], scroll,finishScroll;
 const classes=new Map();
 function element(id){
  const cls=new Set();classes.set(id,cls);
  return {style:{},scrollHeight:height,clientHeight:530,classList:{add:x=>cls.add(x),remove:x=>cls.delete(x)},appendChild(){},innerHTML:'',animate(frames,options){scroll={frames,options};return {finished:new Promise(r=>finishScroll=r)}}};
 }
 const ids={};const doc={getElementById:id=>ids[id]??=element(id),createElement:()=>element(Math.random()),querySelector:()=>element('window'),querySelectorAll:()=>[],fonts:{ready:Promise.resolve()},body:element('body')};
 const context={document:doc,window:{OUTRO_CONFIG:{creditsEndPauseMs:3500},location:{href:'https://example.org/outro/outro.html'}},URL,Date,console,setTimeout:(fn,ms)=>{jobs.push({fn,at:now+ms});},setInterval(){},fetch:async url=>({ok:true,json:async()=>({supporters:Array.from({length:count},(_,i)=>({name:'Person '+i,tier:'midibus'}))}),text:async()=>''})};
 vm.runInNewContext(fs.readFileSync('studio/outro/outro.js','utf8'),context);
 const flush=async()=>{await new Promise(setImmediate);};
 async function advance(ms){let target=now+ms;while(jobs.some(j=>j.at<=target)){jobs.sort((a,b)=>a.at-b.at);const job=jobs.shift();now=job.at;job.fn();await flush();}now=target;await flush();}
 await flush();await advance(7600);assert(scroll);assert.equal(scroll.frames[1].transform,`translateY(${-height-30}px)`);
 await advance(120000);assert(!classes.get('app').has('fade-out'),'Never fade while the animation is pending');
 finishScroll();await flush();await advance(3499);assert(!classes.get('app').has('fade-out'));await advance(1);assert(classes.get('app').has('fade-out'));
 console.log(`PASS ${count} supporters / height ${height}: waits for full animation and end pause`);
}
(async()=>{await verify(1,50);await verify(46,2300);await verify(100,6000);})().catch(e=>{console.error(e);process.exitCode=1;});
