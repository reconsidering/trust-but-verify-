import{describe,it,expect}from'vitest';import{emptyMeta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// Invented adults. Coming untouched, or from the prostate alone, marks the one who comes as the receiving partner: a hint, not an act.
const meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];const result=analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text,meta,{quiet:true,audit:h=>hits.push(h)});return{hits,pair:result.pairings[0]};};
const orgasm=(h:AuditHit)=>h.act==='hands-free orgasm'||h.act==='prostate orgasm';
describe('hands-free and prostate orgasms',()=>{
 it.each([
  ['Morgan fucked Rowan slowly. Rowan came untouched, clenching around Morgan’s cock.','hands-free orgasm'],
  ['Morgan fucked Rowan hard. Rowan came untouched.','hands-free orgasm'],
  ['Morgan’s cock was buried in Rowan. Rowan came without Morgan ever touching his cock.','hands-free orgasm'],
  ['Morgan fucked him hard and Rowan came hands-free.','hands-free orgasm'],
  ['Morgan pressed into Rowan’s ass and made Rowan come untouched.','hands-free orgasm'],
  ['Morgan fucked Rowan slowly. Rowan came just from Morgan’s cock.','hands-free orgasm'],
  ['Morgan worked two fingers into Rowan’s hole. Rowan came on Morgan’s fingers alone.','hands-free orgasm'],
  ['Rowan came just from being fucked.','hands-free orgasm'],
  ['Morgan thrust into Rowan’s hole. Rowan’s untouched cock spilled between them.','hands-free orgasm'],
  ['Morgan kept pressing on his prostate until Rowan came untouched.','hands-free orgasm'],
  ['Rowan had a prostate orgasm.','prostate orgasm'],
  ['Rowan came from his prostate alone, gasping.','prostate orgasm'],
 ])('credits the one who comes as the receiving partner: %s',(text,act)=>{
  const{hits,pair}=run(text);
  const found=hits.filter(orgasm);
  expect(found.length).toBeGreaterThan(0);
  expect(found[0]).toMatchObject({kind:'body',act,role:'bottom',a:'Rowan Marsh',b:'Morgan Vale'});
  expect(pair.anal.desires.some(d=>d.act===act&&d.who==='Rowan Marsh'&&d.role==='bottom')).toBe(true);
  // A hint never adds an anal scene of its own.
  expect(hits.filter(h=>h.kind==='act'&&orgasm(h))).toEqual([]);
 });
 it('follows the pair: whoever is being fucked is the one who comes untouched',()=>{
  expect(run('Morgan fucked Rowan. He came untouched.').hits.find(orgasm)).toMatchObject({a:'Rowan Marsh',role:'bottom'});
  expect(run('Rowan fucked Morgan hard. Morgan came untouched.').hits.find(orgasm)).toMatchObject({a:'Morgan Vale',role:'bottom'});
 });
 it.each([
  'Rowan came back untouched from the war.',
  'Morgan fucked Rowan. Rowan wanted to come untouched.',
  'Morgan fucked Rowan. Rowan had never come untouched before.',
  'Morgan fucked Rowan. Morgan wanted to make Rowan come untouched.',
  'Morgan fucked Rowan. Rowan imagined coming untouched.',
  'Morgan fucked Rowan. If Rowan came untouched, Morgan would win the bet.',
  'Morgan fucked Rowan slowly. Rowan came on Morgan’s cock, moaning.',
  'Rowan came just from Morgan’s cock.',
  'Morgan kissed Rowan’s neck and Rowan came untouched in his jeans.',
  'Morgan fucked Rowan’s pussy hard. Rowan came untouched.',
 ])('is not read from a wish, a negation, a non-sexual use or an orgasm with nothing anal nearby: %s',text=>{
  expect(run(text).hits.filter(orgasm)).toEqual([]);
 });
});
describe('a fantasy-driven orgasm',()=>{
 it('is not a hands-free anal orgasm: coming untouched while thinking about a mouth',()=>{
  expect(run('Morgan fucked Rowan once, weeks ago.||Rowan came untouched, thinking about Morgan’s mouth on him.').hits.filter(orgasm)).toEqual([]);
 });
});
