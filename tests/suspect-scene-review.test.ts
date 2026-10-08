import {readFileSync,readdirSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
import {mountReview} from '../review/review-batch';
import {importAnswers,validateSuspectBatch,type ReviewBatch} from '../review/review-batch-data';
const published = JSON.parse(readFileSync('public/review/suspect-scenes.json','utf8')) as ReviewBatch;
afterEach(()=>{localStorage.clear();document.body.replaceChildren();vi.restoreAllMocks();});
it('has 40 fresh, ranked, contextual proposals without private story paragraphs or feature vectors',()=>{
 expect(validateSuspectBatch(published)).toBe(published);
 const old=JSON.parse(readFileSync('public/review/next-batch.json','utf8')) as ReviewBatch;
 for(const source of published.sources){const previous=old.sources.find(s=>s.file===source.file);if(previous)expect(source).toEqual(previous);}
 const done=new Set(old.rows.map(r=>r.key));
 for(const f of readdirSync('tests/labels').filter(f=>f.endsWith('.json'))){const accepted=JSON.parse(readFileSync('tests/labels/'+f,'utf8'));if(accepted.batchId===published.batchId)continue;for(const key of Object.keys(accepted.labels??{}))done.add(key);}
 const pattern=new Map<string,number>(),fic=new Map<string,number>();
 for(const [i,row] of published.rows.entries()){
  expect(done.has(row.key)).toBe(false);
  if(i)expect(row.engineConfidence!).toBeGreaterThanOrEqual(published.rows[i-1].engineConfidence!);
  expect(row.kind).toBe('act');
  expect(Object.keys(row).sort()).toEqual(['a','act','b','claim','engineConfidence','evidence','fic','id','key','kind','pattern','para','proposal'].sort());
  const base=row.pattern.replace(/~elided$/,'');pattern.set(base,(pattern.get(base)??0)+1);fic.set(row.fic,(fic.get(row.fic)??0)+1);
  for(const other of published.rows.slice(0,i).filter(r=>r.fic===row.fic))expect(Math.abs(other.para-row.para)).toBeGreaterThan(20);
 }
 expect(Math.max(...pattern.values())).toBeLessThanOrEqual(4);expect(Math.max(...fic.values())).toBeLessThanOrEqual(6);
 for(const source of published.sources)expect(Object.keys(source).sort()).toEqual(['file','title','sourceSha','paragraphSha','paragraphCount'].sort());
 const invalid=structuredClone(published);invalid.rows[0].engineConfidence=NaN;expect(()=>validateSuspectBatch(invalid)).toThrow('invalid');
 invalid.rows[0].engineConfidence=.5;invalid.rows[0].proposal!.confidence=101;expect(()=>validateSuspectBatch(invalid)).toThrow('invalid');
});
const synthetic=():ReviewBatch=>({...published,batchId:'invented-proposal-review',sources:[{file:'adult.html',title:'Invented adult scene',paragraphCount:5,sourceSha:'source',paragraphSha:'paragraphs'}],rows:[{id:'S1',key:'invented#hash',fic:'adult.html',para:2,pattern:'invented',a:'Morgan',b:'Rowan',act:'anal sex',kind:'act',claim:'Morgan penetrates Rowan anally with a penis.',engineConfidence:.76,evidence:[{from:1,to:3}],proposal:{revision:'r1',verdict:'wrong',reading:'Morgan fingers Rowan.',rationale:'The adjacent action identifies a finger, not a penis.',confidence:.95,errors:['Fingers or toy mistaken for a penis']}}]});
const setup=()=>{document.body.innerHTML=readFileSync('review/next-batch.html','utf8');};
it('gates proposal buttons, shows both distinct confidences, and saves agreed engine assessments',async()=>{
 setup();const batch=synthetic();const blocked=await mountReview(batch);
 expect(document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.disabled).toBe(true);
 document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.click();expect(blocked.payload().answers).toHaveLength(0);
 const stories=new Map([['adult.html',['Intro','Morgan warms lubricant.','Morgan inserts one finger into Rowan.','Rowan responds.','End']]]);
 const api=await mountReview(batch,{stories});
 expect(document.getElementById('engine-confidence')!.textContent).toContain('76%');expect(document.getElementById('proposal-confidence')!.textContent).toContain('95%');
 expect(document.getElementById('passages')!.textContent).toContain('one finger');
 document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.click();
 expect(api.answers.S1).toMatchObject({verdict:'wrong',proposalReview:'agree',proposalRevision:'r1',errors:['Fingers or toy mistaken for a penis']});
 expect((document.getElementById('context') as HTMLTextAreaElement).value).toBe(`${batch.rows[0].proposal!.reading}\n\n${batch.rows[0].proposal!.rationale}`);
 expect([...document.querySelectorAll<HTMLInputElement>('#errors input')].filter(i=>i.checked).map(i=>i.parentElement!.textContent)).toEqual(['Fingers or toy mistaken for a penis']);
 const text=document.getElementById('context') as HTMLTextAreaElement;text.value='My correction <script>unsafe()</script>';text.dispatchEvent(new Event('input'));
 expect(document.querySelector('#context script')).toBeNull();expect(api.payload().answers[0].context).toBe(text.value);
 expect(localStorage.getItem('engine-review:'+batch.batchId)).not.toContain('Morgan inserts one finger');
 const imported:Record<string,typeof api.answers.S1>={};expect(importAnswers(batch,api.payload(),imported)).toBe(1);expect(imported.S1.proposalReview).toBe('agree');
 const altered=structuredClone(api.payload());altered.answers[0].proposalRevision='other';expect(()=>importAnswers(batch,altered,{})).toThrow('different proposed');
 setup();const restored=await mountReview(batch,{stories});expect(restored.answers.S1.verdict).toBe('wrong');
});
it('adds all proposed error checkboxes and context on agreement without erasing notes or duplicating the assessment',async()=>{
 setup();const batch=synthetic();batch.rows[0].proposal!.errors.push('Hypothetical / wanted / threatened');
 const api=await mountReview(batch,{stories:new Map([['adult.html',['Intro','Lead-in','Invented adult action','Reaction','End']]])});
 const context=document.getElementById('context') as HTMLTextAreaElement;
 context.value='My additional observation.';context.dispatchEvent(new Event('input'));
 document.querySelector<HTMLInputElement>('#errors input')!.click();
 const agree=document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!;agree.click();
 const expected=`My additional observation.\n\n${batch.rows[0].proposal!.reading}\n\n${batch.rows[0].proposal!.rationale}`;
 expect(context.value).toBe(expected);expect(api.answers.S1.errors).toEqual(['Wrong person','Fingers or toy mistaken for a penis','Hypothetical / wanted / threatened']);
 expect([...document.querySelectorAll<HTMLInputElement>('#errors input')].filter(i=>i.checked).map(i=>i.parentElement!.textContent)).toEqual(api.answers.S1.errors);
 agree.click();expect(context.value).toBe(expected);expect(api.payload().answers[0].context).toBe(expected);
 setup();const reopened=await mountReview(batch,{stories:new Map([['adult.html',['Intro','Lead-in','Invented adult action','Reaction','End']]])});
 expect(reopened.answers.S1.context).toBe(expected);expect(reopened.answers.S1.errors).toEqual(api.answers.S1.errors);
});
it('never turns disagree into the opposite label and preserves disagreement with a manual correction',async()=>{
 setup();const batch=synthetic(),api=await mountReview(batch,{stories:new Map([['adult.html',['','', 'Invented adult action','','']]])});
 document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.click();
 document.querySelector<HTMLButtonElement>('[data-proposal=disagree]')!.click();
 expect(api.answers.S1.verdict).toBeUndefined();expect(api.answers.S1.proposalReview).toBe('disagree');expect(document.getElementById('progress')!.textContent).toBe('0 of 1 answered');
 document.querySelector<HTMLButtonElement>('[data-verdict=wrong]')!.click();expect(api.answers.S1).toMatchObject({verdict:'wrong',proposalReview:'disagree'});
 document.querySelector<HTMLButtonElement>('[data-proposal=uncertain]')!.click();expect(api.answers.S1).toMatchObject({verdict:'uncertain',proposalReview:'uncertain'});
 document.getElementById('clear')!.click();expect(api.answers.S1).toBeUndefined();
});
