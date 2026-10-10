// Replay the source-bound report targets without exporting private prose or labels.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import {scoreActRecall} from './act-recall.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [samplesArg,outputArg,onlyFic]=process.argv.slice(2);
if(!samplesArg||!outputArg)throw Error('Usage: node scripts/trace-reviewed-misses.mjs <samples> <output.json> [fic.html]');
const handoff=JSON.parse(readFileSync(join(root,'docs/data/finger-toy-missing-trace.json'),'utf8'));
const cases=handoff.cases.filter(e=>!onlyFic||e.fic===onlyFic);
if(!cases.length)throw Error('No report cases match that fic');
const hash=s=>createHash('sha256').update(s).digest('hex');
const paraHash=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16)};
const dom=new JSDOM('');
for(const k of ['window','document','DOMParser','Node','Element','HTMLElement','Text'])Object.defineProperty(globalThis,k,{value:k==='window'?dom.window:dom.window[k],configurable:true});
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'});
try{
 const {extractFromHtml}=await server.ssrLoadModule('/src/extract.ts');
 const {analyzeWithPatterns}=await server.ssrLoadModule('/src/heuristic/index.ts');
 const snapshots=new Map(),traces=new Map();
 for(const file of new Set(cases.map(e=>e.fic))){
  const selected=cases.filter(e=>e.fic===file),html=readFileSync(join(resolve(samplesArg),file),'utf8');
  const sourceSha=hash(html);
  if(selected.some(e=>e.sourceSha!==sourceSha))throw Error('Source checksum differs: '+file);
  const work=extractFromHtml(html),hits=[],trace=[];let paragraphHashes=[],paragraphSha,last=-1;
  const near=i=>selected.some(e=>i>=e.from-4&&i<=e.to+4);
  analyzeWithPatterns(work.text,work.meta,{quiet:true,
   trace:e=>{if(e.para<last)trace.length=0;last=e.para;if(near(e.para))trace.push({para:e.para,via:e.via,top:e.top,bottom:e.bottom,basis:e.basis});},
   audit:h=>{if(near(h.para))hits.push({para:h.para,via:h.via,kind:h.kind,cat:h.cat,act:h.act,a:h.a,b:h.b,role:h.role});},
   debug:d=>{paragraphHashes=d.paras.map(paraHash);paragraphSha=hash(d.paras.join('\n'));},
  });
  for(const e of selected){
   if(e.from<0||e.to>=paragraphHashes.length)throw Error('Citation out of bounds: '+e.caseId);
   if(e.paragraphHashes&&JSON.stringify(e.paragraphHashes)!==JSON.stringify(paragraphHashes.slice(e.from,e.to+1)))throw Error('Paragraph hashes differ: '+e.caseId);
   if(e.sourceParagraphSha&&e.sourceParagraphSha!==paragraphSha)throw Error('Extraction checksum differs: '+e.caseId);
  }
  snapshots.set(file,{sourceSha,paragraphVerified:true,hits});traces.set(file,trace);
  console.log(file+': '+selected.length+' verified targets');
 }
 const recall=scoreActRecall(cases,snapshots);
 const rows=recall.results.map(e=>({caseId:e.caseId,fic:e.fic,id:e.id,eventId:e.eventId,from:e.from,to:e.to,act:e.act,performer:e.performer,receiver:e.receiver,status:e.status,matches:e.matches,
  initialCandidates:traces.get(e.fic).filter(t=>t.para>=e.from&&t.para<=e.to),
  survivingReadings:snapshots.get(e.fic).hits.filter(h=>h.para>=e.from&&h.para<=e.to)}));
 const output={schema:'reviewed-miss-safe-replay/v1',engineCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceVerified:true,summary:recall.summary.filter(r=>r.expected),cases:rows};
 mkdirSync(dirname(resolve(outputArg)),{recursive:true});writeFileSync(resolve(outputArg),JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({cases:rows.length,statuses:rows.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{})}));
}finally{await server.close();dom.window.close()}
