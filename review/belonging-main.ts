import {mountDeepReview} from './negotiation-review';
import type {DeepBatch} from './deep-review-data';
try {const response=await fetch('./belonging.json');if(!response.ok)throw Error('The review data could not be loaded. Reload this page.');await mountDeepReview(await response.json() as DeepBatch);}catch(e){document.getElementById('status')!.textContent=e instanceof Error?e.message:'The review could not be opened.';}
