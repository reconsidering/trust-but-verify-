import{describe,it,expect}from'vitest';import{emptyMeta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// Invented adults. Coming untouched, or from the prostate alone, marks the one who comes as the receiving partner: a hint, not an act.
const meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];const result=analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),meta,{quiet:true,audit:h=>hits.push(h)});return{hits,pair:result.pairings[0]};};
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
// ── Negation that belongs to another clause, a scene that continues across paragraphs, and more ways of saying "without a touch" ──
const seen=(text:string)=>run(text).hits.filter(orgasm);
describe('a negation about something else does not cancel the orgasm',()=>{
 it.each([
  'Morgan fucked Rowan slowly.||Rowan couldn’t hold back and came untouched.',
  'Morgan fucked Rowan slowly.||Rowan can’t hold on, comes untouched all over his stomach.',
  'Morgan fucked Rowan slowly.||Rowan didn’t stand a chance; he came hands-free.',
  'Morgan fucked Rowan slowly.||Rowan, who never stayed quiet, came untouched.',
 ])('still reads: %s',text=>{expect(seen(text).length).toBeGreaterThan(0);});
 it.each([
  'Morgan fucked Rowan slowly.||Rowan didn’t come untouched.',
  'Morgan fucked Rowan slowly.||Rowan couldn’t come untouched, no matter how hard Morgan fucked him.',
  'Morgan fucked Rowan slowly.||Rowan hadn’t come untouched yet, and Morgan wanted it.',
  'Morgan fucked Rowan slowly.||Rowan never came untouched.',
 ])('a negation that governs the orgasm still cancels it: %s',text=>{expect(seen(text)).toEqual([]);});
});
describe('an ongoing anal scene carries across paragraphs',()=>{
 it('reads an orgasm a few paragraphs after the anal act, with no break between',()=>{
  expect(seen('Morgan fucked Rowan slowly.||The room was quiet.||Rain hit the window.||Morgan breathed out.||Rowan came untouched.').length).toBeGreaterThan(0);
 });
 it('does not carry across a scene break',()=>{
  expect(seen('Morgan fucked Rowan slowly.||***||Rowan came untouched.')).toEqual([]);
 });
 it('does not carry from an anal act that is far away',()=>{
  const gap=Array(12).fill('The night went on.').join('||');
  expect(seen(`Morgan fucked Rowan slowly.||${gap}||Rowan came untouched.`)).toEqual([]);
 });
 it('needs the same person: a different pair’s earlier scene does not count',()=>{
  const meta3={...meta,characters:['Morgan Vale','Rowan Marsh','Avery Lane'],relationships:['Morgan Vale/Rowan Marsh','Avery Lane/Quinn Hart']};
  const r=analyzeWithPatterns('Morgan, Rowan and Avery are adult men.\n\nMorgan fucked Rowan slowly.\n\nThe room was quiet.\n\nRain hit the window.\n\nAvery came untouched.',meta3,{quiet:true,audit:()=>{}});
  expect(r.pairings.length).toBeGreaterThan(0);
 });
});
describe('more ways to say nobody touched him',()=>{
 it.each([
  'Morgan fucked Rowan hard and Rowan came without any direct stimulation.',
  'Morgan fucked Rowan hard and Rowan came with no one touching his cock.',
  'Morgan fucked Rowan hard and Rowan came with his cock completely ignored.',
  'Morgan fucked Rowan hard and Rowan came, clenching around Morgan’s cock and moaning his name, completely untouched.',
  'Morgan fucked Rowan hard and Rowan didn’t need a hand on him to come.',
  'Morgan fucked Rowan hard and Rowan came from the fucking alone.',
  'Morgan fucked Rowan hard and Rowan came just from the stretch of Morgan’s knot.',
  'Morgan pressed on his prostate until Rowan came from nothing but the pressure on his prostate.',
 ])('reads: %s',text=>{expect(seen(text).length).toBeGreaterThan(0);});
 it.each([
  'Morgan fucked Rowan hard and Rowan came with Morgan’s hand wrapped around his cock.',
  'Morgan fucked Rowan hard and Rowan came, Morgan stroking him through it, completely untouched everywhere else.',
  'Morgan fucked Rowan hard and Rowan came without a sound.',
  'Morgan fucked Rowan hard and Rowan came after Morgan took off the cage and stroked him.',
  'Morgan fucked Rowan hard and Rowan came hard, hands gripping the sheets.',
 ])('is not read: %s',text=>{expect(seen(text)).toEqual([]);});
});
describe('orgasm while caged',()=>{
 it.each([
  'Morgan fucked Rowan slowly. Rowan came, still locked in his cage.',
  'Morgan fucked Rowan slowly. Rowan came in his cage, shuddering.',
  'Morgan fucked Rowan slowly. Rowan came while caged.',
 ])('reads: %s',text=>{expect(seen(text).length).toBeGreaterThan(0);});
 it.each([
  'Morgan fucked Rowan slowly. Morgan unlocked the cage and Rowan came in his hand.',
  'Rowan paced his room in his cage. Rowan came back late.',
  'Morgan kissed Rowan’s neck and Rowan came while caged in the shower.',
 ])('is not read: %s',text=>{expect(seen(text)).toEqual([]);});
});
describe('more real-world phrasings',()=>{
 it.each([
  'Rowan cums on cock without a touch to his dick.',
  'Rowan’s cock strained inside the cage as Morgan found his prostate, and then Rowan came, his cock erupting inside the cage.',
  'Morgan fucked Rowan hard. Morgan made Rowan cum without ever releasing his cock.',
  'Morgan fucked Rowan hard and Rowan came, to be at the mercy of Morgan without the attention being given to his cock.',
  'Morgan fucked Rowan hard and Rowan let the wave crash, his cock twitching untouched between them and spilling over their stomachs.',
  'Morgan fucked Rowan hard and Rowan was coming just from Morgan fucking him.',
 ])('reads: %s',text=>{expect(seen(text).length).toBeGreaterThan(0);});
 it.each([
  'Morgan fucked Rowan hard. Morgan, Rowan realizes, has just come completely untouched.',
  'Morgan fucked Rowan hard and Rowan came on his own.',
  'Morgan kissed Rowan hard and Rowan came on cock in his dreams.',
  'Morgan fucked Rowan hard and Rowan’s cock twitched untouched while Morgan stroked him until he came.',
 ])('is not read: %s',text=>{expect(seen(text)).toEqual([]);});
});
