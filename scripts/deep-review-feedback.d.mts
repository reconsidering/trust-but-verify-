import type {DeepBatch, DeepFeedback} from '../review/deep-review-data';
export function validateDeepFeedback(batch:DeepBatch, feedback:unknown):DeepFeedback;
export function buildDeepReviewImports(batch:DeepBatch, feedback:DeepFeedback):{confidence:any;inventory:any};
