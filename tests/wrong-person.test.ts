// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// Readings credited to the wrong person. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),META,{quiet:true,audit:h=>hits.push(h)});return hits;};
const base=(h:AuditHit)=>h.via.replace(/~elided$/,'');
const by=(hits:AuditHit[],id:string)=>hits.filter(h=>base(h)===id);
describe('“catches him looking at his cock”: the one caught is the one looking',()=>{
 it('credits the looker, not the one caught',()=>{
  const h=by(run('Morgan opened his jeans and stripped down, the bulge in his briefs plain to see. Morgan catches him looking at his cock.'),'ogle-crotch');
  expect(h.length).toBeGreaterThan(0);expect(h.filter(x=>x.a==='Morgan Vale')).toEqual([]);
 });
});
describe('“for his knot”: the knot is the one being wanted',()=>{
 it('is not the wanting person’s',()=>{
  expect(by(run('Rowan surrendered to the haze. He lives only for Morgan, for his knot to lock them together.'),'knot-owner').filter(h=>h.a==='Rowan Marsh')).toEqual([]);
 });
});
describe('“no matter how many times he jerks off” is a habit',()=>{
 it('is not a new act',()=>{
  expect(by(run('Rowan felt more himself the next day. No matter how many times he jerks off, it does nothing to relieve the pressure.'),'mast-word')).toEqual([]);
 });
 it('a plain jerking off is still read',()=>{
  expect(by(run('Rowan jerks off in the shower, biting his lip.'),'mast-word').length).toBeGreaterThan(0);
 });
});
describe('an elided subject after “because he wants” is that “he”',()=>{
 it('adds no second reading for the elided one',()=>{
  expect(by(run('His cock pressed against his jeans, picturing Morgan gripping the base because he desperately wants to fuck Rowan.'),'fuck').filter(h=>h.via.endsWith('~elided'))).toEqual([]);
 });
});
describe('a wish by someone unnamed is not the thinker’s act',()=>{
 it('“wondering who would come over and fuck him”',()=>{
  expect(by(run('Rowan scrolls through his contacts, wondering who would come over and fuck him at this late hour.'),'fuck').filter(h=>h.a==='Rowan Marsh')).toEqual([]);
 });
 it('a named wish is still read',()=>{
  expect(by(run('Morgan wants to fuck Rowan, slow and deep.'),'fuck').length).toBeGreaterThan(0);
 });
});
describe('his own fingers into his own mouth',()=>{
 it('is not the partner’s',()=>{
  expect(by(run('Rowan stares at Morgan. His fingers brush against the fabric and the cum on Morgan’s pants, and before he can think about it, he shoves his fingers into his mouth.'),'fingers-into-mouth').filter(h=>h.a==='Morgan Vale')).toEqual([]);
 });
});
describe('a named sucker’s bare “his fingers” are his own',()=>{
 it('is not the partner’s fingers',()=>{
  expect(by(run('Morgan stood frozen, eyes glowing. He watches Rowan suck on his cum-covered fingers in shock.'),'suck-fingers').filter(h=>h.a==='Rowan Marsh')).toEqual([]);
 });
});
describe('a bare oral clause is about the one named in the sentence',()=>{
 const meta:Ao3Meta={...META,relationships:['Morgan Vale/Rowan Marsh','Avery Lane/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh','Avery Lane']};
 it('credits the named partner, not the last person mentioned',()=>{
  const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan and Avery are adult men.\n\nRowan knelt between Morgan’s thighs, sucking him hard. Avery waved from the doorway. He swallows eagerly, delighted Morgan lets him use his mouth in a different way, delighted he wants Rowan enough to let go.',meta,{quiet:true,audit:h=>hits.push(h)});
  const o=hits.filter(h=>h.cat==='oral'&&h.kind==='act'&&h.sentence.includes('swallows'));
  expect(o.length).toBeGreaterThan(0);expect(o.filter(h=>h.a==='Avery Lane'||h.b==='Avery Lane')).toEqual([]);
 });
});
