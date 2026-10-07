import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { importAnswers, validateSuspectBatch, type ReviewBatch, type ReviewAnswer } from '../review/review-batch-data';
import { mountReview } from '../review/review-batch';
const published = JSON.parse(readFileSync('public/review/suspect-scenes-2.json', 'utf8')) as ReviewBatch;
afterEach(() => { localStorage.clear(); document.body.replaceChildren(); vi.restoreAllMocks(); });
it('provides 40 new contextual items, bounded act evidence and honest engine scores', () => {
  expect(validateSuspectBatch(published)).toBe(published);
  const excluded = ['suspect-scenes', 'next-batch', 'gold-verdicts', 'missed-scenes'].flatMap(file => JSON.parse(readFileSync(`public/review/${file}.json`, 'utf8')).rows);
  for (const [i, row] of published.rows.entries()) {
    expect(row.sceneActs!.length).toBeGreaterThan(0);
    expect(row.engineReadings!.some(h => h.key === row.key)).toBe(true);
    if (i) expect(row.engineConfidence!).toBeGreaterThanOrEqual(published.rows[i - 1].engineConfidence!);
    for (const other of [...excluded, ...published.rows.slice(0, i)]) if (other.fic === row.fic) {
      expect(row.key).not.toBe(other.key);
      for (const e of other.evidence ?? [{ from: other.from ?? other.para, to: other.to ?? other.para }]) expect(row.evidence![0].to < e.from || row.evidence![0].from > e.to).toBe(true);
    }
    for (const hit of row.engineReadings!) { expect(hit).not.toHaveProperty('sentence'); expect(hit).not.toHaveProperty('paras'); }
  }
  expect(published.rows.flatMap(r => r.sceneActs!).some(a => a.engineConfidence === null)).toBe(true);
  expect(published.rows.flatMap(r => r.sceneActs!).some(a => a.occurrence === 'imagined')).toBe(true);
  expect(published.sources.some(s => s.file === 'slipfast.html')).toBe(false);
  const invalid = structuredClone(published); invalid.rows[0].sceneActs![0].engineConfidence = 0;
  expect(() => validateSuspectBatch(invalid)).toThrow('confidence');
  invalid.rows[0].sceneActs![0].engineConfidence = published.rows[0].sceneActs![0].engineConfidence;
  invalid.rows[0].sceneActs![0].evidence.to = 999999;
  expect(() => validateSuspectBatch(invalid)).toThrow('act proposal');
});
const synthetic = (): ReviewBatch => ({ schema: 'engine-review-batch/v1', batchId: 'invented-act-review', engineCommit: 'test', sources: [{file:'adult.html',title:'Invented adult encounter',sourceSha:'sha',paragraphSha:'paras',paragraphCount:3}], rows:[{
 id:'T1',key:'invented#hash',fic:'adult.html',para:1,pattern:'invented',a:'Morgan',b:'Rowan',act:'anal sex',kind:'act',claim:'Morgan penetrates Rowan with a penis.',engineConfidence:.74,evidence:[{from:0,to:2}],proposal:{revision:'r1',verdict:'wrong',reading:'Morgan fingers Rowan.',rationale:'The instrument remains a finger.',confidence:.95,errors:['Wrong act or body part']},
 sceneActs:[{id:'A1',revision:'r1',act:'Fingering',performer:'Morgan',receiver:'Rowan',occurrence:'performed',evidence:{from:1,to:1},reviewerConfidence:.95,note:'No penis insertion is established.',engineReadingKeys:[],engineConfidence:null},{id:'A2',revision:'r1',act:'Handjob',performer:'Rowan',receiver:'Morgan',occurrence:'imagined',evidence:{from:2,to:2},reviewerConfidence:.88,note:'A thought rather than a performed act.',engineReadingKeys:['hj#hash'],engineConfidence:.68}],
 engineReadings:[{key:'hj#hash',para:2,pattern:'invented',act:'handjob',kind:'hypothetical',claim:'Rowan imagines giving Morgan a handjob.',confidence:.68,a:'Rowan',b:'Morgan',features:[],attribution:{}}]
}] });
it('gates per-act controls and exports corrections independently without accepting other acts or hints', async () => {
 document.body.innerHTML = readFileSync('review/next-batch.html','utf8'); const batch = synthetic();
 const blocked = await mountReview(batch); document.querySelector<HTMLButtonElement>('[data-act-verdict=correct]')!.click(); expect(blocked.payload().answers).toHaveLength(0);
 expect(document.querySelector('[data-act-id=A1] .act-evidence')!.textContent).toContain('Load the story');
 batch.rows[0].sceneActs![1].evidence.from = 1;
 const stories = new Map([['adult.html',['Adult characters meet.','Morgan inserts a finger into Rowan.','Rowan imagines a handjob.']]]);
 const api = await mountReview(batch,{stories});
 expect(document.querySelector('[data-act-id=A1]')!.textContent).toContain('no confidence score');
 expect(document.querySelector('[data-act-id=A1] .act-evidence')!.textContent).toBe('¶1 · Morgan inserts a finger into Rowan.');
 expect(document.querySelectorAll('[data-act-id=A2] .act-evidence p')).toHaveLength(2);
 expect(document.querySelector('[data-act-id=A2] .act-evidence')!.textContent).toBe('¶1 · Morgan inserts a finger into Rowan.¶2 · Rowan imagines a handjob.');
 expect(document.querySelector('[data-act-id=A2]')!.textContent).toContain('hypothetical, 68%');
 document.querySelector<HTMLButtonElement>('[data-act-id=A1] [data-act-verdict=wrong]')!.click();
 const receiver = document.querySelector<HTMLInputElement>('[data-act-id=A1] [data-act-field=receiver]')!; receiver.value='Morgan'; receiver.dispatchEvent(new Event('input'));
 const context = document.querySelector<HTMLTextAreaElement>('[data-act-id=A1] [data-act-field=context]')!; context.value='Self-insertion, not a partner act.'; context.dispatchEvent(new Event('input'));
 document.querySelector<HTMLInputElement>('[data-act-id=A1] fieldset input')!.click();
 document.querySelector<HTMLInputElement>('#coverage-complete')!.click();
 expect(api.answers.T1.verdict).toBeUndefined(); expect(api.answers.T1.actReviews!.A2).toBeUndefined();
 expect(api.answers.T1.actReviews!.A1).toMatchObject({verdict:'wrong',receiver:'Morgan',context:context.value,errors:['Wrong person']});
 expect(api.answers.T1.coverageComplete).toBe(true);
 const payload=api.payload(), imported: Record<string,ReviewAnswer>={}; expect(importAnswers(batch,payload,imported)).toBe(1); expect(imported.T1).toEqual(api.answers.T1);
 const altered=structuredClone(payload); altered.answers[0].actReviews!.A1.revision='other'; expect(()=>importAnswers(batch,altered,{})).toThrow('act proposal');
 const wrongWindow=structuredClone(payload); wrongWindow.answers[0].evidence=[{from:0,to:1}]; expect(()=>importAnswers(batch,wrongWindow,{})).toThrow('scene window');
 document.body.innerHTML=readFileSync('review/next-batch.html','utf8'); const reopened=await mountReview(batch,{stories}); expect(reopened.answers.T1.actReviews!.A1.receiver).toBe('Morgan');
 expect(localStorage.getItem('engine-review:'+batch.batchId)).not.toContain(stories.get('adult.html')![1]);
 document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.click(); expect(reopened.answers.T1.actReviews!.A1.verdict).toBe('wrong'); expect(reopened.answers.T1.actReviews!.A2).toBeUndefined();
});
