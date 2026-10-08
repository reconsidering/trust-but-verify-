import type { PairingResult } from './types';

const penisAct = (act: string) => act.split(',').some(label => /^anal sex(?: \(riding\))?$/.test(label.trim()));
const high = (confidence?: number) => Number.isFinite(confidence) && confidence! >= 0.75 && confidence! <= 1;
type Evidence = {activity:string;where:string;confidence?:number};
export type AnalReception = {name:string;topScenes:number;tied:boolean;evidence:Evidence[]};

/** Scene counts choose the usual top; hints and tags never establish received stimulation. */
export function analReceptionEvidence(pair: Pick<PairingResult,'pairing'|'anal'|'rimming'|'solo'> & Partial<Pick<PairingResult,'manual'>>): AnalReception[] {
  const names=pair.pairing.split('/').map(name=>name.trim());
  if(names.length!==2 || !names[0] || !names[1] || names[0]===names[1])return [];
  const counts=names.map((name,n)=>pair.anal.instances.filter(s=>s.top===name && s.bottom===names[1-n] && penisAct(s.act)).length);
  const most=Math.max(...counts);
  if(!most)return [];
  return names.flatMap((name,n)=>{
    if(counts[n]!==most)return [];
    const evidence:Evidence[]=[];
    const add=(activity:string,s:{where:string;confidence?:number},allowUnscored=false)=>{
      if(high(s.confidence) || (allowUnscored && s.confidence===undefined))evidence.push({activity,where:s.where,confidence:s.confidence});
    };
    for(const s of pair.anal.instances){
      if(s.bottom!==name || s.top!==names[1-n])continue;
      if(penisAct(s.act))add('Bottoms during anal sex',s);
      if(s.act.split(',').some(label=>label.trim()==='fingering'))add('Is fingered',s,true);
      if(s.act.split(',').some(label=>/^(?:anal sex \(strap-on\/toy\)|toy inside)$/.test(label.trim())))add('Receives an anal toy',s);
    }
    for(const s of pair.rimming.instances)if(s.bottom===name && s.top===names[1-n] && s.act.split(',').some(label=>label.trim()==='rimming'))add('Is rimmed',s);
    for(const s of pair.manual?.instances ?? []) if(s.receiver===name && s.giver===names[1-n] && s.act==='External anal stimulation') add('Receives external anal stimulation',s);
    // Self-fingering and toys are anal only when the anal result explicitly identifies them as such.
    // Solo labels alone can also describe vaginal stimulation and must not be treated as anal proof.
    for(const d of pair.anal.desires){
      if(d.who!==name || !d.wants || d.role!=='bottom' || !['solo','masturbation'].includes(d.kind))continue;
      if(d.act==='fingering himself')add('Anal self-fingering',d);
      if(d.act==='using a toy on himself')add('Anal toy on self',d);
    }
    return evidence.length?[{name,topScenes:most,tied:counts[0]===counts[1],evidence}]:[];
  });
}

export function renderAnalSwitchIndicator(pair: Pick<PairingResult,'pairing'|'anal'|'rimming'|'solo'> & Partial<Pick<PairingResult,'manual'>>): HTMLElement | undefined {
  const readings=analReceptionEvidence(pair);
  if(!readings.length)return;
  const box=document.createElement('details');box.className='anal-switch-indicator';
  const summary=document.createElement('summary');
  const confident=readings.some(r=>r.evidence.some(e=>high(e.confidence)));
  summary.textContent=confident?'Usual anal top receives anal stimulation · High-confidence evidence':'Usual anal top receives anal stimulation · Review needed';
  box.append(summary);
  const explanation=document.createElement('p');
  explanation.textContent='Based on who tops in the most detected anal penetration scenes. High-confidence entries score at least 75%. Activities can occur at different points in the work.';
  box.append(explanation);
  for(const reading of readings){
    const heading=document.createElement('p');heading.textContent=`${reading.name} · ${reading.topScenes} topping scene${reading.topScenes===1?'':'s'}${reading.tied?' · tied for most; no single usual top':''}`;box.append(heading);
    const list=document.createElement('ul');
    for(const evidence of reading.evidence){
      const item=document.createElement('li');
      item.textContent=`${evidence.activity} · ${evidence.confidence===undefined?'confidence unavailable — review needed':`${Math.round(evidence.confidence*100)}% sure`}${evidence.where?` · ${evidence.where}`:''}`;
      list.append(item);
    }
    box.append(list);
  }
  return box;
}
