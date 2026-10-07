// Build one review item per recorded gold scene range. Never publish story text.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [snapshotDir, output = 'public/review/gold-verdicts.json'] = process.argv.slice(2);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const identities = JSON.parse(readFileSync('public/review/gold-sources.json','utf8'));
const accepted = JSON.parse(readFileSync('tests/gold-review/owner-2026-10-06.json','utf8'));
const excludedRanges = [{fic:'rushing.html',act:'anal',from:1148,to:1150}];
const rows = [], sources = [];
for (const file of readdirSync('tests/gold').filter((f) => f.endsWith('.json')).sort()) {
  const bytes = readFileSync(join('tests/gold',file)), gold = JSON.parse(bytes);
  if (!gold.verdicts?.length || accepted.excludedFics.includes(gold.fic + '.html')) continue;
  const source = identities.sources.find((s) => s.file === gold.fic + '.html');
  if (!source) throw Error('Missing validated source identity: ' + gold.fic);
  if (snapshotDir) {
    const data = JSON.parse(readFileSync(join(snapshotDir,source.file + '.json'),'utf8'));
    const html = readFileSync(join('ao3-samples',source.file));
    if (sha(html) !== source.sourceSha || data.sourceSha !== source.sourceSha || sha(data.paras.join('\n')) !== source.paragraphSha) throw Error('Stale source snapshot: ' + source.file);
    if (/>\s*Underage\s*</i.test(html.toString())) throw Error('Underage source is excluded: ' + source.file);
  }
  const start = rows.length;
  const reviewVerdicts = [...gold.verdicts, ...[...new Set((gold.scenes ?? []).map(s => s.act))].filter(act => act === 'fingering' && !gold.verdicts.some(v => v.act === act)).map(act => ({pairing:gold.verdicts[0].pairing,act,verdict:'scene'}))];
  reviewVerdicts.forEach((v,index) => {
    const pair = v.pairing.split('/');
    for (const s of gold.scenes ?? []) {
      if (excludedRanges.some(r => r.fic === source.file && r.act === s.act && r.from === s.from && r.to === s.to)) continue;
      if (s.act !== v.act || !pair.includes(s.top) || !pair.includes(s.bottom)) continue;
      if (s.from < 0 || s.to < s.from || s.to >= source.paragraphCount) throw Error('Invalid scene range: ' + file);
      const a = s.top, b = s.bottom;
      const action = v.act === 'anal' ? `${a} anally penetrates ${b} with a penis` : v.act === 'blowjob' ? `${a} receives a blowjob from ${b}` : v.act === 'fingering' ? `${a} anally fingers ${b}` : v.act === 'rimming' ? `${a} rims ${b}` : `${a} and ${b}: ${v.act}`;
      rows.push({id:'G'+(rows.length+1),key:`gold-range:${file}:${index}:${s.from}-${s.to}#${sha(bytes)}`,fic:source.file,para:s.from,pattern:'gold-range',a,b,act:v.act,kind:'gold-range',claim:`Passages ${s.from}–${s.to}: ${action}.`,gold:{file,hash:sha(bytes),pairing:v.pairing,act:v.act,verdict:v.verdict},evidence:[{from:s.from,to:s.to}]});
    }
  });
  if (rows.length > start) sources.push(source);
}
const batchId = 'gold-ranges-' + sha(JSON.stringify({sources,rows})).slice(0,12);
writeFileSync(output,JSON.stringify({schema:'engine-gold-range-review/v1',batchId,engineCommit:identities.engineCommit,sources,rows},null,1)+'\n');
console.log(`${rows.length} separate gold ranges across ${sources.length} stories; no story text published.`);
