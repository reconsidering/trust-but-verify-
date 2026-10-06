/** Resolver choices, captured before later act/role refinements. No story text is retained here. */
export type PersonOrigin = "name" | "pronoun" | "epithet" | "pov" | "clause" | "last-subject" | "recent" | "partner" | "rule";

export interface AttributionEvidence {
  top: PersonOrigin;
  bottom: PersonOrigin;
  topPronoun: boolean;
  bottomPronoun: boolean;
  elided: boolean;
  subjectCandidates: number;
  partnerCandidates: number;
  nearbyCharacters: number;
}

export interface DecisionEvidence {
  attribution: AttributionEvidence;
  match: string;
  /** Unmatched text in this paragraph and its neighbours, separate from the pattern's phrase. */
  surrounding: string;
  category: string;
  act: string;
  hint: boolean;
}

/** Append-only: the existing model's weights still refer to the original feature prefix. */
export const DECISION_FEATURES = [
  "topDirectName", "bottomDirectName", "topTokenPronoun", "bottomTokenPronoun",
  "resolvedEpithet", "resolvedPov", "resolvedClause", "resolvedLastSubject",
  "resolvedRecent", "inferredPartner", "resolutionRule", "subjectElided",
  "subjectCandidates", "partnerCandidates", "nearbyCharacters",
  "patternAnal", "patternOral", "patternFingering", "patternToy", "patternHint",
  "matchPenetration", "matchKissing", "matchMouth", "matchFingers", "matchToy", "matchAnalBody", "matchPenis",
  "nearPenetration", "nearKissing", "nearMouth", "nearFingers", "nearToy", "nearAnalBody", "nearPenis",
] as const;

// These are lexical cues, not assertions that an act happened. In particular, fingers may be in hair.
const CUES = [
  /\b(?:penetrat\w*|insert\w*|inside|into|thrust\w*|fuck\w*|bottom(?:s|ed|ing)?\s+out)\b/i,
  /\b(?:kiss\w*|mak(?:e|es|ing)\s+out|made\s+out)\b/i,
  /\b(?:mouth|lips?|tongue|throat|gag\w*)\b/i,
  /\b(?:fingers?|digits?|knuckles?|fists?|fisting)\b/i,
  /\b(?:toys?|dildos?|plugs?|vibrators?|strap[- ]?ons?|harness|beads)\b/i,
  /\b(?:anus|anal|asshole|arsehole|ass|arse|rim|pucker|butt)\b/i,
  /\b(?:cock|dick|penis|prick|shaft)\b/i,
] as const;

export function decisionFeaturesOf(d?: DecisionEvidence): number[] {
  if (!d) return DECISION_FEATURES.map(() => 0);
  const a = d.attribution;
  const origins = [a.top, a.bottom];
  const via = (origin: PersonOrigin) => Number(origins.includes(origin));
  return [
    Number(a.top === "name"), Number(a.bottom === "name"), Number(a.topPronoun), Number(a.bottomPronoun),
    via("epithet"), via("pov"), via("clause"), via("last-subject"),
    via("recent"), via("partner"), via("rule"), Number(a.elided),
    Math.log1p(a.subjectCandidates), Math.log1p(a.partnerCandidates), Math.log1p(a.nearbyCharacters),
    Number(d.category === "anal"), Number(d.category === "oral"), Number(/finger|fist/i.test(d.act)),
    Number(/toy|strap|dildo|plug|vibrator/i.test(d.act)), Number(d.hint),
    ...CUES.map((cue) => Number(cue.test(d.match))),
    ...CUES.map((cue) => Number(cue.test(d.surrounding))),
  ];
}
