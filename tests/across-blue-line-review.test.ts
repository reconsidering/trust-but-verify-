import {readFileSync} from 'node:fs';
import {afterEach,expect,it} from 'vitest';
import {ACT_CHOICES,actAgreement,blankFeedback,readingAgreement,type DeepBatch} from '../review/deep-review-data';
import {buildDeepReviewImports,validateDeepFeedback} from '../scripts/deep-review-feedback.mjs';
import {mountDeepReview} from '../review/negotiation-review';
const batches=['across-the-blue-line'].map(name=>({name,batch:JSON.parse(readFileSync(`public/review/${name}-deep-review.json`,'utf8')) as DeepBatch}));
afterEach(()=>{localStorage.clear();document.body.replaceChildren();});
it.each(batches)('$name contains only proposed errors and missed/corrected acts, with real probabilities and source-bound citations',({batch})=>{
 expect(batch.readings.length).toBeGreaterThan(0);
 expect(batch.readings.every(r=>r.proposal.verdict==='wrong')).toBe(true);
 expect(batch.statistics.readingAssessments).toEqual({wrong:batch.readings.length,correct:0,uncertain:0});
 expect(new Set(batch.readings.map(r=>r.id)).size).toBe(batch.readings.length);
 expect(new Set(batch.windows.map(w=>w.id)).size).toBe(batch.windows.length);
 expect(batch.windows.flatMap(w=>w.detectionIds).sort()).toEqual(batch.readings.map(r=>r.id).sort());
 expect(batch.windows.flatMap(w=>w.actIds).sort()).toEqual(batch.acts.map(a=>a.id).sort());
 for(const w of batch.windows){expect(w.from).toBeGreaterThanOrEqual(0);expect(w.to).toBeLessThan(batch.source.paragraphCount);expect(w.detectionIds.length+w.actIds.length).toBeGreaterThan(0);}
 for(const r of batch.readings){expect(r).not.toHaveProperty('sentence');if(r.features.length){expect(r.engineConfidence).toBeGreaterThanOrEqual(0);expect(r.engineConfidence).toBeLessThanOrEqual(1);}else if(r.engineConfidence!==null){expect(r.engineConfidence).toBeGreaterThanOrEqual(0);expect(r.engineConfidence).toBeLessThanOrEqual(1);expect(r.confidenceBasis).toContain("displayed confidence");}const w=batch.windows.find(w=>w.detectionIds.includes(r.id))!;expect(r.para).toBeGreaterThanOrEqual(w.from);expect(r.para).toBeLessThanOrEqual(w.to);}
 for(const a of batch.acts){expect(ACT_CHOICES).toContain(a.act);expect(a.engineConfidence).toBeNull();expect(a.occurrence).toBe('performed');expect(a.performer).not.toBe('');if(a.act!=='Solo masturbation')expect(a.receiver).not.toBe('');const w=batch.windows.find(w=>w.id===a.windowId)!;expect(a.evidence.from).toBeGreaterThanOrEqual(w.from);expect(a.evidence.to).toBeLessThanOrEqual(w.to);expect(a.evidence.from).toBeLessThanOrEqual(a.evidence.to);}
 const f=blankFeedback(batch);for(const r of batch.readings)f.readingAnswers[r.id]=readingAgreement(r);for(const a of batch.acts)f.actAnswers[a.id]=actAgreement(a);
 expect(validateDeepFeedback(batch,f)).toBe(f);const out=buildDeepReviewImports(batch,f);expect(out.confidence.answers).toHaveLength(batch.readings.length);expect(out.inventory.windows.flatMap((w:{events:unknown[]})=>w.events)).toHaveLength(batch.acts.length);
 const forbidden=new Set(['sentence','paras','text','fulltext','html']);const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){expect(forbidden.has(k)).toBe(false);walk(x);}};walk(batch);
});
function fixture(){const b=structuredClone(batches[0].batch);b.batchId='invented-adults-errors';b.source={...b.source,title:'Morgan and Rowan',paragraphCount:3};b.windows=[{id:'W1',fic:b.source.file,title:'Invented adult scene',chapter:1,from:0,to:2,detectionIds:['D1'],actIds:['A1']}];b.readings=[{...b.readings[0],id:'D1',para:1,claim:'Morgan penetrates Rowan anally.',proposal:{revision:'v1',verdict:'wrong',reading:'Morgan’s penis contacts Rowan’s buttocks externally.',rationale:'The clothing stays in place and entry does not occur.',confidence:.99,errors:['Contact mistaken for penetration']}}];b.acts=[{...b.acts[0],id:'A1',windowId:'W1',revision:'v1',act:'Penis against buttocks',performer:'Morgan',receiver:'Rowan',evidence:{from:1,to:1},engineStatus:'wrong contact category',engineConfidence:null,note:'External contact through clothing; no insertion.',errors:['Contact mistaken for penetration']}];return b;}
it.each(batches)('$name page allows fast agreement and a later disagreement without manufacturing a replacement label',async({name})=>{
 document.body.innerHTML=readFileSync(`review/${name}.html`,'utf8');const b=fixture();const page=await mountDeepReview(b,['Morgan and Rowan are adults.','Morgan rubs against Rowan’s buttocks through clothing.','They stop without penetration.']);
 expect(document.body.textContent).not.toContain('I read the whole scene');expect(document.getElementById('summary')!.textContent).not.toContain('Read all');
 (document.getElementById('agree-window') as HTMLButtonElement).click();const f=page.getFeedback();expect(f.readingAnswers.D1).toMatchObject({verdict:'wrong',errors:['Contact mistaken for penetration']});expect(f.readingAnswers.D1.context).toContain('clothing');expect(f.actAnswers.A1).toMatchObject({verdict:'correct',act:'Penis against buttocks',performer:'Morgan',receiver:'Rowan'});expect(f.windowAnswers).toEqual({});expect(validateDeepFeedback(b,f)).toBe(f);
 expect(document.querySelector('[data-act-id=A1] .passage')!.textContent).toContain('through clothing');
 const out=buildDeepReviewImports(b,f);expect(out.inventory.windows[0].events[0]).toMatchObject({act:'Penis against buttocks',scored:false});
 [...document.querySelectorAll<HTMLButtonElement>('[data-reading-id=D1] button')].find(b=>b.textContent==='Disagree')!.click();expect(page.getFeedback().readingAnswers.D1.verdict).toBeUndefined();expect(buildDeepReviewImports(b,page.getFeedback()).confidence.labels).toEqual({});
});
it('keeps oral directions, manual stimulation and recalled anal acts distinct',()=>{
 const b=batches[0].batch;
 expect(b.acts.filter(a=>a.act==='Blowjob').map(a=>[a.performer,a.receiver])).toEqual([
 ['Mikko Korhonen','Cody Michaud'],['Cody Michaud','Mikko Korhonen']]);
 expect(b.acts.filter(a=>a.act==='Handjob').map(a=>[a.performer,a.receiver])).toEqual([
 ['Mikko Korhonen','Cody Michaud'],['Cody Michaud','Mikko Korhonen']]);
 const anal=b.acts.find(a=>a.act==='Anal penetration (penis)')!;
 expect(anal).toMatchObject({performer:'Mikko Korhonen',receiver:'Cody Michaud',occurrence:'performed'});
 expect(anal.note).toContain('recalled');
 expect(b.acts.filter(a=>a.act==='Solo masturbation').map(a=>a.performer)).toEqual(['Mikko Korhonen','Cody Michaud']);
 expect(b.readings.some(r=>r.proposal.errors.includes('Animal or object mistaken for a person'))).toBe(true);
});
