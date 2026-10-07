// Invented adult-character cases; no sample story quotations.
import {expect,it} from 'vitest';
import {sceneRoleAgreementOf,type SceneRoleReading} from '../src/heuristic/decision-features';
const reading=(para:number,a='Morgan',b='Rowan',overrides:Partial<SceneRoleReading>={}):SceneRoleReading=>({a,b,kind:'act',cat:'anal',act:'anal sex',para,sentence:`Adult ${a} penetrates adult ${b} in passage ${para}.`,...overrides});
it('compares other sentences and detects a lone reversal without letting overlapping patterns vote',()=>{
 const rows=[reading(1),reading(2),reading(3,'Rowan','Morgan')];expect(sceneRoleAgreementOf(rows,()=>'' )).toEqual([0,0,-1]);
 const own=reading(1),duplicate={...own};expect(sceneRoleAgreementOf([own,duplicate],()=>'' )).toEqual([0,0]);
 const repeated=[reading(1),reading(1),reading(1),reading(3,'Rowan','Morgan'),reading(4,'Rowan','Morgan')];expect(sceneRoleAgreementOf(repeated,()=>'' )[0]).toBe(-1);
});
it('keeps chapters, distant scenes, oral acts, fingering, and hypothetical acts separate',()=>{
 const rows=[reading(1),reading(2,'Rowan','Morgan',{cat:'oral',act:'blowjob'}),reading(3,'Rowan','Morgan',{act:'fingering'}),reading(4,'Rowan','Morgan',{kind:'hypothetical'}),reading(30,'Rowan','Morgan')];expect(sceneRoleAgreementOf(rows,()=>'' )).toEqual([0,0,0,0,0]);
 expect(sceneRoleAgreementOf([reading(1),reading(2,'Rowan','Morgan')],pi=>pi===1?'Chapter one':'Chapter two')).toEqual([0,0]);
});
it('normalizes hint roles and uses the same feature with every confidence or label value omitted',()=>{
 const rows=[reading(1,'Rowan','Morgan',{kind:'wanted',role:'bottom'}),reading(2,'Morgan','Rowan',{kind:'wanted',role:'top'})];expect(sceneRoleAgreementOf(rows,()=>'' )).toEqual([1,1]);
});
