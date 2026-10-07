import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {TextEncoder,TextDecoder} from 'node:util';
import {afterEach,expect,it,vi} from 'vitest';
import JSZip from 'jszip';
import {buildMissedBatch} from '../scripts/build-missed-scene-batch.mjs';
import {ACTS,OCCURRENCES,emptyAnswer,importSceneAnswers,validSceneAnswer,type SceneBatch} from '../review/missed-scene-data';
import {mountMissedReview} from '../review/missed-scene-review';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const fixture='<div id="chapters"><p>Morgan and Rowan are adults.</p><p>Morgan kisses Rowan.</p><p>Rowan speaks.</p></div>';
const source={file:'adult.html',title:'Invented adult story',sourceSha:hash(fixture),paragraphSha:hash('Morgan and Rowan are adults.\nMorgan kisses Rowan.\nRowan speaks.'),paragraphCount:3,wordCount:14,lengthBand:'short',participants:['Morgan','Rowan'],eligibleWindows:1,cueWindows:1,style:{dialogueFraction:0,meanParagraphWords:4.6}};
const row={id:'M1',fic:source.file,from:1,to:2,windowSha:hash('Morgan kisses Rowan. Rowan speaks.'),lane:'random' as const};
const batch:SceneBatch={schema:'engine-missed-scene-review/v1',batchId:'invented',referenceCommit:'a'.repeat(40),selection:{},sources:[source],rows:[row]};
const completed=()=>({...emptyAnswer(),verdict:'acts' as const,complete:true,events:[{act:ACTS[9],occurrence:OCCURRENCES[0],performer:'Morgan',receiver:'Rowan',from:1,to:1}],updatedAt:'2026-10-07T00:00:00Z'});
const payload=(answer=completed())=>({schema:batch.schema,batchId:batch.batchId,referenceCommit:batch.referenceCommit,answers:[{...row,sourceSha:source.sourceSha,...answer}]});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();localStorage.clear();document.body.replaceChildren();});
const setup=()=>{vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('TextEncoder',TextEncoder);vi.stubGlobal('TextDecoder',TextDecoder);document.body.innerHTML=readFileSync('review/missed-scenes.html','utf8');};

it('samples without accessing detector results, remains reproducible, and excludes unsafe windows',()=>{
 const paras=Array.from({length:160},(_,i)=>i<16?'A child walks to school.':i%16<3?'Adult Morgan touches Rowan with his fingers.':`Adult Rowan speaks in paragraph ${i}.`);
 const story={file:'adult.html',title:'Invented adult story',meta:{words:1000,characters:['Morgan','Rowan'],relationships:['Morgan/Rowan']},paras,sourceSha:hash('invented'),paragraphSha:hash(paras.join('\n')),html:'adult story',get hits(){throw Error('Detector hits must never be accessed');}};
 const built=buildMissedBatch([story],{referenceCommit:batch.referenceCommit});
 expect(buildMissedBatch([story],{referenceCommit:batch.referenceCommit})).toEqual(built);
 expect(built.rows).toHaveLength(4);expect(built.rows.filter(r=>r.lane==='random')).toHaveLength(2);expect(new Set(built.rows.map(r=>r.from)).size).toBe(4);
 expect(built.rows.every(r=>r.from>=32)).toBe(true);expect(JSON.stringify(built)).not.toContain('touches Rowan');
 expect(()=>buildMissedBatch([Object.assign(Object.create(story),{html:'<dd>Underage</dd>'})],{referenceCommit:batch.referenceCommit})).toThrow('Excluded');
 expect(()=>buildMissedBatch([story],{referenceCommit:batch.referenceCommit,width:0})).toThrow('width');
});

it('publishes diverse source identities and ranges without story text or detector claims',()=>{
 const published=JSON.parse(readFileSync('public/review/missed-scenes.json','utf8')) as SceneBatch;
 expect(published.rows).toHaveLength(40);expect(published.sources).toHaveLength(10);expect(new Set(published.sources.map(s=>s.lengthBand)).size).toBe(3);expect(published.rows.filter(r=>r.lane==='random')).toHaveLength(20);
 expect(new Set(published.rows.map(r=>r.id)).size).toBe(40);
 for(const r of published.rows){expect(Object.keys(r).sort()).toEqual(['fic','from','id','lane','to','windowSha']);const s=published.sources.find(s=>s.file===r.fic)!;expect(r.from).toBeGreaterThanOrEqual(0);expect(r.to).toBeLessThan(s.paragraphCount);expect(r.windowSha).toMatch(/^[a-f0-9]{64}$/);expect(published.rows.filter(other=>other.fic===r.fic&&other.id!==r.id&&other.from<=r.to&&other.to>=r.from)).toHaveLength(0);}
});

