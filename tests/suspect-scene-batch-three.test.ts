import {readFileSync, readdirSync} from 'node:fs';
import {afterEach, expect, it, vi} from 'vitest';
import {validateSuspectBatch, type ReviewBatch} from '../review/review-batch-data';
import {mountReview} from '../review/review-batch';
import {probability} from '../src/heuristic/learned';
import {precisionOf} from '../src/heuristic/reliability';
const batch = JSON.parse(readFileSync('public/review/suspect-scenes-3.json','utf8')) as ReviewBatch;
afterEach(() => {localStorage.clear(); document.body.replaceChildren(); vi.restoreAllMocks();});
it('provides 50 new reviewed passages, with real model scores and no repeated prior review windows', () => {
 expect(validateSuspectBatch(batch, 50)).toBe(batch);
 expect(() => validateSuspectBatch(batch)).toThrow('incomplete');
 expect(batch.sources).toHaveLength(20);
 const prior = readdirSync('public/review').filter(f => f.endsWith('.json') && f !== 'suspect-scenes-3.json').flatMap(f => JSON.parse(readFileSync(`public/review/${f}`,'utf8')).rows ?? []);
 const labelled = new Set(readdirSync('tests/labels').filter(f => f.endsWith('.json')).flatMap(f => Object.keys(JSON.parse(readFileSync(`tests/labels/${f}`,'utf8')).labels)));
 for (const [i,row] of batch.rows.entries()) {
  expect(labelled.has(row.key)).toBe(false);
  expect(['act','handjob','solo','masturbation']).toContain(row.kind);
  const window = row.evidence![0];
  const main = row.engineReadings!.find(h => h.key === row.key)!;
  expect(main).toBeDefined();
  expect(row.engineConfidence).toBe(probability(precisionOf(row.pattern),main.features));
  for (const other of prior.filter(r => r.fic === row.fic)) {
   for (const e of other.evidence ?? (other.context ? [other.context] : [{from:other.from ?? other.para,to:other.to ?? other.para}])) {
    expect(window.to < e.from || window.from > e.to, `${row.id} overlaps ${other.id}`).toBe(true);
    expect(row.para < e.from - 20 || row.para > e.to + 20, `${row.id} too close to ${other.id}`).toBe(true);
   }
  }
  for (const other of batch.rows.slice(0,i).filter(r => r.fic === row.fic)) {
   expect(Math.abs(row.para - other.para)).toBeGreaterThanOrEqual(40);
   expect(window.to < other.evidence![0].from || window.from > other.evidence![0].to).toBe(true);
  }
  for (const h of row.engineReadings!) {
   expect(h).not.toHaveProperty('sentence'); expect(h).not.toHaveProperty('paras');
   if(h.features.length) expect(h.confidence).toBe(probability(precisionOf(h.pattern),h.features));
  }
 }
 expect(batch.rows.filter(r=>r.proposal!.verdict==='wrong')).toHaveLength(27);
 expect(batch.rows.flatMap(r=>r.sceneActs!)).toHaveLength(87);
 expect(batch.sources.map(s=>s.file)).not.toContain('pact-of-ice-and-fire.html');
});
it('records unresolved feedback without turning disagreement into a verdict, and separates acts from hints and frames', () => {
 expect(batch.selection!.feedback).toMatchObject({explicitCorrect:39,explicitWrong:7,explicitUncertain:1,unresolvedDisagreements:3,unresolvedIds:['L9','L10','L42'],usedForRankingOnly:true});
 const row=(id:string)=>batch.rows.find(r=>r.id===id)!;
 expect(row('U1').sceneActs![0].occurrence).toBe('habitual');
 expect(row('U2').sceneActs![0].occurrence).toBe('not performed');
 expect(row('U26').sceneActs![0].act).toBe('Toy insertion');
 expect(row('U34').sceneActs![0]).toMatchObject({performer:'Kyle',receiver:'Tanner',occurrence:'memory',engineConfidence:null});
 expect(row('U40').sceneActs![0].act).toBe('Oral finger contact');
 expect(row('U48').sceneActs!.filter(a=>a.act==='Anal penetration (penis)')).toHaveLength(2);
 expect(row('U48').sceneActs!.some(a=>a.act==='Fingering')).toBe(true);
 expect(batch.selection!.scope).toContain('no negative labels');
});
it('Agree accepts the assistant call, fills context/errors, and leaves other acts independently reviewable', async () => {
 document.body.innerHTML=readFileSync('review/next-batch.html','utf8');
 const one=structuredClone(batch); one.rows=[one.rows.find(r=>r.id==='U5')!];
 const row=one.rows[0], source=one.sources.find(s=>s.file===row.fic)!;
 const files:File[]=[];
 Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 Object.defineProperty(navigator,'share',{configurable:true,value:vi.fn(async ({files:shared}:{files:File[]})=>{files.push(...shared);})});
 const api=await mountReview(one,{stories:new Map([[row.fic,Array(source.paragraphCount).fill('Locally loaded passage.')]])});
 expect(api.payload().answers).toHaveLength(0);
 document.querySelector<HTMLButtonElement>('[data-proposal=agree]')!.click();
 expect(api.answers.U5.verdict).toBe('wrong');
 expect(api.answers.U5.context).toContain(row.proposal!.reading);
 expect(api.answers.U5.errors).toEqual(expect.arrayContaining(['Wrong person','Roles reversed']));
 expect(Object.values(api.answers.U5.actReviews ?? {}).every(a=>a.verdict===undefined)).toBe(true);
 document.getElementById('share')!.click();
 await vi.waitFor(()=>expect(files).toHaveLength(1));
 expect(files[0].name).toBe('suspect-scene-review-3-answers.json');
});
