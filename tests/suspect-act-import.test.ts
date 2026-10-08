import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {expect,it} from 'vitest';
import {buildSuspectActReview} from '../scripts/suspect-act-review.mjs';
import type {ReviewBatch} from '../review/review-batch-data';
const setup = () => {
 const source={file:'adult.html',title:'Invented adult encounter',sourceSha:'source',paragraphSha:'paras',paragraphCount:5};
 const acts=['Fingering','Blowjob','Anal penetration (penis)','Handjob','Solo masturbation','External anal stimulation'];
 const sceneActs=acts.map((act,i)=>({id:'A'+i,revision:'r1',act,performer:'Morgan',receiver:act==='Solo masturbation'?'':'Rowan',occurrence:'performed',evidence:{from:1,to:2},reviewerConfidence:.9,note:'Invented annotation.',engineReadingKeys:[],engineConfidence:null}));
 const batch:ReviewBatch={schema:'engine-review-batch/v1',batchId:'synthetic',engineCommit:'commit',sources:[source],rows:[{id:'T1',key:'invented#hash',fic:source.file,para:1,pattern:'invented',a:'Morgan',b:'Rowan',act:'anal sex',kind:'act',claim:'Morgan penetrates Rowan.',evidence:[{from:0,to:4}],sceneActs}]};
 const marked=['correct','correct','wrong','uncertain',undefined,'correct'];
 const actReviews=Object.fromEntries(sceneActs.map((a,i)=>[a.id,{revision:a.revision,act:a.act,performer:a.performer,receiver:a.receiver,occurrence:i===1?'imagined':'performed',verdict:marked[i],errors:[],context:'DO_NOT_PUBLISH_PRIVATE_CONTEXT'}]));
 const feedback={schema:batch.schema,batchId:batch.batchId,engineCommit:batch.engineCommit,answers:[{id:'T1',key:'invented#hash',fic:source.file,paragraph:1,sourceSha:source.sourceSha,evidence:batch.rows[0].evidence,verdict:'wrong',errors:[],context:'DO_NOT_PUBLISH_PRIVATE_CONTEXT',updatedAt:'2026-10-07T00:00:00Z',coverageComplete:true,actReviews}]};
 return {batch,feedback};
};
it('keeps only confirmed performed positives and separately preserves context, rejected and uncertain reviews',()=>{
 const {batch,feedback}=setup(),saved=buildSuspectActReview(batch,feedback),w=saved.windows[0];
 expect(w.reviews).toHaveLength(5);expect(w.events.map(e=>e.act)).toEqual(['Fingering','External anal stimulation']);expect(w.events.map(e=>e.scored)).toEqual([true,false]);
 expect(w.coverage).toBe('positive-only');expect(w.coverageReviewed).toBe(true);expect(JSON.stringify(saved)).not.toContain('DO_NOT_PUBLISH_PRIVATE_CONTEXT');
 const older=structuredClone(feedback);older.answers[0].updatedAt='2026-10-06T00:00:00Z';older.answers[0].actReviews.A0.verdict='wrong';expect(buildSuspectActReview(batch,older,saved).windows).toEqual(saved.windows);
 for(const wrong of [()=>{feedback.answers[0].actReviews.A0.revision='other';},()=>{feedback.answers[0].evidence=[{from:0,to:3}];}]){const fixture=setup();wrong();expect(()=>buildSuspectActReview(batch,feedback)).toThrow();Object.assign(feedback,fixture.feedback);}
});
it('validates both outputs before writing and never discards per-act answers silently',()=>{
 const {batch,feedback}=setup(),dir=mkdtempSync(join(tmpdir(),'suspect-act-import-')),bp=join(dir,'batch.json'),ap=join(dir,'answers.json'),lp=join(dir,'labels.json'),sp=join(dir,'acts.json');writeFileSync(bp,JSON.stringify(batch));writeFileSync(ap,JSON.stringify(feedback));
 const run=(...paths:string[])=>spawnSync('node',['scripts/import-review-batch.mjs',bp,ap,...paths]);
 expect(run(lp).status).not.toBe(0);expect(run(lp,sp).status).toBe(0);expect(JSON.parse(readFileSync(lp,'utf8')).labels).toEqual({'invented#hash':'wrong'});
 const beforeLabels=readFileSync(lp,'utf8'),beforeActs=readFileSync(sp,'utf8');feedback.answers[0].actReviews.A0.revision='changed';writeFileSync(ap,JSON.stringify(feedback));expect(run(lp,sp).status).not.toBe(0);expect(readFileSync(lp,'utf8')).toBe(beforeLabels);expect(readFileSync(sp,'utf8')).toBe(beforeActs);
 expect(beforeActs).not.toContain('DO_NOT_PUBLISH_PRIVATE_CONTEXT');expect(run(lp,'tests/labels/never-write-acts.json').status).not.toBe(0);
});
it('preserves a cleared act field on an explicit rejection without creating a performed event',()=>{
 const {batch,feedback}=setup();feedback.answers[0].actReviews.A2.act='';
 const result=buildSuspectActReview(batch,feedback),review=result.windows[0].reviews.find(r=>r.id==='A2');
 expect(review).toMatchObject({act:'',verdict:'wrong'});expect(result.windows[0].events.some(e=>e.ownerActId==='A2')).toBe(false);
 feedback.answers[0].actReviews.A2.verdict='correct';expect(()=>buildSuspectActReview(batch,feedback)).toThrow('Invalid act proposal');
 feedback.answers[0].actReviews.A2.verdict='uncertain';expect(()=>buildSuspectActReview(batch,feedback)).toThrow('Invalid act proposal');
});
