// Build verdict-only review metadata. Story text remains in private snapshots.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [snapshotDir, output = 'public/review/gold-verdicts.json'] = process.argv.slice(2);
if (!snapshotDir) throw Error('Supply the private snapshot directory.');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const readingBatch = JSON.parse(readFileSync('public/review/next-batch.json','utf8'));
const rows = [], sources = [];
for (const file of readdirSync('tests/gold').filter((f) => f.endsWith('.json')).sort()) {
  const bytes = readFileSync(join('tests/gold',file)), gold = JSON.parse(bytes);
  if (!gold.verdicts?.length) continue;
  const data = JSON.parse(readFileSync(join(snapshotDir, gold.fic + '.html.json'),'utf8'));
  const html = readFileSync(join('ao3-samples',data.file));
  if (sha(html) !== data.sourceSha) throw Error('Stale source snapshot: ' + data.file);
  if (/>\s*Underage\s*</i.test(html.toString())) throw Error('Underage source is excluded: ' + data.file);
  sources.push({ file:data.file, title:data.title, sourceSha:data.sourceSha, paragraphSha:data.paragraphSha, paragraphCount:data.paras.length });
  gold.verdicts.forEach((v,index) => {
    const pair = v.pairing.split('/'), a = v.top ?? pair[0], b = v.bottom ?? pair[1];
    const action = v.act === 'anal' ? `${a} penetrates ${b}` : v.act === 'blowjob' ? `${a} receives blowjobs from ${b}` : v.act === 'rimming' ? `${a} rims ${b}` : `${a} and ${b}: ${v.act}`;
    const claim = v.verdict === 'one_way' ? `${action}; the gold verdict says the roles do not switch.` : v.verdict === 'switch' ? `${pair.join(' and ')} switch roles for ${v.act === 'anal' ? 'anal penetration' : v.act === 'blowjob' ? 'blowjobs' : v.act}.` : `${v.pairing}: gold verdict for ${v.act} is ${v.verdict}.`;
    const evidence = (gold.scenes ?? []).filter((s) => s.act === v.act && pair.includes(s.top) && pair.includes(s.bottom)).map((s) => ({ from:s.from, to:s.to }));
    const unique = [...new Map(evidence.map((r) => [r.from + ':' + r.to,r])).values()];
    rows.push({ id:'G'+(rows.length+1), key:`gold:${file}:${index}#${sha(bytes)}`, fic:data.file, para:unique[0]?.from ?? 0, pattern:'gold-verdict', a,b,act:v.act,kind:'gold-verdict',claim, gold:{ file,hash:sha(bytes),pairing:v.pairing,act:v.act,verdict:v.verdict }, evidence:unique });
  });
}
const batchId = 'gold-' + sha(JSON.stringify({sources,rows})).slice(0,12);
writeFileSync(output, JSON.stringify({ schema:'engine-gold-review/v1', batchId,engineCommit:readingBatch.engineCommit,sources,rows },null,1)+'\n');
console.log(`${rows.length} gold verdicts across ${sources.length} stories; no story text published.`);
