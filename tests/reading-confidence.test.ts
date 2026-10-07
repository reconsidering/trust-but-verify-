import {expect,it} from 'vitest';
import {emptyMeta} from '../src/ao3';
import {buildAct,buildVaginal,sceneLineScore,scoreDesires} from '../src/heuristic/builders';
import type {ActHit,DesireHit} from '../src/heuristic/hits';
import type {Character} from '../src/heuristic/characters';
import {toAnalysis} from '../src/analyze';
const person=(name:string):Character=>({name,aliases:[name],gender:'m',vulva:false,penis:true});
const m=person('Morgan'),r=person('Rowan');
const hit=(changes:Partial<ActHit>={}):ActHit=>({cat:'anal',act:'fingering',top:m,bottom:r,weight:0.9,basis:'named',para:1,sentence:'Morgan inserts a finger into Rowan.',...changes});
const where=()=> 'Chapter 1';
it('scores fingering and vaginal scenes individually without promoting fingering into penetration',()=>{
 const anal=buildAct('anal',[hit()],[],{roles:[],dynamics:[],dynamicTags:[],switching:[],actTags:{anal:[],oral:[],blowjob:[],rimming:[],cunnilingus:[]}},[m,r],emptyMeta(),where);
 expect(anal.instances[0]).toMatchObject({act:'fingering',confidence:0.8});
 expect(anal.instances[0].reasons?.length).toBeGreaterThan(0);
 expect(anal.verdict).toBe('unclear');expect(anal.top).toBe('');
 const vaginal=buildVaginal([hit({cat:'vaginal',act:'vaginal sex'})],[m,r],emptyMeta(),where);
 expect(vaginal.instances[0]).toMatchObject({confidence:0.8,top:'Morgan',bottom:'Rowan'});expect(vaginal.occurs).toBe(true);
 const fingers=buildVaginal([hit({cat:'vaginal'})],[m,r],emptyMeta(),where);
 expect(fingers.instances[0].confidence).toBe(0.8);expect(fingers.occurs).toBe(false);
});
it('lowers scene confidence for inference, shaky evidence, ambiguity and participant conflicts',()=>{
 const named=hit(),inferred=hit({basis:'inferred'});
 expect(sceneLineScore(inferred,[inferred]).confidence).toBeLessThan(sceneLineScore(named,[named]).confidence);
 const shaky=hit({shaky:'The participant attribution is uncertain.'});
 expect(sceneLineScore(shaky,[shaky]).reasons).toContain(shaky.shaky);
 expect(sceneLineScore(shaky,[shaky]).confidence).toBeLessThan(sceneLineScore(named,[named]).confidence);
 const second=hit({sentence:'Morgan continues stimulating Rowan.'});
 expect(sceneLineScore(named,[named,second]).confidence).toBeGreaterThan(sceneLineScore(named,[named,named]).confidence);
 const conflict=hit({top:r,bottom:m,sentence:'Rowan stimulates Morgan.'});
 expect(sceneLineScore(named,[named,conflict]).confidence).toBeLessThan(sceneLineScore(named,[named]).confidence);
 const ambiguous=hit({holeGuess:'ambiguous'});
 expect(sceneLineScore(ambiguous,[ambiguous]).confidence).toBeLessThan(sceneLineScore(named,[named]).confidence);
});
it('keeps a numeric reading score for every supported hint kind, without making it a performed act',()=>{
 const kinds=['said','wanted','fantasy','hypothetical','identity','history','ogling','touch','fingering','prep','fingers','solo','behavior','stated','body','aftercare','position','petname','masturbation','handjob'] as const;
 const hints:DesireHit[]=kinds.map(kind=>({cat:'anal',act:'anal sex',who:m,partner:r,role:'bottom',wants:true,kind,weight:0.5,para:1,sentence:'Morgan considers a possibility.',basis:'named'}));
 const scores=scoreDesires(hints,()=>undefined);
 for(const h of hints){expect(scores.get(h)?.conf).toBeGreaterThanOrEqual(0);expect(scores.get(h)?.conf).toBeLessThanOrEqual(1);expect(scores.get(h)?.reasons.length).toBeGreaterThan(0);}
 const out=buildAct('anal',[],hints,{roles:[],dynamics:[],dynamicTags:[],switching:[],actTags:{anal:[],oral:[],blowjob:[],rimming:[],cunnilingus:[]}},[m,r],emptyMeta(),where);
 expect(out.instances).toEqual([]);
 for(const d of out.desires){expect(Number.isFinite(d.confidence)).toBe(true);expect(d.reasons?.length).toBeGreaterThan(0);}
});
it('preserves separate Claude scores and reasons for scenes, hints and vaginal readings',()=>{
 const instance={top:'Morgan',bottom:'Rowan',act:'anal sex',where:'Chapter 1',evidence:'A paraphrased adult scene.',confidence:0.81,reasons:['Both participants identified.']};
 const hint={who:'Morgan',role:'bottom' as const,wants:true,kind:'wanted' as const,act:'anal sex',where:'Chapter 2',evidence:'A proposed role.',confidence:0.55,reasons:['Proposal, not performed.']};
 const act={verdict:'one_way' as const,top:'Morgan',bottom:'Rowan',summary:'',instances:[instance],desires:[hint],confidence:{level:'High' as const,reasons:['Overall result.']}};
 const answer={fandom:'Original Work',main_pairing:'Morgan/Rowan',notes:'',pairings:[{pairing:'Morgan/Rowan',anal:act,oral:{...act,instances:[{...instance,act:'blowjob',confidence:0.72}]},vaginal:{occurs:true,summary:'',instances:[{participants:['Morgan','Rowan'],act:'vaginal sex',where:'Chapter 3',evidence:'A paraphrase.',confidence:0.64,reasons:['Participant uncertainty.']}],confidence:{level:'High' as const,reasons:[]}}}]};
 const a=toAnalysis(answer);
 const p=a.pairings[0];expect(p.anal.instances[0].confidence).toBe(0.81);expect(p.anal.desires[0].confidence).toBe(0.55);
 expect(p.blowjob.instances[0].confidence).toBe(0.72);expect(p.vaginal.instances[0].confidence).toBe(0.64);expect(p.vaginal.instances[0].reasons).toEqual(['Participant uncertainty.']);
 for(const bad of [NaN,Infinity,-0.1,1.1]){answer.pairings[0].anal.instances[0].confidence=bad;expect(()=>toAnalysis(answer)).toThrow('individual confidence');}
 answer.pairings[0].anal.instances[0].confidence=0.81;
 answer.pairings[0].anal.desires[0].confidence=NaN;expect(()=>toAnalysis(answer)).toThrow('individual confidence');
 answer.pairings[0].anal.desires[0].confidence=0.55;answer.pairings[0].vaginal.instances[0].confidence=NaN;expect(()=>toAnalysis(answer)).toThrow('individual confidence');
});
