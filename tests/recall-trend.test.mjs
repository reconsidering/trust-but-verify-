import {expect,it} from 'vitest';
import {reviewerGroup,claimIdentity,inventoryReviewer,semanticAct} from '../scripts/review-provenance.mjs';
import {commonEvidence,evaluateHistory} from '../scripts/recall-trend.mjs';
const claim={fic:'adult.html',sourceSha:'source',paragraph:1,pattern:'oral',kind:'act',act:'blowjob',a:'Morgan',b:'Rowan',role:''};
const event={fic:'adult.html',sourceSha:'source',from:1,to:1,act:'Blowjob',performer:'Rowan',receiver:'Morgan',reviewer:'ChatGPT',paragraphHashes:['b'],id:'one'};
const hit={...claim,para:1,via:'oral'};
const snap=hits=>({sourceSha:'source',paragraphSha:'paragraphs',paragraphHashes:['a','b'],hits});
const version=(ref,hits)=>({ref,date:'2026-10-10',snapshots:new Map([['adult.html',snap(hits)]])});
it('splits AI consensus only when verdicts agree and preserves owner precedence',()=>{
 expect(reviewerGroup({claude:'correct',chatgpt:'correct'})).toEqual({group:'Both',verdict:'correct'});
 expect(reviewerGroup({claude:'wrong',chatgpt:'correct'})).toEqual({group:'Disagreement',verdict:null});
 expect(reviewerGroup({owner:'wrong',claude:'correct',chatgpt:'correct'})).toEqual({group:'Owner',verdict:'wrong'});
 expect(reviewerGroup({claude:'wrong'}).group).toBe('Claude');
 expect(reviewerGroup({chatgpt:'wrong'}).group).toBe('ChatGPT');
 expect(reviewerGroup({claude:'not sure',chatgpt:'not sure'}).group).toBe('Unreviewed');
});
it('does not attach consensus to a changed source, instrument, occurrence or participant claim',()=>{
 for(const replacement of [{sourceSha:'new'},{kind:'wanted'},{act:'anal sex'},{a:'Rowan',b:'Morgan'},{paragraph:2}])expect(claimIdentity({...claim,...replacement})).not.toBe(claimIdentity(claim));
 const row={claim,semantic:semanticAct(claim),group:'Both',verdict:'correct'};
 expect(inventoryReviewer(event,[row])).toBe('Both');
 expect(inventoryReviewer(event,[{...row,group:'Owner'}])).toBe('Owner');
 expect(inventoryReviewer(event,[{...row,verdict:'wrong'}])).toBe('ChatGPT');
 expect(inventoryReviewer({...event,sourceSha:'new'},[row])).toBe('ChatGPT');
 expect(inventoryReviewer({...event,performer:'Morgan',receiver:'Rowan'},[row])).toBe('ChatGPT');
});
it('uses an identical denominator for every run and reports absent Claude inventory as no data',()=>{
 const versions=[version('old',[]),version('new',[hit])];
 const common=commonEvidence({events:[event],claims:[]},versions);
 const r=evaluateHistory(common,versions);
 expect(r.runs.map(r=>r.summary.find(a=>a.act==='Blowjob').expected)).toEqual([1,1]);
 expect(r.runs.map(r=>r.summary.find(a=>a.act==='Blowjob').matched)).toEqual([0,1]);
 expect(r.runs[0].byReviewer.Claude.find(a=>a.act==='Blowjob').recall).toBeNull();
 const changed=version('changed',[hit]);changed.snapshots.get('adult.html').paragraphSha='different';
 const excluded=commonEvidence({events:[event],claims:[]},[versions[0],changed]);
 expect(excluded.events).toHaveLength(0);expect(excluded.excluded[0].reason).toContain('extraction differs');
});
it('rejects unsupported citation checksums globally rather than changing the denominator',()=>{
 const c={claim,sourceParagraphSha:'paragraphs',semantic:semanticAct(claim),group:'Both',verdict:'wrong',id:'claim'};
 const r=commonEvidence({events:[{...event,paragraphHashes:['stale']}],claims:[c]},[version('old',[]),version('new',[hit])]);
 expect(r.events).toHaveLength(0);expect(r.claims).toHaveLength(1);
 expect(commonEvidence({events:[],claims:[{...c,sourceParagraphSha:undefined}]},[version('old',[]) ]).claims).toHaveLength(0);
 expect(commonEvidence({events:[],claims:[{...c,sourceParagraphSha:undefined,citationHash:'b'}]},[version('old',[])]).claims).toHaveLength(1);
 expect(commonEvidence({events:[],claims:[{...c,sourceParagraphSha:undefined,citationHash:'stale'}]},[version('old',[])]).claims).toHaveLength(0);
});
it('keeps known-claim survival separate from recall and allows accepted acts to change pattern',()=>{
 const rows=['correct','wrong'].map(verdict=>({id:verdict,claim,sourceParagraphSha:'paragraphs',semantic:semanticAct(claim),group:'Both',verdict}));
 const versions=[version('old',[hit]),version('new',[{...hit,via:'another-oral-pattern'}])];
 const r=evaluateHistory(commonEvidence({events:[],claims:rows},versions),versions);
 expect(r.runs.map(r=>r.claimSummary.Both.covered)).toEqual([1,1]);
 expect(r.runs.map(r=>r.claimSummary.Both.survivingRejected)).toEqual([1,0]);
 expect(r.runs[0].summary.every(a=>a.expected===0)).toBe(true);
});
