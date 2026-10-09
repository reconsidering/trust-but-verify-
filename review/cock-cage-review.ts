import {mountDeepReview} from './negotiation-review';
import {storyBytes,verifyStory} from './review-batch-data';
import {blankFeedback,type DeepBatch,type DeepFeedback} from './deep-review-data';
import {validateDeepFeedback} from '../scripts/deep-review-validation.mjs';
import {validateCageFeedback,type CageFeedback} from '../scripts/cock-cage-feedback.mjs';
export type CageIndex={schema:'cock-cage-review-index/v1';engineCommit:string;totalPassages:number;fics:{id:string;title:string;tags:string[];tag:string;manifest:string;passages:number;readings:number;proposals:number}[]};
export async function mountCockCageReview(index:CageIndex,batches:DeepBatch[],initialStories=new Map<string,string[]>()){
 const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
 const stories=new Map(initialStories),answers=new Map<string,DeepFeedback>();let page:Awaited<ReturnType<typeof mountDeepReview>>|undefined;
 const selector=el<HTMLSelectElement>('fic-selector');selector.replaceChildren();
 for(const f of index.fics){const option=document.createElement('option');option.value=f.id;option.textContent=`${f.title} · ${f.passages} passages`;selector.append(option);}
 let selected=index.fics.find(f=>f.id===new URLSearchParams(location.search).get('fic'))??index.fics[0];
 if(!selected||batches.length!==index.fics.length)throw Error('The fic reviews could not be loaded.');
 const batchFor=(id:string)=>batches[index.fics.findIndex(f=>f.id===id)];
 for(const b of batches){try{const saved=localStorage.getItem('fic-deep-review:'+b.batchId);if(saved)answers.set(b.batchId,validateDeepFeedback(b,JSON.parse(saved)));}catch{el('collection-status').textContent='Some browser answers could not be restored. Restore your exported JSON if needed.';}}
 const remember=()=>{if(page)answers.set(batchFor(selected.id).batchId,page.getFeedback());};
 const collect=():CageFeedback=>{remember();return validateCageFeedback(batches,structuredClone({schema:'engine-cock-cage-review/v1',batches:batches.map(b=>answers.get(b.batchId)??blankFeedback(b))}));};
 const snapshot=()=>new File([JSON.stringify(collect(),null,2)],'cock-cage-review-answers.json',{type:'application/json'});
 async function show(id:string){remember();selected=index.fics.find(f=>f.id===id)!;selector.value=id;const b=batchFor(id);
  el('verdicts').replaceChildren();el<HTMLSelectElement>('filter').value='all';el('fic-heading').textContent=b.source.title+' · cock-cage review';el('tag-note').textContent='Eligibility tag: '+selected.tags.join(', ')+'. The tag does not establish any particular action.';
  page=await mountDeepReview(b,stories.get(b.source.file),answers.get(b.batchId));
  const url=new URL(location.href);url.searchParams.set('fic',id);history.replaceState(null,'',url);
  el<HTMLInputElement>('story-file').onchange=async()=>{const file=el<HTMLInputElement>('story-file').files?.[0];if(!file)return;el('status').textContent='Checking the fic files locally…';try{let added=0;for await(const bytes of storyBytes(file)){const found=await verifyStory(bytes,batches.map(b=>b.source));if(found){stories.set(found.source.file,found.paras);added++;}}if(!added)throw Error('No matching cock-cage fic was found. Use the original sample ZIP or one of the listed HTML files.');await show(selected.id);el('status').textContent=`Loaded ${added} matching fic file(s) locally. ${stories.size} of ${batches.length} available; you can switch fics without uploading again.`;}catch(e){el('status').textContent=(e as Error).message;}};
  el('export').textContent='Export all fic answers';el('export').onclick=()=>{try{const file=snapshot(),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);el('status').textContent='All fic answers exported in one JSON file.';}catch(e){el('status').textContent=(e as Error).message;}};
  el('share').onclick=async()=>{try{const file=snapshot();if(navigator.canShare&&!navigator.canShare({files:[file]}))throw Error('Use Export all fic answers on this browser.');await navigator.share({files:[file],title:'Cock-cage review answers'});}catch(e){if((e as Error).name!=='AbortError')el('status').textContent=(e as Error).message;}};
  el<HTMLInputElement>('answers-file').onchange=async()=>{const file=el<HTMLInputElement>('answers-file').files?.[0];if(!file)return;try{const imported=validateCageFeedback(batches,JSON.parse(await file.text()));remember();for(const incoming of imported.batches){const b=batches.find(b=>b.batchId===incoming.batchId)!,current=answers.get(b.batchId)??blankFeedback(b);for(const kind of ['readingAnswers','actAnswers','windowAnswers'] as const)for(const[id,a]of Object.entries(incoming[kind])){const old=current[kind][id];if(!old||a.updatedAt>old.updatedAt)(current[kind] as Record<string,unknown>)[id]=a;}answers.set(b.batchId,current);try{localStorage.setItem('fic-deep-review:'+b.batchId,JSON.stringify(current));}catch{/* In-memory answers remain exportable. */}}page=undefined;await show(selected.id);el('status').textContent='Answers restored for all fics; only newer decisions replaced existing answers.';}catch(e){el('status').textContent=(e as Error).message;}};
 }
 selector.onchange=()=>void show(selector.value);await show(selected.id);
 return {getFeedback:collect,selectFic:show};
}
