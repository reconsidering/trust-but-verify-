import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { trainingLabels } from '../scripts/training-labels.mjs';
import { sameClaim, reviewedClaims } from '../scripts/reviewed-claims.mjs';
function load(files:Record<string,unknown>) {
  const dir=mkdtempSync(join(tmpdir(),'weighted-claims-'));
  try { for(const [file,data] of Object.entries(files)) writeFileSync(join(dir,file),JSON.stringify(data)); return trainingLabels(dir); }
  finally { rmSync(dir,{recursive:true,force:true}); }
}
describe('corroborated claim labels',()=>{
  it('uses one fractional observation instead of adding corroboration to the old observation',()=>{
    const labels=load({'audit.json':{labels:{'finger#abc':'ok'}},'zz-corroborated.json':{labels:{'finger#abc':'ok'},weights:{'finger#abc':.9}}});
    expect([...labels.values()]).toEqual([{label:'ok',weight:.9}]);
  });
  it('keeps a later owner judgment at full weight',()=>{
    expect(load({'zz-corroborated.json':{labels:{'finger#abc':'ok'},weights:{'finger#abc':.9}},'batch-owner.json':{labels:{'finger#abc':'wrong'}}}).get('finger#abc')).toEqual({label:'wrong',weight:1});
  });
  it('removes a superseded old claim without creating an absence label',()=>{
    expect(load({'audit.json':{labels:{'finger#abc':'wrong'}},'zz-corroborated.json':{labels:{},superseded:{'finger#abc':{reason:'Removed reading'}}}}).size).toBe(0);
  });
  it('does not transfer a label from anal penetration to fingering with the same people',()=>{
    // Adult Rowan uses fingers on adult Avery; a former penile claim is a different reading.
    const old={fic:'adult-example.html',sourceSha:'sha',paragraph:3,pattern:'push-in',act:'anal sex',kind:'act',a:'Rowan',b:'Avery',role:''};
    expect(sameClaim(old,{...old,act:'fingering'})).toBe(false);
    expect(sameClaim(old,{...old,kind:'hypothetical'})).toBe(false);
    expect(sameClaim(old,{...old,a:'Avery',b:'Rowan'})).toBe(false);
  });
  it('rejects malformed weights',()=>{
    expect(()=>load({'bad.json':{labels:{'finger#abc':'ok'},weights:{'finger#abc':1.5}}})).toThrow('Invalid label weight');
  });
});

it('keeps historical corroboration separate from deduplicated exact current claims',()=>{
  const data=JSON.parse(readFileSync(join(__dirname,'labels/zz-corroborated-claude-oct4-5.json'),'utf8'));
  expect(data.historical).toHaveLength(178);
  expect(Object.keys(data.labels)).toHaveLength(144);
  expect(data.answers).toHaveLength(145);
  expect(data.historical.every((r:any)=>r.assistantConfidence>=.97 && r.historicalRecord.source==='claude')).toBe(true);
  expect(Object.values(data.weights).every(w=>w===.9)).toBe(true);
  const bound=reviewedClaims(join(__dirname,".."));
  for(const answer of data.answers) {
    expect(bound.get(answer.key)).toEqual(answer.claim);
    expect(answer.claim.fic).toBe(answer.fic);
    expect(answer.claim.sourceSha).toBe(answer.sourceSha);
    expect(answer.claim.paragraph).toBe(answer.paragraph);
    expect(data.labels[answer.key]).toBe(answer.verdict==='correct'?'ok':'wrong');
  }
  const withheld=new Set(data.historical.filter((r:any)=>r.currentKeys.length===0).map((r:any)=>r.id));
  expect(withheld.size).toBe(33);
  expect(data.answers.some((a:any)=>withheld.has(a.id))).toBe(false);
});


it('keeps owner claim identity even when its filename precedes AI corroboration',()=>{
  const root=mkdtempSync(join(tmpdir(),'owner-claim-'));
  const dir=join(root,'tests/labels'); mkdirSync(dir,{recursive:true});
  const owner={fic:'adult-example.html',sourceSha:'sha',paragraph:3,pattern:'push-in',act:'fingering',kind:'act',a:'Rowan',b:'Avery',role:''};
  const ai={...owner,act:'anal sex'};
  try {
    writeFileSync(join(dir,'batch-owner.json'),JSON.stringify({labels:{'push-in#abc':'wrong'},answers:[{key:'push-in#abc',claim:owner}]}));
    writeFileSync(join(dir,'zz-corroborated.json'),JSON.stringify({labels:{'push-in#abc':'ok'},weights:{'push-in#abc':.9},answers:[{key:'push-in#abc',claim:ai}]}));
    expect(trainingLabels(dir).get('push-in#abc')).toEqual({label:'wrong',weight:1});
    expect(reviewedClaims(root).get('push-in#abc')).toEqual(owner);
  } finally {rmSync(root,{recursive:true,force:true});}
});
