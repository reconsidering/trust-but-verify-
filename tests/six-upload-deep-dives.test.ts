import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {it,expect,describe} from 'vitest';
import {baseVia,weightOf,slugOf} from '../scripts/right-set.mjs';
import {claimOf,reviewedClaims,sameClaim,sameReportedPeople} from '../scripts/reviewed-claims.mjs';
import {extractFromHtml} from '../src/extract';
import {analyzeWithPatterns} from '../src/heuristic';
import {reviewParagraphs} from '../review/review-batch-data';
const root=join(__dirname,'..');
const data=JSON.parse(readFileSync(join(__dirname,'scene-review/chatgpt-six-upload-deep-dives.json'),'utf8'));
const provenance=JSON.parse(readFileSync(join(__dirname,'labels/chatgpt-six-upload-deep-dives-claims.json'),'utf8'));

it('keeps definite adult claim judgments fractional, source-bound and separate from omissions',()=>{
 expect(data.fics).toHaveLength(4);
 expect(data.pendingEligibility).toHaveLength(0);expect(data.eligibilityResolutions).toHaveLength(3);
 expect(data.minimumReviewerConfidence).toBe(.95);expect(provenance.labels).toEqual({});
 const claims=reviewedClaims(root),existing=new Set<string>();
 for(const name of readdirSync(join(__dirname,'labels')).filter(f=>f.endsWith('.json'))){
  const labels=JSON.parse(readFileSync(join(__dirname,'labels',name),'utf8'));Object.keys(labels.labels??{}).forEach(k=>existing.add(k));
 }
 for(const fic of data.fics){
 expect(fic.safety.eligible).toBe(true);expect(fic.readCoverage).toEqual([{from:0,to:fic.paragraphs-1}]);
 const set=JSON.parse(readFileSync(join(__dirname,'right-set',fic.file.replace(/\.html$/,'.json')),'utf8'));
 expect(set.fic).toBe(slugOf(fic.title)); // Learning looks up reports by extracted title, not upload filename.
 for(const r of fic.readings){
  if(r.training==='withheld'){expect(r.training).toBe('withheld');expect(provenance.answers.some((a:any)=>a.key===r.key)).toBe(false);continue;}
  expect(r.confidence).toBeGreaterThanOrEqual(.95);expect(['correct','wrong']).toContain(r.verdict);
  const pool=r.verdict==='correct'?set.entries:set.negatives;
  const entries=pool.filter((e:any)=>e.h===r.reportHash&&e.via===baseVia(r.claim.pattern));
  expect(entries).toHaveLength(1);expect(weightOf(entries[0])).toBe(.9);expect(entries[0].source).toBe('chatgpt');
  expect(entries[0].reviewerConfidence).toBe(r.confidence);expect(sameReportedPeople(entries[0],r.claim)).toBe(true);
  const reviewed=claims.get(r.key);expect(reviewed).toBeTruthy();
  if(!reviewed)throw new Error(`Missing reviewed claim: ${r.id}`);
  expect(sameClaim(reviewed,r.claim)).toBe(true);expect(existing.has(r.key)).toBe(false);
  expect(entries[0].card).not.toBe('vibe');
  if(r.verdict==='wrong'){expect(entries[0].misread).toBe(true);expect(set.entries.some((e:any)=>e.h===r.reportHash&&e.via===baseVia(r.claim.pattern))).toBe(false);}
 }
 for(const a of fic.acts)expect(a.paragraphHashes).toHaveLength(a.to-a.from+1);
 }
 expect(provenance.answers).toHaveLength(data.fics.reduce((n:number,f:any)=>n+f.counts.imported,0));
 expect(data.excluded.map((x:any)=>x.file).sort()).toEqual(['There_Are_No_Gays_in.pdf','frequently_secretly_fond.html']);
});
for(const fic of data.fics)describe.skipIf(!process.env.AO3_DIR)(`${fic.title} private source replay`,()=>{
 it('replays the exact accepted claim identities and hashes every inventory paragraph',()=>{
  const bytes=readFileSync(join(process.env.AO3_DIR!,fic.file));const sha=createHash('sha256').update(bytes).digest('hex');expect(sha).toBe(fic.sourceSha);
  const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16)};
  const work=extractFromHtml(bytes.toString()),found=new Map<string,any[]>();
  analyzeWithPatterns(work.text,work.meta,{quiet:true,audit:h=>{const key=`${h.via}#${hash(h.sentence)}`;found.set(key,[...(found.get(key)??[]),claimOf(h,fic.file,sha)])}});
  for(const r of fic.readings.filter((r:any)=>r.training==='right-set'))expect(found.get(r.key)?.some(h=>sameClaim(h,r.claim)),r.id).toBe(true);
  const paras=reviewParagraphs(bytes.toString());expect(paras).toHaveLength(fic.paragraphs);
  expect(createHash('sha256').update(paras.join('\n')).digest('hex')).toBe(fic.paragraphSha);
  for(const a of fic.acts)expect(paras.slice(a.from,a.to+1).map(hash)).toEqual(a.paragraphHashes);
 },900000);
});
