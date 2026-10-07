import {mountMissedReview} from './missed-scene-review';
import type {SceneBatch} from './missed-scene-data';
try {
  const response=await fetch('./missed-scenes.json');
  if (!response.ok) throw Error('The missed-scene batch could not be loaded. Try reloading.');
  await mountMissedReview(await response.json() as SceneBatch);
} catch(error) {document.getElementById('status')!.textContent=error instanceof Error?error.message:'The review could not be opened.';}
