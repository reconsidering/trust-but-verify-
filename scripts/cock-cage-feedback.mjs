import {validateDeepFeedback,buildDeepReviewImports} from './deep-review-feedback.mjs';
export function validateCageFeedback(batches,feedback){
 if(feedback?.schema!=='engine-cock-cage-review/v1'||!Array.isArray(feedback.batches))throw Error('This is not a cock-cage review export.');
 const seen=new Set();for(const answer of feedback.batches){const batch=batches.find(b=>b.batchId===answer?.batchId);if(!batch||seen.has(answer.batchId))throw Error('Unknown or repeated fic review.');seen.add(answer.batchId);validateDeepFeedback(batch,answer);}
 return feedback;
}
export function buildCageReviewImports(batches,feedback){validateCageFeedback(batches,feedback);return feedback.batches.map(answer=>{const batch=batches.find(b=>b.batchId===answer.batchId);return {batchId:batch.batchId,file:batch.source.file,...buildDeepReviewImports(batch,answer)};});}
