import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {expect,it} from 'vitest';
import {SCORED_ACTS,actualActOf,actHitsForWindow,buildActInventory,type ActInventory} from '../scripts/scene-review-scope.mjs';
import type {SceneBatch} from '../review/missed-scene-data';
const row={id:'M1',fic:'adult.html',from:0,to:4,windowSha:'window',lane:'random' as const};
const batch:SceneBatch={schema:'engine-missed-scene-review/v1',batchId:'invented',referenceCommit:'a'.repeat(40),selection:{},sources:[{file:'adult.html',title:'Invented adult scene',sourceSha:'source',paragraphSha:'paragraphs',paragraphCount:5,wordCount:100,lengthBand:'short',participants:['Morgan','Rowan'],eligibleWindows:1,cueWindows:1,style:{dialogueFraction:0,meanParagraphWords:20}}],rows:[row]};
const event=(act='Fingering',occurrence='Happens in this scene')=>({act,occurrence,performer:'Morgan',receiver:'Rowan',from:1,to:1});
const feedback=(events=[event()],complete=true,verdict='acts')=>({schema:batch.schema,batchId:batch.batchId,referenceCommit:batch.referenceCommit,answers:[{...row,sourceSha:'source',complete,verdict,events,flags:[],context:'PRIVATE_OWNER_NOTE',updatedAt:'2026-10-07T00:00:00Z'}]});

it('never judges cock/bulge ogling, preparation, or sexual-act hints in a completed empty act window',()=>{
 const inventory=buildActInventory(batch,feedback([],true,'none'));
 const hints=[
  {kind:'ogling',act:'checking out a cock',para:1},
  {kind:'ogling',act:'staring at a bulge',para:2},
  {kind:'prep',act:'slicking up',para:3},
  ...['wanted','hypothetical','history','said','stated','body'].map(kind=>({kind,act:'anal sex',para:2})),
  {kind:'act',act:'checking out a cock',para:1},
 ];
 expect(inventory.windows[0].events).toEqual([]);
 expect(actHitsForWindow(hints,inventory.windows[0])).toEqual([]);
 const performed={kind:'act',act:'fingering',para:2};
 expect(actHitsForWindow([...hints,performed,{...performed,para:9}],inventory.windows[0])).toEqual([performed]);
 expect(actualActOf({kind:'handjob',act:'handjob'})).toBe('Handjob');
 expect(actualActOf({kind:'solo',act:'masturbation'})).toBe('Solo masturbation');
 expect(actualActOf({kind:'act',act:'anal sex (strap-on/toy)'})).toBe('Toy insertion');
});

it('imports only completed actual-act inventories, without free text, contextual hints, or opposite labels',()=>{
 const events=[event(),event('Blowjob','Wanted / proposed'),event('Anal penetration (penis)','Imagined / conditional'),event('Blowjob','Actually happened earlier / memory'),event('Kissing / body rubbing'),event('Other')];
 const inventory=buildActInventory(batch,feedback(events));
 expect(inventory.windows[0].events).toEqual([{act:'Fingering',performer:'Morgan',receiver:'Rowan',from:1,to:1}]);
 expect(inventory.excludedContextEvents).toBe(5);
 expect(JSON.stringify(inventory)).not.toContain('PRIVATE_OWNER_NOTE');expect(JSON.stringify(inventory)).not.toContain('"labels"');
 const unfinished=buildActInventory(batch,feedback([{...event('Other'),receiver:''}],false));
 expect(unfinished.windows).toEqual([]);expect(unfinished.skippedUnfinished).toEqual(['M1']);
 const altered=feedback();altered.answers[0].sourceSha='wrong';expect(()=>buildActInventory(batch,altered)).toThrow('identity');
 const badRange=feedback();badRange.answers[0].events[0].to=10;expect(()=>buildActInventory(batch,badRange)).toThrow('range');
 const dir=mkdtempSync(join(tmpdir(),'act-inventory-')),bp=join(dir,'batch.json'),ap=join(dir,'answers.json'),out=join(dir,'inventory.json');
 writeFileSync(bp,JSON.stringify(batch));writeFileSync(ap,JSON.stringify(feedback(events)));
 expect(spawnSync('node',['scripts/import-missed-scene-review.mjs',bp,ap,out]).status).toBe(0);
 expect(JSON.parse(readFileSync(out,'utf8')).windows[0].events).toHaveLength(1);
 expect(spawnSync('node',['scripts/import-missed-scene-review.mjs',bp,ap,'tests/labels/should-never-write.json']).status).not.toBe(0);
});

it('keeps the accepted owner batch separate from per-reading training labels and records its act-only scope',()=>{
 const accepted=JSON.parse(readFileSync('tests/scene-review/missed-2051db5b4e06.json','utf8')) as ActInventory;
 expect(accepted.schema).toBe('engine-sex-act-inventory/v1');expect(accepted.scope.acts).toEqual(SCORED_ACTS);
 expect(accepted.windows).toHaveLength(28);expect(accepted.skippedUnfinished).toHaveLength(12);
 expect(accepted.windows.reduce((n,w)=>n+w.events.length,0)).toBe(22);
 expect(accepted.scope.confidenceTraining).toContain('none');
 for(const window of accepted.windows)for(const e of window.events){expect(SCORED_ACTS).toContain(e.act);expect(e.from).toBeGreaterThanOrEqual(window.from);expect(e.to).toBeLessThanOrEqual(window.to);expect(e.from).toBeLessThanOrEqual(e.to);}
});
