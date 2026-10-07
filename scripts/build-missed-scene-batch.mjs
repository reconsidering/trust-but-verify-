// Independent passage sampling: reads paragraph text and source metadata, never detector hits or gold labels.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const sha = value => createHash('sha256').update(value).digest('hex');
const CHILD = /\b(?:child|children|kid|kids|toddler|baby boy|baby girl|teenager|underage|under age|schoolboy|schoolgirl|(?:twelve|thirteen|fourteen|fifteen|sixteen|seventeen|1[2-7])[- ](?:year[- ]old|years old))\b/i;
const CUE = /\b(?:sex|sexual|cock|dick|penis|penetrat\w*|orgasm|masturbat\w*|blowjob|rimmin\w*|thrust\w*|fingers?|tongue|naked|undress\w*|moan\w*|climax\w*)\b/gi;

export function buildMissedBatch(stories, { seed = 'missed-scenes-2026-10-07', referenceCommit, width = 16 } = {}) {
  if (!/^[a-f0-9]{40}$/.test(referenceCommit ?? '')) throw Error('Supply the detector reference commit for the later comparison.');
  if (!Number.isInteger(width) || width < 1 || width > 100) throw Error('Window width must be between 1 and 100 paragraphs.');
  const rows = [], sources = [];
  for (const story of [...stories].sort((a,b)=>a.file.localeCompare(b.file))) {
    const { file, title, meta, paras, sourceSha, paragraphSha, html } = story;
    if (!/^[\w-]+\.html$/.test(file) || !paras.length || !/^[a-f0-9]{64}$/.test(sourceSha) || sha(paras.join('\n')) !== paragraphSha) throw Error('Invalid source identity.');
    if (/>\s*Underage\s*</i.test(html) || /\b(?:underage|under age|adult\/minor|teenage|high school)\b/i.test((meta.freeforms ?? []).join(' '))) throw Error(`Excluded source: ${file}`);
    const windows = [];
    for (let from=0; from<paras.length; from+=width) {
      const to=Math.min(paras.length-1,from+width-1);
      if (CHILD.test(paras.slice(Math.max(0,from-8),to+9).join(' '))) continue;
      const text=paras.slice(from,to+1).join(' ');
      windows.push({from,to,windowSha:sha(text),cued:(text.match(CUE) ?? []).length>=2});
    }
    const rank = (lane,w) => sha(`${seed}:${file}:${lane}:${w.from}`);
    const random=[...windows].sort((a,b)=>rank('random',a).localeCompare(rank('random',b))).slice(0,2);
    const discovery=windows.filter(w=>w.cued&&!random.includes(w)).sort((a,b)=>rank('discovery',a).localeCompare(rank('discovery',b))).slice(0,2);
    if (random.length!==2||discovery.length!==2) throw Error(`Insufficient eligible windows in ${file}; do not substitute detector-selected passages.`);
    const wordCount=meta.words || paras.join(' ').split(/\s+/).length;
    const band=wordCount<25000?'short':wordCount<75000?'medium':'long';
    const participants=[...new Set([...(meta.characters ?? []),...(meta.relationships ?? []).flatMap(r=>r.split(/\s*[\/&]\s*/))])].filter(n=>!/(?:Background|Relationship|Other .*Characters|The .*Character)/i.test(n));
    sources.push({file,title,sourceSha,paragraphSha,paragraphCount:paras.length,wordCount,lengthBand:band,participants,eligibleWindows:windows.length,cueWindows:windows.filter(w=>w.cued).length,style:{dialogueFraction:paras.filter(p=>/^[“"‘]/.test(p)).length/paras.length,meanParagraphWords:wordCount/paras.length}});
    for (const [lane,picks] of [['random',random],['discovery',discovery]]) for (const w of picks) rows.push({fic:file,from:w.from,to:w.to,windowSha:w.windowSha,lane});
  }
  rows.sort((a,b)=>sha(`${seed}:order:${a.fic}:${a.from}`).localeCompare(sha(`${seed}:order:${b.fic}:${b.from}`)));
  rows.forEach((r,i)=>r.id=`M${i+1}`);
  const selection={seed,width,randomPerFic:2,discoveryPerFic:2,method:'fixed non-overlapping windows; seeded uniform rank within each source; discovery requires two broad lexical cues; neither lane uses detector output; child-containing windows and eight-paragraph context excluded'};
  const batchId='missed-'+sha(JSON.stringify({referenceCommit,sources,rows,selection})).slice(0,12);
  return {schema:'engine-missed-scene-review/v1',batchId,referenceCommit,selection,sources,rows};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [snapshots,samples,output]=process.argv.slice(2);
  const opt=n=>{const i=process.argv.indexOf(`--${n}`);return i>=0?process.argv[i+1]:undefined;};
  const fics=(opt('fics')??'').split(',').filter(Boolean);
  if (!snapshots||!samples||!output||!fics.length) throw Error('Supply snapshots, samples, output, --fics reviewed-adult-source-list, and --commit reference.');
  const stories=fics.map(fic=>{const data=JSON.parse(readFileSync(join(snapshots,fic+'.html.json'),'utf8'));const html=readFileSync(join(samples,data.file),'utf8');if(sha(html)!==data.sourceSha)throw Error('Source checksum mismatch.');return {file:data.file,title:data.title,meta:data.meta,paras:data.paras,sourceSha:data.sourceSha,paragraphSha:data.paragraphSha,html};});
  const batch=buildMissedBatch(stories,{referenceCommit:opt('commit'),...(opt('seed')?{seed:opt('seed')}:{})});
  writeFileSync(output,JSON.stringify(batch,null,1)+'\n');
  console.log(`${batch.rows.length} windows / ${batch.sources.length} sources; ${batch.sources.map(s=>`${s.file}: ${s.wordCount} words, ${s.eligibleWindows} eligible`).join('; ')}. No story text or engine claims published.`);
}
