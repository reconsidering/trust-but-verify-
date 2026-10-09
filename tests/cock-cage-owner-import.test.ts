import{readFileSync,readdirSync}from'node:fs';import{expect,it}from'vitest';
import{claimOf,reviewedClaims,sameClaim}from'../scripts/reviewed-claims.mjs';
import{replayInventories}from'../scripts/replay-scene-reviews.mjs';
const prefix='zz-owner-cock-cages-6b83b511ef25-';
const imports=readdirSync('tests/labels').filter(f=>f.startsWith(prefix)).map(f=>JSON.parse(readFileSync('tests/labels/'+f,'utf8')));
const inventory=readdirSync('tests/scene-review').filter(f=>f.startsWith('cock-cages-6b83b511ef25-')).map(f=>JSON.parse(readFileSync('tests/scene-review/'+f,'utf8')));
const index=JSON.parse(readFileSync('public/review/cock-cage-index.json','utf8'));
const manifests=index.fics.map((f:{manifest:string})=>JSON.parse(readFileSync('public/review/'+f.manifest,'utf8')));
it('accepts only explicit versioned decisions, quarantines uncertainty, and leaves the two unanswered fics untouched',()=>{
 const identities=reviewedClaims(process.cwd()),counts={ok:0,wrong:0,unclear:0};
 expect(imports).toHaveLength(6);
 for(const imported of imports){const batch=manifests.find((b:any)=>b.batchId===imported.batchId)!;
  expect(batch).toBeDefined();expect(imported.feedbackSha).toBe('6b83b511ef2551b38cb5ea80c5da7bfc281c79796e615b288e953f1d94e82546');
  expect(imported.engineCommit).toBe(batch.engineCommit);
  for(const a of imported.answers){const r=batch.readings.find((r:any)=>r.id===a.id);expect(r).toBeDefined();expect(a.key).toBe(r.key);expect(a.claim).toEqual(claimOf(r,r.fic,batch.source.sourceSha));expect(a).not.toHaveProperty('context');}
  for(const[key,value]of Object.entries(imported.labels)){counts[value as keyof typeof counts]++;if(value==='unclear'){expect(imported.superseded[key]).toBeDefined();expect(identities.get(key)).toBeNull();}else{expect(imported.superseded[key]).toBeUndefined();const a=imported.answers.find((a:any)=>a.key===key)!;expect(sameClaim(identities.get(key)!,a.claim)).toBe(true);expect(value).toBe(a.verdict==='correct'?'ok':'wrong');}}
 }
 expect(imports.flatMap(i=>i.answers).filter(a=>a.verdict==='correct')).toHaveLength(68);
 expect(imports.flatMap(i=>i.answers).filter(a=>a.verdict==='wrong')).toHaveLength(10);
 expect(imports.filter(i=>i.ambiguousReadingKeys.includes('chastity-wearer#3f2c8de4'))).toHaveLength(2);
 expect(counts).toEqual({ok:68,wrong:8,unclear:14});
 for(const name of ['innocent-until','nazarene'])expect(imports.some(i=>i.batchId.includes('cock-cages-'+name+'-'))).toBe(false);
});
it('stores device events separately from sex acts, preserving memory and declined wearing as context only',()=>{
 let deviceEvents=0,manualEvents=0,contextOnly=0;
 for(const i of inventory){expect(i.scope.coverage).toContain('positive-only');expect(i.feedbackSha).toBe(imports[0].feedbackSha);
  for(const w of i.windows){expect(w.coverage).toBe('positive-only');expect(w.coverageReviewed).toBe(false);
   for(const review of w.reviews){if(review.occurrence!=='performed'){contextOnly++;expect(w.events.some((e:any)=>e.ownerActId===review.id)).toBe(false);}}
   for(const e of w.events){const review=w.reviews.find((r:any)=>r.id===e.ownerActId)!;expect(review).toMatchObject({verdict:'correct',occurrence:'performed',act:e.act,performer:e.performer,receiver:e.receiver});if(e.act.startsWith('Chastity')){deviceEvents++;expect(e.scored).toBe(false);}else{manualEvents++;expect(e.act).toBe('Handjob');expect(e.scored).toBe(true);}}
  }
 }
 expect({deviceEvents,manualEvents,contextOnly}).toEqual({deviceEvents:25,manualEvents:1,contextOnly:2});
 // Device inventory entries never become anal-sex misses during replay.
 expect(replayInventories(inventory,new Map()).results).toHaveLength(1);
});
