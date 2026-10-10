import {readFileSync,readdirSync,mkdirSync,writeFileSync,existsSync,symlinkSync} from 'node:fs';
import {execFileSync,spawn} from 'node:child_process';
import {join,resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),samples=resolve(process.argv[2]??'ao3-samples'),out=resolve(process.argv[3]??'recall-history-output');
mkdirSync(out,{recursive:true});
const baseline=JSON.parse(readFileSync(join(root,'docs/data/act-recall-baseline.json'),'utf8'));
const batch=JSON.parse(readFileSync(join(root,'public/review/claude-oct4-5.json'),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const wanted=new Map();for(const r of baseline.results)wanted.set(r.fic,r.sourceSha);
for(const s of batch.sources)wanted.set(s.file,s.sourceSha);
const blocked=new Set(['play-the-game.html','slipfast.html','strawberry-mama.html','self-mythology.html']);
const fics=[...wanted].filter(([file,s])=>!blocked.has(file)&&existsSync(join(samples,file))&&sha(readFileSync(join(samples,file)))===s).map(([file,sourceSha])=>({file,sourceSha})).sort((a,b)=>a.file.localeCompare(b.file));
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name)]).sort();
const fp=p=>sha(walk(join(p,'src')).map(f=>relative(p,f)+'\n'+readFileSync(f,'utf8')).join('\n')+readFileSync(join(root,'package-lock.json'),'utf8'));
const extractorFingerprint=fp(root),refs=process.argv.slice(4).length?process.argv.slice(4):['055197b','c144b6b','309407d','6e878a4','048da76','7f77a76'];
const jobs=[];
for(const short of refs){
 const ref=execFileSync('git',['rev-parse',short],{cwd:root,encoding:'utf8'}).trim();const engineRoot=join(out,'private-engine-source',ref);mkdirSync(engineRoot,{recursive:true});
 const archive=execFileSync('git',['archive',ref,'src'],{cwd:root,maxBuffer:100*1024*1024});execFileSync('tar',['-x','-C',engineRoot],{input:archive});
 if(!existsSync(join(engineRoot,'node_modules')))symlinkSync(join(root,'node_modules'),join(engineRoot,'node_modules'));
 writeFileSync(join(engineRoot,'package.json'),'{"type":"module"}\n');
 const date=execFileSync('git',['show','-s','--format=%cI',ref],{cwd:root,encoding:'utf8'}).trim();
 const job={ref,date,engineRoot,extractorRoot:root,engineFingerprint:fp(engineRoot),extractorFingerprint,samples,fics,output:join(out,'engines',short),currentEngine:short==='7f77a76',reuse:[]};
 const jobPath=join(out,short+'-job.json');writeFileSync(jobPath,JSON.stringify(job));jobs.push({jobPath,...job});
}
writeFileSync(join(out,'manifest.json'),JSON.stringify({schema:'fixed-inventory-history/v1',extractorFingerprint,fics,versions:jobs.map(({ref,date,output,engineFingerprint})=>({ref,date,output,engineFingerprint}))},null,2));
let next=0;async function lane(){while(next<jobs.length){const job=jobs[next++];await new Promise((ok,bad)=>{const p=spawn('node',[join(root,'scripts/recall-history-worker.mjs'),job.jobPath],{cwd:root,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=8000'},stdio:['ignore','pipe','pipe']});p.stdout.on('data',b=>process.stdout.write(b));p.stderr.on('data',b=>process.stderr.write(b));p.on('exit',code=>code===0?ok():bad(Error('Worker '+job.ref+' failed '+code)));});}}
await Promise.all([lane(),lane(),lane()]);console.log('All historical snapshots complete');
