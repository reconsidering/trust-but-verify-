import type {ReviewSource} from './review-batch-data';
export type Verdict = 'correct' | 'wrong' | 'uncertain';
export type EngineReading = {claim:string; occurrence:string; kind:string; act:string; a:string; b?:string; role?:string; wants?:boolean; pattern:string; para:number; confidence:number|null; confidenceBasis:string; displayedConfidence:number|null};
export type ClaudeItem = {
 id:string; key:string; fic:string; title:string; paragraph:number; locations:number[]; evidence:{from:number;to:number;target:number}[];
 historical:{source:'claude';dates:string[];label:Verdict;path:string;record:Record<string,unknown>;original:{claim:string;occurrence:string;act:string|null;a:string;b:string|null;role:string|null};replayVerified:boolean;confidence:number|null;confidenceBasis:string};
 activeLabels:{source:string;verdict:Verdict;identityMatches:boolean;seen:string[];weight:number|null}[];hasLaterOwnerReview:boolean;changed:boolean;current:EngineReading[];priority:number;
 proposal:{revision:string;originalVerdict:Verdict;currentVerdict:Verdict;pastLabel:'keep'|'replace'|'uncertain';reading:string;rationale:string;confidence:number;errors:string[];reviewBasis:string};
};
export type ClaudeBatch = {schema:'claude-label-review/v1';batchId:string;engineCommit:string;historicalCommit:string;created:string;sources:ReviewSource[];statistics:{records:number;fics:number;distinctParagraphs:number;archivedReplayVerified:number;noSamePatternCurrentReading:number;laterOwnerReview:number;proposedLabelChanges:number;notSure:number;counts:Record<string,number>};items:ClaudeItem[]};
export type ClaudeAnswer = {proposalReview?:'agree'|'disagree'|'uncertain';originalVerdict?:Verdict;currentVerdict?:Verdict;pastLabel?:'keep'|'replace'|'uncertain';context:string;errors:string[];updatedAt:string};
const verdicts=['correct','wrong','uncertain'];
const score=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;
export function validateClaudeBatch(batch:ClaudeBatch):ClaudeBatch {
 if(batch?.schema!=='claude-label-review/v1'||!batch.batchId||!Array.isArray(batch.items)||batch.items.length!==662||!Array.isArray(batch.sources)||batch.sources.length!==12||! /^[a-f0-9]{40}$/.test(batch.engineCommit)||! /^[a-f0-9]{40}$/.test(batch.historicalCommit))throw Error('Incomplete Claude-label review data.');
 const ids=new Set<string>(),keys=new Set<string>();
 for(const r of batch.items){const s=batch.sources.find(s=>s.file===r.fic),p=r.proposal;
  if(!s||ids.has(r.id)||keys.has(r.key)||!r.key||!r.title||!Number.isInteger(r.paragraph)||r.paragraph<0||r.paragraph>=s.paragraphCount||!p?.revision||!p.reading||!p.rationale||!score(p.confidence)||!verdicts.includes(p.originalVerdict)||!verdicts.includes(p.currentVerdict)||!['keep','replace','uncertain'].includes(p.pastLabel)||!Array.isArray(p.errors)||p.errors.some(e=>typeof e!=='string')||r.historical?.source!=='claude'||!['correct','wrong'].includes(r.historical.label)||!r.historical.original?.claim||(r.historical.confidence!==null&&!score(r.historical.confidence))||!r.historical.dates.length||r.historical.dates.some(d=>!['2026-10-04','2026-10-05'].includes(d))||typeof r.historical.replayVerified!=='boolean'||!r.evidence.length||!r.locations.includes(r.paragraph)||r.evidence.some(e=>!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<0||e.to>=s.paragraphCount||e.from>e.target||e.to<e.target||!r.locations.includes(e.target)))throw Error('Invalid historical claim or proposal.');
  for(const h of r.current)if(!h.claim||!h.confidenceBasis||(h.confidence!==null&&!score(h.confidence))||(h.displayedConfidence!==null&&!score(h.displayedConfidence))||!r.locations.includes(h.para))throw Error('Invalid current engine reading.');
  const expected=p.originalVerdict==='uncertain'?'uncertain':p.originalVerdict===r.historical.label?'keep':'replace';if(p.pastLabel!==expected)throw Error('Historical label decision contradicts its claim verdict.');
  ids.add(r.id);keys.add(r.key);
 }
 return batch;
}
export function agreeWithAssessment(row:ClaudeItem,previous?:ClaudeAnswer,now=new Date().toISOString()):ClaudeAnswer {
 const automatic=`Proposed reading: ${row.proposal.reading}\nReason: ${row.proposal.rationale}`;
 const context=previous?.context??'';
 return {...previous,proposalReview:'agree',originalVerdict:row.proposal.originalVerdict,currentVerdict:row.proposal.currentVerdict,pastLabel:row.proposal.pastLabel,errors:[...new Set([...(previous?.errors??[]),...row.proposal.errors])],context:context.includes(automatic)?context:[context,automatic].filter(Boolean).join('\n\n'),updatedAt:now};
}
export function disagreeWithAssessment(previous?:ClaudeAnswer,now=new Date().toISOString()):ClaudeAnswer {
 // Disagreement with the assistant is not a label for either engine claim. Preserve authored notes.
 return {...previous,proposalReview:'disagree',originalVerdict:undefined,currentVerdict:undefined,pastLabel:undefined,context:previous?.context??'',errors:previous?.errors??[],updatedAt:now};
}
export function validClaudeAnswer(a:unknown):a is ClaudeAnswer {
 if(!a||typeof a!=='object')return false;const v=a as ClaudeAnswer;
 return (v.proposalReview===undefined||['agree','disagree','uncertain'].includes(v.proposalReview))&&(v.originalVerdict===undefined||verdicts.includes(v.originalVerdict))&&(v.currentVerdict===undefined||verdicts.includes(v.currentVerdict))&&(v.pastLabel===undefined||['keep','replace','uncertain'].includes(v.pastLabel))&&typeof v.context==='string'&&Array.isArray(v.errors)&&v.errors.every(e=>typeof e==='string')&&typeof v.updatedAt==='string'&&Number.isFinite(Date.parse(v.updatedAt));
}
export function exportClaudeAnswers(batch:ClaudeBatch,answers:Record<string,ClaudeAnswer>) {
 return {schema:batch.schema,batchId:batch.batchId,engineCommit:batch.engineCommit,historicalCommit:batch.historicalCommit,exportedAt:new Date().toISOString(),answers:batch.items.filter(r=>answers[r.id]).map(r=>({id:r.id,key:r.key,fic:r.fic,paragraph:r.paragraph,sourceSha:batch.sources.find(s=>s.file===r.fic)!.sourceSha,proposalRevision:r.proposal.revision,historicalLabel:r.historical.label,historicalRecord:r.historical.record,...answers[r.id]}))};
}
export function importClaudeAnswers(batch:ClaudeBatch,value:unknown,current:Record<string,ClaudeAnswer>):number {
 const p=value as ReturnType<typeof exportClaudeAnswers>;
 if(!p||p.schema!==batch.schema||p.batchId!==batch.batchId||p.engineCommit!==batch.engineCommit||p.historicalCommit!==batch.historicalCommit||!Array.isArray(p.answers))throw Error('These answers belong to a different review batch.');
 const ids=new Set<string>();for(const a of p.answers){const r=batch.items.find(r=>r.id===a.id),s=r&&batch.sources.find(s=>s.file===r.fic);
  if(!r||ids.has(a.id)||a.key!==r.key||a.fic!==r.fic||a.paragraph!==r.paragraph||a.sourceSha!==s?.sourceSha||a.proposalRevision!==r.proposal.revision||a.historicalLabel!==r.historical.label||JSON.stringify(a.historicalRecord)!==JSON.stringify(r.historical.record)||!validClaudeAnswer(a))throw Error('An answer does not match its original claim.');ids.add(a.id);
 }
 let count=0;for(const a of p.answers)if(!current[a.id]||a.updatedAt>current[a.id].updatedAt){current[a.id]={proposalReview:a.proposalReview,originalVerdict:a.originalVerdict,currentVerdict:a.currentVerdict,pastLabel:a.pastLabel,context:a.context,errors:[...a.errors],updatedAt:a.updatedAt};count++;}return count;
}
