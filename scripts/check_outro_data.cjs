const assert=require('node:assert/strict'),fs=require('node:fs');
const Data=require('../outro/data.js');
const original=JSON.parse(fs.readFileSync('outro/settings.json','utf8'));
const imported=Data.importSupporters('Jméno,Handle,E-mail,Předplatné\r\n"Novák, Jan",jan,private@example.org,Standard\r\n,nickname,secret@example.org,Midibus\r\n','podporovatele-metrobuscz-2026-10-13.csv');
assert.equal(imported.supporters[0].name,'Novák, Jan');assert.equal(imported.supporters[1].name,'nickname');assert(!imported.csv.includes('example.org'));assert(!JSON.stringify(imported).includes('E-mail'));
assert.deepEqual(Data.parseCsv('a;b\n"line\ninside";"two ""quotes"""'),[['a','b'],['line\ninside','two "quotes"']]);
assert.throws(()=>Data.parseCsv('a,b\n"broken,b'));
assert.throws(()=>Data.importSupporters('Jméno,Handle,Předplatné\nJoe,joe,unknown','x.csv'));
assert.throws(()=>Data.importSupporters('Jméno,Handle,Předplatné\nJoe,joe,Standard','podporovatele-metrobuscz-2026-99-01.csv'));
const newer={...original,footer:'A newer footer'};
async function simulate({conflict=false,denied=false,lateConflict=false}={}) {
 const calls=[];
 const fetcher=async(url,opt)=>{
  const path=url.replace('https://api.github.com/repos/anlexcz/studio','');calls.push({path,...opt});
  if(denied)return {ok:false,status:401};
  let data;
  if(path==='/git/ref/heads/main')data={object:{sha:'HEAD'}};
  else if(path.startsWith('/contents/'))data={content:Buffer.from(JSON.stringify(conflict?newer:original),'utf8').toString('base64')};
  else if(path==='/git/commits/HEAD')data={tree:{sha:'BASE'}};
  else if(path.startsWith('/git/trees/BASE'))data={tree:[{path:'outro/podporovatele-metrobuscz-2026-10-13.csv'}]};
  else if(path==='/git/trees')data={sha:'TREE'};
  else if(path==='/git/commits')data={sha:'NEXT'};
  else if(path==='/git/refs/heads/main'){if(lateConflict)return {ok:false,status:422};data={};}
  else throw Error('Unexpected API path '+path);
  return {ok:true,json:async()=>data};
 };
 const result=Data.publish({settings:{...original,guests:['Anlex','Honza']},original,upload:imported,token:'TEST_ONLY',fetcher});
 if(conflict||denied||lateConflict)await assert.rejects(result);else {await result;const tree=JSON.parse(calls.find(x=>x.path==='/git/trees').body);assert.equal(tree.base_tree,'BASE');assert.equal(tree.tree.length,2);assert(tree.tree.every(f=>f.path.startsWith('outro/')));assert(!JSON.stringify(tree).includes('example.org'));const ref=JSON.parse(calls.at(-1).body);assert.equal(ref.force,false);assert.deepEqual(ref,{sha:'NEXT',force:false});}
 if(conflict||denied)assert(calls.every(c=>c.method==='GET'));
}
(async()=>{await simulate();await simulate({conflict:true});await simulate({denied:true});await simulate({lateConflict:true});console.log('PASS: CSV quoting, privacy, fallback names, atomic commit, auth and conflict handling');})().catch(e=>{console.error(e);process.exitCode=1;});
