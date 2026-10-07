import {describe,it,expect} from 'vitest';
import {emptyMeta,type Ao3Meta} from '../src/ao3';
import {analyzeWithPatterns,type AuditHit} from '../src/heuristic';
const meta:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],characters:['Morgan Vale','Rowan Hart'],relationships:['Morgan Vale/Rowan Hart']};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan were adults, naked and aroused in bed. Morgan kissed Rowan.\n\n'+text.replaceAll('||','\n\n'),meta,{quiet:true,audit:h=>hits.push(h)});return hits;};
const actual=(text:string,pattern:RegExp)=>run(text).filter(h=>h.kind==='act'&&pattern.test(h.via));
describe('owner reading act selection and participants',()=>{
 it('does not turn emergency finger insertion into sexual fingering',()=>{
  expect(actual("Morgan rolls a stranger onto his side and sticks his fingers down the man's throat to clear the airway.",/^dd2-finger-shoved-into/)).toEqual([]);
 });
 it('does not assign fingers in a fleshlight to a partner',()=>{
  expect(actual('Rowan spears his fingers into the fleshlight.||Morgan strokes Rowan as Rowan jams his fingers into the opening again.',/^dd2-finger-shoved-into/)).toEqual([]);
 });
 it('does not assign reflexive finger preparation to the nearby watcher',()=>{
  expect(actual('Morgan watches Rowan. Rowan pushes his fingers inside himself.||He works himself open, scissoring his fingers before slipping a third finger inside.',/^dd3-slipping-second/)).toEqual([]);
 });
 it('keeps a finger insertion distinct from simultaneous oral activity',()=>{
  const h=actual("Morgan eases a finger into Rowan. Rowan pulls Morgan's hair. Morgan moans around his cock, letting him adjust before pushing in all the way.",/^pushed-in/);
  expect(h.length).toBeGreaterThan(0);expect(h.every(h=>h.act==='fingering')).toBe(true);
 });
 it('keeps tongue insertion distinct from penile penetration',()=>{
  const h=actual('Morgan dives back in, licking eagerly before pushing in past Rowan\'s ring of muscle.',/^push-into/);
  expect(h.some(h=>h.act==='rimming')).toBe(true);expect(h.some(h=>h.act.startsWith('anal sex'))).toBe(false);
 });
 it('does not mistake reinserted plugs for penile penetration',()=>{
  expect(actual("Morgan pulls the plug out of Rowan's mouth and shoves it back into his ass.",/^push-into/).some(h=>h.act.startsWith('anal sex'))).toBe(false);
 });
 it('keeps a prostate tap as fingering during established finger preparation',()=>{
  const h=actual("Morgan inserts a finger into Rowan's ass.||Morgan taps Rowan's prostate again.",/^prostate/);
  expect(h.some(h=>h.act==='fingering')).toBe(true);
 });
 it('assigns finger thrusting to the named finger owner rather than receiver',()=>{
  const h=actual("Rowan pushes down on Morgan's fingers, his walls clenching around Morgan as he thrusts in and out.",/^pushed-in/);
  expect(h.some(h=>h.a==='Morgan Vale'&&h.b==='Rowan Hart'&&h.act==='fingering')).toBe(true);
 });
 it('uses the named reacting partner in a because clause',()=>{
  const h=actual("Morgan lines his cock up with Rowan's hole.||Rowan relaxes, which Morgan didn't expect, because he slides in almost to the base.",/^pushed-in/);
  expect(h.some(h=>h.a==='Morgan Vale'&&h.b==='Rowan Hart')).toBe(true);
 });
 it('uses the intervening named actor when another finger is added',()=>{
  const h=actual("Morgan presses a lubed finger inside Rowan.||Rowan moans as his finger brushes his prostate, but Morgan didn't linger there long, instead he added a second finger.",/^dd3-slipping-second/);
  expect(h.length).toBeGreaterThan(0);expect(h.every(h=>h.a==='Morgan Vale'&&h.b==='Rowan Hart')).toBe(true);
 });
 it('keeps a named-partner wish separate from simultaneous self-fingering',()=>{
  const h=run('Rowan waves his fingers while Morgan waits.||Now he needs to be one with Morgan, to have him driven inside him, as he fingers himself.');
  expect(h.some(h=>h.via==='push-into'&&h.kind==='wanted'&&h.act==='anal sex'&&h.a==='Rowan Hart'&&h.b==='Morgan Vale'&&h.role==='bottom')).toBe(true);
 });
 it('does not carry earlier fingers over explicit penile activity in the same paragraph',()=>{
  const h=actual("Morgan works a finger inside Rowan.||Morgan's cock fills Rowan's ass. Morgan goes slowly, hitting Rowan's prostate with each thrust.",/^prostate/);
  expect(h.some(h=>h.act.startsWith('anal sex'))).toBe(true);
 });
 it('retains the direct named actor across comma-separated insertion adverbs',()=>{
  const h=actual('Morgan positions himself at Rowan\'s hole.||They inhale as Morgan slowly, patiently, pushes inside.',/^pushed-in$/);
  expect(h.some(h=>h.a==='Morgan Vale'&&h.b==='Rowan Hart'&&h.attribution?.top==='name')).toBe(true);
 });
 it('recognizes named participants in a thrusting continuation of penile insertion',()=>{
  const h=actual("Morgan pushes his cock inside Rowan's ass.||Morgan raises Rowan's hips up, ensuring each thrust hits his prostate.",/^hips-thrust-prostate/);
  expect(h.some(h=>h.a==='Morgan Vale'&&h.b==='Rowan Hart'&&h.act==='anal sex'&&h.attribution?.top==='name'&&h.attribution?.bottom==='name')).toBe(true);
 });
 it('does not treat finger preparation or an isolated hip adjustment as penile thrusting',()=>{
  const cue="Morgan raises Rowan's hips up, ensuring each thrust hits his prostate.";
  expect(actual("Morgan pushes a finger inside Rowan's ass.||"+cue,/^hips-thrust-prostate/)).toEqual([]);
  expect(actual(cue,/^hips-thrust-prostate/)).toEqual([]);
 });
 it('retains penile penetration after fingers are withdrawn',()=>{
  expect(actual("Morgan pulls his fingers out, lines up his cock and pushes into Rowan's ass.",/^push-into/).some(h=>h.act.startsWith('anal sex'))).toBe(true);
 });
 it('retains simultaneous handjobs and penile penetration',()=>{
  expect(run("Morgan takes Rowan in hand, stroking him steadily as his own cock thrusts into Rowan's ass.").some(h=>h.kind==='handjob')).toBe(true);
 });
});
