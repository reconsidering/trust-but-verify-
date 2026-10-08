// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {emptyMeta,type Ao3Meta} from '../src/ao3';
import {analyzeWithPatterns,type AuditHit} from '../src/heuristic';
const meta:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],characters:['Rhys Calder','Theo Marsh'],relationships:['Rhys Calder/Theo Marsh'],freeforms:[]};
// All characters in these invented passages are adults.
function run(text:string){const hits:AuditHit[]=[];analyzeWithPatterns(text,meta,{quiet:true,audit:h=>hits.push(h)});return hits;}
const acts=(h:AuditHit[],act:string)=>h.filter(x=>x.kind==='act'&&x.act.startsWith(act));
describe('review-driven instrument continuity',()=>{
 it('keeps a thumb insertion as fingering when the next clause only says pushes in',()=>{
  const h=run('Rhys coats his thumb with lubricant and circles Theo’s anus. Rhys pushes in, draws back, and presses deeper with the thumb.');
  expect(acts(h,'anal sex').filter(x=>x.act==='anal sex')).toEqual([]);expect(acts(h,'fingering').length).toBeGreaterThan(0);
 });
 it('keeps a plug as a toy when generic depth language refers to it',()=>{
  const h=run('Rhys lubricates the plug and presses it against Theo’s rim. He pushes it inside Theo, then lets it bottom out inside Theo.');
  expect(acts(h,'anal sex').filter(x=>x.act==='anal sex')).toEqual([]);expect(acts(h,'anal sex (strap-on/toy)').length).toBeGreaterThan(0);
 });
 it('allows explicit penile penetration after finger preparation',()=>{
  const h=run('Rhys inserts a finger into Theo’s anus. Rhys withdraws the finger. Rhys slides his cock into Theo’s ass.');
  expect(acts(h,'fingering').length).toBeGreaterThan(0);expect(acts(h,'anal sex').some(x=>x.act==='anal sex')).toBe(true);
 });
 it('does not infer fingers from hair while penile penetration is explicit',()=>{
  const h=run('Theo tangles his fingers in Rhys’s hair while Rhys slides his cock into Theo’s ass.');
  expect(acts(h,'anal sex').some(x=>x.act==='anal sex')).toBe(true);
 });
});
describe('review-driven ownership',()=>{
 it('keeps the finger action with its named performer across the receiver reaction',()=>{
  const h=run('Theo lies bound and naked. Rhys oils his fingers and touches Theo’s hole. Theo gasps before Rhys pushes his finger inside him.');
  expect(acts(h,'fingering').some(x=>x.a==='Rhys Calder'&&x.b==='Theo Marsh')).toBe(true);
  expect(acts(h,'fingering').some(x=>x.a==='Theo Marsh')).toBe(false);
 });
 it('keeps oral continuation with the performer after the recipient reacts',()=>{
  const h=run('Theo takes Rhys’s cock into his mouth. Rhys groans as Theo wraps his lips around the head. He swirls his tongue around the shaft and lowers his head.');
  expect(acts(h,'blowjob').every(x=>x.a==='Rhys Calder'&&x.b==='Theo Marsh')).toBe(true);
 });
});

