import { expect, it } from 'vitest';
import { analSwitchEvidence, renderAnalSwitchIndicator } from '../src/anal-switch';
import type { ActResult, Instance } from '../src/types';
const scene = (top = 'Morgan', bottom = 'Rowan', confidence: number | undefined = 0.8, act = 'anal sex'): Instance => ({top,bottom,confidence,act,where:'Chapter 2',evidence:''});
const result = (instances: Instance[]): ActResult => ({verdict:'one_way',top:'Morgan',bottom:'Rowan',summary:'',instances,desires:[],confidence:{score:0.99,label:'High',reasons:[]}});
it('requires a high-confidence performed anal scene in both directions, even when aggregate roles favour one partner',()=>{
 const forward=scene(),reverse=scene('Rowan','Morgan',0.75,'anal sex (riding)');
 expect(analSwitchEvidence(result([forward,reverse]),'Morgan/Rowan')).toEqual([forward,reverse]);
 expect(analSwitchEvidence(result([forward]),'Morgan/Rowan')).toBeUndefined();
 expect(analSwitchEvidence(result([forward,scene('Rowan','Morgan',0.74)]),'Morgan/Rowan')).toBeUndefined();
 const missing=scene('Rowan','Morgan');delete missing.confidence;
 expect(analSwitchEvidence(result([forward,missing]),'Morgan/Rowan')).toBeUndefined();
 for(const confidence of [NaN,Infinity,1.1])expect(analSwitchEvidence(result([forward,scene('Rowan','Morgan',confidence)]),'Morgan/Rowan')).toBeUndefined();
});
it('does not infer switching from hints, other acts, self acts, or other characters',()=>{
 for(const act of ['blowjob','rimming','fingering','anal sex (strap-on/toy)','toy inside','past experience (anal)']){
  expect(analSwitchEvidence(result([scene(),scene('Rowan','Morgan',0.99,act)]),'Morgan/Rowan')).toBeUndefined();
 }
 for(const reverse of [scene('Rowan','Other'),scene('Rowan','Rowan')])expect(analSwitchEvidence(result([scene(),reverse]),'Morgan/Rowan')).toBeUndefined();
 const tagsOnly=result([]);tagsOnly.verdict='switch';tagsOnly.people=[{name:'Morgan',top:0.99,bottom:0.99},{name:'Rowan',top:0.99,bottom:0.99}];
 expect(analSwitchEvidence(tagsOnly,'Morgan/Rowan')).toBeUndefined();
 expect(analSwitchEvidence(result([scene(),scene('Rowan','Morgan')]),'Morgan/Rowan/Other')).toBeUndefined();
});
it('shows the strongest supporting scene in each direction with scores and safe, expandable text',()=>{
 const strong=scene('Morgan','Rowan',0.95);strong.where='Chapter 4';
 const act=result([scene(),strong,scene('Rowan','Morgan',0.85)]);
 const indicator=renderAnalSwitchIndicator(act,'Morgan/Rowan')!;
 expect(indicator.tagName).toBe('DETAILS');expect(indicator.querySelector('summary')?.textContent).toContain('Anal role switching found');
 expect(indicator.querySelectorAll('li')).toHaveLength(2);expect(indicator.textContent).toContain('95% sure · Chapter 4');expect(indicator.textContent).toContain('Rowan tops Morgan · 85% sure');
 expect(indicator.textContent).toContain('different points in the work');
 expect(renderAnalSwitchIndicator(result([scene()]),'Morgan/Rowan')).toBeUndefined();
});
