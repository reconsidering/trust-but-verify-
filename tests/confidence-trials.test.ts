import {it,expect} from 'vitest';
import {trialFeatures} from '../scripts/confidence-trials.mjs';
import type {DecisionOutcome} from '../src/heuristic';
const outcome:DecisionOutcome={initialTop:'Morgan',initialBottom:'Rowan',initialAct:'anal sex',topChanged:false,bottomChanged:false,actChanged:true,compatiblePronounCandidates:3,sentenceDistance:4,instrument:'finger'};
it('records final refinements, pronoun alternatives and actual sentence distance as separate trials',()=>{
 expect(trialFeatures('final-decision',outcome)).toEqual([0,1,0]);
 expect(trialFeatures('pronoun-alternatives',outcome)).toEqual([Math.log(3)]);
 expect(trialFeatures('sentence-distance',outcome)).toEqual([Math.log(5)]);
 expect(trialFeatures(undefined,outcome)).toEqual([]);
 expect(trialFeatures('final-decision')).toEqual([0,0,0]);
 expect(()=>trialFeatures('unknown',outcome)).toThrow('Unknown confidence trial');
});

import {emptyMeta} from '../src/ao3';
import {analyzeWithPatterns,type AuditHit} from '../src/heuristic';
const adultMeta={...emptyMeta(),rating:'Explicit',categories:['M/M'],characters:['Rhys Calder','Theo Marsh'],relationships:['Rhys Calder/Theo Marsh']};
function auditAdults(text:string){const hits:AuditHit[]=[];analyzeWithPatterns(text,adultMeta,{quiet:true,audit:h=>hits.push(h)});return hits;}
it('retains initial act evidence alongside a final toy correction in an invented adult scene',()=>{
 const hits=auditAdults('Rhys lubricates a plug and holds it against Theo’s anus. He pushes it inside Theo.');
 const corrected=hits.find(h=>h.kind==='act'&&h.act==='anal sex (strap-on/toy)'&&h.decisionOutcome?.actChanged);
 expect(corrected?.decisionOutcome?.initialAct).toBe('anal sex');
 expect(corrected?.decisionOutcome?.instrument).toBe('toy');
});
it('records several compatible pronouns and a distant named person without altering the reading',()=>{
 const hits=auditAdults('Rhys looks at Theo. The lamp is lit. Rain taps the window. He slides his cock into him.');
 const outcome=hits.find(h=>h.kind==='act'&&h.act==='anal sex')?.decisionOutcome;
 expect(outcome?.compatiblePronounCandidates).toBeGreaterThanOrEqual(2);
 expect(outcome?.sentenceDistance).toBeGreaterThanOrEqual(3);
});
