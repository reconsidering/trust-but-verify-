// Reviewer agreement is evidence about one unchanged claim, never an inferred correction.
import {actualActOf} from './scene-review-scope.mjs';
import {actParticipants} from './replay-scene-reviews.mjs';
const canon=s=>(s??'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
export function semanticAct(claim){
 const act=claim.act==='face-fucking'?'blowjob (face-fucking)':claim.act;
 const hit={...claim,act};const category=actualActOf(hit);if(!category)return;
 return {act:category,performer:actParticipants(hit)[0],receiver:actParticipants(hit)[1]};
}
export function claimIdentity(c){return JSON.stringify([c.fic,c.sourceSha,c.paragraph,c.pattern,c.kind,c.act,canon(c.a),canon(c.b),c.role??'']);}
export function reviewerGroup({owner,claude,chatgpt}){
 claude=['correct','wrong'].includes(claude)?claude:undefined;chatgpt=['correct','wrong'].includes(chatgpt)?chatgpt:undefined;
 if(['correct','wrong'].includes(owner))return {group:'Owner',verdict:owner};
 if(claude&&chatgpt)return claude===chatgpt?{group:'Both',verdict:claude}:{group:'Disagreement',verdict:null};
 if(claude)return {group:'Claude',verdict:claude};if(chatgpt)return {group:'ChatGPT',verdict:chatgpt};
 return {group:'Unreviewed',verdict:null};
}
export function inventoryReviewer(event,claims){
 if(['owner','Owner'].includes(event.reviewer))return 'Owner';
 if(['partial / assistant','Partial owner / ChatGPT'].includes(event.reviewer))return 'Partial owner / ChatGPT';
 // A joint rejection of a wrong engine claim does not validate its proposed replacement act.
 const supports=group=>claims.some(c=>c.group===group&&c.verdict==='correct'&&c.claim.fic===event.fic&&c.claim.sourceSha===event.sourceSha&&c.claim.paragraph>=event.from&&c.claim.paragraph<=event.to&&c.semantic?.act===event.act&&canon(c.semantic.performer)===canon(event.performer)&&canon(c.semantic.receiver)===canon(event.act==='Solo masturbation'?'':event.receiver));
 if(supports('Owner'))return 'Owner';
 return supports('Both')?'Both':'ChatGPT';
}
