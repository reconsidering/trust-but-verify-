import {it} from 'vitest';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {extractFromHtml} from '../src/extract';
import {analyzeWithPatterns,type AuditHit} from '../src/heuristic';
import {inventoryEvents,scoreActRecall,recallMarkdown,recallHistoryMarkdown} from '../scripts/act-recall.mjs';
const dir=process.env.ACT_RECALL_DIR;
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
it.skipIf(!dir)('writes current-engine per-act recall without modifying labels or models',()=>{
 const labelDir='tests/scene-review';const files=readdirSync(labelDir).filter(f=>f.endsWith('.json')).sort();
 const inputs=files.map(file=>({file,raw:readFileSync(join(labelDir,file),'utf8')}));
 const parsed=inputs.map(({file,raw})=>({file,doc:JSON.parse(raw)}));
 const events=parsed.flatMap(({file,doc})=>inventoryEvents(doc,file).events);
 const excluded=parsed.flatMap(({file,doc})=>inventoryEvents(doc,file).excluded);
 const identities=parsed.flatMap(({doc})=>[...(doc.sources??[]).map((s:any)=>({file:s.file,sourceSha:s.sourceSha,paragraphSha:s.paragraphSha})),...(doc.fics??[]).map((f:any)=>({file:f.file,sourceSha:f.sourceSha,paragraphSha:f.paragraphSha}))]);
 const blocked=new Set(['play-the-game.html','slipfast.html','strawberry-mama.html','self-mythology.html']);
 const scoringFingerprint=sha(['scripts/act-recall.mjs','scripts/scene-review-scope.mjs','scripts/replay-scene-reviews.mjs','tests/act-recall-run.test.ts'].map(p=>readFileSync(p,'utf8')).join('\n'));
 const snapshots=new Map();
 const out=process.env.ACT_RECALL_OUT??dir!;mkdirSync(out,{recursive:true});
 const cacheDir=join(out,'.act-recall-cache');mkdirSync(cacheDir,{recursive:true});
 const engineFiles=(p:string):string[]=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?engineFiles(join(p,e.name)):[join(p,e.name)]).sort();
 const engineFingerprint=sha(engineFiles('src').map(p=>p+'\n'+readFileSync(p,'utf8')).join('\n')+readFileSync('package-lock.json','utf8'));
 for(const file of [...new Set(events.map(e=>e.fic))].sort()) {
  if(blocked.has(file)||!/^[-\w]+\.html$/.test(file)||!existsSync(join(dir!,file)))continue;
  const html=readFileSync(join(dir!,file),'utf8'),sourceSha=sha(html);
  // Do not read an unrelated replacement source or an unverified adult corpus addition.
  const expected=identities.filter(i=>i.file===file&&i.sourceSha===sourceSha);
  if(!expected.length)continue;
  const cachePath=join(cacheDir,file+'.json');
  if(existsSync(cachePath)){const cached=JSON.parse(readFileSync(cachePath,'utf8'));if(cached.engineFingerprint===engineFingerprint&&cached.sourceSha===sourceSha){snapshots.set(file,{...cached,paragraphVerified:expected.some(i=>i.paragraphSha===cached.paragraphSha)});continue;}}
  const work=extractFromHtml(html);const hits:Omit<AuditHit,'sentence'|'f'|'attribution'>[]=[];let paragraphSha='';let paragraphHashes:string[]=[];
  analyzeWithPatterns(work.text,work.meta,{quiet:true,audit:({para,via,kind,cat,act,a,b,role})=>hits.push({para,via,kind,cat,act,a,b,role}),debug:({paras})=>{paragraphSha=sha(paras.join('\n'));paragraphHashes=paras.map(p=>{let h=2166136261;for(let i=0;i<p.length;i++)h=Math.imul(h^p.charCodeAt(i),16777619);return(h>>>0).toString(16)});}});
  const snapshot={engineFingerprint,sourceSha,paragraphSha,paragraphVerified:expected.some(i=>i.paragraphSha===paragraphSha),paragraphHashes,hits};snapshots.set(file,snapshot);writeFileSync(cachePath,JSON.stringify(snapshot));
  console.log(`Recall: ${file}`);
 }
 const adjudicationRaw=readFileSync('tests/scene-review-adjudication.json','utf8');
 const exclusions=new Map<string,string>(JSON.parse(adjudicationRaw).exclusions.map((e:any)=>[`${e.batchId}:${e.id}:${e.eventId}`,e.reason]));
 const report={...scoreActRecall(events,snapshots,exclusions),engineCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inventoryFingerprint:sha(inputs.map(i=>i.file+'\n'+i.raw).join('\n')+adjudicationRaw),generatedAt:new Date().toISOString(),engineFingerprint,scoringFingerprint,unsupported:excluded,availableFics:snapshots.size,blockedFics:[...blocked]};
 writeFileSync(join(out,'ACT_RECALL_REPORT.json'),JSON.stringify(report,null,2)+'\n');
 writeFileSync(join(out,'ACT_RECALL_REPORT.md'),recallMarkdown(report));
 const history=join(out,'ACT_RECALL_HISTORY.jsonl');
 const prior=existsSync(history)?readFileSync(history,'utf8').trim().split('\n').filter(Boolean).map(s=>JSON.parse(s)):[];
 if(!prior.some(r=>r.engineCommit===report.engineCommit&&r.engineFingerprint===report.engineFingerprint&&r.availableFics===report.availableFics&&r.inventoryFingerprint===report.inventoryFingerprint&&r.scoringFingerprint===report.scoringFingerprint&&JSON.stringify(r.summary)===JSON.stringify(report.summary)))appendFileSync(history,JSON.stringify({schema:report.schema,engineCommit:report.engineCommit,inventoryFingerprint:report.inventoryFingerprint,generatedAt:report.generatedAt,engineFingerprint,scoringFingerprint,availableFics:report.availableFics,summary:report.summary,byReviewer:report.byReviewer})+'\n');
 writeFileSync(join(out,'ACT_RECALL_HISTORY.md'),recallHistoryMarkdown(readFileSync(history,'utf8').trim().split('\n').filter(Boolean).map(s=>JSON.parse(s))));
 console.log(JSON.stringify(report.summary));
},1500000);
