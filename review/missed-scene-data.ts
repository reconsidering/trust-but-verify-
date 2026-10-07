import type { ReviewSource } from './review-batch-data';
export const ACTS = ['Anal penetration (penis)', 'Blowjob', 'Rimming', 'Cunnilingus', 'Vaginal penetration (penis)', 'Fingering', 'Toy insertion', 'Handjob', 'Solo masturbation', 'Kissing / body rubbing', 'Other'] as const;
export const OCCURRENCES = ['Happens in this scene', 'Actually happened earlier / memory', 'Wanted / proposed', 'Imagined / conditional', 'Unclear'] as const;
export type SceneRow = {id:string;fic:string;from:number;to:number;windowSha:string;lane:'random'|'discovery'};
export type SceneSource = ReviewSource & {wordCount:number;lengthBand:string;participants:string[];eligibleWindows:number;cueWindows:number;style:{dialogueFraction:number;meanParagraphWords:number}};
export type SceneBatch = {schema:'engine-missed-scene-review/v1';batchId:string;referenceCommit:string;selection:Record<string,unknown>;sources:SceneSource[];rows:SceneRow[]};
export type SceneEvent = {act:typeof ACTS[number]|'';occurrence:typeof OCCURRENCES[number];performer:string;receiver:string;from:number;to:number};
export type SceneAnswer = {verdict?:'acts'|'none'|'uncertain';complete:boolean;events:SceneEvent[];flags:string[];context:string;updatedAt:string};
export const emptyAnswer = ():SceneAnswer => ({complete:false,events:[],flags:[],context:'',updatedAt:new Date().toISOString()});
export function eventComplete(event:SceneEvent):boolean {
  return ACTS.includes(event.act as typeof ACTS[number]) && !!event.performer.trim() && (event.act==='Solo masturbation'||!!event.receiver.trim());
}
export function validSceneAnswer(value:unknown,row:SceneRow):value is SceneAnswer {
  if (!value||typeof value!=='object') return false;
  const a=value as SceneAnswer;
  return (a.verdict===undefined||['acts','none','uncertain'].includes(a.verdict)) && typeof a.complete==='boolean' && typeof a.context==='string' && typeof a.updatedAt==='string' && Number.isFinite(Date.parse(a.updatedAt)) && Array.isArray(a.flags) && a.flags.every(f=>typeof f==='string') && Array.isArray(a.events) && a.events.every(e=>e && typeof e==='object' && (e.act===''||ACTS.includes(e.act)) && OCCURRENCES.includes(e.occurrence) && typeof e.performer==='string' && typeof e.receiver==='string' && Number.isInteger(e.from) && Number.isInteger(e.to) && e.from>=row.from && e.to<=row.to && e.from<=e.to) && (!a.complete || (a.verdict==='none' ? !a.events.length : a.verdict==='acts' && a.events.length>0 && a.events.every(eventComplete)));
}
export function importSceneAnswers(batch:SceneBatch,payload:unknown,current:Record<string,SceneAnswer>):number {
  const p=payload as {schema?:string;batchId?:string;referenceCommit?:string;answers?:(SceneAnswer&SceneRow&{sourceSha:string})[]};
  if (p?.schema!==batch.schema||p.batchId!==batch.batchId||p.referenceCommit!==batch.referenceCommit||!Array.isArray(p.answers)) throw Error('These answers belong to a different missed-scene batch.');
  const seen=new Set<string>();
  for (const a of p.answers) {
    const row=batch.rows.find(r=>r.id===a.id),source=row&&batch.sources.find(s=>s.file===row.fic);
    if (!row||seen.has(a.id)||a.fic!==row.fic||a.from!==row.from||a.to!==row.to||a.windowSha!==row.windowSha||a.lane!==row.lane||a.sourceSha!==source?.sourceSha||!validSceneAnswer(a,row)) throw Error('An answer does not match its passage, or a completed answer is incomplete.');
    seen.add(a.id);
  }
  let count=0;
  for (const a of p.answers) if (!current[a.id]||Date.parse(a.updatedAt)>Date.parse(current[a.id].updatedAt)) {
    current[a.id]={verdict:a.verdict,complete:a.complete,events:a.events.map(e=>({...e})),flags:[...a.flags],context:a.context,updatedAt:a.updatedAt};count++;
  }
  return count;
}
