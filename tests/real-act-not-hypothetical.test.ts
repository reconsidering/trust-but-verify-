// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// A real act that was read as hypothetical, fantasy or wished-for. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),META,{quiet:true,audit:h=>hits.push(h)});return hits;};
const real=(hits:AuditHit[],cat:string)=>hits.filter(h=>h.kind==='act'&&h.cat===cat);
describe('“forgetting what it means to suck” while sucking',()=>{
 it('is the act',()=>{
  expect(real(run('Rowan wrapped his lips around the piercing, sucking gently, the barbell cool against his tongue.||He was lost in the rush of it, forgetting what it means to suck Morgan’s cock, and taste him.'),'oral').length).toBeGreaterThan(0);
 });
 it('is still not an act when he only wonders',()=>{
  expect(real(run('Rowan wondered all day what it means to suck Morgan’s cock.'),'oral')).toEqual([]);
 });
});
describe('a purpose clause inside a running scene is the act',()=>{
 const scene='Morgan thrust deep inside Rowan, slow and hard.||“I love your cock.” Rowan loved the feel of the hard steel inside him with every stroke.||';
 it('“holding him in place so he can grind inside”',()=>{
  expect(real(run(scene+'Morgan gripped Rowan’s hips in a bruising hold, holding him in place so he can grind his cock inside Rowan.'),'anal').filter(h=>h.sentence.includes('holding him in place')).length).toBeGreaterThan(0);
 });
 it('stays hypothetical when no scene is running',()=>{
  expect(real(run('Morgan gripped Rowan’s hips and said he would hold him in place so he can grind his cock inside Rowan.'),'anal').filter(h=>h.sentence.includes('hold him in place'))).toEqual([]);
 });
});
describe('“as though it wasn’t happening” says it is',()=>{
 it('a knot that is locked, ignored by a visitor',()=>{
  expect(real(run('Morgan’s knot was locked inside Rowan, and neither could move.||Her gaze drifted over the chaos of the room, as though Morgan’s knot wasn’t locked inside Rowan, leaving them at her mercy.'),'anal').filter(h=>h.sentence.includes('as though')).length).toBeGreaterThan(0);
 });
});
describe('a dream fulfilled is not a fantasy',()=>{
 it('“her dream … was fulfilled” in the same paragraph',()=>{
  expect(real(run('Morgan didn’t take his time, immediately pushing his cock in Rowan’s ass. And just like that, Rowan’s dream of being taken in this elevator was fulfilled.'),'anal').length).toBeGreaterThan(0);
 });
 it('a plain dream is still a fantasy',()=>{
  expect(real(run('Rowan dreamed that Morgan pushed his cock in Rowan’s ass in the elevator.'),'anal')).toEqual([]);
 });
});
describe('a wish earlier in a long sentence does not turn the later act into a wish',()=>{
 it('“wanting to see …, only to be … as he lines up and pushes in”',()=>{
  expect(real(run('He hears Morgan spit, and then a few squelching noises.||Rowan tries to look behind him, suddenly wanting to see Morgan lube his cock, only to be welcomed by a hand cupping his jaw and Morgan kissing him as he lines up his cock on Rowan’s hole and pushes in hard and slow and deep.'),'anal').length).toBeGreaterThan(0);
 });
 it('still a wish when the second verb is the wish',()=>{
  expect(real(run('Rowan wanted to kneel and suck Morgan’s cock.'),'oral')).toEqual([]);
 });
});