describe('review-driven occurrence and contact',()=>{
 it('retains a recalled handjob as historical evidence rather than a current manual act',()=>{
  const h=run('Rhys remembered how he stroked Theo’s cock during their earlier night together.');
  expect(h.some(x=>x.kind==='handjob')).toBe(false);expect(h.some(x=>x.act==='handjob'&&x.kind==='history')).toBe(true);
 });
 it('does not count pictured self-stimulation as performed',()=>{
  const h=run('The image of Theo stroking himself while Rhys watched appeared in Rhys’s mind.');
  expect(h.some(x=>x.kind==='masturbation')).toBe(false);
 });
 it('keeps current masturbation separate from the remembered partner act',()=>{
  const h=run('Rhys remembered Theo’s mouth around his cock last night. Now Rhys jerked himself off, alone in bed.');
  expect(h.some(x=>x.kind==='masturbation'&&x.a==='Rhys Calder')).toBe(true);
 });
 it('does not count a restraint-only genital hold as a handjob',()=>{
  const h=run('Rhys grips Theo’s cock and balls. He holds Theo steady by them while he thrusts a dildo into Theo’s ass.');
  expect(h.some(x=>x.kind==='handjob')).toBe(false);
 });
 it('does not turn supporting oneself on furniture into masturbation',()=>{
  const h=run('Rhys admires Theo’s photograph. He grips the counter behind himself to steady his feet.');
  expect(h.some(x=>x.kind==='masturbation')).toBe(false);
 });
 it('keeps an actual moving hand on the genitals during concurrent penetration',()=>{
  const h=run('Rhys slides his cock into Theo’s ass and strokes Theo’s cock with his hand.');
  expect(h.some(x=>x.kind==='handjob')).toBe(true);expect(acts(h,'anal sex').length).toBeGreaterThan(0);
 });
});
describe('review-driven missed activity',()=>{
 it('detects tongue penetration with an explicit anal posture, but not a tongue in a mouth',()=>{
  const h=run('Rhys spreads Theo’s ass open. Theo stays on his hands and knees while Rhys penetrates him with his tongue.');
  expect(acts(h,'rimming').some(x=>x.a==='Rhys Calder'&&x.b==='Theo Marsh')).toBe(true);
  expect(acts(run('Rhys kisses Theo’s lips and penetrates his mouth with his tongue.'),'rimming')).toEqual([]);
 });
 it('detects a toy tip inserted after that toy is explicitly identified',()=>{
  const h=run('Rhys picks up the dildo and lubricates it. Theo holds his legs apart. Rhys pushes the tip inside.');
  expect(acts(h,'anal sex (strap-on/toy)').length).toBeGreaterThan(0);
 });
 it('detects a penile replacement of a removed anal toy without treating removal as insertion',()=>{
  const h=run('Rhys removes the plug from Theo’s ass and inserts himself in its place. Rhys thrusts his cock into Theo’s ass.');
  expect(acts(h,'anal sex').some(x=>/in its place/.test(x.sentence)&&x.act==='anal sex')).toBe(true);
  expect(acts(h,'anal sex (strap-on/toy)')).toEqual([]);
 });
 it('keeps explicit finger and penile activity as separate concurrent acts',()=>{
  const h=run('Rhys pushes a finger into Theo’s anus alongside his cock.');
  expect(acts(h,'fingering').length).toBeGreaterThan(0);
 });
 it('retains a real anal direction change rather than imposing a scene majority',()=>{
  const h=run('Rhys slides his cock into Theo’s ass.\n\nLater Rhys withdraws. Theo slides his cock into Rhys’s ass.');
  expect(acts(h,'anal sex').some(x=>x.a==='Rhys Calder')).toBe(true);expect(acts(h,'anal sex').some(x=>x.a==='Theo Marsh')).toBe(true);
 });
});

it('reports external anal stimulation separately without inventing penetration',()=>{
 const a=analyzeWithPatterns('Rhys rubs Theo’s anus externally with his fingers.',meta,{quiet:true});
 expect(a.pairings[0].manual!.instances.some(x=>x.act==='External anal stimulation')).toBe(true);
 expect(a.pairings[0].anal.instances).toEqual([]);
 expect(a.pairings[0].manual!.instances[0].confidence).toBeGreaterThan(0);
});

it('does not carry an earlier self-used toy over a newly established partnered penile act',()=>{
 const h=run(`Theo says he used a plug while waiting.

Rhys slides into Theo. Theo finally feels filled by a warm cock.`);
 expect(acts(h,'anal sex').some(x=>x.act==='anal sex')).toBe(true);
 expect(acts(h,'anal sex (strap-on/toy)')).toEqual([]);
});

