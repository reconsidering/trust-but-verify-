import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {commonEvidence,evaluateHistory} from './recall-trend.mjs';
const dir=resolve(process.argv[2]??'recall-history-output');
const manifest=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
const evidence=JSON.parse(readFileSync(join(dir,'frozen-evidence.json'),'utf8'));
const versions=manifest.versions.map(v=>({...v,snapshots:new Map(manifest.fics.flatMap(f=>{
 const p=join(v.output,f.file+'.json');if(!existsSync(p))throw Error('Incomplete historical replay: '+v.ref+' '+f.file);
 const s=JSON.parse(readFileSync(p,'utf8'));if(s.engineFingerprint!==v.engineFingerprint||s.extractorFingerprint!==manifest.extractorFingerprint)throw Error('Snapshot fingerprint mismatch');
 return [[f.file,s]];
}))}));
const report={...evaluateHistory(commonEvidence(evidence,versions),versions),baselineExclusions:evidence.baselineExclusions,inventoryFingerprint:evidence.fingerprint,extractorFingerprint:manifest.extractorFingerprint,sourceFics:manifest.fics.length};
report.scoringFingerprint=createHash('sha256').update(['scripts/recall-trend.mjs','scripts/review-provenance.mjs','scripts/act-recall.mjs','scripts/scene-review-scope.mjs','scripts/replay-scene-reviews.mjs'].map(p=>readFileSync(p,'utf8')).join('\n')).digest('hex');
writeFileSync(join(dir,'FIXED_REVIEW_HISTORY.json'),JSON.stringify(report,null,2)+'\n');
if(process.argv[3]){
 const cleanEvent=({matches,status,...e})=>e;
 const published={...report,events:report.events.map(cleanEvent),runs:report.runs.map(v=>({...v,results:v.results.map((e,eventIndex)=>({eventIndex,status:e.status})),claims:v.claims.map((c,claimIndex)=>({claimIndex,acceptedActCovered:c.acceptedActCovered,rejectedOriginalSurvives:c.rejectedOriginalSurvives}))}))};
 writeFileSync(process.argv[3],JSON.stringify(published,null,2)+'\n');
}
console.log(JSON.stringify(report.runs.map(r=>({ref:r.ref.slice(0,7),correct:r.summary.reduce((n,a)=>n+a.matched,0),expected:r.summary.reduce((n,a)=>n+a.expected,0),claims:r.claimSummary})),null,2));