it('separates unfinished and uncertain answers from completed inventories and validates every evidence range',()=>{
 expect(validSceneAnswer(completed(),row)).toBe(true);
 expect(validSceneAnswer({...emptyAnswer(),verdict:'none',complete:true},row)).toBe(true);
 expect(validSceneAnswer({...completed(),verdict:'uncertain'},row)).toBe(false);
 expect(validSceneAnswer({...completed(),events:[]},row)).toBe(false);
 expect(validSceneAnswer({...completed(),events:[{...completed().events[0],receiver:''}]},row)).toBe(false);
 expect(validSceneAnswer({...completed(),events:[{...completed().events[0],from:0}]},row)).toBe(false);
 expect(validSceneAnswer({...completed(),events:[{...completed().events[0],act:'Solo masturbation',receiver:''}]},row)).toBe(true);
});

it('imports atomically, rejects altered passage identity, preserves newer answers and restores all event fields',()=>{
 const current={M1:completed()};const p=payload({...completed(),updatedAt:'2026-10-08T00:00:00Z'});
 expect(()=>importSceneAnswers(batch,{...p,answers:[p.answers[0],{...p.answers[0],id:'other'}]},current)).toThrow('match');expect(current.M1.updatedAt).toBe('2026-10-07T00:00:00Z');
 expect(()=>importSceneAnswers(batch,{...p,answers:[{...p.answers[0],windowSha:'wrong'}]},current)).toThrow('match');
 expect(importSceneAnswers(batch,p,current)).toBe(1);expect(importSceneAnswers(batch,payload(),current)).toBe(0);
 expect(()=>importSceneAnswers(batch,{...p,batchId:'other'},current)).toThrow('different');expect(current.M1.events).toEqual(p.answers[0].events);
});

it('gates annotation on verified ZIP input, records multiple acts and saves without story text or uploads',async()=>{
 setup();const network=vi.fn();vi.stubGlobal('fetch',network);const api=await mountMissedReview(batch);
 expect(document.querySelector<HTMLButtonElement>('[data-answer="acts"]')!.disabled).toBe(true);
 const zip=await new JSZip().file('renamed.html',fixture).generateAsync({type:'arraybuffer'});
 await api.loadFiles([{name:'samples.zip',arrayBuffer:async()=>zip}]);
 expect(document.getElementById('passages')!.textContent).toContain('Morgan kisses Rowan');
 document.querySelector<HTMLButtonElement>('[data-answer="acts"]')!.click();
 const selects=document.querySelectorAll<HTMLSelectElement>('#events select');selects[0].value=ACTS[9];selects[0].dispatchEvent(new Event('change'));
 const inputs=document.querySelectorAll<HTMLInputElement>('#events input:not([type=number])');inputs[0].value='Morgan';inputs[0].dispatchEvent(new Event('input'));inputs[1].value='Rowan';inputs[1].dispatchEvent(new Event('input'));
 (document.getElementById('complete') as HTMLInputElement).click();expect(api.answers.M1.complete).toBe(true);
 document.getElementById('add-act')!.click();expect(api.answers.M1.events).toHaveLength(2);expect(api.answers.M1.complete).toBe(false);
 const textarea=document.getElementById('context') as HTMLTextAreaElement;textarea.value='<img onerror="bad">Additional context';textarea.dispatchEvent(new Event('input'));
 const exported=api.payload();expect(exported.answers[0].from).toBe(row.from);expect(exported.answers[0].events).toHaveLength(2);expect(exported.answers[0].context).toBe(textarea.value);expect(document.querySelector('#context img')).toBeNull();
 expect(localStorage.getItem('missed-scene-review:invented')).not.toContain(fixture);expect(network).not.toHaveBeenCalled();
 setup();const reopened=await mountMissedReview(batch);expect(reopened.answers.M1.events).toHaveLength(2);expect(document.querySelector<HTMLButtonElement>('[data-answer="acts"]')!.disabled).toBe(true);
});

it('requires explicit confirmation for no-act answers and prevents incomplete forms counting as finished',async()=>{
 setup();const api=await mountMissedReview(batch);await api.loadFiles([{name:'adult.html',arrayBuffer:async()=>new TextEncoder().encode(fixture).buffer as ArrayBuffer}]);
 document.querySelector<HTMLButtonElement>('[data-answer="acts"]')!.click();(document.getElementById('complete') as HTMLInputElement).click();expect(api.answers.M1.complete).toBe(false);
 document.querySelector<HTMLButtonElement>('[data-answer="none"]')!.click();expect(api.answers.M1.complete).toBe(false);(document.getElementById('complete') as HTMLInputElement).click();expect(api.answers.M1.complete).toBe(true);expect(api.answers.M1.events).toEqual([]);
 document.querySelector<HTMLButtonElement>('[data-answer="uncertain"]')!.click();expect(api.answers.M1.complete).toBe(false);expect((document.getElementById('complete') as HTMLInputElement).disabled).toBe(true);
});
