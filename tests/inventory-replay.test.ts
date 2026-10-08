import {it,expect} from 'vitest';
import {replayInventories,type Inventory} from '../scripts/replay-scene-reviews.mjs';
const inventory:Inventory={batchId:'invented-adults',windows:[{id:'M1',fic:'adults.html',sourceSha:'source',from:2,to:5,coverage:'positive-only',events:[{act:'Blowjob',performer:'Rowan',receiver:'Morgan',from:3,to:3}]}]};
it('uses oral performer direction and distinguishes exact, boundary, reversed and hint-only evidence',()=>{
 const run=(h:unknown[])=>replayInventories([inventory],new Map([['adults.html',{sourceSha:'source',hits:h as never[]}]]));
 const hit={kind:'act',act:'blowjob',a:'Morgan',b:'Rowan',para:3};
 expect(run([hit]).totals).toEqual({matched:1});
 expect(run([{...hit,para:1}]).results[0].status).toBe('missing');
 expect(run([{...hit,para:2}]).results[0].status).toBe('detected-elsewhere-in-window');
 expect(run([{...hit,a:'Rowan',b:'Morgan'}]).results[0].status).toBe('wrong-participants');
 expect(run([{...hit,kind:'wanted',role:'top'}]).results[0].status).toBe('hint-or-context-only');
 expect(run([]).results).toHaveLength(1); // An omitted hint never becomes a negative event.
});
it('refuses changed sources and explicitly quarantines existing-toy removal',()=>{
 expect(replayInventories([inventory],new Map([['adults.html',{sourceSha:'changed',hits:[]}]] )).results[0].status).toBe('source-unverified');
 expect(replayInventories([inventory],new Map(),new Map([['invented-adults:M1:0','Existing toy removed']])).results[0].status).toBe('needs-adjudication');
});

it('uses completed empty windows only for actual acts, never for hints or unfinished omissions',()=>{
 const empty={...inventory,schema:'engine-sex-act-inventory/v1',windows:[{...inventory.windows[0],coverage:undefined,events:[]}]};
 const snapshots=new Map([['adults.html',{sourceSha:'source',hits:[{kind:'ogling',act:'looking at a bulge',a:'Morgan',b:'Rowan',para:3},{kind:'act',act:'anal sex',a:'Morgan',b:'Rowan',para:3}]}]]);
 expect(replayInventories([empty],snapshots).totals).toEqual({'unexpected-performed-act':1});
 expect(replayInventories([{...empty,windows:[{...empty.windows[0],coverage:'positive-only'}]}],snapshots).results).toEqual([]);
});
