import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {baseVia,slugOf,strengthOf,weightOf,type RightSet} from '../scripts/right-set.mjs';
import {claimOf,reviewedClaims,sameClaim,sameReportedPeople} from '../scripts/reviewed-claims.mjs';
import {extractFromHtml} from '../src/extract';
import {analyzeWithPatterns} from '../src/heuristic';

const root=join(__dirname,'..');
const data=JSON.parse(readFileSync(join(__dirname,'scene-review/chatgpt-five-fic-deep-dives.json'),'utf8'));
const provenance=JSON.parse(readFileSync(join(__dirname,'labels/chatgpt-five-fic-deep-dives-claims.json'),'utf8'));
const sets:RightSet[]=readdirSync(join(__dirname,'right-set')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(__dirname,'right-set',f),'utf8')));

describe('five-fic deep dives: training provenance and coverage',()=>{
  it('covers every detected claim and every paragraph of the three eligible works',()=>{
    expect(data.fics.map((f:any)=>f.file).sort()).toEqual(['bluebells.html','dogbird.html','were-compeer.html']);
    for(const f of data.fics){
      const covered=new Set<number>();
      for(const r of f.readCoverage)for(let p=r.from;p<=r.to;p++)covered.add(p);
      expect([...covered].sort((a,b)=>a-b)).toEqual(Array.from({length:f.paragraphs},(_,i)=>i));
      expect(f.readings.length).toBe(f.counts.correct+f.counts.wrong+f.counts.uncertain);
      expect(new Set(f.readings.map((r:any)=>r.id)).size).toBe(f.readings.length);
      for(const r of f.readings){
        expect(r.claim.fic).toBe(f.file);expect(r.claim.sourceSha).toBe(f.sourceSha);
        expect(r.claim.paragraph).toBeGreaterThanOrEqual(0);expect(r.claim.paragraph).toBeLessThan(f.paragraphs);
        expect(r.weight).toBe(0.9);expect(r.confidence).toBeGreaterThan(0);expect(r.confidence).toBeLessThanOrEqual(1);
        if(r.verdict==='uncertain')expect(r.training).toBe('withheld');
      }
      for(const a of f.acts){expect(a.weight).toBe(0.9);expect(a.paragraphHashes.length).toBe(a.to-a.from+1)}
    }
    expect(data.excluded.map((f:any)=>f.file).sort()).toEqual(['Negotiation.html','Strawberry_Mama.html']);
  });
  it('keeps the audit-label path empty so each accepted judgment retains its fractional weight',()=>{
    expect(provenance.labels).toEqual({});
    const claims=reviewedClaims(root);
    const accepted=data.fics.flatMap((f:any)=>f.readings.filter((r:any)=>r.training==='right-set').map((r:any)=>({f,r})));
    expect(accepted.length).toBeGreaterThan(0);expect(provenance.answers.length).toBe(accepted.length);
    for(const {f,r} of accepted){
      const set=sets.find(s=>s.fic===slugOf(f.title))!;
      const pool=r.verdict==='correct'?set.entries:set.negatives??[];
      const entries=pool.filter(e=>e.source==='chatgpt'&&e.via===baseVia(r.claim.pattern)&&e.h===r.reportHash);
      expect(entries).toHaveLength(1);
      expect(weightOf(entries[0])).toBe(0.9);
      expect(sameReportedPeople(entries[0],r.claim)).toBe(true);
      expect(sameClaim(claims.get(r.key)!,r.claim)).toBe(true);
      if(r.verdict==='correct')expect(strengthOf(entries[0])).toBe('weighted');
      else{expect(entries[0].misread).toBe(true);expect(set.entries.some(e=>e.via===entries[0].via&&e.h===entries[0].h)).toBe(false)}
    }
  });
  it('does not overwrite earlier audit judgments or archive human right-set judgments',()=>{
    const existing=new Set<string>();
    for(const file of readdirSync(join(__dirname,'labels')).filter(f=>f.endsWith('.json'))){
      const v=JSON.parse(readFileSync(join(__dirname,'labels',file),'utf8'));for(const key of Object.keys(v.labels??{}))existing.add(key);
    }
    for(const answer of provenance.answers)expect(existing.has(answer.key)).toBe(false);
    for(const old of data.priorAutomatedEntries){expect(old.entry.source).not.toBe('owner');expect(weightOf(old.entry)).toBeLessThan(1);expect(old.entry.retired).toBeFalsy()}
  });
  it('rejects a future act or participant change rather than reusing the old judgment',()=>{
    const original={fic:'adult-example.html',sourceSha:'made-up-source',paragraph:4,pattern:'push-into',act:'anal sex',kind:'act',a:'Morgan',b:'Rowan',role:''};
    expect(sameClaim(original,{...original,act:'fingering'})).toBe(false);
    expect(sameClaim(original,{...original,a:'Rowan',b:'Morgan'})).toBe(false);
    expect(sameClaim(original,{...original,kind:'wanted'})).toBe(false);
  });
});

describe.skipIf(!process.env.AO3_DIR)('five-fic deep dives: accepted claim replay',()=>{
  it('finds every new weighted judgment as exactly the reviewed raw claim',()=>{
    const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16)};
    for(const f of data.fics){
      const bytes=readFileSync(join(process.env.AO3_DIR!,f.file));
      const sourceSha=createHash('sha256').update(bytes).digest('hex');
      expect(sourceSha).toBe(f.sourceSha);
      const work=extractFromHtml(bytes.toString());
      const found=new Map();
      analyzeWithPatterns(work.text,work.meta,{quiet:true,audit:h=>found.set(`${h.via}#${hash(h.sentence)}`,claimOf(h,f.file,sourceSha))});
      for(const r of f.readings.filter((r:any)=>r.training==='right-set')){
        expect(found.has(r.key),r.id).toBe(true);
        expect(sameClaim(found.get(r.key),r.claim),r.id).toBe(true);
      }
    }
  },900_000);
});
