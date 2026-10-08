// Import an exported owner review. Free-text context stays in the private feedback file, never in tracked labels.
// node scripts/import-review-batch.mjs public/review/next-batch.json answers.json [tests/labels/batch-ID.json]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, sep } from 'node:path';
import {validateReadingReviews} from './reading-review-validation.mjs';
import { claimOf, sameClaim } from './reviewed-claims.mjs';
import { buildSuspectActReview } from './suspect-act-review.mjs';

const [batchPath, answersPath, outputPath, actOutputPath] = process.argv.slice(2);
if (!batchPath || !answersPath) throw Error("Supply the batch metadata and exported answers JSON.");
const batch = JSON.parse(readFileSync(batchPath, "utf8")), bytes = readFileSync(answersPath), feedback = JSON.parse(bytes);
if (batch.schema !== "engine-review-batch/v1" || feedback.schema !== batch.schema || feedback.batchId !== batch.batchId || feedback.engineCommit !== batch.engineCommit || !Array.isArray(feedback.answers)) throw Error("Feedback does not match this batch and engine revision.");
const output = outputPath ?? `tests/labels/batch-${batch.batchId}.json`;
const existing = existsSync(output) ? JSON.parse(readFileSync(output, "utf8")) : undefined;
if (existing && existing.batchId !== batch.batchId) throw Error("The output file belongs to another batch.");
let actReview;
if (batch.rows.some(r => r.sceneActs)) {
  if (!actOutputPath) throw Error('Supply a separate act-review output path as the fourth argument; act answers must not be discarded.');
  if (resolve(actOutputPath) === resolve(output) || ['tests/labels','tests/right-set','tests/gold'].some(dir => resolve(actOutputPath).startsWith(resolve(dir)+sep))) throw Error('Act reviews need a separate scene-review output, outside confidence and gold labels.');
  actReview = buildSuspectActReview(batch, feedback, existsSync(actOutputPath) ? JSON.parse(readFileSync(actOutputPath,'utf8')) : undefined);
  actReview.feedbackSha = createHash('sha256').update(bytes).digest('hex');
}
const answers = new Map((existing?.answers ?? []).map((a) => [a.id, a]));
const seen = new Set();
for (const a of feedback.answers) {
  const row = batch.rows.find((r) => r.id === a.id), source = row && batch.sources.find((s) => s.file === row.fic);
  if (!row || seen.has(a.id) || a.key !== row.key || a.fic !== row.fic || a.paragraph !== row.para || a.sourceSha !== source?.sourceSha ||
      (a.verdict !== undefined && !["correct", "wrong", "uncertain"].includes(a.verdict)) || !Array.isArray(a.errors) || !a.errors.every((e) => typeof e === "string") || typeof a.updatedAt !== "string") throw Error("An answer is malformed or does not match its batch reading.");
  if (a.pastLabelReview !== undefined && (!row.labelAudit || !['keep','replace','uncertain'].includes(a.pastLabelReview))) throw Error('An answer has an invalid past-label decision.');
  validateReadingReviews(row,a);
  seen.add(a.id);
  for(const [id,review] of Object.entries(a.readingReviews??{})){
    if(!review.verdict)continue;
    const hit=row.engineReadings.find(h=>h.id===id);
    const safe={id:row.id+":reading:"+id,key:hit.key,fic:row.fic,paragraph:hit.para,sourceSha:source.sourceSha,claim:claimOf(hit,row.fic,source.sourceSha),verdict:review.verdict,errors:review.errors,updatedAt:review.updatedAt};
    const old=answers.get(safe.id);if(!old||safe.updatedAt>old.updatedAt)answers.set(safe.id,safe);
  }
  if (!a.verdict) continue;
  const safe = { id: a.id, key: row.key, fic: row.fic, paragraph: row.para, sourceSha: source.sourceSha, claim: claimOf(row,row.fic,source.sourceSha), verdict: a.verdict, errors: a.errors, updatedAt: a.updatedAt, ...(a.pastLabelReview ? {pastLabelReview:a.pastLabelReview} : {}) };
  const old = answers.get(a.id);
  if (!old || safe.updatedAt > old.updatedAt) answers.set(a.id, safe);
}
const map = { correct: "ok", wrong: "wrong", uncertain: "unclear" };
const labels={},superseded={...(existing?.superseded??{})};
const groups=new Map();
for(const a of answers.values()){const group=groups.get(a.key)??[];group.push(a);groups.set(a.key,group);}
for(const [key,group] of groups){
 const first=group[0];
 if(group.some(a=>a.verdict!==first.verdict||!a.claim||!first.claim||!sameClaim(a.claim,first.claim))){labels[key]='unclear';superseded[key]={reason:'Conflicting owner decisions or different claims share this legacy key.'};}
 else {labels[key]=map[first.verdict];if(labels[key]==='unclear')superseded[key]={reason:'The owner left this claim uncertain.'};else delete superseded[key];}
}
writeFileSync(output, JSON.stringify({ made: new Date().toISOString().slice(0, 10), how: `Owner review: ${batch.selection?.method ?? "20 attribution/act-selection targets, 10 random readings with diversity caps, and 10 high-confidence controls"}. Keys use full audit sentence hashes. Only the owner’s engine verdicts become labels; assistant proposals and scores are not imported. Uncertain answers are excluded from training; free-text context stays private.`, batchId: batch.batchId, engineCommit: batch.engineCommit, feedbackSha: createHash("sha256").update(bytes).digest("hex"), labels, superseded, answers: [...answers.values()] }, null, 1) + "\n");
console.log(`${Object.keys(labels).length} reviewed labels written to ${output}.`);
if (actReview) {
  writeFileSync(actOutputPath, JSON.stringify(actReview,null,1)+'\n');
  console.log(`${actReview.windows.reduce((n,w)=>n+w.reviews.length,0)} marked act proposals preserved; ${actReview.windows.reduce((n,w)=>n+w.events.length,0)} confirmed performed events. No labels inferred from unmarked acts or hints.`);
}
