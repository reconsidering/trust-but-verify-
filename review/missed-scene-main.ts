import {mountMissedReview} from './missed-scene-review';
import {validateSceneProposals,type SceneBatch} from './missed-scene-data';
try {
  const response=await fetch('./missed-scenes.json');
  if (!response.ok) throw Error('The missed-scene batch could not be loaded. Try reloading.');
  const batch=await response.json() as SceneBatch;
  const proposed=await fetch('./missed-scene-proposals.json');
  if (!proposed.ok) throw Error('The proposed readings could not be loaded. Try reloading.');
  await mountMissedReview(batch,validateSceneProposals(batch,await proposed.json()));
} catch(error) {document.getElementById('status')!.textContent=error instanceof Error?error.message:'The review could not be opened.';}
