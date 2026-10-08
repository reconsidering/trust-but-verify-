// Convert explicit owner decisions into confidence labels and a positive-only act inventory.
// Free-text notes and assistant scores never enter tracked labels.
import {claimOf} from './reviewed-claims.mjs';
import {SCORED_ACTS} from './scene-review-scope.mjs';
import {validateDeepFeedback} from './deep-review-validation.mjs';
export {validateDeepFeedback} from './deep-review-validation.mjs';
export function buildDeepReviewImports(batch,feedback){
 validateDeepFeedback(batch,feedback);
 const answers=Object.entries(feedback.readingAnswers).filter(([,a])=>a.verdict!==undefined).map(([id,a])=>{const r=batch.readings.find(r=>r.id===id);return {id,key:r.key,fic:r.fic,paragraph:r.para,sourceSha:batch.source.sourceSha,claim:claimOf(r,r.fic,batch.source.sourceSha),verdict:a.verdict,errors:a.errors,updatedAt:a.updatedAt};});
 const labels={}, ambiguousReadingKeys=[];
 const grouped=new Map();
 for(const a of answers){const rows=grouped.get(a.key)??[];rows.push(a);grouped.set(a.key,rows);}
 // A legacy sentence hash can recur in different paragraphs or produce different claims.
 // Preserve all decisions, but never let a later answer silently overwrite another claim.
 for(const[key,rows]of grouped){const identities=new Set(rows.map(a=>JSON.stringify(a.claim))),decisions=new Set(rows.map(a=>a.verdict));
  if(identities.size>1||decisions.size>1){labels[key]='unclear';ambiguousReadingKeys.push(key);}
  else labels[key]={correct:'ok',wrong:'wrong',uncertain:'unclear'}[rows[0].verdict];
 }

 const superseded=Object.fromEntries(Object.entries(labels).filter(([,v])=>v==='unclear').map(([key])=>[key,{reason:ambiguousReadingKeys.includes(key)?'Different claims or conflicting owner decisions share this legacy key.':'The owner left this claim uncertain.'}]));
 const windows=batch.windows.map(w=>{const reviews=Object.entries(feedback.actAnswers).filter(([,a])=>a.windowId===w.id&&a.verdict!==undefined).map(([id,a])=>({id,revision:a.revision,verdict:a.verdict,act:a.act,performer:a.performer,receiver:a.receiver,occurrence:a.occurrence,from:a.from,to:a.to,errors:a.errors}));return {id:w.id,fic:w.fic,sourceSha:batch.source.sourceSha,from:w.from,to:w.to,coverage:'positive-only',coverageReviewed:feedback.windowAnswers[w.id]?.complete===true,reviews,events:reviews.filter(r=>r.verdict==='correct'&&r.occurrence==='performed').map(({id,act,performer,receiver,from,to})=>({ownerActId:id,act,performer,receiver,from,to,scored:SCORED_ACTS.includes(act)}))};}).filter(w=>w.reviews.length||w.coverageReviewed);
 return {confidence:{made:new Date().toISOString().slice(0,10),how:'Explicit owner judgments on current engine readings from a full-text deep review. Acts and hints are labelled only when explicitly judged. Uncertain answers are excluded from training. No label is inferred from a missed act, assistant confidence, or an omission.',batchId:batch.batchId,engineCommit:batch.engineCommit,labels,answers,ambiguousReadingKeys,superseded},inventory:{schema:'engine-suspect-act-review/v1',batchId:batch.batchId,referenceCommit:batch.engineCommit,scope:{coverage:'positive-only; even complete windows never imply missing-act or hint negatives',occurrence:'only explicitly confirmed performed acts become events',confidenceTraining:'separate explicit per-reading decisions only',privateText:'free text and assistant scores excluded'},sources:[batch.source],windows}};
}
