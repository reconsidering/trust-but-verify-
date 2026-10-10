// Compare one fixed, source-verified denominator; no model fitting or label changes.
import {scoreActRecall} from './act-recall.mjs';
import {semanticAct} from './review-provenance.mjs';
import {baseVia} from './right-set.mjs';
const canon=s=>(s??'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
export const REVIEWER_GROUPS=['Owner','Claude','ChatGPT','Both'];
export function commonEvidence(evidence,versions) {
 const last=versions.at(-1).snapshots,excluded=[];
 function verified(row,isClaim){
  const fic=isClaim?row.claim.fic:row.fic,source=isClaim?row.claim.sourceSha:row.sourceSha;
  const snap=last.get(fic),from=isClaim?row.claim.paragraph:row.from,to=isClaim?from:row.to;
  let reason;
  if(!snap||versions.some(v=>!v.snapshots.has(fic)))reason='source unavailable in a historical run';
  else if(versions.some(v=>v.snapshots.get(fic).sourceSha!==source))reason='source checksum mismatch';
  else if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>=snap.paragraphHashes.length)reason='invalid citation';
  else if(versions.some(v=>v.snapshots.get(fic).paragraphSha!==snap.paragraphSha))reason='paragraph extraction differs between engine versions';
  else if(!(row.sourceParagraphSha===snap.paragraphSha||(isClaim&&row.citationHash===snap.paragraphHashes[from])||(!isClaim&&row.paragraphHashes?.length===to-from+1&&JSON.stringify(row.paragraphHashes)===JSON.stringify(snap.paragraphHashes.slice(from,to+1)))))reason='citation extraction not independently verified';
  if(reason)excluded.push({id:row.id,fic,type:isClaim?'claim':'inventory event',reason});
  return !reason;
 }
 return {events:evidence.events.filter(e=>verified(e,false)),claims:evidence.claims.filter(c=>c.verdict&&verified(c,true)),excluded,disagreements:evidence.claims.filter(c=>c.group==='Disagreement').length};
}
export function evaluateHistory(common,versions) {
 const runs=versions.map(version=>{
  const snapshots=new Map([...version.snapshots].map(([fic,s])=>[fic,{...s,paragraphVerified:true}]));
  const inventory=scoreActRecall(common.events,snapshots);
  const byReviewer=Object.fromEntries(REVIEWER_GROUPS.map(group=>[group,scoreActRecall(common.events.filter(e=>e.reviewer===group),snapshots).summary]));
  const claims=common.claims.map(c=>{
   const hits=snapshots.get(c.claim.fic).hits.filter(h=>h.para===c.claim.paragraph);
   const same=h=>{const a=semanticAct(h);return a?.act===c.semantic.act&&canon(a.performer)===canon(c.semantic.performer)&&canon(a.receiver)===canon(c.semantic.receiver);};
   return {id:c.id,group:c.group,verdict:c.verdict,act:c.semantic.act,acceptedActCovered:c.verdict==='correct'&&hits.some(same),rejectedOriginalSurvives:c.verdict==='wrong'&&hits.some(h=>same(h)&&baseVia(h.via??'')===baseVia(c.claim.pattern??''))};
  });
  const claimSummary=Object.fromEntries(REVIEWER_GROUPS.map(group=>{
   const rs=claims.filter(r=>r.group===group),accepted=rs.filter(r=>r.verdict==='correct'),rejected=rs.filter(r=>r.verdict==='wrong');
   return [group,{accepted:accepted.length,covered:accepted.filter(r=>r.acceptedActCovered).length,rejected:rejected.length,survivingRejected:rejected.filter(r=>r.rejectedOriginalSurvives).length}];
  }));
  return {ref:version.ref,date:version.date,summary:inventory.summary,byReviewer,claimSummary,results:inventory.results,claims};
 });
 return {schema:'fixed-reviewed-history-report/v1',reviewerGroups:REVIEWER_GROUPS,scope:'Strict recall on selected independently inventoried events, not whole-corpus recall. Claude has no independent inventory denominator. Both means equal judgments on the same source-bound claim. Known-claim survival is a separate, detection-selected measure; old rejections may predate current contact conventions.',events:common.events,claimEvidence:common.claims,excluded:common.excluded,disagreements:common.disagreements,runs};
}
