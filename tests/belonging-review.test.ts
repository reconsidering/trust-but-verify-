import{readFileSync}from'node:fs';import{afterEach,expect,it}from'vitest';
import{probability}from'../src/heuristic/learned';import{precisionOf}from'../src/heuristic/reliability';
import{buildDeepReviewImports,validateDeepFeedback}from'../scripts/deep-review-feedback.mjs';
import{actAgreement,blankFeedback,readingAgreement,type DeepBatch}from'../review/deep-review-data';
import{mountDeepReview}from'../review/negotiation-review';
const batch=JSON.parse(readFileSync('public/review/belonging.json','utf8')) as DeepBatch;
afterEach(()=>{localStorage.clear();document.body.replaceChildren();});
it('includes the full audit with correct probabilities and bounded private-source citations',()=>{
 expect(batch.statistics.paragraphsRead).toBe(5783);expect(batch.readings).toHaveLength(518);expect(batch.windows).toHaveLength(98);expect(batch.acts).toHaveLength(156);
 expect(new Set(batch.readings.map(r=>r.id)).size).toBe(518);
 expect(batch.windows.flatMap(w=>w.detectionIds).sort()).toEqual(batch.readings.map(r=>r.id).sort());
 expect(batch.windows.flatMap(w=>w.actIds).sort()).toEqual(batch.acts.map(a=>a.id).sort());
 for(const r of batch.readings){expect(r).not.toHaveProperty('sentence');if(r.features.length)expect(r.engineConfidence).toBeCloseTo(probability(precisionOf(r.pattern),r.features),14);if(r.engineConfidence!==null){expect(r.engineConfidence).toBeGreaterThanOrEqual(0);expect(r.engineConfidence).toBeLessThanOrEqual(1);}expect(r.proposal.confidence).toBeGreaterThan(0);expect(r.proposal.confidence).toBeLessThanOrEqual(1);const w=batch.windows.find(w=>w.detectionIds.includes(r.id))!;expect(r.para).toBeGreaterThanOrEqual(w.from);expect(r.para).toBeLessThanOrEqual(w.to);}
 for(const a of batch.acts){const w=batch.windows.find(w=>w.id===a.windowId)!;expect(a.evidence.from).toBeGreaterThanOrEqual(w.from);expect(a.evidence.to).toBeLessThanOrEqual(w.to);expect(a.evidence.to).toBeGreaterThanOrEqual(a.evidence.from);expect(a.reviewerConfidence).toBeLessThanOrEqual(1);if(/missing/.test(a.engineStatus))expect(a.engineConfidence).toBeNull();}
 const f=blankFeedback(batch);for(const r of batch.readings)f.readingAnswers[r.id]=readingAgreement(r);for(const a of batch.acts)f.actAnswers[a.id]=actAgreement(a);expect(validateDeepFeedback(batch,f)).toBe(f);
 const forbidden=new Set(['sentence','paras','text','fulltext','html','notes']);const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){expect(forbidden.has(k)).toBe(false);walk(x);}};walk(batch);
});
it('distinguishes instruments, genuine oral misses and attempts from nearby performed acts',()=>{
 const oralMisses=batch.acts.filter(a=>a.act==='Blowjob'&&a.engineStatus==='missing');expect(oralMisses.map(a=>a.evidence.from)).toEqual([2107,4142]);
 expect(batch.acts.find(a=>a.act==='Rimming'&&a.evidence.from===3878)!.engineStatus).toBe('missing');
 expect(batch.acts.find(a=>a.evidence.from===5041)!).toMatchObject({act:'Toy insertion',evidence:{from:5041,to:5284}});
 expect(batch.acts.find(a=>a.evidence.from===5522)!.occurrence).toBe('not performed');expect(batch.acts.find(a=>a.evidence.from===5549)!.occurrence).toBe('performed');
 expect(batch.readings.find(r=>r.para===3518)!.proposal.verdict).toBe('correct');expect(batch.readings.find(r=>r.kind==='fantasy'&&r.para===3534)!.proposal.verdict).toBe('wrong');
 expect(batch.readings.find(r=>r.id==='D217')!.proposal.verdict).toBe('correct');
 expect(batch.acts.filter(a=>a.act==='Anal penetration (penis)'&&a.occurrence==='performed').every(a=>a.evidence.from>=3066)).toBe(true);
});
it('quarantines repeated legacy keys with different claims or conflicting decisions',()=>{
 const b=structuredClone(batch),f=blankFeedback(b);const sameKey=b.readings.filter(r=>r.key===b.readings.find(r=>r.id==='D241')!.key);
 for(const r of sameKey)f.readingAnswers[r.id]=readingAgreement(r);const out=buildDeepReviewImports(b,f);expect(out.confidence.labels[sameKey[0].key]).toBe('unclear');expect(out.confidence.ambiguousReadingKeys).toContain(sameKey[0].key);expect(out.confidence.answers).toHaveLength(2);
 const twins=b.readings.filter(r=>r.para===3594);expect(twins).toHaveLength(2);const g=blankFeedback(b);g.readingAnswers[twins[0].id]=readingAgreement(twins[0]);g.readingAnswers[twins[1].id]={...readingAgreement(twins[1]),proposalReview:undefined,verdict:'correct'};expect(buildDeepReviewImports(b,g).confidence.labels[twins[0].key]).toBe('unclear');
 g.readingAnswers[twins[1].id]=readingAgreement(twins[1]);expect(buildDeepReviewImports(b,g).confidence.labels[twins[0].key]).toBe('wrong');
});
it('renders the new page with agreement autofill and no labels inferred from coverage or act agreement',async()=>{
 document.body.innerHTML=readFileSync('review/belonging.html','utf8');const b=structuredClone(batch);b.batchId='invented-adult-test';b.source={...b.source,title:'Morgan and Rowan',paragraphCount:3};b.windows=[{id:'W1',fic:b.source.file,title:'Adult scene',chapter:1,from:0,to:2,detectionIds:['D1'],actIds:['A1']}];b.readings=[{...b.readings[0],id:'D1',para:1,claim:'Morgan penetrates Rowan with a penis.',proposal:{revision:'test',verdict:'wrong',reading:'Morgan uses an anal toy on Rowan.',rationale:'The surrounding passage names the toy.',confidence:.99,errors:['Fingers or toy mistaken for a penis']}}];b.acts=[{...b.acts[0],id:'A1',windowId:'W1',revision:'test',act:'Toy insertion',performer:'Morgan',receiver:'Rowan',evidence:{from:1,to:1},occurrence:'performed',engineStatus:'wrong act or instrument',note:'Morgan inserts the toy, rather than a penis.',errors:['Fingers or toy mistaken for a penis']}];
 const page=await mountDeepReview(b,['Morgan and Rowan are adults.','Morgan inserts the anal toy into Rowan.','They rest afterwards.']);(document.getElementById('agree-window')as HTMLButtonElement).click();const f=page.getFeedback();expect(f.readingAnswers.D1).toMatchObject({verdict:'wrong',errors:['Fingers or toy mistaken for a penis']});expect(f.readingAnswers.D1.context).toContain('Morgan uses an anal toy');expect(f.actAnswers.A1).toMatchObject({verdict:'correct',act:'Toy insertion',performer:'Morgan',receiver:'Rowan'});expect(document.querySelector('[data-act-id=A1] .passage')!.textContent).toContain('Morgan inserts');expect(f.windowAnswers).toEqual({});const out=buildDeepReviewImports(b,f);expect(out.inventory.windows[0].events).toHaveLength(1);expect(Object.keys(out.confidence.labels)).toHaveLength(1);
});
