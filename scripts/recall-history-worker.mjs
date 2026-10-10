// Private replay worker: archived detector, frozen current HTML extraction, no prose output.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
const job=JSON.parse(readFileSync(process.argv[2],'utf8'));
const dom=new JSDOM('');
for(const k of ['window','document','DOMParser','Node','Element','HTMLElement','Text'])Object.defineProperty(globalThis,k,{value:k==='window'?dom.window:dom.window[k],configurable:true});
const server=await createServer({root:job.engineRoot,configFile:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'});
const sha=s=>createHash('sha256').update(s).digest('hex');
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16)};
try{
 const {extractFromHtml}=await server.ssrLoadModule('/@fs/'+join(job.extractorRoot,'src/extract.ts'));
 const {analyzeWithPatterns}=await server.ssrLoadModule('/src/heuristic/index.ts');
 mkdirSync(job.output,{recursive:true});
 for(const f of job.fics){
  const target=join(job.output,f.file+'.json');
  const candidates=[target,...(job.reuse??[]).map(p=>join(p,f.file+'.json'))];let cached;
  for(const p of candidates)if(existsSync(p)){const d=JSON.parse(readFileSync(p,'utf8'));if(d.sourceSha===f.sourceSha&&d.engineFingerprint===job.engineFingerprint&&(!d.extractorFingerprint?job.currentEngine:d.extractorFingerprint===job.extractorFingerprint)){cached=d;break;}}
  if(cached){writeFileSync(target,JSON.stringify({...cached,extractorFingerprint:job.extractorFingerprint}));continue;}
  const html=readFileSync(join(job.samples,f.file),'utf8');if(sha(html)!==f.sourceSha)throw Error('Source checksum changed: '+f.file);
  const work=extractFromHtml(html),hits=[];let paragraphHashes=[],paragraphSha;
  analyzeWithPatterns(work.text,work.meta,{quiet:true,audit:({para,via,kind,cat,act,a,b,role})=>hits.push({para,via,kind,cat,act,a,b,role}),debug:({paras})=>{paragraphHashes=paras.map(hash);paragraphSha=sha(paras.join('\n'));}});
  writeFileSync(target,JSON.stringify({schema:'historical-act-snapshot/v1',sourceSha:f.sourceSha,engineFingerprint:job.engineFingerprint,extractorFingerprint:job.extractorFingerprint,paragraphHashes,paragraphSha,hits}));
  console.log(job.ref.slice(0,7)+' '+f.file);
 }
}finally{await server.close();dom.window.close();}
