// Import a combined owner export to new, separate per-fic files; no automatic retraining.
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{resolve,dirname,join,sep}from'node:path';import{buildCageReviewImports}from'./cock-cage-feedback.mjs';
const[indexFile,answersFile,outputDir]=process.argv.slice(2);
if(!indexFile||!answersFile||!outputDir)throw Error('Supply review index, combined answers JSON and a NEW output directory.');
const output=resolve(outputDir);if(existsSync(output))throw Error('Output directory already exists. Use a fresh path.');
if(['tests/labels','tests/right-set','tests/gold','src/heuristic'].some(p=>output===resolve(p)||output.startsWith(resolve(p)+sep)))throw Error('Use a separate staging directory; review imports are not accepted automatically.');
const index=JSON.parse(readFileSync(indexFile,'utf8'));if(index.schema!=='cock-cage-review-index/v1')throw Error('Unsupported review index.');
const batches=index.fics.map(f=>JSON.parse(readFileSync(join(dirname(indexFile),f.manifest),'utf8'))),feedback=JSON.parse(readFileSync(answersFile,'utf8')),results=buildCageReviewImports(batches,feedback);
mkdirSync(output,{recursive:true});let labels=0,events=0;
for(const r of results){const base=r.file.replace(/\.html$/,'');writeFileSync(join(output,base+'-confidence.json'),JSON.stringify(r.confidence,null,2)+'\n');writeFileSync(join(output,base+'-inventory.json'),JSON.stringify(r.inventory,null,2)+'\n');labels+=Object.keys(r.confidence.labels).length;events+=r.inventory.windows.reduce((n,w)=>n+w.events.length,0);}
console.log(`${results.length} fic reviews staged: ${labels} explicit labels, ${events} positive performed events. Cage events are not scored as penetrative sex. Labels are not accepted or retrained automatically.`);
