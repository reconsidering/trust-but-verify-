// Owner-confirmed act inventory, separate from per-reading confidence labels. No negatives from omissions.
import {SCORED_ACTS} from './scene-review-scope.mjs';
const verdicts = ['correct', 'wrong', 'uncertain'];
const occurrences = ['performed', 'memory', 'habitual', 'imagined', 'recording', 'wanted', 'unclear', 'uncertain', 'not performed'];
const strings = value => Array.isArray(value) && value.every(v => typeof v === 'string');
export function buildSuspectActReview(batch, feedback, previous) {
  if (batch.schema !== 'engine-review-batch/v1' || feedback.schema !== batch.schema || feedback.batchId !== batch.batchId || feedback.engineCommit !== batch.engineCommit || !Array.isArray(feedback.answers)) throw Error('Act feedback belongs to a different batch.');
  if (previous && (previous.schema !== 'engine-suspect-act-review/v1' || previous.batchId !== batch.batchId || previous.referenceCommit !== batch.engineCommit)) throw Error('The existing act review belongs to another batch.');
  const windows = new Map((previous?.windows ?? []).map(w => [w.id, w])), seen = new Set();
  const knownActs = new Set([...SCORED_ACTS, ...batch.rows.flatMap(r => (r.sceneActs ?? []).map(a => a.act)), 'Other']);
  for (const answer of feedback.answers) {
    const row = batch.rows.find(r => r.id === answer.id), source = row && batch.sources.find(s => s.file === row.fic);
    if (!row || !source || !row.sceneActs || seen.has(answer.id) || answer.key !== row.key || answer.fic !== row.fic || answer.paragraph !== row.para || answer.sourceSha !== source.sourceSha || JSON.stringify(answer.evidence) !== JSON.stringify(row.evidence) || !Number.isFinite(Date.parse(answer.updatedAt)) || !strings(answer.errors) || (answer.verdict !== undefined && !verdicts.includes(answer.verdict)) || (answer.coverageComplete !== undefined && typeof answer.coverageComplete !== 'boolean')) throw Error('Invalid scene identity or answer metadata.');
    if ((answer.proposalReview !== undefined || answer.proposalRevision !== undefined) && (!['agree','disagree','uncertain'].includes(answer.proposalReview) || answer.proposalRevision !== row.proposal?.revision)) throw Error('Different main reading proposal.');
    if (!['act','handjob','solo','masturbation'].includes(row.kind)) throw Error('This act-only import cannot label an engine hint.');
    if (answer.actReviews !== undefined && (!answer.actReviews || typeof answer.actReviews !== 'object' || Array.isArray(answer.actReviews))) throw Error('Invalid act review collection.');
    seen.add(answer.id);
    const reviews = [];
    for (const [id, review] of Object.entries(answer.actReviews ?? {})) {
      const proposal = row.sceneActs.find(a => a.id === id);
      if (!proposal || !review || review.revision !== proposal.revision || (review.verdict !== undefined && !verdicts.includes(review.verdict)) || (!knownActs.has(review.act) && !(review.verdict === 'wrong' && review.act === '')) || !occurrences.includes(review.occurrence) || typeof review.performer !== 'string' || typeof review.receiver !== 'string' || typeof review.context !== 'string' || !strings(review.errors) || (review.verdict === 'correct' && !review.performer.trim())) throw Error('Invalid act proposal identity or correction.');
      if (review.verdict === 'correct' && SCORED_ACTS.includes(review.act) && review.act !== 'Solo masturbation' && !review.receiver.trim()) throw Error('A confirmed partnered act needs a receiver.');
      if (!Number.isInteger(proposal.evidence.from) || !Number.isInteger(proposal.evidence.to) || proposal.evidence.from < row.evidence[0].from || proposal.evidence.to > row.evidence[0].to || proposal.evidence.from > proposal.evidence.to) throw Error('Invalid act evidence range.');
      if (review.verdict === undefined) continue;
      reviews.push({id, revision:review.revision, verdict:review.verdict, act:review.act, performer:review.performer, receiver:review.receiver, occurrence:review.occurrence, from:proposal.evidence.from, to:proposal.evidence.to, errors:[...review.errors]});
    }
    const events = reviews.filter(r => r.verdict === 'correct' && r.occurrence === 'performed').map(({id,act,performer,receiver,from,to}) => ({ownerActId:id,act,performer,receiver,from,to,scored:SCORED_ACTS.includes(act)}));
    const safe = {id:row.id, key:row.key, fic:row.fic, from:row.evidence[0].from, to:row.evidence[0].to, sourceSha:source.sourceSha, updatedAt:answer.updatedAt, coverageReviewed:answer.coverageComplete === true, coverage:'positive-only', reviews, events};
    const old = windows.get(row.id);
    if (!old || safe.updatedAt > old.updatedAt) windows.set(row.id, safe);
  }
  return {schema:'engine-suspect-act-review/v1', batchId:batch.batchId, referenceCommit:batch.engineCommit,
    scope:{coverage:'positive-only, including windows marked checked; omissions never establish absence', occurrence:'events include only owner-confirmed performed acts', scoredActs:[...SCORED_ACTS], otherActivity:'other confirmed performed categories are retained with scored:false', context:'memory, imagined, habitual, recording and not-performed confirmations remain in reviews, not performed events', rejected:'wrong and uncertain proposals remain in reviews and never become positives', hints:'unreviewed; never derive negative hint labels or per-hit labels from act reviews', confidenceTraining:'none; only separately imported main engine verdicts train confidence', privateText:'free-text context, story text and assistant confidence are excluded'},
    sources:batch.sources.filter(s => [...windows.values()].some(w => w.fic === s.file)), unanswered:batch.rows.filter(r => !windows.has(r.id)).map(r => r.id), windows:[...windows.values()]};
}
