// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// A wish, a plan or an expected event is not the act. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),META,{quiet:true,audit:h=>hits.push(h)});return hits;};
const act=(hits:AuditHit[],cat:string)=>hits.filter(h=>h.kind==='act'&&h.cat===cat);
describe('a hint from a wish is not the gesture',()=>{
 it.each([
  ['Morgan’s eyes were dark with lust, which made Rowan want to hike his knees up and present his ass to him.',/presenting|present/],
  ['Rowan wanted Morgan to bend him over the arm of the sofa and bury his cock inside him.',/bending/],
  ['Morgan’s anger rolled off him in waves, making Rowan want to kneel between his thighs and beg forgiveness.',/kneeling/],
  ['Morgan kissed Rowan hard. Rowan felt calm authority rolling off Morgan like a drug that made him want to kneel between Morgan’s thighs.',/kneeling/],
  ['Morgan’s hands on him made Rowan want to bend over, show him his hole leaking come and beg for more.',/leaking/],
 ])('%s',(text,what)=>{
  expect(run(text).filter(h=>what.test(h.act)&&h.a)).toEqual([]);
 });
 it('keeps the gesture when the wish is a separate clause or sentence',()=>{
  expect(run('Morgan kissed Rowan hard. Rowan wanted to see him come, so he knelt between Morgan’s thighs.').some(h=>/kneeling/.test(h.act))).toBe(true);
  expect(run('Morgan kissed Rowan hard. Rowan wanted more. Morgan pushed him down and knelt between his thighs.').some(h=>/kneeling/.test(h.act))).toBe(true);
 });
});
describe('a wish to protect, or "long enough to", still shows the dynamic',()=>{
 it('keeps a protecting hint when the wish is to protect',()=>{
  expect(run('Morgan just wants to protect Rowan, and curls around him to shield him from the world.').some(h=>h.via.startsWith('dom-protect'))).toBe(true);
 });
 it('does not treat "long enough to" as a wish',()=>{
  expect(run('Morgan pulled away just long enough to grab their shirts, then carried Rowan to the bed.').some(h=>h.kind!=='act'&&/carry|carrying/.test(h.act))).toBe(true);
 });
});
describe('an expected, planned or not-yet act is not anal sex',()=>{
 it.each([
  'Rowan knew it wouldn’t stop until Morgan sank into him and fucked him hard.',
  'Rowan had dreaded the evening, and now he was expected to get fucked for his dinner.',
  'Rowan told Morgan not to wait up because he planned to get railed that night.',
 ])('%s',text=>{
  expect(act(run(text),'anal').filter(h=>/anal sex/.test(h.act))).toEqual([]);
 });
 it('does not read a purpose clause as fingering',()=>{
  expect(act(run('Morgan restrained Rowan so he could get what he needed to open Rowan up and get him ready.'),'anal').filter(h=>h.act==='fingering')).toEqual([]);
 });
 it.each([
  'Morgan fucked Rowan hard, and Rowan knew it wouldn’t stop until morning.',
  'Morgan fucked Rowan hard until Rowan came.',
  'Morgan pushed into Rowan and fucked him hard.',
 ])('still reads a real act: %s',text=>{
  expect(act(run(text),'anal').filter(h=>/anal sex/.test(h.act)).length).toBeGreaterThan(0);
 });
});
