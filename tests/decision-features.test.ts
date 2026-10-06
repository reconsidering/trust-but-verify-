// All examples are invented adult-character fixtures, not quotations from sample fics.
import { describe, expect, it } from "vitest";
import { emptyMeta } from "../src/ao3";
import { analyzeWithPatterns, type AuditHit } from "../src/heuristic";
import { type Cast, type Character } from "../src/heuristic/characters";
import { DECISION_FEATURES, decisionFeaturesOf, type DecisionEvidence } from "../src/heuristic/decision-features";
import { FEATURES, LEGACY_FEATURES, MODEL, featuresOf, probability } from "../src/heuristic/learned";
import { Ctx, resolvePair } from "../src/heuristic/resolve";

const person = (name: string): Character => ({ name, aliases: [name], gender: "m", penis: true, vulva: false });
const alex = person("Alex"), sam = person("Sam"), lee = person("Lee");
function context(third = false) {
  const chars = third ? [alex, sam, lee] : [alex, sam];
  const cast: Cast = { chars, byAlias: new Map(chars.map((c) => [c.name, c])), pairings: third ? [[alex, sam], [alex, lee]] : [[alex, sam]], aliasPattern: chars.map((c) => c.name).join("|"), maleVulva: false };
  const ctx = new Ctx(cast);
  ctx.lastSubject = alex;
  ctx.recent = [...chars];
  return { ctx, cast };
}

describe("resolver provenance", () => {
  it("distinguishes captured names from pronouns inherited from the last subject", () => {
    const { ctx, cast } = context();
    const named = resolvePair("Alex", "Sam", "t", cast, ctx)!;
    expect(named).toMatchObject({ top: alex, bottom: sam, basis: "named", attribution: { top: "name", bottom: "name", topPronoun: false, partnerCandidates: 0 } });
    const pronouns = resolvePair("he", "him", "t", cast, ctx)!;
    expect(pronouns).toMatchObject({ top: alex, bottom: sam, basis: "pronoun", attribution: { top: "last-subject", bottom: "partner", topPronoun: true, bottomPronoun: true, partnerCandidates: 1 } });
  });
  it("records clause overrides and recent-person fallback as different choices", () => {
    const { ctx, cast } = context();
    expect(resolvePair("he", "Alex", "t", cast, ctx, undefined, sam)?.attribution.top).toBe("clause");
    ctx.lastSubject = undefined;
    expect(resolvePair("he", "him", "t", cast, ctx)?.attribution.top).toBe("recent");
  });
  it("exposes a choice between multiple eligible partners without changing the chosen pair", () => {
    const { ctx, cast } = context(true);
    const hit = resolvePair("Alex", "him", "t", cast, ctx)!;
    expect(hit.bottom).toBe(sam);
    expect(hit.attribution).toMatchObject({ bottom: "partner", partnerCandidates: 2, nearbyCharacters: 3 });
    ctx.coSubjects.add(lee);
    expect(resolvePair("Alex", "him", "t", cast, ctx)?.attribution.partnerCandidates).toBe(1);
  });
  it("keeps epithets and first-person resolution distinct from direct names", () => {
    const { ctx, cast } = context();
    cast.narrator = alex;
    expect(resolvePair("I", "Sam", "t", cast, ctx)?.attribution.top).toBe("pov");
    ctx.newSentence(["the blond"]);
    ctx.epithets.set("hair:blond", sam);
    expect(resolvePair("Epithet0", "Alex", "t", cast, ctx)?.attribution.top).toBe("epithet");
  });
});

const decision = (match: string, surrounding = "", act = "anal sex"): DecisionEvidence => ({
  attribution: { top: "name", bottom: "partner", topPronoun: false, bottomPronoun: true, elided: false, subjectCandidates: 0, partnerCandidates: 2, nearbyCharacters: 3 },
  match, surrounding, category: "anal", act, hint: false,
});
const values = (d: DecisionEvidence) => Object.fromEntries(DECISION_FEATURES.map((name, i) => [name, decisionFeaturesOf(d)[i]]));

