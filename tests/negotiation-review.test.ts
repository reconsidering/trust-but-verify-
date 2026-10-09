import{readFileSync,mkdtempSync,writeFileSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{execFileSync}from'node:child_process';
import{afterEach,expect,it,vi}from'vitest';import{buildDeepReviewImports,validateDeepFeedback}from'../scripts/deep-review-feedback.mjs';
import{actAgreement,blankFeedback,readingAgreement,withdrawAgreement,type DeepBatch}from'../review/deep-review-data';import{mountDeepReview}from'../review/negotiation-review';
const batch=JSON.parse(readFileSync('public/review/negotiation.json','utf8')) as DeepBatch;
afterEach(()=>{localStorage.clear();document.body.replaceChildren();vi.restoreAllMocks();});
it('covers every current audit reading exactly once and keeps real model scores and bounded citations',()=>{
 expect(batch.readings).toHaveLength(67);expect(batch.windows).toHaveLength(40);expect(batch.acts).toHaveLength(36);expect(batch.statistics.paragraphsRead).toBe(1637);
 expect(new Set(batch.readings.map(r=>r.key)).size).toBe(67);
 expect(batch.windows.flatMap(w=>w.detectionIds).sort()).toEqual(batch.readings.map(r=>r.id).sort());
 for(const r of batch.readings){expect(r).not.toHaveProperty('sentence');if(r.features.length){expect(r.engineConfidence).toBeGreaterThanOrEqual(0);expect(r.engineConfidence).toBeLessThanOrEqual(1);};const w=batch.windows.find(w=>w.detectionIds.includes(r.id))!;expect(r.para).toBeGreaterThanOrEqual(w.from);expect(r.para).toBeLessThanOrEqual(w.to);}
 for(const a of batch.acts){const w=batch.windows.find(w=>w.id===a.windowId)!;expect(a.evidence.from).toBeGreaterThanOrEqual(w.from);expect(a.evidence.to).toBeLessThanOrEqual(w.to);expect(a.evidence.from).toBeLessThanOrEqual(a.evidence.to);if(a.engineStatus==='missing')expect(a.engineConfidence).toBeNull();}
 const forbidden=new Set(['sentence','paras','text','fulltext','html','notes']);const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){expect(forbidden.has(k)).toBe(false);walk(x);}};walk(batch);
});
it('keeps actual misses distinct from hints, habits, interrupted attempts and the boundary contact error',()=>{
 const misses=batch.acts.filter(a=>a.engineStatus==='missing'&&['Handjob','Anal penetration (penis)'].includes(a.act));expect(misses.map(a=>a.evidence.from).sort((a,b)=>a-b)).toEqual([461,854,1219]);
 expect(batch.acts.find(a=>a.evidence.from===1350)!.occurrence).toBe('imagined');expect(batch.acts.find(a=>a.evidence.from===1609)!.occurrence).toBe('habitual');
 expect(batch.readings.find(r=>r.para===1130)!.proposal.verdict).toBe('wrong');expect(batch.acts.find(a=>a.evidence.from===1133)!.occurrence).toBe('performed');
 expect(batch.acts.some(a=>a.act==='Solo masturbation'&&a.occurrence==='not performed')).toBe(true);
});
function fixture(){const b=structuredClone(batch);b.batchId='invented-adults';b.source={...b.source,title:'Invented adult encounter',paragraphCount:3};b.windows=[{id:'W1',fic:b.source.file,title:'Morgan and Rowan, both adults',chapter:1,from:0,to:2,detectionIds:['D1','D2'],actIds:['A1','A2']}];b.readings=[{...b.readings[0],id:'D1',key:'invented#1',para:1,claim:'Morgan gives Rowan a handjob.',proposal:{revision:'v1',verdict:'wrong',reading:'Rowan gives Morgan a handjob.',rationale:'The named giver is Rowan.',confidence:.99,errors:['Roles reversed']}},{...b.readings[1],id:'D2',key:'invented#2',para:2,proposal:{revision:'v1',verdict:'uncertain',reading:'The gesture is ambiguous.',rationale:'More context is needed.',confidence:.6,errors:[]}}];b.acts=[{...b.acts[0],id:'A1',windowId:'W1',revision:'v1',act:'Handjob',performer:'Rowan',receiver:'Morgan',occurrence:'performed',note:'Rowan stimulates Morgan manually.',errors:['Act missed'],engineConfidence:null,engineStatus:'missing',evidence:{from:1,to:1}},{...b.acts[1],id:'A2',windowId:'W1',revision:'v1',act:'Anal penetration (penis)',performer:'Morgan',receiver:'Rowan',occurrence:'imagined',note:'The act is imagined rather than performed.',errors:[],engineConfidence:null,engineStatus:'hint not detected',evidence:{from:2,to:2}}];return b;}
it('Agreement is idempotent and preserves owner notes and manually selected errors',()=>{
 const r=fixture().readings[0],first=readingAgreement(r);first.context+='\nOwner clarification.';first.errors.push('Other');const again=readingAgreement(r,first);expect(again.context).toBe(first.context);expect(again.errors).toEqual(['Roles reversed','Other']);expect(withdrawAgreement(again,`${r.proposal.reading}\n\n${r.proposal.rationale}`,r.proposal.errors)).toEqual({context:'Owner clarification.',errors:['Other']});
 const a=fixture().acts[0],answer=actAgreement(a);answer.context+='\nOwner clarification.';expect(actAgreement(a,answer).context).toBe(answer.context);
});
it('bulk agreement fills separate explicit decisions, errors and corrections without marking coverage',async()=>{
 document.body.innerHTML=readFileSync('review/negotiation.html','utf8');const b=fixture(),page=await mountDeepReview(b,['Morgan and Rowan are adults.','Rowan gives Morgan a handjob.','Morgan imagines a different encounter.']);
 (document.getElementById('agree-window') as HTMLButtonElement).click();const f=page.getFeedback();expect(f.readingAnswers.D1).toMatchObject({verdict:'wrong',errors:['Roles reversed']});expect(f.readingAnswers.D1.context).toContain('Rowan gives Morgan');expect(f.readingAnswers.D2.verdict).toBe('uncertain');expect(f.actAnswers.A1).toMatchObject({verdict:'correct',performer:'Rowan',receiver:'Morgan',occurrence:'performed',errors:['Act missed']});expect(f.actAnswers.A2.occurrence).toBe('imagined');expect(f.windowAnswers).toEqual({});
 expect(document.querySelector('[data-act-id=A1] .passage')!.textContent).toContain('Rowan gives Morgan');
 expect(JSON.parse(localStorage.getItem(page.storageKey)!)).toEqual(f);
 const out=buildDeepReviewImports(b,f);expect(Object.values(out.confidence.labels)).toEqual(['wrong','unclear']);expect(out.inventory.windows[0].events).toHaveLength(1);expect(out.inventory.windows[0].events[0].act).toBe('Handjob');
});
it('Disagree is not inverted into a confidence label or a negative act',async()=>{
 document.body.innerHTML=readFileSync('review/negotiation.html','utf8');const b=fixture(),page=await mountDeepReview(b,['Both are adults.','A gesture happens.','The context remains unclear.']);
 for(const id of ['[data-reading-id=D1]','[data-act-id=A1]']){const button=[...document.querySelectorAll<HTMLButtonElement>(id+' button')].find(b=>b.textContent==='Disagree')!;button.click();}
 const f=page.getFeedback();expect(f.readingAnswers.D1.verdict).toBeUndefined();expect(f.actAnswers.A1.verdict).toBeUndefined();const out=buildDeepReviewImports(b,f);expect(out.confidence.labels).toEqual({});expect(out.inventory.windows).toEqual([]);
});
it('accepts edited acts only after a fresh confirmation and retains added acts separately from engine labels',()=>{
 const b=fixture(),f=blankFeedback(b);f.actAnswers.A1={...actAgreement(b.acts[0]),performer:'Morgan'};expect(()=>validateDeepFeedback(b,f)).toThrow('Edited');f.actAnswers.A1=actAgreement(b.acts[0]);f.actAnswers.A1.verdict='wrong';expect(()=>validateDeepFeedback(b,f)).toThrow('Edited');f.actAnswers.A1.proposalReview=undefined;f.actAnswers.A1.verdict='correct';expect(validateDeepFeedback(b,f)).toBe(f);
 f.actAnswers['extra:W1:1']={...actAgreement(b.acts[0]),revision:'owner-added-v1',proposalReview:undefined,act:'Blowjob',from:2,to:2};const out=buildDeepReviewImports(b,f);expect(out.confidence.labels).toEqual({});expect(out.inventory.windows[0].events).toHaveLength(2);expect(JSON.stringify(out)).not.toContain('stimulates');
 f.actAnswers['extra:W1:1'].to=4;expect(()=>validateDeepFeedback(b,f)).toThrow('paragraph range');
});
it('refuses malformed or wrong-source answers before producing any labels',()=>{
 const b=fixture(),f=blankFeedback(b);expect(()=>validateDeepFeedback(b,{...f,sourceSha:'wrong'})).toThrow('different');f.readingAnswers.unknown=readingAgreement(b.readings[0]);expect(()=>buildDeepReviewImports(b,f)).toThrow('Unknown');delete f.readingAnswers.unknown;f.windowAnswers.W9={complete:true,updatedAt:new Date().toISOString()};expect(()=>validateDeepFeedback(b,f)).toThrow('coverage');
});
it('keeps buttons disabled before loading the source and tolerates unavailable browser storage',async()=>{
 document.body.innerHTML=readFileSync('review/negotiation.html','utf8');await mountDeepReview(fixture());expect((document.getElementById('agree-window') as HTMLButtonElement).disabled).toBe(true);
 document.body.innerHTML=readFileSync('review/negotiation.html','utf8');vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('Quota');});const page=await mountDeepReview(fixture(),['Both adults.','A gesture.','A thought.']);(document.getElementById('agree-window') as HTMLButtonElement).click();expect(page.getFeedback().readingAnswers.D1.verdict).toBe('wrong');expect(document.getElementById('autosave-note')!.textContent).toContain('Export');
});
it('the command-line importer writes owner-only labels and scene events without copying free text',()=>{
 const dir=mkdtempSync(join(tmpdir(),'deep-review-'));try{const b=fixture(),f=blankFeedback(b);f.readingAnswers.D1=readingAgreement(b.readings[0]);f.actAnswers.A1=actAgreement(b.acts[0]);f.actAnswers.A1.context='PRIVATE OWNER NOTES';const p=(n:string)=>join(dir,n);writeFileSync(p('batch.json'),JSON.stringify(b));writeFileSync(p('answers.json'),JSON.stringify(f));execFileSync('node',['scripts/import-deep-review.mjs',p('batch.json'),p('answers.json'),p('labels.json'),p('scenes.json')]);expect(JSON.parse(readFileSync(p('labels.json'),'utf8')).labels).toEqual({'invented#1':'wrong'});expect(JSON.parse(readFileSync(p('scenes.json'),'utf8')).windows[0].events).toHaveLength(1);expect(readFileSync(p('scenes.json'),'utf8')).not.toContain('PRIVATE OWNER NOTES');}finally{rmSync(dir,{recursive:true,force:true});}
});
it.each(['belonging','negotiation'])('saves an individual hint assessment on the %s page without deciding nearby acts',async name=>{
 document.body.innerHTML=readFileSync(`review/${name}.html`,'utf8');const b=fixture();b.readings[0]={...b.readings[0],kind:'ogling',act:'staring at a bulge',claim:'Morgan notices Rowan’s bulge.',proposal:{revision:'v1',verdict:'correct',reading:'Morgan looks at Rowan’s bulge.',rationale:'This is an observation, not a performed act.',confidence:.93,errors:[]}};
 const page=await mountDeepReview(b,['Both are adults.','Morgan notices Rowan’s bulge.','Rowan makes an ambiguous gesture.']);
 const card=document.querySelector('[data-reading-id=D1]')!;expect(card.textContent).toContain('My confidence: 93%');Array.from(card.querySelectorAll('button')).find(b=>b.textContent==='Agree with my assessment')!.click();const f=page.getFeedback();expect(f.readingAnswers.D1.verdict).toBe('correct');expect(f.readingAnswers.D2).toBeUndefined();expect(f.actAnswers).toEqual({});expect(buildDeepReviewImports(b,f).confidence.labels).toEqual({'invented#1':'ok'});
 expect(document.getElementById('readings-title')!.textContent).toContain('hints and other cues');
});
