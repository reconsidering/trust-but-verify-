import { expect, it } from 'vitest';
import { analReceptionEvidence, renderAnalSwitchIndicator } from '../src/anal-switch';
import type { ActResult, Instance } from '../src/types';
const scene=(top='Morgan',bottom='Rowan',confidence:number|undefined=0.8,act='anal sex'):Instance=>({top,bottom,confidence,act,where:'Chapter 2',evidence:''});
const result=(instances:Instance[]):ActResult=>({verdict:'one_way',top:'Rowan',bottom:'Morgan',summary:'',instances,desires:[],confidence:{score:0.99,label:'High',reasons:[]}});
const pair=(extra:Instance[]=[],rims:Instance[]=[])=>({pairing:'Morgan/Rowan',anal:result([scene(),scene(),...extra]),rimming:result(rims)});
it('uses penetration scene counts and identifies the usual top receiving each anal activity',()=>{
 for(const [act,activity] of [['anal sex (riding)','Bottoms during anal sex'],['fingering','Is fingered'],['anal sex (strap-on/toy)','Receives an anal toy'],['toy inside','Receives an anal toy']]){
  const readings=analReceptionEvidence(pair([scene('Rowan','Morgan',0.75,act)]));
  expect(readings).toEqual([expect.objectContaining({name:'Morgan',topScenes:2,tied:false,evidence:[expect.objectContaining({activity})]})]);
 }
 expect(analReceptionEvidence(pair([],[scene('Rowan','Morgan',0.9,'rimming')]))[0].evidence[0].activity).toBe('Is rimmed');
});
it('requires scored confidence or explicitly marks unscored fingering for review',()=>{
 for(const confidence of [0.74,NaN,Infinity,1.1])expect(analReceptionEvidence(pair([scene('Rowan','Morgan',confidence)]))).toEqual([]);
 const unscored=scene('Rowan','Morgan',0.8,'fingering');delete unscored.confidence;
 const indicator=renderAnalSwitchIndicator(pair([unscored]))!;
 expect(indicator.querySelector('summary')?.textContent).toContain('Review needed');
 expect(indicator.textContent).toContain('confidence unavailable');
 const missing=scene('Rowan','Morgan');delete missing.confidence;
 expect(analReceptionEvidence(pair([missing]))).toEqual([]);
});
it('excludes other partners, oral penetration, hints, self acts and unspecific solo labels',()=>{
 for(const act of ['blowjob','cunnilingus','past experience (anal)'])expect(analReceptionEvidence(pair([scene('Rowan','Morgan',0.99,act)]))).toEqual([]);
 for(const s of [scene('Other','Morgan'),scene('Morgan','Morgan')])expect(analReceptionEvidence(pair([s]))).toEqual([]);
 const p=pair();p.anal.people=[{name:'Morgan',top:0.99,bottom:0.99}];p.anal.verdict='switch';
 expect(analReceptionEvidence(p)).toEqual([]);
 expect(analReceptionEvidence({...p,solo:{occurs:true,summary:'',people:[],instances:[{who:'Morgan',act:'Toy on self',confidence:0.99,where:'',evidence:''}]}})).toEqual([]);
 expect(analReceptionEvidence({...p,pairing:'Morgan/Rowan/Other'})).toEqual([]);
});
it('shows reception for tied tops without naming a single usual top, and never invents a top when no penetration was detected',()=>{
 const p=pair([scene('Rowan','Morgan'),scene('Rowan','Morgan')]);
 expect(analReceptionEvidence(p).map(r=>[r.name,r.tied])).toEqual([['Morgan',true],['Rowan',true]]);
 expect(renderAnalSwitchIndicator(p)?.textContent).toContain('no single usual top');
 expect(analReceptionEvidence({...p,anal:result([])})).toEqual([]);
});
it('shows expandable activity evidence with its confidence and location',()=>{
 const indicator=renderAnalSwitchIndicator(pair([],[scene('Rowan','Morgan',0.85,'rimming')]))!;
 expect(indicator.tagName).toBe('DETAILS');expect(indicator.querySelector('summary')?.textContent).toContain('High-confidence evidence');
 expect(indicator.textContent).toContain('Morgan · 2 topping scenes');expect(indicator.textContent).toContain('Is rimmed · 85% sure · Chapter 2');
 expect(renderAnalSwitchIndicator(pair())).toBeUndefined();
});

it('includes explicitly anal solo stimulation but excludes wishes and other hint kinds',()=>{
 const p=pair();
 const d={who:'Morgan',role:'bottom' as const,wants:true,kind:'solo' as const,act:'using a toy on himself',where:'Chapter 3',evidence:'',confidence:0.9};
 p.anal.desires=[d];
 expect(analReceptionEvidence(p)[0].evidence).toEqual([{activity:'Anal toy on self',where:'Chapter 3',confidence:0.9}]);
 p.anal.desires=[{...d,act:'fingering himself'}];
 expect(analReceptionEvidence(p)[0].evidence[0].activity).toBe('Anal self-fingering');
 for(const kind of ['wanted','hypothetical','history','ogling','prep'] as const){p.anal.desires=[{...d,kind}];expect(analReceptionEvidence(p)).toEqual([]);}
 p.anal.desires=[{...d,wants:false}];expect(analReceptionEvidence(p)).toEqual([]);
});

it('includes high-confidence external anal contact without counting it as another penetration scene',()=>{
 const p={...pair(),manual:{occurs:true,summary:'',people:[],instances:[{giver:'Rowan',receiver:'Morgan',act:'External anal stimulation',mutual:false,evidence:'',where:'Chapter 3',confidence:0.9}]}};
 expect(analReceptionEvidence(p)[0]).toMatchObject({name:'Morgan',topScenes:2,evidence:[{activity:'Receives external anal stimulation',where:'Chapter 3',confidence:0.9}]});
 p.manual.instances[0].confidence=0.7;expect(analReceptionEvidence(p)).toEqual([]);
});