describe("act-selection evidence", () => {
  it("keeps cues inside the matched phrase separate from nearby kissing and fingers", () => {
    const f = values(decision("Alex pushed into Sam", "They kissed. A finger brushed a cheek."));
    expect(f).toMatchObject({ matchPenetration: 1, matchKissing: 0, matchFingers: 0, nearKissing: 1, nearFingers: 1 });
  });
  it("records oral, finger and toy evidence without asserting an act occurred", () => {
    expect(values(decision("his tongue pressed into the mouth", "", "blowjob"))).toMatchObject({ matchMouth: 1, matchPenetration: 1, matchToy: 0 });
    expect(values(decision("two fingers slipped inside", "", "fingering"))).toMatchObject({ patternFingering: 1, matchFingers: 1, matchToy: 0 });
    expect(values(decision("a dildo slid inside", "", "anal sex (strap-on/toy)"))).toMatchObject({ patternToy: 1, matchToy: 1, matchFingers: 0 });
  });
  it("leaves existing-model probabilities identical when new evidence is appended", () => {
    const base = { sent: "Alex pushed into Sam.", paras: ["Alex pushed into Sam."], pi: 0, basis: "named" as const, elided: false, pairBoth: true, actorNamed: true, anyNamed: true };
    const old = featuresOf(base).slice(0, LEGACY_FEATURES.length);
    const expanded = featuresOf({ ...base, decision: decision("Alex pushed into Sam", "They kissed.") });
    expect(expanded).toHaveLength(FEATURES.length);
    expect(expanded.slice(0, LEGACY_FEATURES.length)).toEqual(old);
    // Explicitly use the old prefix model: retraining may later supply all feature weights.
    const oldModel = { ...MODEL, weights: MODEL.weights.slice(0, LEGACY_FEATURES.length) };
    expect(probability(0.8, expanded, oldModel)).toBe(probability(0.8, old, oldModel));
  });
});

describe("engine audit feature hooks", () => {
  const meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], relationships: ["Alex/Sam", "Alex/Lee"], characters: ["Alex", "Sam", "Lee"], fandoms: ["Original Work"] };
  const run = (text: string) => {
    const hits: AuditHit[] = [];
    analyzeWithPatterns("Alex and Sam were naked in bed. Sam kissed Alex. Lee waited nearby.\n\n" + text, meta, { quiet: true, audit: (h) => hits.push(h) });
    return hits.filter((h) => h.para === 1 && h.f);
  };
  it("exports the actual resolver route and a finite feature vector for a detected act", () => {
    const hit = run("Alex fucked Sam.").find((h) => h.kind === "act" && h.via === "fuck")!;
    expect(hit).toBeDefined();
    expect(hit.attribution).toMatchObject({ top: "name", bottom: "name", elided: false });
    expect(hit.f).toHaveLength(FEATURES.length);
    expect(hit.f!.every(Number.isFinite)).toBe(true);
    expect(hit.f![FEATURES.indexOf("matchPenetration")]).toBe(1);
  });
  it("records left-out subjects and inheritance across sentences in real scanning", () => {
    const elided = run("Alex grinned and pushed into Sam.").find((h) => h.via.endsWith("~elided"))!;
    expect(elided).toBeDefined();
    expect(elided.attribution?.elided).toBe(true);
    const inherited = run("Alex smiled at Sam. He fucked him.").find((h) => h.kind === "act" && h.via === "fuck")!;
    expect(inherited.attribution).toMatchObject({ top: "last-subject", bottom: "partner", topPronoun: true });
  });
  it("adds the same metadata to hints, including manual act patterns", () => {
    const hit = run("Alex stroked Sam's cock.").find((h) => h.kind === "handjob")!;
    expect(hit).toBeDefined();
    expect(hit.attribution).toBeDefined();
    expect(hit.f![FEATURES.indexOf("patternHint")]).toBe(1);
  });
});
