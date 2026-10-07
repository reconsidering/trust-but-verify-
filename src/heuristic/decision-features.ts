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
  /** Experimental confidence diagnostic; never alters resolution or detection. */
  sceneRoleAgreement?: number;
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

/** A text reading only: no tags, labels, confidence, or pattern precision are inputs. */
export interface SceneRoleReading {
  a: string;
  b?: string;
  role?: string;
  kind: string;
  cat: string;
  act: string;
  para: number;
  sentence: string;
}

/** Leave the target sentence out: its overlapping patterns must not vote for themselves. */
export function sceneRoleAgreementOf(readings: readonly SceneRoleReading[], chapterOf: (pi: number) => string): number[] {
  const values = readings.map(() => 0);
  const groups = new Map<string, {r: SceneRoleReading; i: number; direction: string}[]>();
  for (const [i,r] of readings.entries()) {
    if (!r.b || r.a===r.b || ['solo','masturbation'].includes(r.kind)) continue;
    const family = /finger|fist/i.test(r.act) ? 'fingers' : /toy|strap|plug|dildo|vibrator/i.test(r.act) ? 'toy' : /rimm/i.test(r.act) ? 'rimming' : /cunniling/i.test(r.act) ? 'cunnilingus' : /blowjob/i.test(r.act) ? 'blowjob' : r.cat;
    const [top,bottom] = r.role==='bottom' ? [r.b,r.a] : [r.a,r.b];
    const pair = [top,bottom].sort().join('\u0000');
    const key = [r.kind,r.cat,family,pair].join('\u0001');
    const group = groups.get(key)??[];group.push({r,i,direction:top});groups.set(key,group);
  }
  for (const group of groups.values()) {
    group.sort((a,b)=>a.r.para-b.r.para);
    const scenes: typeof group[] = [];
    for (const item of group) {
      const last=scenes[scenes.length-1],previous=last?.[last.length-1];
      if(previous && item.r.para-previous.r.para<=20 && chapterOf(item.r.para)===chapterOf(last[0].r.para)) last.push(item);
      else scenes.push([item]);
    }
    for(const scene of scenes) {
      const votes = new Map<string,Set<string>>();
      const sentenceKey=(r:SceneRoleReading)=>`${r.para}\u0000${r.sentence}`;
      for(const item of scene){const set=votes.get(item.direction)??new Set<string>();set.add(sentenceKey(item.r));votes.set(item.direction,set);}
      for(const item of scene){let same=0,opposite=0;for(const [direction,set] of votes){const n=set.size-Number(set.has(sentenceKey(item.r)));if(direction===item.direction)same+=n;else opposite+=n;}values[item.i]=same+opposite?(same-opposite)/(same+opposite):0;}
    }
  }
  return values;
}
