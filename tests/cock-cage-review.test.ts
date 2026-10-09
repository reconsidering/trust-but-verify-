import{readFileSync}from'node:fs';
import{afterEach,expect,it,vi}from'vitest';
import{ACT_CHOICES,blankFeedback,readingAgreement,actAgreement,type DeepBatch}from'../review/deep-review-data';
import{validateDeepFeedback,buildDeepReviewImports}from'../scripts/deep-review-feedback.mjs';
import{validateCageFeedback,buildCageReviewImports}from'../scripts/cock-cage-feedback.mjs';
import{mountCockCageReview,type CageIndex}from'../review/cock-cage-review';
const index=JSON.parse(readFileSync('public/review/cock-cage-index.json','utf8')) as CageIndex;
const batches=index.fics.map(f=>JSON.parse(readFileSync('public/review/'+f.manifest,'utf8')) as DeepBatch);
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();document.body.replaceChildren();history.replaceState(null,'','/');});
it('uses only explicitly tagged sources, with unique cited passages and genuine scores when available',()=>{
 expect(index.fics.every(f=>f.tags.some(t=>/cock[ -]?cages?/i.test(t)))).toBe(true);
 expect(index.totalPassages).toBe(50);expect(batches.reduce((n,b)=>n+b.windows.length,0)).toBe(50);
 for(const b of batches){expect(b.engineCommit).toBe(index.engineCommit);expect(b.windows.flatMap(w=>w.detectionIds).sort()).toEqual(b.readings.map(r=>r.id).sort());expect(b.windows.flatMap(w=>w.actIds).sort()).toEqual(b.acts.map(a=>a.id).sort());
  let previous=-1;for(const w of b.windows){expect(w.from).toBeGreaterThan(previous);expect(w.to).toBeLessThan(b.source.paragraphCount);previous=w.to;expect(w.detectionIds.length+w.actIds.length).toBeGreaterThan(0);}
  for(const r of b.readings){expect(r.pattern).toMatch(/^chastity/);expect(r).not.toHaveProperty('sentence');if(r.features.length){expect(r.engineConfidence).toBeGreaterThanOrEqual(0);expect(r.engineConfidence).toBeLessThanOrEqual(1);}else if(r.engineConfidence===null)expect(r.confidenceBasis).toContain('No score is invented');else expect(r.confidenceBasis).toContain('displayed confidence');}
  const f=blankFeedback(b);for(const r of b.readings)f.readingAnswers[r.id]=readingAgreement(r);for(const a of b.acts){expect(ACT_CHOICES).toContain(a.act);f.actAnswers[a.id]=actAgreement(a);}
  expect(validateDeepFeedback(b,f)).toBe(f);const imported=buildDeepReviewImports(b,f);
  for(const w of imported.inventory.windows)for(const event of w.events)if(event.act.startsWith('Chastity'))expect(event.scored).toBe(false);
  const forbidden=new Set(['sentence','paras','text','fulltext','html']);const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){expect(forbidden.has(k)).toBe(false);walk(x);}};walk(b);
 }
});
it('keeps remembered self-fitting and explicit non-wearing out of performed cage events',()=>{
 const buck=batches.find(b=>b.source.file==='lock-it.html')!,sugar=batches.find(b=>b.source.file==='sugar-alpha.html')!;
 for(const b of [buck,sugar]){const f=blankFeedback(b);for(const a of b.acts)f.actAnswers[a.id]=actAgreement(a);const result=buildDeepReviewImports(b,f);const reviews=result.inventory.windows.flatMap((w:{reviews:any[]})=>w.reviews);expect(reviews.some((r:any)=>r.occurrence!=='performed')).toBe(true);expect(result.inventory.windows.flatMap((w:{events:any[]})=>w.events).every((e:any)=>!b.acts.filter(a=>a.occurrence!=='performed').some(a=>a.id===e.ownerActId))).toBe(true);expect(result.confidence.labels).toEqual({});}
 const helper=batches.find(b=>b.source.file==='were-compeer.html')!.acts.find(a=>a.performer==='Vernon Boyd')!;expect(helper.receiver).toBe('Stiles Stilinski');
 const selfKey=batches.find(b=>b.source.file==='nazarene.html')!.acts.find(a=>a.performer==='Harry Styles')!;expect(selfKey.receiver).toBe('Harry Styles');
 const relock=batches.find(b=>b.source.file==='nazarene.html')!.acts.find(a=>a.act==='Chastity device relocking')!;expect(relock).toMatchObject({performer:'Louis Tomlinson',receiver:'Harry Styles'});expect(batches.find(b=>b.source.file==='nazarene.html')!.acts.some(a=>a.windowId===relock.windowId&&a.act==='Chastity device removal')).toBe(false);
});
it('rejects duplicate or mismatched fic answers and leaves unreviewed fics unlabeled',()=>{
 const f=blankFeedback(batches[0]);f.readingAnswers[batches[0].readings[0].id]=readingAgreement(batches[0].readings[0]);
 const collection={schema:'engine-cock-cage-review/v1' as const,batches:[f]};expect(buildCageReviewImports(batches,collection)).toHaveLength(1);
 expect(()=>validateCageFeedback(batches,{...collection,batches:[f,f]})).toThrow('repeated');expect(()=>validateCageFeedback(batches,{...collection,batches:[{...f,sourceSha:'wrong-source'}]})).toThrow('different source');
});
it('keeps answers across fic switches, autocompletes independently, and restores a combined export',async()=>{
 document.body.innerHTML=readFileSync('review/cock-cages.html','utf8');
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('Browser storage unavailable');});
 const invented=batches.slice(0,2).map((b,i)=>{const copy=structuredClone(b);copy.batchId='invented-adult-cage-'+i;copy.source={...copy.source,file:'invented-'+i+'.html',title:'Morgan and Rowan',paragraphCount:3};copy.windows=[{id:'W1',fic:copy.source.file,title:'Adult cage fitting',chapter:1,from:0,to:2,detectionIds:['D1'],actIds:['A1']}];copy.readings=[{...copy.readings[0],id:'D1',fic:copy.source.file,para:1,claim:'Morgan wears a chastity device.',proposal:{revision:'v1',verdict:'wrong',reading:'Rowan wears the cage; Morgan fits it.',rationale:'The fitting names Rowan as wearer.',confidence:.99,errors:['Wrong person']}}];copy.acts=[{...copy.acts[0],id:'A1',windowId:'W1',act:'Chastity device fitting',performer:'Morgan',receiver:'Rowan',revision:'v1',evidence:{from:1,to:1},note:'Morgan fits Rowan’s device; no penetration occurs.'}];return copy;});
 const miniature={...index,fics:index.fics.slice(0,2)},stories=new Map(invented.map(b=>[b.source.file,['Morgan and Rowan are adults.','Morgan fits the cage onto Rowan.','Rowan wears it comfortably.']]));
 const page=await mountCockCageReview(miniature,invented,stories);
 expect(document.body.textContent).not.toContain('I read the whole scene');expect((document.getElementById('filter') as HTMLSelectElement).value).toBe('all');
 (document.getElementById('agree-window') as HTMLButtonElement).click();await page.selectFic(miniature.fics[1].id);
 [...document.querySelectorAll<HTMLButtonElement>('[data-reading-id=D1] button')].find(b=>b.textContent==='Agree with my assessment')!.click();
 const exportFile=page.getFeedback();expect(exportFile.batches[0].readingAnswers.D1).toMatchObject({verdict:'wrong',errors:['Wrong person']});expect(exportFile.batches[0].actAnswers.A1).toMatchObject({act:'Chastity device fitting',performer:'Morgan',receiver:'Rowan'});expect(exportFile.batches[1].readingAnswers.D1.verdict).toBe('wrong');
 expect(validateCageFeedback(invented,JSON.parse(JSON.stringify(exportFile)))).toEqual(exportFile);
 await page.selectFic(miniature.fics[0].id);expect(document.querySelector('[data-act-id=A1] .passage')!.textContent).toContain('fits the cage');
 [...document.querySelectorAll<HTMLButtonElement>('[data-reading-id=D1] button')].find(b=>b.textContent==='Disagree')!.click();expect(page.getFeedback().batches[0].readingAnswers.D1.verdict).toBeUndefined();expect(buildCageReviewImports(invented,page.getFeedback())[0].confidence.labels).toEqual({});
 const incoming=structuredClone(exportFile);incoming.batches[0].readingAnswers.D1.updatedAt='2100-01-01T00:00:00Z';
 const input=document.getElementById('answers-file') as HTMLInputElement;Object.defineProperty(input,'files',{configurable:true,value:[{text:async()=>JSON.stringify(incoming)}]});
 await input.onchange!.call(input,new Event('change'));expect(document.getElementById('status')!.textContent).toContain('Answers restored');expect(page.getFeedback().batches[0].readingAnswers.D1.verdict).toBe('wrong');
});
