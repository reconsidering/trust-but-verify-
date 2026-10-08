// Scene inventories judge performed acts only. An unlisted hint is never a negative label.
export const SCORED_ACTS = ['Anal penetration (penis)', 'Blowjob', 'Rimming', 'Cunnilingus', 'Vaginal penetration (penis)', 'Fingering', 'Toy insertion', 'Handjob', 'Solo masturbation'];
const OCCURRENCES = ['Happens in this scene', 'Actually happened earlier / memory', 'Wanted / proposed', 'Imagined / conditional', 'Unclear'];
const ALL_ACTS = [...SCORED_ACTS, 'Kissing / body rubbing', 'Other'];

/** Whitelist both the occurrence kind and act type; lexical cues alone are not performed acts. */
export function actualActOf(hit) {
  if (!['act', 'handjob', 'solo', 'masturbation'].includes(hit.kind)) return undefined;
  if (hit.kind === 'handjob') return /^(?:handjob|mutual handjob)$/.test(hit.act) ? 'Handjob' : undefined;
  if (hit.kind === 'solo' || hit.kind === 'masturbation') {
    return hit.act === 'masturbation' ? 'Solo masturbation' : hit.act === 'fingering himself' ? 'Fingering' : hit.act === 'using a toy on himself' ? 'Toy insertion' : undefined;
  }
  if (/^(?:anal sex \((?:strap-on\/toy|toy)\)|toy inside|using a toy on himself)$/.test(hit.act)) return 'Toy insertion';
  if (/^fingering(?: himself)?$/.test(hit.act)) return 'Fingering';
  if (/^anal sex(?: \(riding\))?$/.test(hit.act)) return 'Anal penetration (penis)';
  if (/^blowjob(?: \(face-fucking\))?$/.test(hit.act)) return 'Blowjob';
  if (hit.act === 'rimming') return 'Rimming';
  if (hit.act === 'cunnilingus') return 'Cunnilingus';
  if (hit.act === 'vaginal sex') return 'Vaginal penetration (penis)';
  if (hit.act === 'handjob' || hit.act === 'mutual handjob') return 'Handjob';
  return undefined;
}

/** A completed empty window excludes only the explicit scored acts, never hints or other activity. */
export function actHitsForWindow(hits, window) {
  return hits.filter(hit => hit.para >= window.from && hit.para <= window.to && actualActOf(hit) !== undefined);
}

export function buildActInventory(batch, feedback) {
  if (batch.schema !== 'engine-missed-scene-review/v1' || feedback.schema !== batch.schema || feedback.batchId !== batch.batchId || feedback.referenceCommit !== batch.referenceCommit || !Array.isArray(feedback.answers)) throw Error('The answers do not match the missed-scene batch.');
  const seen = new Set(), windows = [], skipped = [];
  let excludedEvents = 0;
  for (const answer of feedback.answers) {
    const row = batch.rows.find(r => r.id === answer.id), source = row && batch.sources.find(s => s.file === row.fic);
    if (!row || !source || seen.has(answer.id) || ['fic', 'from', 'to', 'windowSha', 'lane'].some(k => answer[k] !== row[k]) || answer.sourceSha !== source.sourceSha || typeof answer.complete !== 'boolean' || !['acts', 'none', 'uncertain'].includes(answer.verdict) || !Array.isArray(answer.events) || !Array.isArray(answer.flags) || !answer.flags.every(f => typeof f === 'string') || !Number.isFinite(Date.parse(answer.updatedAt))) throw Error('An answer has invalid passage identity or completion metadata.');
    seen.add(answer.id);
    for (const event of answer.events) {
      if ((!ALL_ACTS.includes(event.act) && !(!answer.complete && event.act === '')) || !OCCURRENCES.includes(event.occurrence) || typeof event.performer !== 'string' || typeof event.receiver !== 'string' || (answer.complete && (!event.performer.trim() || (event.act !== 'Solo masturbation' && !event.receiver.trim()))) || !Number.isInteger(event.from) || !Number.isInteger(event.to) || event.from < row.from || event.to > row.to || event.from > event.to) throw Error('An event has invalid act, participants, or evidence range.');
    }
    if (answer.verdict === 'none' && answer.events.length) throw Error('A no-act answer contains events.');
    if (!answer.complete || answer.verdict === 'uncertain') { skipped.push(answer.id); continue; }
    if (answer.verdict === 'acts' && !answer.events.length) throw Error('A completed act answer has no events.');
    const events = answer.events.filter(e => e.occurrence === 'Happens in this scene' && SCORED_ACTS.includes(e.act));
    excludedEvents += answer.events.length - events.length;
    // Do not publish free text, assistant proposals, or incidental activity from the feedback.
    windows.push({ ...row, sourceSha: source.sourceSha, updatedAt: answer.updatedAt, events: events.map(e => ({act:e.act, performer:e.performer, receiver:e.receiver, from:e.from, to:e.to})) });
  }
  return {
    schema: 'engine-sex-act-inventory/v1', batchId: batch.batchId, referenceCommit: batch.referenceCommit,
    scope: { occurrence: 'Happens in this scene', acts: [...SCORED_ACTS], hints: 'not reviewed; never infer ok or wrong labels from omissions', otherActivity: 'unscored; kissing/body rubbing and Other are not evidence of absence of a hint or another act', confidenceTraining: 'none; scene inventories are separate from per-reading labels' },
    skippedUnfinished: skipped, excludedContextEvents: excludedEvents,
    sources: batch.sources.filter(s => windows.some(w => w.fic === s.file)).map(({file,title,sourceSha,paragraphSha,paragraphCount}) => ({file,title,sourceSha,paragraphSha,paragraphCount})), windows,
  };
}
