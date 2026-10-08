// Per-reading decisions are explicit and bound to a versioned, cited claim.
export function validateReadingReviews(row, answer) {
 if(answer.readingReviews === undefined)return;
 if(!answer.readingReviews || typeof answer.readingReviews!=='object' || Array.isArray(answer.readingReviews))throw Error('Invalid individual reading answers.');
 for(const [id,a] of Object.entries(answer.readingReviews)){
  const hit=row.engineReadings?.find(h=>h.id===id && id!=='primary');
  if(!hit?.proposal || !a || typeof a!=='object' || (a.verdict!==undefined&&!['correct','wrong','uncertain'].includes(a.verdict)) || !Array.isArray(a.errors) || a.errors.some(e=>typeof e!=='string') || typeof a.context!=='string' || typeof a.updatedAt!=='string' || a.proposalRevision!==hit.proposal.revision || (a.proposalReview!==undefined&&!['agree','disagree','uncertain'].includes(a.proposalReview)))throw Error('An individual answer does not match its proposed reading.');
  if(a.proposalReview==='agree'&&a.verdict!==hit.proposal.verdict || a.proposalReview==='uncertain'&&a.verdict!=='uncertain')throw Error('An individual agreement does not match its proposed verdict.');
 }
 if(JSON.stringify(answer.evidence)!==JSON.stringify(row.evidence))throw Error('Individual reading answers do not match their cited window.');
}
