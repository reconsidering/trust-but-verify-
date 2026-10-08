// Optional confidence experiments. Production scores retain their committed feature vector and weights.
export const TRIALS = {
 'final-decision':['participantsRefined','actRefined','instrumentUnknown'],
 'pronoun-alternatives':['compatiblePronounAlternatives'],
 'sentence-distance':['resolvedSentenceDistance'],
};
export function trialFeatures(name,outcome) {
 if(!name) return [];
 if(!TRIALS[name]) throw Error(`Unknown confidence trial: ${name}`);
 if(!outcome) return TRIALS[name].map(()=>0);
 if(name==='final-decision') return [Number(outcome.topChanged||outcome.bottomChanged),Number(outcome.actChanged),Number(outcome.instrument==='unknown')];
 if(name==='pronoun-alternatives') return [Math.log1p(Math.max(0,outcome.compatiblePronounCandidates-1))];
 return [Math.log1p(outcome.sentenceDistance)];
}
