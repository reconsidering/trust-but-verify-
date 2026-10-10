import {expect,it} from 'vitest';
import {inventoryEvents,scoreActRecall,recallMarkdown,recallHistoryMarkdown} from '../scripts/act-recall.mjs';
const e={inventory:'invented.json',batchId:'adult',id:'scene',eventId:0,fic:'adult.html',sourceSha:'source',from:3,to:4,act:'Blowjob',performer:'Rowan',receiver:'Morgan',reviewer:'owner'};
const hit={kind:'act',act:'blowjob',a:'Morgan',b:'Rowan',para:3,via:'oral'};
const score=(hits:any[],events=[e])=>scoreActRecall(events,new Map([['adult.html',{sourceSha:'source',paragraphVerified:true,hits}]]));
it('counts oral roles correctly, excludes hints and refuses to inflate recall with nearby hits',()=>{
 expect(score([hit]).summary.find((r:any)=>r.act==='Blowjob')).toMatchObject({expected:1,matched:1,recall:1});
 expect(score([{...hit,a:'Rowan',b:'Morgan'}]).results[0].status).toBe('wrong-participants');
 expect(score([{...hit,kind:'wanted',role:'top'}]).results[0].status).toBe('hint-only');
 expect(score([{...hit,para:2}]).results[0].status).toBe('nearby-only');
 expect(score([{...hit,para:2}]).summary.find((r:any)=>r.act==='Blowjob').recall).toBe(0);
 expect(score([]).results[0].status).toBe('missed');
});
it('excludes stale, missing and disputed sources rather than marking them missed',()=>{
 for(const snap of [undefined,{sourceSha:'changed',paragraphVerified:true,hits:[]},{sourceSha:'source',paragraphVerified:false,hits:[]}]) {
  const r=scoreActRecall([e],snap?new Map([['adult.html',snap]]):new Map());expect(r.summary.find((x:any)=>x.act==='Blowjob')).toMatchObject({expected:0,recall:null,excluded:1});
 }
 expect(scoreActRecall([e],new Map(),new Map([['adult:scene:0','Disputed']])).results[0].status).toBe('needs-adjudication');
});
it('deduplicates identical events across reviews and keeps the owner judgment as provenance',()=>{
 const r=score([hit],[{...e,reviewer:'AI'},e]);expect(r.results).toHaveLength(1);expect(r.duplicates).toHaveLength(1);expect(r.results[0].reviewer).toBe('owner');
 expect(r.byReviewer.AI.find((x:any)=>x.act==='Blowjob').expected).toBe(0);
});
it('whitelists explicit current AI inventory acts and preserves unfinished positive-only scope',()=>{
 const doc={fics:[{file:'adult.html',safety:{eligible:true},sourceSha:'source',acts:[{act:'anal sex',occurrence:'current',confidence:.99,labelEligible:true,from:1,to:2,a:'Rowan',b:'Morgan'},{act:'blowjob',occurrence:'fantasy',confidence:1},{act:'sex unspecified',occurrence:'performed',confidence:1},{act:'blowjob',occurrence:'performed',confidence:.94}]}]};
 const r=inventoryEvents(doc,'ai.json');expect(r.events).toHaveLength(1);expect(r.excluded).toHaveLength(3);
 const partial=inventoryEvents({schema:'engine-partial-sex-act-review/v1',batchId:'draft',windows:[{...e,coverage:'positive-only',events:[e]}]},'partial.json');expect(partial.events[0].reviewer).toBe('partial / assistant');
});
it('counts wrong instruments and solo acts separately, without copying evidence text',()=>{
 const wrong=score([{kind:'act',act:'anal sex',a:'Rowan',b:'Morgan',para:3}]);expect(wrong.results[0].status).toBe('wrong-act');
 const solo={...e,act:'Solo masturbation',performer:'Morgan',receiver:''};expect(score([{kind:'solo',act:'masturbation',a:'Morgan',para:3}], [solo]).results[0].status).toBe('matched');
 const report={...score([{...hit,sentence:'PRIVATE_SOURCE_TEXT'}]),engineCommit:'test',inventoryFingerprint:'test'};expect(JSON.stringify(report)).not.toContain('PRIVATE_SOURCE_TEXT');expect(recallMarkdown(report)).toContain('100.0%');
});
it('recognizes both directions of an explicitly mutual handjob',()=>{
 const event={...e,act:'Handjob',performer:'Rowan',receiver:'Morgan'};
 expect(score([{kind:'handjob',act:'mutual handjob',a:'Morgan',b:'Rowan',para:3}],[event]).results[0].status).toBe('matched');
});
it('allows event-range hash verification when an older inventory lacks a full paragraph checksum',()=>{
 const event={...e,paragraphHashes:['one','two']};const snapshot={sourceSha:'source',paragraphVerified:false,paragraphHashes:['','','','one','two'],hits:[hit]};
 expect(scoreActRecall([event],new Map([['adult.html',snapshot]])).results[0].status).toBe('matched');
 expect(scoreActRecall([{...event,paragraphHashes:['changed','two']}],new Map([['adult.html',snapshot]])).results[0].status).toBe('source-unverified');
});

it('makes the history readable without presenting categories with no evidence as perfect',()=>{
 const history=recallHistoryMarkdown([{generatedAt:'2026-10-10T12:00:00Z',engineCommit:'abcdefgh',inventoryFingerprint:'inventory',scoringFingerprint:'scoring',summary:[{act:'Rimming',expected:0,matched:0,recall:null}]}]);expect(history).toContain('| 0 | 0 | — |');expect(history).toContain('same inventory/scoring fingerprints');
});
it('does not treat malformed evidence ranges or missing participant names as detection misses',()=>{
 for(const event of [{...e,from:-1},{...e,performer:''},{...e,to:2}])expect(score([hit],[event]).results[0].status).toBe('invalid-event');
});
it('interprets an explicitly self-directed inventory act without inventing a partner',()=>{
 const doc={fics:[{file:'adult.html',safety:{eligible:true},sourceSha:'source',acts:[{act:'self-fingering',occurrence:'performed',confidence:.99,from:3,to:4,a:'Morgan',b:null}]}]};
 const events=inventoryEvents(doc,'ai.json').events;expect(events[0]).toMatchObject({performer:'Morgan',receiver:'Morgan',act:'Fingering'});
 expect(score([{kind:'solo',act:'fingering himself',a:'Morgan',para:3}],events).results[0].status).toBe('matched');
});
