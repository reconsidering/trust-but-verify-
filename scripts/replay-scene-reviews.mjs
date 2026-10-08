// Replay positive act evidence without deriving labels for unreviewed acts or hints.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {actualActOf,SCORED_ACTS} from './scene-review-scope.mjs';
const canon = name => (name ?? '').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
export function actParticipants(hit) {
  if(hit.kind==='solo'||hit.kind==='masturbation') return [hit.a,/himself|herself|themselves/.test(hit.act)?hit.a:''];
  if(hit.act.startsWith('blowjob')||hit.role==='bottom') return [hit.b ?? '',hit.a];
  return [hit.a,hit.b ?? ''];
}
export function replayInventories(inventories,snapshots,excluded=new Map()) {
  const results=[];
  for(const inventory of inventories) for(const w of inventory.windows) {
    const snap=snapshots.get(w.fic);
    if(inventory.schema==='engine-sex-act-inventory/v1' && w.events.length===0 &&
       w.coverage!=='positive-only' && snap?.sourceSha===w.sourceSha) {
      for(const hit of snap.hits.filter(h=>h.para>=w.from&&h.para<=w.to&&actualActOf(h))) {
        results.push({batchId:inventory.batchId,id:w.id,fic:w.fic,from:w.from,to:w.to,
          act:actualActOf(hit),performer:actParticipants(hit)[0],receiver:actParticipants(hit)[1],
          status:'unexpected-performed-act',pattern:hit.via,para:hit.para});
      }
    }
    for(const [index,event] of w.events.entries()) {
      if(event.scored===false||!SCORED_ACTS.includes(event.act)) continue;
      const row={batchId:inventory.batchId,id:w.id,eventId:event.ownerActId ?? index,fic:w.fic,
        from:event.from,to:event.to,act:event.act,performer:event.performer,receiver:event.receiver,
        provenance:event.provenance ?? 'owner accepted',coverage:w.coverage ?? 'completed window'};
      const exclusion=excluded.get(`${inventory.batchId}:${w.id}:${event.ownerActId ?? index}`);
      if(exclusion){results.push({...row,status:'needs-adjudication',reason:exclusion});continue;}
      if(!snap||snap.sourceSha!==w.sourceSha){results.push({...row,status:'source-unverified'});continue;}
      const samePeople=h=>actParticipants(h).map(canon).every((p,i)=>p===canon([event.performer,event.receiver][i]));
      const exact=h=>actualActOf(h)===event.act&&samePeople(h);
      const inRange=snap.hits.filter(h=>h.para>=event.from&&h.para<=event.to);
      const inWindow=snap.hits.filter(h=>h.para>=w.from&&h.para<=w.to);
      let status='missing';let candidates=[];
      if(inRange.some(exact)) {status='matched';candidates=inRange.filter(exact);}
      else if(inWindow.some(exact)){status='detected-elsewhere-in-window';candidates=inWindow.filter(exact);}
      else if(snap.hits.some(h=>h.para>=event.from-1&&h.para<=event.to+1&&exact(h))){status='citation-boundary';candidates=snap.hits.filter(h=>h.para>=event.from-1&&h.para<=event.to+1&&exact(h));}
      else if(inRange.some(h=>actualActOf(h)===event.act)){status='wrong-participants';candidates=inRange.filter(h=>actualActOf(h)===event.act);}
      else if(inRange.some(h=>actualActOf(h)&&samePeople(h))){status='wrong-act';candidates=inRange.filter(h=>actualActOf(h)&&samePeople(h));}
      else if(inRange.some(h=>!actualActOf(h)&&samePeople(h))){status='hint-or-context-only';candidates=inRange.filter(h=>!actualActOf(h)&&samePeople(h));}
      results.push({...row,status,matches:candidates.map(h=>({para:h.para,pattern:h.via,kind:h.kind,act:h.act,performer:actParticipants(h)[0],receiver:actParticipants(h)[1]}))});
    }
  }
  return {scope:'Positive-event coverage only; no absence or hint labels inferred. Counts are entries, not independent scenes.',
    totals:Object.fromEntries([...new Set(results.map(r=>r.status))].sort().map(s=>[s,results.filter(r=>r.status===s).length])),results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [snapshotDir,output]=process.argv.slice(2);if(!snapshotDir||!output)throw Error('Supply a private adult-source snapshot directory and report output.');
 const inventories=readdirSync('tests/scene-review').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join('tests/scene-review',f),'utf8')));
 const snapshots=new Map(readdirSync(snapshotDir).filter(f=>f.endsWith('.html.json')&&!f.includes('slipfast')).map(f=>{const d=JSON.parse(readFileSync(join(snapshotDir,f),'utf8'));return [d.file,d];}));
 const adjudication=JSON.parse(readFileSync('tests/scene-review-adjudication.json','utf8'));
 const exclusions=new Map(adjudication.exclusions.map(e=>[`${e.batchId}:${e.id}:${e.eventId}`,e.reason]));
 const report=replayInventories(inventories,snapshots,exclusions);writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(report.totals);
}
