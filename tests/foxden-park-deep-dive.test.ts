import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {baseVia,slugOf,weightOf,type RightSet} from '../scripts/right-set.mjs';
import {claimOf,reviewedClaims,sameClaim,sameReportedPeople} from '../scripts/reviewed-claims.mjs';
import {extractFromHtml} from '../src/extract';
import {analyzeWithPatterns} from '../src/heuristic';

const root=join(__dirname,'..');
const data=JSON.parse(readFileSync(join(__dirname,'scene-review/chatgpt-foxden-park-deep-dive.json'),'utf8'));
const provenance=JSON.parse(readFileSync(join(__dirname,'labels/chatgpt-foxden-park-claims.json'),'utf8'));
for (const fic of data.fics) {
const set:RightSet=JSON.parse(readFileSync(join(__dirname,'right-set',slugOf(fic.title)+'.json'),'utf8'));
const accepted=fic.readings.filter((r:any)=>r.training==='right-set');

describe(`${fic.title}: label provenance and full coverage`,()=>{
  it('covers every paragraph and every audit reading of the eligible work',()=>{
    expect(data.fics).toHaveLength(1);
    const covered=fic.readCoverage.flatMap((r:any)=>Array.from({length:r.to-r.from+1},(_,i)=>r.from+i));
    expect(covered).toEqual(Array.from({length:fic.paragraphs},(_,i)=>i));
    expect(fic.readings).toHaveLength(fic.counts.correct+fic.counts.wrong+fic.counts.uncertain);
    expect(new Set(fic.readings.map((r:any)=>r.id)).size).toBe(fic.readings.length);
    expect(data.excluded.map((f:any)=>f.file).sort()).toEqual(['dog_teeth.pdf']);
    for(const r of fic.readings){
      expect(r.claim.sourceSha).toBe(fic.sourceSha);expect(r.claim.fic).toBe(fic.file);
      expect(r.claim.paragraph).toBeGreaterThanOrEqual(0);expect(r.claim.paragraph).toBeLessThan(fic.paragraphs);
      if(r.confidence<.95||r.verdict==='uncertain')expect(r.training).toBe('withheld');
      if(r.engineConfidence!==null){expect(r.engineConfidence).toBeGreaterThan(0);expect(r.engineConfidence).toBeLessThan(1);}
    }
  });
  it('keeps qualifying labels fractional and bound to their exact claims',()=>{
    expect(data.minimumReviewerConfidence).toBe(.95);expect(provenance.labels).toEqual({});
    expect(provenance.answers).toHaveLength(data.fics.reduce((n:number,f:any)=>n+f.counts.imported,0));expect(accepted.length).toBe(fic.counts.imported);
    const claims=reviewedClaims(root);
    for(const r of accepted){
      expect(r.confidence).toBeGreaterThanOrEqual(.95);
      const pool=r.verdict==='correct'?set.entries:set.negatives??[];
      const matching=pool.filter(e=>e.h===r.reportHash&&e.via===baseVia(r.claim.pattern));
      expect(matching).toHaveLength(1);expect(matching[0].source).toBe('chatgpt');
      expect([.9,.3]).toContain(weightOf(matching[0]));expect(matching[0].reviewerConfidence).toBe(r.confidence);
      expect(sameReportedPeople(matching[0],r.claim)).toBe(true);expect(sameClaim(claims.get(r.key)!,r.claim)).toBe(true);
      if(r.verdict==='wrong')expect(matching[0].misread).toBe(true);
    }
    expect(set.fic).toBe(slugOf(fic.title));
  });
  it('protects previous audit labels and keeps recall evidence separate from confidence rows',()=>{
    const existing=new Set<string>();
    for(const file of readdirSync(join(__dirname,'labels')).filter(f=>f.endsWith('.json'))){
      const old=JSON.parse(readFileSync(join(__dirname,'labels',file),'utf8'));for(const key of Object.keys(old.labels??{}))existing.add(key);
    }
    for(const answer of provenance.answers)expect(existing.has(answer.key)).toBe(false);
    for(const act of fic.acts){
      expect(act.paragraphHashes).toHaveLength(act.to-act.from+1);
      if(act.confidence<.95)expect(act.labelEligible).toBe(false);
      if(act.gapScope==='candidate-additional-act'){expect(act.occurrence).toBe('performed');expect(act.confidence).toBeGreaterThanOrEqual(.95);}
    }
    expect(fic.acts.filter((a:any)=>a.gapScope==='candidate-additional-act')).toHaveLength(fic.counts.candidateMissedActs);
  });

});

describe.skipIf(!process.env.AO3_DIR)(`${fic.title}: accepted raw claim replay`,()=>{
  it('finds every accepted judgment as exactly the reviewed claim',()=>{
    const bytes=readFileSync(join(process.env.AO3_DIR!,fic.file));
    const sourceSha=createHash('sha256').update(bytes).digest('hex');expect(sourceSha).toBe(fic.sourceSha);
    const work=extractFromHtml(bytes.toString()),found=new Map();
    const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16)};
    analyzeWithPatterns(work.text,work.meta,{quiet:true,audit:h=>found.set(`${h.via}#${hash(h.sentence)}`,claimOf(h,fic.file,sourceSha))});
    for(const r of accepted){expect(found.has(r.key),r.id).toBe(true);expect(sameClaim(found.get(r.key),r.claim),r.id).toBe(true);}
  },900_000);
});

}
