// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// Readings credited to the wrong person that needed their own wording. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),META,{quiet:true,audit:h=>hits.push(h)});return hits;};
const oral=(hits:AuditHit[])=>hits.filter(h=>h.cat==='oral'&&h.kind==='act');
describe('“when he feels him blow on his cock”: the other man does the blowing',()=>{
 it('the one who feels it is the one being stimulated',()=>{
  const o=oral(run('Rowan tightens his grip in Morgan’s hair when he feels him blow on his cock.'));
  expect(o.length).toBeGreaterThan(0);expect(o.filter(h=>h.a!=='Rowan Marsh')).toEqual([]);
 });
});
describe('“watching Morgan manipulate his mouth over his hard cock”',()=>{
 it('the mouth is Morgan’s and the cock is Rowan’s',()=>{
  const o=oral(run('Rowan’s eyes sweep down his own flushed body, watching Morgan manipulate his mouth over his hard cock.'));
  expect(o.length).toBeGreaterThan(0);expect(o.filter(h=>h.a!=='Rowan Marsh')).toEqual([]);
 });
});
