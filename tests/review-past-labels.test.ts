import {it,expect,vi,afterEach} from 'vitest';
import {readFileSync,mkdtempSync,writeFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {TextEncoder,TextDecoder} from 'node:util';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {mountReview} from '../review/review-batch';
import {validatePastLabelBatch,importAnswers,reviewParagraphs,type ReviewBatch} from '../review/review-batch-data';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const fixture='<div id="chapters"><p>Morgan Vale passes a cup to Rowan Hale.</p><p>Rowan Hale thanks Morgan Vale.</p></div>';
const paragraphs=()=>reviewParagraphs(fixture);
function synthetic():ReviewBatch{return{schema:'engine-review-batch/v1',batchId:'past-label-synthetic',engineCommit:'a'.repeat(40),sources:[{file:'adult.html',title:'Invented adults',sourceSha:hash(fixture),paragraphSha:hash(paragraphs().join('\n')),paragraphCount:paragraphs().length}],rows:[{id:'L1',key:'cup#madeup',fic:'adult.html',para:0,pattern:'cup',a:'Morgan Vale',b:'Rowan Hale',act:'passes a cup',kind:'act',claim:'Morgan Vale passes Rowan Hale a cup.',engineConfidence:0.8,evidence:[{from:0,to:1}],proposal:{revision:'v1',verdict:'correct',confidence:0.95,reading:'Morgan Vale passes the cup.',rationale:'The surrounding exchange supports the giver.',errors:[]},labelAudit:{pastLabels:[{source:'tests/labels/invented.json',verdict:'wrong',provenance:'Owner',claim:'Rowan Hale passed the cup.',identityVerified:true,key:'cup#madeup'}],priority:1,occurrence:'Performed',changed:true,quarantined:true,status:'The people changed; obtain a fresh verdict.',reasons:['Participants changed.'],recentEvidence:[]}}]};}
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();document.body.replaceChildren();});
it('publishes 50 independent label identities with old provenance, both scores and source-checked citations',()=>{
 const batch=validatePastLabelBatch(JSON.parse(readFileSync('public/review/past-labels.json','utf8')));
 expect(new Set(batch.rows.map(r=>r.key)).size).toBe(50);expect(batch.sources).toHaveLength(17);
 for(const row of batch.rows){expect(row.labelAudit!.pastLabels.every(l=>l.source.startsWith('tests/'))).toBe(true);expect(row.proposal!.reading).not.toBe('');expect(row.engineConfidence).toBeGreaterThan(0);expect(row.evidence![0].from).toBeLessThanOrEqual(row.para);expect(row.labelAudit!.referenceIsOriginal).toBe(false);}
 expect(batch.rows.find(r=>r.id==='L30')!.labelAudit!.recentEvidence.join(' ')).toContain('owner-confirmed Handjob');
 expect(batch.rows.find(r=>r.id==='L40')!.proposal!.verdict).toBe('wrong');
 expect(batch.rows.find(r=>r.id==='L40')!.kind).toBe('solo');
 const bad=structuredClone(batch);bad.rows[0].engineConfidence=NaN;expect(()=>validatePastLabelBatch(bad)).toThrow('confidence');
});
it('keeps history decisions and assistant calls out of current verdicts until the owner explicitly answers',async()=>{
 vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('TextEncoder',TextEncoder);vi.stubGlobal('TextDecoder',TextDecoder);
 document.body.innerHTML=readFileSync('review/next-batch.html','utf8');const batch=synthetic(),api=await mountReview(batch);
 expect(api.payload().answers).toHaveLength(0);expect(document.getElementById('past-label-history')!.textContent).toContain('Past label: Wrong');
 expect(document.querySelector<HTMLButtonElement>('[data-past-label="replace"]')!.disabled).toBe(true);
 await api.loadFiles([{name:'renamed.html',arrayBuffer:async()=>new TextEncoder().encode(fixture).buffer as ArrayBuffer}]);
 expect(document.getElementById('engine-confidence')!.textContent).toContain('80%');expect(document.getElementById('proposal-confidence')!.textContent).toContain('95%');
 document.querySelector<HTMLButtonElement>('[data-past-label="replace"]')!.click();
 let payload=api.payload();expect(payload.answers[0].pastLabelReview).toBe('replace');expect(payload.answers[0].verdict).toBeUndefined();
 expect(JSON.stringify(payload)).not.toContain('Rowan Hale thanks');expect(JSON.stringify(payload)).not.toContain('rationale');
 const restored={};expect(importAnswers(batch,payload,restored)).toBe(1);expect(restored).toMatchObject({L1:{pastLabelReview:'replace'}});
 document.querySelector<HTMLButtonElement>('[data-proposal="agree"]')!.click();payload=api.payload();expect(payload.answers[0].verdict).toBe('correct');expect(payload.answers[0].pastLabelReview).toBe('replace');
 const malformed=structuredClone(payload);malformed.answers[0].pastLabelReview='invalid' as 'keep';expect(()=>importAnswers(batch,malformed,{})).toThrow('match');
});
it('imports only the explicitly judged current claim, preserving its identity without deriving a label from history or assistant scores',()=>{
 const dir=mkdtempSync(join(tmpdir(),'past-label-import-')),bp=join(dir,'batch.json'),ap=join(dir,'answers.json'),out=join(dir,'labels.json'),batch=synthetic();writeFileSync(bp,JSON.stringify(batch));
 const answer={id:'L1',key:'cup#madeup',fic:'adult.html',paragraph:0,sourceSha:batch.sources[0].sourceSha,pastLabelReview:'replace',errors:[],context:'PRIVATE_CONTEXT',updatedAt:'2026-10-08T00:00:00Z'};
 const run=(answers:unknown[])=>{writeFileSync(ap,JSON.stringify({schema:batch.schema,batchId:batch.batchId,engineCommit:batch.engineCommit,answers}));return spawnSync('node',['scripts/import-review-batch.mjs',bp,ap,out]).status;};
 expect(run([answer])).toBe(0);expect(JSON.parse(readFileSync(out,'utf8')).labels).toEqual({});
 expect(run([{...answer,verdict:'correct'}])).toBe(0);const text=readFileSync(out,'utf8'),saved=JSON.parse(text);expect(saved.labels).toEqual({'cup#madeup':'ok'});expect(saved.answers[0].claim.a).toBe('Morgan Vale');expect(saved.answers[0].pastLabelReview).toBe('replace');expect(text).not.toContain('PRIVATE_CONTEXT');expect(saved.answers[0].engineConfidence).toBeUndefined();expect(saved.answers[0].proposal).toBeUndefined();expect(saved.answers[0].labelAudit).toBeUndefined();
});
it('agreement automatically selects the matching historical decision and exports it, with manual overrides still available',async()=>{
 const cases=[
  {changed:true,quarantined:false,label:'ok',verdict:'correct',verified:true,expected:'replace'},
  {changed:false,quarantined:false,label:'ok',verdict:'correct',verified:true,expected:'keep'},
  {changed:false,quarantined:false,label:'wrong',verdict:'wrong',verified:true,expected:'keep'},
  {changed:false,quarantined:false,label:'wrong',verdict:'correct',verified:true,expected:'replace'},
  {changed:false,quarantined:true,label:'ok',verdict:'correct',verified:true,expected:'replace'},
  {changed:false,quarantined:false,label:'ok',verdict:'correct',verified:false,expected:'replace'},
  {changed:true,quarantined:true,label:'wrong',verdict:'uncertain',verified:true,expected:'uncertain'},
 ] as const;
 for(const [index,c]of cases.entries()){
  document.body.innerHTML=readFileSync('review/next-batch.html','utf8');const batch=synthetic();batch.batchId+='-'+index;
  const row=batch.rows[0];row.proposal!.verdict=c.verdict;row.labelAudit!.changed=c.changed;row.labelAudit!.quarantined=c.quarantined;row.labelAudit!.pastLabels[0].verdict=c.label;row.labelAudit!.pastLabels[0].identityVerified=c.verified;
  const api=await mountReview(batch,{stories:new Map([['adult.html',paragraphs()]])});
  expect(api.payload().answers).toHaveLength(0);
  document.querySelector<HTMLButtonElement>('[data-proposal="agree"]')!.click();
  expect(api.answers.L1.pastLabelReview).toBe(c.expected);expect(api.payload().answers[0].pastLabelReview).toBe(c.expected);
  expect(document.querySelector(`[data-past-label="${c.expected}"]`)!.getAttribute('aria-pressed')).toBe('true');
  document.querySelector<HTMLButtonElement>('[data-past-label="uncertain"]')!.click();expect(api.answers.L1.pastLabelReview).toBe('uncertain');
 }
});
