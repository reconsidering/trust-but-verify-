import {describe,it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {cacheFingerprint,claimOf,sameClaim,validRowsCache,reviewedClaims} from '../scripts/reviewed-claims.mjs';
const hit={via:'insert',para:3,act:'anal sex',kind:'act',a:'Morgan',b:'Rowan'};
describe('reviewed claim identity and extraction cache',()=>{
 it('does not apply a rejected penis reading to corrected finger or reversed-person readings',()=>{
  const original=claimOf(hit,'adults.html','source');
  expect(sameClaim(original,claimOf(hit,'adults.html','source'))).toBe(true);
  for(const change of [{act:'fingering'},{a:'Rowan',b:'Morgan'},{kind:'hypothetical'},{para:4}]) expect(sameClaim(original,claimOf({...hit,...change},'adults.html','source'))).toBe(false);
  expect(sameClaim(original,claimOf(hit,'adults.html','new-source'))).toBe(false);
 });
 it('recovers old batch identities without rewriting the owner decisions',()=>{
  const claims=reviewedClaims(join(__dirname,'..'));
  expect(claims.get('hj-stroke#51d6834e')).toBeNull();
  expect([...claims.values()].filter(Boolean).length).toBeGreaterThan(100);
  expect([...claims.values()].some(c=>c?.act==='fingering')).toBe(true);
 });
 it('invalidates same-length features and changed labels, while repeated extraction reuses its fingerprint',()=>{
  const dir=mkdtempSync(join(tmpdir(),'review-cache-'));const p=join(dir,'labels.json');
  try {
   writeFileSync(p,'{"review":"wrong"}');const f=cacheFingerprint([p],['named']);
   const rows=[{key:'insert#hash',fic:'adults.html',y:0,wt:1,f:[1]}];
   expect(validRowsCache({schema:'engine-learning-rows/v2',fingerprint:f,rows},cacheFingerprint([p],['named']),1)).toBe(true);
   expect(validRowsCache(rows,f,1)).toBe(false);
   expect(cacheFingerprint([p],['pronoun'])).not.toBe(f);
   writeFileSync(p,'{"review":"ok"}');expect(cacheFingerprint([p],['named'])).not.toBe(f);
   expect(validRowsCache({schema:'engine-learning-rows/v2',fingerprint:f,rows:[{...rows[0],f:[NaN]}]},f,1)).toBe(false);
  } finally {rmSync(dir,{recursive:true,force:true});}
 });
});
