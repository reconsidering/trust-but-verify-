import{describe,it,expect,beforeEach,vi}from 'vitest';
import{readFileSync}from 'node:fs';
import{validateClaudeBatch,agreeWithAssessment,disagreeWithAssessment,exportClaudeAnswers,importClaudeAnswers,type ClaudeBatch,type ClaudeAnswer}from '../review/claude-label-data';
import{mountClaudeReview}from '../review/claude-label-review';
const batch=JSON.parse(readFileSync('public/review/claude-oct4-5.json','utf8'))as ClaudeBatch;
const html=readFileSync('review/claude-oct4-5.html','utf8');
const item=(id:string)=>batch.items.find(r=>r.id===id)!;
describe('Complete October Claude-label review',()=>{
 it('contains every historical record with source, independent proposal and current score or explicit absence',()=>{
  expect(validateClaudeBatch(batch)).toBe(batch);expect(batch.items).toHaveLength(662);expect(batch.sources).toHaveLength(12);
  expect(Object.values(batch.statistics.counts).reduce((n,v)=>n+v,0)).toBe(662);
  expect(batch.items.filter(r=>!r.historical.replayVerified)).toHaveLength(51);
  expect(batch.items.filter(r=>!r.current.length)).toHaveLength(28);
  for(const r of batch.items){expect(r.historical.record.source).toBe('claude');expect(r.proposal.confidence).toBeGreaterThan(0);expect(r.proposal.reading).toBeTruthy();expect(r.proposal.rationale).toBeTruthy();expect(r.evidence.map(e=>e.target)).toEqual(r.locations);}
 });
 it('keeps separate hint and solo labels for the same source passage',()=>{
  const hint=item('C0447'),solo=item('C0459');expect(hint.paragraph).toBe(solo.paragraph);expect(hint.key).not.toBe(solo.key);expect(hint.historical.record.kind).toBe('hint');expect(solo.historical.record.kind).toBe('solo');
 });
 it('allows unavailable scores but rejects fabricated scores, missing assessments and contradictory past-label proposals',()=>{
  const copy=structuredClone(batch);copy.items[0].current[0].confidence=null;expect(()=>validateClaudeBatch(copy)).not.toThrow();copy.items[0].current[0].confidence=2;expect(()=>validateClaudeBatch(copy)).toThrow();
  const missing=structuredClone(batch);missing.items.pop();expect(()=>validateClaudeBatch(missing)).toThrow();
  const contradictory=structuredClone(batch);contradictory.items[0].proposal.pastLabel='keep';expect(()=>validateClaudeBatch(contradictory)).toThrow();
 });
 it('stores the original rejected roles separately from today’s corrected roles',()=>{
  const r=item('C0556');expect(r.historical.label).toBe('wrong');expect(r.historical.record.top).toBe('Steve Harrington');expect(r.current[0].a).toBe('Eddie Munson');
  const a=agreeWithAssessment(r);expect(a.originalVerdict).toBe('wrong');expect(a.currentVerdict).toBe('correct');expect(a.pastLabel).toBe('keep');expect(a.errors).toContain('Roles reversed');
 });
 it('Agree fills the correction and applicable errors while preserving authored notes and avoiding duplicates',()=>{
  const r=item('C0538');const original:ClaudeAnswer={context:'Please also check the earlier transition.',errors:['Wrong person'],updatedAt:'2026-10-09T00:00:00Z'};
  const a=agreeWithAssessment(r,original);expect(a.context).toContain(original.context);expect(a.context).toContain(r.proposal.rationale);expect(a.errors).toEqual(expect.arrayContaining(['Wrong person','Fingers or toy mistaken for a penis']));expect(agreeWithAssessment(r,a).context).toBe(a.context);expect(original.errors).toEqual(['Wrong person']);
 });
 it('Disagree never assumes the opposite verdict or erases notes',()=>{
  const a=disagreeWithAssessment(agreeWithAssessment(item('C0556')));expect(a.originalVerdict).toBeUndefined();expect(a.currentVerdict).toBeUndefined();expect(a.pastLabel).toBeUndefined();expect(a.context).toBeTruthy();expect(a.errors).toContain('Roles reversed');
 });
 it('round-trips partial answers and validates the entire file before merging',()=>{
  const answers={C0556:agreeWithAssessment(item('C0556')),C0538:{context:'Need a closer look.',errors:[],updatedAt:'2026-10-09T01:00:00Z'}};
  const data=exportClaudeAnswers(batch,answers),restored:Record<string,ClaudeAnswer>={};expect(importClaudeAnswers(batch,data,restored)).toBe(2);expect(restored.C0556.currentVerdict).toBe('correct');expect(restored.C0538.originalVerdict).toBeUndefined();
  const changed=structuredClone(data);changed.answers[1].key='different historical claim';const empty={};expect(()=>importClaudeAnswers(batch,changed,empty)).toThrow();expect(empty).toEqual({});
  const stale=structuredClone(data);stale.engineCommit='0'.repeat(40);expect(()=>importClaudeAnswers(batch,stale,{})).toThrow();
 });
 it('does not publish fic paragraphs, sentences, or the “read whole scene” gate',()=>{
  expect(Object.keys(batch.items[0])).not.toContain('sentence');expect(Object.keys(batch.sources[0])).not.toContain('paras');expect(html).not.toContain('type="checkbox" required');expect(html).toContain('Files stay on your device');
 });
});
describe('Owner-facing controls',()=>{
 beforeEach(()=>{document.body.innerHTML=html;localStorage.clear();});
 it('shows engine and reviewer scores and fills all answers with a single Agree',()=>{
  const {answers}=mountClaudeReview(batch),jump=document.getElementById('jump')as HTMLSelectElement;jump.value='C0556';jump.dispatchEvent(new Event('change'));
  expect(document.getElementById('current')!.textContent).toContain('Engine confidence');expect(document.getElementById('review-score')!.textContent).toContain('My confidence');
  document.getElementById('agree')!.click();expect(answers.C0556.currentVerdict).toBe('correct');expect((document.getElementById('past-verdict')as HTMLSelectElement).value).toBe('keep');expect((document.getElementById('context')as HTMLTextAreaElement).value).toContain('saved roles');
  document.getElementById('disagree')!.click();expect(answers.C0556.currentVerdict).toBeUndefined();expect(answers.C0556.context).toBeTruthy();
 });
 it('shows selected local paragraphs with enough expandable context, using text only',()=>{
  const {stories}=mountClaudeReview(batch),jump=document.getElementById('jump')as HTMLSelectElement,r=item('C0556');const paras=Array.from({length:batch.sources.find(s=>s.file===r.fic)!.paragraphCount},(_,i)=>`Invented adult-context paragraph ${i}`);paras[r.paragraph]='<script>unsafe markup</script>';stories.set(r.fic,paras);jump.value=r.id;jump.dispatchEvent(new Event('change'));
  expect(document.getElementById('passages')!.textContent).toContain('<script>unsafe markup</script>');expect(document.querySelector('#passages script')).toBeNull();expect(document.getElementById('passages')!.textContent).not.toContain(`paragraph ${r.paragraph-10}`);document.getElementById('more')!.click();expect(document.getElementById('passages')!.textContent).toContain(`paragraph ${r.paragraph-10}`);
 });
 it('warns when browser autosave fails but leaves answers exportable',()=>{
  const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('quota');});const {answers}=mountClaudeReview(batch);document.getElementById('agree')!.click();expect(Object.keys(answers)).toHaveLength(1);expect(document.getElementById('storage')!.textContent).toContain('storage is unavailable');expect(exportClaudeAnswers(batch,answers).answers).toHaveLength(1);spy.mockRestore();
 });
});
