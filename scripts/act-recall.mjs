// Recall of independently inventoried performed acts; never training labels.
import {actualActOf,SCORED_ACTS} from './scene-review-scope.mjs';
import {actParticipants} from './replay-scene-reviews.mjs';
const canon=s=>(typeof s==='string'?s:'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const aliases=new Map([
 ['anal sex','Anal penetration (penis)'],['anal','Anal penetration (penis)'],['anal intercourse','Anal penetration (penis)'],['anal cock-warming','Anal penetration (penis)'],['anal intercourse / knotting','Anal penetration (penis)'],
 ['blowjob','Blowjob'],['fellatio','Blowjob'],['face-fucking','Blowjob'],['fellatio / face-fucking','Blowjob'],['oral penile stimulation','Blowjob'],['oral cock-warming','Blowjob'],['penile-oral-contact','Blowjob'],
 ['rimming','Rimming'],['cunnilingus','Cunnilingus'],['vaginal sex','Vaginal penetration (penis)'],['vaginal intercourse','Vaginal penetration (penis)'],
 ['fingering','Fingering'],['anal fingering','Fingering'],['anal-fingering','Fingering'],['vaginal fingering','Fingering'],['self-fingering','Fingering'],['anal fingering / prostate massage','Fingering'],
 ['anal toy act','Toy insertion'],['anal toy insertion','Toy insertion'],['self anal toy insertion','Toy insertion'],['toy penetration','Toy insertion'],
 ['handjob','Handjob'],['manual','Handjob'],['manual penis stimulation','Handjob'],['masturbation','Solo masturbation'],['manual self-stimulation','Solo masturbation']
]);
export function inventoryEvents(doc,file) {
 const events=[],excluded=[];
 if(doc.windows) {
  for(const w of doc.windows)for(const [i,e] of (w.events??[]).entries()) {
   const row={inventory:file,batchId:doc.batchId,id:w.id,eventId:e.ownerActId??i,fic:w.fic,sourceSha:w.sourceSha,from:e.from,to:e.to,act:e.act,performer:e.performer,receiver:e.receiver,reviewer:doc.schema==='engine-partial-sex-act-review/v1'?'partial / assistant':'owner',coverage:w.coverage??'reviewed window'};
   if(e.scored===false||!SCORED_ACTS.includes(e.act))excluded.push({...row,reason:'outside explicit act scope'});else events.push(row);
  }
 } else if(doc.fics) {
  for(const f of doc.fics)for(const [i,a] of (f.acts??[]).entries()) {
   const row={inventory:file,batchId:file,id:a.id??i,eventId:i,fic:f.file,sourceSha:f.sourceSha,from:a.from,to:a.to,act:aliases.get(a.act),originalAct:a.act,performer:a.actor??a.a,receiver:a.recipient??a.b??(/^self[- ]/.test(a.act)?a.actor??a.a:undefined),reviewer:'AI',coverage:'selected deep-dive inventory',paragraphHashes:a.paragraphHashes};
   if(f.safety?.eligible!==true||a.labelEligible===false||!(a.confidence>=.95)||!['performed','current'].includes(a.occurrence)||!row.act)excluded.push({...row,reason:'ineligible, uncertain, historical, non-current or unsupported act'});else events.push(row);
  }
 }
 return {events,excluded};
}
export function scoreActRecall(events,snapshots,adjudication=new Map()) {
 const unique=new Map(),duplicates=[];
 for(const e of events) {
  const key=JSON.stringify([e.fic,e.sourceSha,e.from,e.to,e.act,canon(e.performer),canon(e.receiver)]);
  if(unique.has(key)) {duplicates.push({fic:e.fic,from:e.from,to:e.to,inventory:e.inventory});if(e.reviewer==='owner')unique.set(key,e);} else unique.set(key,e);
 }
 const results=[];
 for(const e of unique.values()) {
  const snap=snapshots.get(e.fic);let status='missed';let hits=[];
  const reason=adjudication.get(`${e.batchId}:${e.id}:${e.eventId}`);
  if(reason)status='needs-adjudication';
  else if(!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<0||e.from>e.to||typeof e.performer!=='string'||!e.performer.trim()||(e.act!=='Solo masturbation'&&(typeof e.receiver!=='string'||!e.receiver.trim())))status='invalid-event';
  else if(!snap)status='source-unavailable';
  else if(snap.sourceSha!==e.sourceSha||!(snap.paragraphVerified || (Array.isArray(e.paragraphHashes)&&e.paragraphHashes.length===e.to-e.from+1&&JSON.stringify(e.paragraphHashes)===JSON.stringify(snap.paragraphHashes?.slice(e.from,e.to+1)))))status='source-unverified';
  else {
   const people=h=>{const actual=actParticipants(h).map(canon),expected=[e.performer,e.act==='Solo masturbation'?'':e.receiver].map(canon);return actual.every((p,i)=>p===expected[i])||(h.act==='mutual handjob'&&actual.every((p,i)=>p===expected[1-i]));};
   const exact=h=>actualActOf(h)===e.act&&people(h);
   const range=snap.hits.filter(h=>h.para>=e.from&&h.para<=e.to);
   hits=range.filter(exact);
   if(hits.length)status='matched';
   else if(range.some(h=>actualActOf(h)===e.act)){status='wrong-participants';hits=range.filter(h=>actualActOf(h)===e.act);}
   else if(range.some(h=>actualActOf(h)&&people(h))){status='wrong-act';hits=range.filter(h=>actualActOf(h)&&people(h));}
   else if(range.some(h=>!actualActOf(h)&&people(h))){status='hint-only';hits=range.filter(h=>!actualActOf(h)&&people(h));}
   else {hits=snap.hits.filter(h=>h.para>=e.from-1&&h.para<=e.to+1&&exact(h));if(hits.length)status='nearby-only';}
  }
  results.push({...e,status,...(reason?{reason}:{}),matches:hits.map(h=>({para:h.para,pattern:h.via,act:h.act,kind:h.kind,participants:actParticipants(h)}))});
 }
 const skipped=new Set(['source-unavailable','source-unverified','needs-adjudication','invalid-event']);
 const summarize=reviewer=>SCORED_ACTS.map(act=>{
  const all=results.filter(r=>r.act===act&&(!reviewer||r.reviewer===reviewer));const scored=all.filter(r=>!skipped.has(r.status));
  const count=s=>scored.filter(r=>r.status===s).length;
  return {act,expected:scored.length,matched:count('matched'),recall:scored.length?count('matched')/scored.length:null,wrongParticipants:count('wrong-participants'),wrongAct:count('wrong-act'),hintOnly:count('hint-only'),nearbyOnly:count('nearby-only'),missed:count('missed'),excluded:all.length-scored.length};
 });
 return {schema:'engine-act-recall-report/v1',scope:'Strict inventory-event recall, not whole-corpus scene recall. A performed reading must fall inside the cited event range and have the correct act and participants. Nearby matches do not count. Hints and absent acts never become training labels. Exact duplicate events are collapsed; overlapping ranges may still describe the same scene.',summary:summarize(),byReviewer:Object.fromEntries(['owner','AI','partial / assistant'].map(r=>[r,summarize(r)])),results,duplicates};
}
export function recallMarkdown(report) {
 const table=rows=>['| Act | Expected | Correct | Recall | Wrong people | Wrong act | Hint only | Nearby only | Missed | Excluded |','|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',...rows.map(r=>`| ${r.act} | ${r.expected} | ${r.matched} | ${r.recall===null?'—':(100*r.recall).toFixed(1)+'%'} | ${r.wrongParticipants} | ${r.wrongAct} | ${r.hintOnly} | ${r.nearbyOnly} | ${r.missed} | ${r.excluded} |`)];
 return ['# Per-act recall', '',`Engine: ${report.engineCommit}. Inventory fingerprint: ${report.inventoryFingerprint}.`, '',report.scope,'','Anal/finger/toy entrance contact counts under AGENTS.md; the legacy category names say penetration/insertion. This report evaluates internal surviving readings, not whether every act appears in the displayed scene list. Historical events and unsupported categories are excluded, not counted as misses.','',...table(report.summary),...Object.entries(report.byReviewer).flatMap(([r,rows])=>['',`## ${r}`, '',...table(rows)]),'','## Events needing attention','',...report.results.filter(r=>r.status!=='matched').map(r=>`- ${r.fic}, paragraphs ${r.from}–${r.to}: ${r.act}; ${r.performer} → ${r.receiver||'self'}; **${r.status}** (${r.inventory}, ${r.id}).`),''].join('\n');
}
export function recallHistoryMarkdown(history) {
 return ['# Per-act recall history','','Compare only runs with the same inventory/scoring fingerprints, reviewed-event denominator and source coverage. These are selected inventory events, not all scenes in all fics.','','| Date (UTC) | Engine | Inventory | Scoring | Act | Expected | Correct | Recall |','|---|---|---|---|---|---:|---:|---:|',...history.flatMap(run=>run.summary.map(r=>`| ${run.generatedAt.slice(0,10)} | ${run.engineCommit.slice(0,7)} | ${run.inventoryFingerprint.slice(0,8)} | ${run.scoringFingerprint?.slice(0,8)??'unrecorded'} | ${r.act} | ${r.expected} | ${r.matched} | ${r.recall===null?'—':(100*r.recall).toFixed(1)+'%'} |`)),''].join('\n');
}
