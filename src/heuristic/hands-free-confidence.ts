// How sure the engine is of a hands-free or prostate orgasm hint. Scored apart from other "bodily sign" hints (soreness, a gingerly walk): the sentence
// states the event outright, and the person who comes is the one that matters, whether or not the partner is named.
import type { AttributionEvidence } from "./decision-features";
import type { Basis } from "./hits";

/** Patterns whose wording says outright that nobody touched him ("came untouched", "without a touch to his dick", "didn't need a hand"). The owner
 * marked every hint these produced in round 1 (tests/hands-free/round-1.json) as hands-free. */
const EXPLICIT = /^(?:came-untouched|made-come-untouched|untouched-cock-spills|untouched-cock-twitches-spills|came-no-hand-needed)(?:~|$)/;
/** Patterns that read "hands-free" from what stimulated him alone, a cage or the prostate: not yet checked against the owner's answers, so kept lower. */
const IMPLIED = /^(?:came-from-partner-alone|came-from-being-fucked|came-from-stimulation-alone|came-just-from-partner-verbing|came-caged|cage-erupts|prostate-orgasm|came-from-prostate)(?:~|$)/;

export function isHandsFree(act: string): boolean {
  return act === "hands-free orgasm" || act === "prostate orgasm";
}

/** The base score and the one-line reason shown with it; undefined for any other hint. */
export function handsFreeScoring(patternId: string, act: string): { base: number; note: string } | undefined {
  if (!isHandsFree(act)) return undefined;
  if (EXPLICIT.test(patternId)) return { base: 0.9, note: "says outright that no one touched him" };
  if (IMPLIED.test(patternId)) return { base: 0.7, note: "comes from anal or prostate stimulation alone, by the wording" };
  return { base: 0.65, note: "an orgasm without a hand on him" };
}

/** How the person who comes was found. The partner is not part of this hint, so a partner who is not in the sentence does not make it "inferred". */
export function comerBasis(attribution: AttributionEvidence, comerIsBottom: boolean): Basis {
  const origin = comerIsBottom ? attribution.bottom : attribution.top;
  if (origin === "name") return "named";
  if (origin === "pronoun" || origin === "pov" || origin === "clause") return "pronoun";
  return "inferred";
}
export const basisFactor = (b: Basis | undefined) => (b === "named" ? 1 : b === "pronoun" ? 0.75 : 0.5);
