import type {DeepBatch,DeepFeedback} from '../review/deep-review-data';
export type CageFeedback={schema:'engine-cock-cage-review/v1';batches:DeepFeedback[]};
export function validateCageFeedback(batches:DeepBatch[],feedback:unknown):CageFeedback;
export function buildCageReviewImports(batches:DeepBatch[],feedback:CageFeedback):Array<{batchId:string;file:string;confidence:Record<string,any>;inventory:Record<string,any>}>;
