import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {resolve,join,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {scoreActRecall} from './act-recall.mjs';
// Safe replay of the frozen 349-event inventory; never imports or rewrites labels.
// Baselines may use an archived src/ directory; extraction/scoring stay frozen to this checkout.
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [samplesArg,outArg,engineArg,engineRef='HEAD + working tree']=process.argv.slice(2);
if(!samplesArg||!outArg)throw Error('Usage: node scripts/replay-fixed-inventory.mjs <samples> <out> [archived engine root] [engine ref]');
const root=resolve(engineArg??repo),samples=resolve(samplesArg),out=resolve(outArg);
const doc=JSON.parse(readFileSync(join(repo,'docs/data/fixed-review-history.json')));
mkdirSync(out,{recursive:true});
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name)]).sort();
const engineBytes=()=>walk(join(root,'src')).map(p=>relative(root,p)+'\n'+readFileSync(p,'utf8')).join('\n');
const loadedEngineBytes=engineBytes();
const selected=doc.events.filter(e=>!process.env.REPLAY_ONLY||e.fic===process.env.REPLAY_ONLY);
if(!selected.length)throw Error('No frozen events match REPLAY_ONLY');
const events=[];
const dom=new JSDOM('');for(const k of ['window','document','DOMParser','Node','Element','HTMLElement','Text'])Object.defineProperty(globalThis,k,{value:k==='window'?dom.window:dom.window[k],configurable:true});
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'});
const sha=s=>createHash('sha256').update(s).digest('hex');
try{
 const {extractFromHtml}=await server.ssrLoadModule('/@fs/'+join(repo,'src/extract.ts')); const {splitParagraphs}=await server.ssrLoadModule('/@fs/'+join(repo,'src/text.ts')); const {analyzeWithPatterns}=await server.ssrLoadModule('/src/heuristic/index.ts');
 const snapshots=new Map();
 for(const file of new Set(selected.map(e=>e.fic))){
  const html=readFileSync(join(samples,file),'utf8'); const sourceSha=sha(html);
  if(selected.filter(e=>e.fic===file).some(e=>e.sourceSha!==sourceSha))throw Error('Source mismatch '+file);
  const work=extractFromHtml(html), hits=[];let paragraphSha,paragraphHashes;
  const clean=work.text.replace(/\[\[AO3_UNCERTAIN_NOTE_START\]\][\s\S]*?\[\[AO3_UNCERTAIN_NOTE_END\]\]/g,'').replace(/\[\[AO3_[A-Z_]+\]\]/g,'');
  const rawParas=splitParagraphs(clean.replace(/^([ \t]*>[ \t]*\S.*|.*\S[ \t]*<[ \t]*)$/gm,'\n$1\n'));
  const rawSha=sha(rawParas.join('\n'));
  const ph=p=>{let h=2166136261;for(let i=0;i<p.length;i++)h=Math.imul(h^p.charCodeAt(i),16777619);return(h>>>0).toString(16)};
  analyzeWithPatterns(work.text,work.meta,{quiet:true,audit:({para,via,kind,cat,act,a,b,role})=>hits.push({para,via,kind,cat,act,a,b,role}),debug:({paras})=>{paragraphSha=sha(paras.join('\n'));paragraphHashes=paras.map(p=>{let h=2166136261;for(let i=0;i<p.length;i++)h=Math.imul(h^p.charCodeAt(i),16777619);return(h>>>0).toString(16)});}});
  const snapshot={sourceSha,paragraphVerified:false,paragraphSha,paragraphHashes,hits};
  snapshots.set(file,snapshot);
  for(const e of selected.filter(e=>e.fic===file)) {
    const current=paragraphHashes.slice(e.from,e.to+1),raw=rawParas.slice(e.from,e.to+1).map(ph);
    const validRange=Number.isInteger(e.from)&&Number.isInteger(e.to)&&e.from>=0&&e.to>=e.from&&e.to<paragraphHashes.length;
    const verified=validRange && (e.paragraphHashes ? e.paragraphHashes.length===e.to-e.from+1 && JSON.stringify(e.paragraphHashes)===JSON.stringify(current) :
      e.sourceParagraphSha===paragraphSha || e.sourceParagraphSha===rawSha && rawParas.length===paragraphHashes.length && JSON.stringify(raw)===JSON.stringify(current));
    events.push({...e,...(verified?{paragraphHashes:current}:{}),citationVerification:verified?'verified':'unverified'});
  }
  writeFileSync(join(out,file+'.json'),JSON.stringify(snapshot));
  console.log(file);
 }
 const result=scoreActRecall(events,snapshots);
 if(engineBytes()!==loadedEngineBytes)throw Error('Engine changed during replay; discard partial snapshots and rerun');
 result.engineRef=engineRef;result.engineFingerprint=sha(loadedEngineBytes);result.inventoryFingerprint=doc.inventoryFingerprint;result.scoringFingerprint=sha(['scripts/act-recall.mjs','scripts/scene-review-scope.mjs','scripts/replay-scene-reviews.mjs'].map(p=>p+'\n'+readFileSync(join(repo,p),'utf8')).join('\n'));result.referenceScoringFingerprint=doc.scoringFingerprint;result.referenceInventorySize=doc.events.length;
 result.replayedEvents=selected.length;
 writeFileSync(join(out,process.env.REPLAY_ONLY?'fixed-inventory-'+process.env.REPLAY_ONLY+'.json':'fixed-inventory.json'),JSON.stringify(result,null,2));
 for(const [file,snapshot]of snapshots)writeFileSync(out+'/'+file+'.json',JSON.stringify(snapshot));
 console.log(JSON.stringify(result.summary));
}finally{await server.close();dom.window.close()}
