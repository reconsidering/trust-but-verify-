import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {claimIdentity,reviewerGroup,semanticAct,inventoryReviewer} from './review-provenance.mjs';
import {baseVia,slugOf} from './right-set.mjs';
const root=process.cwd();
const output=process.argv[2];
if(!output)throw Error('Usage: node scripts/freeze-recall-evidence.mjs <private-output.json>');
mkdirSync(dirname(output),{recursive:true});
const load=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const batch=load('public/review/claude-oct4-5.json');const baseline=load('docs/data/act-recall-baseline.json');
const pathList=execFileSync('git',['ls-tree','-r','--name-only','cffe355','--','tests/right-set'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>p.endsWith('.json'));
const second=pathList.map(p=>({path:p,doc:JSON.parse(execFileSync('git',['show','cffe355:'+p],{cwd:root,encoding:'utf8',maxBuffer:1024*1024*8}))}));
const current=readdirSync(join(root,'tests/right-set')).filter(f=>f.endsWith('.json')).map(f=>({path:f,doc:load('tests/right-set/'+f)}));
const own=new Map();for(const file of readdirSync(join(root,'tests/labels')).sort().filter(f=>/^zz-owner.*\.json$/.test(f))){const d=load('tests/labels/'+file);for(const a of d.answers??[]){const lab=d.labels?.[a.key];if(a.claim&&['ok','wrong'].includes(lab)){const k=claimIdentity(a.claim),v=lab==='ok'?'correct':'wrong';own.set(k,own.has(k)&&own.get(k)!==v?'conflicting':v);}}}
const sameFields=(e,c)=>e.kind==='scene'?e.top===c.a&&e.bottom===(c.b??''):e.kind==='solo'?e.who===c.a:false;
function records(sets,title,hash,claim,source){return sets.filter(s=>slugOf(s.doc.title??s.doc.fic)===slugOf(title)||s.path.endsWith('/'+claim.fic.replace('.html','.json'))||s.path===claim.fic.replace('.html','.json')).flatMap(s=>[...s.doc.entries.map(e=>({e,verdict:'correct'})),...(s.doc.negatives??[]).map(e=>({e,verdict:'wrong'}))]).filter(({e})=>e.source===source&&!e.retired&&e.h===hash&&baseVia(e.via??'')===baseVia(claim.pattern)&&sameFields(e,claim));}
function citationHash(f,para){const hashes=(f.acts??[]).filter(a=>Number.isInteger(a.from)&&Number.isInteger(a.to)&&para>=a.from&&para<=a.to&&a.paragraphHashes?.length===a.to-a.from+1).map(a=>a.paragraphHashes[para-a.from]);return hashes.length&&new Set(hashes).size===1?hashes[0]:undefined;}
const rows=[];const excluded=[];
for(const file of readdirSync(join(root,'tests/scene-review')).filter(f=>f.endsWith('.json'))){const d=load('tests/scene-review/'+file);for(const f of d.fics??[])for(const r of f.readings??[]){
 if(!r.claim||r.training!=='right-set'||r.confidence<.95||!['correct','wrong'].includes(r.qaVerdict??r.verdict)||!f.safety?.eligible)continue;
 const semantic=semanticAct(r.claim);if(!semantic)continue;
 const chatgpt=r.qaVerdict??r.verdict;
 const match=records(second,f.title,r.reportHash,r.claim,'chatgpt').filter(x=>x.verdict===chatgpt&&[.3,.9].includes(x.e.weight));
 const claude=match.length===1?(match[0].e.weight===.9?chatgpt:(chatgpt==='correct'?'wrong':'correct')):undefined;
 const owners=records(current,f.title,r.reportHash,r.claim,'owner');
 const owner=(['correct','wrong'].includes(own.get(claimIdentity(r.claim)))?own.get(claimIdentity(r.claim)):undefined)??(owners.length&&new Set(owners.map(o=>o.verdict)).size===1?owners[0].verdict:undefined);
 const group=reviewerGroup({owner,claude,chatgpt});
 rows.push({id:r.id,inventory:file,reportHash:r.reportHash,claim:r.claim,semantic,sourceParagraphSha:f.paragraphSha,citationHash:citationHash(f,r.claim.paragraph),judgments:{owner,claude,chatgpt},...group,provenance:match.length===1?'Claude blind-review snapshot cffe355, exact record lookup':'ChatGPT source-bound deep-dive judgment'});
}}
for(const r of batch.items){
 const o=r.historical.original;const kind=o.occurrence==='Performed act'?'act':['Solo act','Self-directed act'].includes(o.occurrence)?'solo':undefined;
 const source=batch.sources.find(s=>s.file===r.fic);
 const claim={fic:r.fic,sourceSha:source.sourceSha,paragraph:r.paragraph,pattern:r.historical.record.via,kind,act:o.act,a:o.a,b:o.b??'',role:o.role??''};
 if(!kind||!r.historical.replayVerified||r.locations.length!==1||!semanticAct(claim)){excluded.push({id:r.id,reason:'Non-performed, unsupported or unverifiable historical claim'});continue;}
 const claude=r.historical.label;const chatgpt=r.proposal.confidence>=.95&&['correct','wrong'].includes(r.proposal.originalVerdict)?r.proposal.originalVerdict:undefined;
 const ownerRows=records(current,r.title,r.historical.record.h,claim,'owner');
 const owner=(['correct','wrong'].includes(own.get(claimIdentity(claim)))?own.get(claimIdentity(claim)):undefined)??(ownerRows.length&&new Set(ownerRows.map(o=>o.verdict)).size===1?ownerRows[0].verdict:undefined);
 rows.push({id:r.id,inventory:'claude-oct4-5.json',reportHash:r.historical.record.h,claim,semantic:semanticAct(claim),sourceParagraphSha:source.paragraphSha,judgments:{owner,claude,chatgpt},...reviewerGroup({owner,claude,chatgpt}),provenance:'Original Claude claim and ChatGPT judgment of that same original claim, archived review page'});
}
const unique=new Map();for(const r of rows){const key=claimIdentity(r.claim);const old=unique.get(key);if(!old||r.group==='Owner')unique.set(key,r);else if(old.verdict!==r.verdict&&r.group!=='Disagreement')unique.set(key,{...old,group:'Disagreement',verdict:null});}
const claims=[...unique.values()];
const inventoryProof=e=>{const d=load('tests/scene-review/'+e.inventory);return [...(d.sources??[]),...(d.fics??[])].find(f=>(f.file??f.fic)===e.fic&&f.sourceSha===e.sourceSha)?.paragraphSha;};
const events=baseline.results.filter(r=>!['source-unverified','source-unavailable','needs-adjudication','invalid-event'].includes(r.status)&&r.reviewer!=='partial / assistant').map(r=>({...r,sourceParagraphSha:inventoryProof(r),reviewer:inventoryReviewer(r,claims)}));
const payload={schema:'fixed-reviewed-evidence/v1',baseEngine:'7f77a76',secondReviewCommit:'cffe355',claims,events,excluded,baselineExclusions:{unverified:baseline.results.filter(r=>r.status==='source-unverified').length,adjudication:baseline.results.filter(r=>r.status==='needs-adjudication').length,partial:baseline.results.filter(r=>r.reviewer==='partial / assistant'&&!['source-unverified','source-unavailable','needs-adjudication','invalid-event'].includes(r.status)).length}};payload.fingerprint=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
writeFileSync(output,JSON.stringify(payload,null,2));console.log('Claims',Object.fromEntries([...new Set(claims.map(c=>c.group))].map(g=>[g,claims.filter(c=>c.group===g).length])),'Events',Object.fromEntries([...new Set(events.map(e=>e.reviewer))].map(g=>[g,events.filter(e=>e.reviewer===g).length])));
