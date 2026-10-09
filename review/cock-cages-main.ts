import {mountCockCageReview,type CageIndex} from './cock-cage-review';
import type {DeepBatch} from './deep-review-data';
try{
 const fetchJSON=async(path:string)=>{const response=await fetch(path);if(!response.ok)throw Error('The review data could not be loaded. Reload this page.');return response.json();};
 const index=await fetchJSON('./cock-cage-index.json') as CageIndex;
 if(index.schema!=='cock-cage-review-index/v1')throw Error('Unsupported review collection.');
 const batches=await Promise.all(index.fics.map(f=>fetchJSON('./'+f.manifest))) as DeepBatch[];
 await mountCockCageReview(index,batches);
}catch(e){document.getElementById('status')!.textContent=e instanceof Error?e.message:'The review could not be opened.';}