it('detects reciprocal oral completion with the stated throat owner',()=>{
 const h=run('Theo takes Rhys’s cock into his mouth. Later Rhys takes Theo’s cock into his mouth. Theo comes, hard, down Rhys’s throat.');
 expect(acts(h,'blowjob').some(x=>x.via.startsWith('review-orgasm-down-throat')&&x.a==='Theo Marsh'&&x.b==='Rhys Calder')).toBe(true);
});
it('requires established anal evidence for summarized tongue activity and resumed penetration',()=>{
 const h=run('Rhys slides his cock into Theo’s ass. Rhys pulls out. Rhys presses a finger against Theo’s rim. Rhys unravels Theo completely with his tongue. Rhys takes Theo for the second time until both are breathless and sticky.');
 expect(acts(h,'rimming').some(x=>x.via.startsWith('review-tongue-summary')),JSON.stringify(h.map(x=>({via:x.via,act:x.act,kind:x.kind})))).toBe(true);
 expect(acts(h,'anal sex').some(x=>x.via.startsWith('review-takes-second-time'))).toBe(true);
 expect(acts(run('Rhys unravels Theo completely with his tongue. Rhys takes Theo for the second time.'),'anal sex')).toEqual([]);
 expect(acts(run('Rhys kisses Theo’s mouth. Rhys unravels Theo completely with his tongue.'),'rimming')).toEqual([]);
});

it('does not interpret the verb plug as a toy or carry another character’s earlier preparation',()=>{
 const h=run(`Rhys rotates his cock inside Theo. Rhys asks to plug his semen inside Theo.

Rhys slips back inside Theo.`);
 expect(acts(h,'anal sex (strap-on/toy)')).toEqual([]);
 const separated=run(`Theo dips a finger inside his anus.

Rhys strokes himself.

Rhys slides his cock into Theo’s ass.`);
 expect(acts(separated,'anal sex').length).toBeGreaterThan(0);
});

it('prefers a trailing explicit penile instrument to earlier finger preparation',()=>{
 const h=run('Rhys inserts three fingers into Theo’s hole, then pushes into Theo with his cock.');
 expect(acts(h,'anal sex').some(x=>x.act==='anal sex')).toBe(true);
});
it('keeps explicit self-fingering separate from the partner watching',()=>{
 const h=run('Theo spreads his naked legs and asks Rhys to watch. Theo pushes a finger into himself while Rhys watches him.');
 expect(h.some(x=>x.kind==='solo'&&x.a==='Theo Marsh'&&x.act==='fingering himself')).toBe(true);
 expect(acts(h,'fingering')).toEqual([]);
});

it('uses near-following explicit finger insertion while preserving a later penile act',()=>{
 const h=run(`Rhys brushes a finger against Theo’s anus.

Theo nods.

Rhys presses in as Theo spreads his naked legs.

Theo sighs.

Two fingers in and Theo asks for another.

Rhys withdraws his fingers and slides his cock into Theo’s ass.`);
 expect(h.some(x=>x.sentence==='Rhys presses in as Theo spreads his naked legs.'&&x.act==='fingering')).toBe(true);
 expect(acts(h,'anal sex').some(x=>x.act==='anal sex')).toBe(true);
});
it.each(['Theo mouths at Rhys’s balls.','Theo sucks Rhys’s balls into his mouth.','Theo takes Rhys’s balls into his mouth.'])('separates scrotal oral contact from penile blowjobs: %s',text=>{
 const a=analyzeWithPatterns(text,meta,{quiet:true});
 expect(a.pairings[0].manual!.instances.some(x=>x.act==='Genital licking'&&x.giver==='Theo Marsh'&&x.receiver==='Rhys Calder')).toBe(true);
 expect(a.pairings[0].blowjob.instances).toEqual([]);
 expect(a.pairings[0].manual!.instances.every(x=>typeof x.confidence==='number')).toBe(true);
});
it('does not mistake taking someone to a clinic for resumed penetration',()=>{
 const h=run('Rhys slides his cock into Theo’s ass. Later Rhys takes Theo for the second time to the clinic.');
 expect(h.some(x=>x.via.startsWith('review-takes-second-time'))).toBe(false);
});

