import {readFileSync} from 'node:fs';
import {expect,it,afterEach} from 'vitest';
import {validatePastLabelBatch,importAnswers,type ReviewBatch} from '../review/review-batch-data';
import {mountReview} from '../review/review-batch';
const batch=JSON.parse(readFileSync('public/review/past-labels-2.json','utf8')) as ReviewBatch;
afterEach(()=>{localStorage.clear();document.body.replaceChildren();});
it('provides fifty fresh past-label comparisons with distinct history, current scores and reviewed calls',()=>{
 expect(validatePastLabelBatch(batch)).toBe(batch);
 expect(batch.sources).toHaveLength(22);
 const excluded=['past-labels','suspect-scenes-3'].flatMap(f=>JSON.parse(readFileSync(`public/review/${f}.json`,'utf8')).rows);
 for(const row of batch.rows){
  expect(row.labelAudit!.pastLabels.some(l=>!l.retired)).toBe(true);
  expect(row.labelAudit!.pastLabels.every(l=>l.claim && l.provenance && !l.identityVerified)).toBe(true);
  expect(row.labelAudit!.referenceIsOriginal).toBe(false);
  for(const other of excluded.filter(r=>r.fic===row.fic))for(const e of other.evidence){
   const window=row.evidence![0];expect(window.to<e.from || window.from>e.to,`${row.id} repeats ${other.id}`).toBe(true);
  }
 }
 expect(batch.selection!.latestFeedback).toMatchObject({explicitCorrect:39,explicitWrong:7,explicitUncertain:1,unresolvedIds:['L9','L10','L42']});
 expect(batch.rows.filter(r=>r.proposal!.verdict==='correct')).toHaveLength(10);
 expect(batch.rows.filter(r=>r.proposal!.verdict==='uncertain')).toHaveLength(4);
 expect(batch.sources.map(s=>s.file)).not.toContain('pact-of-ice-and-fire.html');
});
it('does not silently equate hash-only or category-summary records with the current engine claim',()=>{
 for(const row of batch.rows)for(const label of row.labelAudit!.pastLabels){
  expect(label.claim).not.toBe(row.claim);
  expect(label.claim).toMatch(/original.*(?:not saved|not recorded)/i);
 }
 const row=batch.rows.find(r=>r.id==='P28')!;
 expect(row.kind).toBe('hypothetical');expect(row.proposal!.verdict).toBe('correct');
 expect(batch.rows.find(r=>r.id==='P1')!.proposal!.reading).toContain('plug');
 expect(batch.rows.find(r=>r.id==='P13')!.proposal!.errors).toContain('Memory counted as a new scene');
});
it('agreement accepts today’s call and requests a fresh identity-specific label without approving old history',async()=>{
 document.body.innerHTML=readFileSync('review/next-batch.html','utf8');
 const one=structuredClone(batch);one.rows=[one.rows.find(r=>r.id==='P28')!];const row=one.rows[0],s=one.sources.find(s=>s.file===row.fic)!;
 const api=await mountReview(one,{stories:new Map([[row.fic,Array(s.paragraphCount).fill('Locally loaded passage.')]])});
 expect(api.payload().answers).toHaveLength(0);
 document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.click();
 const answer=api.payload().answers[0];expect(answer.verdict).toBe('correct');expect(answer.pastLabelReview).toBe('replace');expect(answer.context).toContain(row.proposal!.reading);
 expect(importAnswers(one,api.payload(),{})).toBe(1);
 expect(document.getElementById('past-label-history')!.textContent).toContain('Past label:');
 document.querySelector<HTMLButtonElement>('[data-past-label=uncertain]')!.click();expect(api.answers.P28.pastLabelReview).toBe('uncertain');
 expect(batch.selection!.answerFile).toBe('past-label-review-2-answers.json');
});
it('includes all 164 window readings, each with its own versioned assessment and score provenance',()=>{
 const readings=batch.rows.flatMap(r=>r.engineReadings??[]);expect(readings).toHaveLength(164);
 for(const row of batch.rows){expect(row.engineReadings!.filter(h=>h.id==='primary')).toHaveLength(1);expect(new Set(row.engineReadings!.map(h=>h.id)).size).toBe(row.engineReadings!.length);
  for(const h of row.engineReadings!){expect(h.proposal!.rationale.length).toBeGreaterThan(10);expect(h.confidenceBasis).toBeTruthy();expect(h).not.toHaveProperty('sentence');expect(h.para).toBeGreaterThanOrEqual(row.evidence![0].from);expect(h.para).toBeLessThanOrEqual(row.evidence![0].to);}
 }
 expect(readings.filter(h=>h.confidence===null)).toHaveLength(11);
 expect(readings.some(h=>h.kind==='hypothetical'&&h.proposal!.verdict==='correct')).toBe(true);
});
