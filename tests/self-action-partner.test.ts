// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// A motion that belongs to the person themself must not be credited to the partner. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),META,{quiet:true,audit:h=>hits.push(h)});return hits;};
const via=(hits:AuditHit[],id:string)=>hits.filter(h=>h.via===id||h.via===id+'~elided');
describe('"made him spread his legs" is his own legs',()=>{
 it('is not someone spreading them',()=>{
  expect(via(run('Morgan turned Rowan down with a smile. A thrill under his skin made him spread his legs wide in invitation.'),'spread-their-legs')).toEqual([]);
 });
 it.each([
  'Morgan shoved Rowan down and spread Rowan’s legs wide.',
 ])('still reads a partner spreading legs: %s',text=>{
  expect(via(run(text),'spread-their-legs').length).toBeGreaterThan(0);
 });
});
describe('a squeeze after his own muscles tense is his own',()=>{
 it('is not grabbing the partner’s ass',()=>{
  expect(via(run('Morgan stood behind him, waiting. Rowan flexed his muscles, squeezing his ass cheeks with a whimper of need.'),'grab-ass')).toEqual([]);
 });
 it('still reads a squeeze after a kiss',()=>{
  expect(via(run('Morgan kissed Rowan hard, squeezing his ass.'),'grab-ass').length).toBeGreaterThan(0);
 });
});
describe('his own cock in his own hand is not a handjob for the partner',()=>{
 it.each([
  '“Oh, fuck.” His cock pressed against his jeans, picturing Morgan gripping his knotted cock between his fingers because he badly wanted to fuck Rowan.',
  'Rowan rubbed his cock under the sheet, egged on by Morgan’s orders.',
  'Rowan stroked his cock for Morgan, slow and shameless.',
 ])('%s',text=>{
  expect(via(run(text),'hj-stroke')).toEqual([]);
 });
 it.each([
  'Morgan pushed Rowan down onto the bed and gripped his swollen cock between his fingers.',
  'Morgan knelt over Rowan and rubbed his cock under the sheet, egged on by Rowan’s moans.',
  'Morgan stroked Rowan’s cock slowly.',
 ])('still reads a handjob: %s',text=>{
  expect(via(run(text),'hj-stroke').length).toBeGreaterThan(0);
 });
});