it('uses posture established earlier in the paragraph for explicit tongue penetration',()=>{
 const h=run('Theo kneels on his hands and knees, naked and spread open. Rhys penetrates him with his tongue.');
 expect(acts(h,'rimming').some(x=>x.a==='Rhys Calder'&&x.b==='Theo Marsh')).toBe(true);
});
it('recognizes unplugging an established anal toy followed by its penile replacement',()=>{
 const h=run('Rhys announces he will knot Theo. Rhys walks around Theo’s ass, unplugging the toy and inserting himself in its place.');
 expect(acts(h,'anal sex').some(x=>x.via.startsWith('review-replaces-anal-toy'))).toBe(true);
});
it('does not promote an impending oral climax to a performed event',()=>{
 const h=run('Rhys was about to come down Theo’s throat.');
 expect(acts(h,'blowjob')).toEqual([]);
 expect(h.some(x=>x.act==='blowjob'&&x.kind==='wanted')).toBe(true);
});

it('detects an identified dildo insertion and does not count putting a toy in its case',()=>{
 const h=run('Rhys spreads Theo’s ass. Rhys slides the dildo inside.');
 expect(acts(h,'anal sex (strap-on/toy)').some(x=>x.via.startsWith('review-inserts-named-toy'))).toBe(true);
 expect(acts(run('Rhys checks Theo’s ass. Rhys slides the dildo inside its case.'),'anal sex (strap-on/toy)')).toEqual([]);
});
it('keeps a just-selected dildo as the instrument when its tip is inserted without lubrication wording',()=>{
 const h=run('Rhys spreads Theo’s ass, picks up the dildo and pushes the tip inside.');
 expect(acts(h,'anal sex (strap-on/toy)').some(x=>x.via.startsWith('review-toy-tip-inside'))).toBe(true);
});

it('recognizes a known actor after a connective and aside without turning a bystander into that actor',()=>{
 const h=run('Rhys touches Theo’s anus. And Rhys, never one to avoid a challenge, proceeds to unravel Theo completely with his tongue.');
 expect(acts(h,'rimming').some(x=>x.a==='Rhys Calder'&&x.b==='Theo Marsh')).toBe(true);
 const stranger=run('Rhys touches Theo’s anus. And Morgan, never one to avoid a challenge, proceeds to unravel Theo completely with his tongue.');
 expect(acts(stranger,'rimming')).toEqual([]);
});
it('preserves established penile resumption after separate rimming',()=>{
 const h=run('Rhys slides his cock into Theo’s ass. Rhys withdraws. Rhys licks Theo’s anus with his tongue. Rhys takes Theo for the second time until both are breathless and sticky.');
 expect(acts(h,'anal sex').some(x=>x.via.startsWith('review-takes-second-time'))).toBe(true);
});

it('clears target continuity at a chapter boundary',()=>{
 const h=run(`Rhys strokes Theo’s anus.

Chapter 2

Rhys unravels Theo completely with his tongue.`);
 expect(acts(h,'rimming')).toEqual([]);
});

it('does not expand connective attribution into a negated retrospective handjob',()=>{
 const h=run('Rhys and Theo finished earlier and lay in the aftermath. And Theo, legs drawn up, had come from that—not Rhys’s hand on his cock, working him after an orgasm, but the look on his face.');
 expect(h.filter(x=>x.kind==='handjob'&&x.a==='Theo Marsh'&&x.b==='Rhys Calder')).toEqual([]);
});

it('keeps explicit vaginal self-fingering out of anal reception evidence',()=>{
 const h=run('Theo spreads his naked legs and asks Rhys to watch. Theo pushes a finger into himself, touching his vagina.');
 expect(h.some(x=>x.act==='fingering himself'&&x.cat==='vaginal')).toBe(true);
 expect(h.some(x=>x.act==='fingering himself'&&x.cat==='anal')).toBe(false);
});

it('keeps remembered remote self-fingering historical',()=>{
 const h=run('Theo remembered how his fingers entered his hole while Rhys spoke to him on the phone.');
 expect(h.some(x=>x.via==='fingers-enter-hole'&&x.act==='fingering himself'&&x.kind==='history')).toBe(true);
 expect(h.some(x=>x.via==='fingers-enter-hole'&&x.kind==='solo')).toBe(false);
});
