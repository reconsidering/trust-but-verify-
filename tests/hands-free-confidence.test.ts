import { describe, expect, it } from "vitest";
import { emptyMeta } from "../src/ao3";
import { analyzeWithPatterns } from "../src/heuristic";
import { comerBasis, handsFreeScoring } from "../src/heuristic/hands-free-confidence";
import { handsFreeOrgasmEvidence } from "../src/hands-free-orgasm";

// Invented adults. The score of a hands-free orgasm hint starts from what the wording states, and is judged on how the person who comes was found.
const meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] };
const desires = (text: string) => analyzeWithPatterns("Morgan and Rowan are adult men.\n\n" + text, meta, { quiet: true }).pairings[0].anal.desires;
const orgasm = (text: string) => desires(text).find((d) => d.act === "hands-free orgasm" || d.act === "prostate orgasm");

describe("confidence of a hands-free orgasm hint", () => {
  it.each([
    "Morgan fucked Rowan hard. Rowan came untouched.",
    "Morgan fucked Rowan hard. Rowan came without a touch to his dick.",
    "Morgan fucked Rowan hard. Rowan’s cock twitched untouched, spilling between them.",
  ])("is high when the wording says outright that no one touched him and the person is named: %s", (text) => {
    const d = orgasm(text)!;
    expect(d.confidence).toBeGreaterThanOrEqual(0.75);
    expect(d.reasons![0]).toBe("says outright that no one touched him");
    expect(d.reasons).not.toContain("people inferred, not named");
  });
  it("shows up in the Anal-card indicator only when it is that high", () => {
    const high = analyzeWithPatterns("Morgan and Rowan are adult men.\n\nMorgan fucked Rowan hard. Rowan came untouched.", meta, { quiet: true }).pairings[0];
    expect(handsFreeOrgasmEvidence(high.anal, high.pairing)).toHaveLength(1);
    const low = analyzeWithPatterns("Morgan and Rowan are adult men.\n\nMorgan fucked Rowan hard. Rowan had a prostate orgasm.", meta, { quiet: true }).pairings[0];
    expect(handsFreeOrgasmEvidence(low.anal, low.pairing)).toHaveLength(0);
  });
  it("is lower when only a pronoun says who came, since “he” could be either man", () => {
    const named = orgasm("Morgan fucked Rowan hard. Rowan came untouched.")!.confidence!;
    const pronoun = orgasm("Morgan fucked Rowan hard. He came untouched.")!.confidence!;
    expect(pronoun).toBeLessThan(named);
    expect(pronoun).toBeLessThan(0.75);
    expect(pronoun).toBeGreaterThan(0.38); // it was 0.38 before: the wording is still explicit
  });
  it.each([
    "Morgan fucked Rowan hard. Rowan came from the fucking alone.",
    "Morgan fucked Rowan hard and Rowan came just from Morgan’s cock.",
    "Morgan fucked Rowan hard. Rowan had a prostate orgasm.",
    "Morgan fucked Rowan slowly. Rowan came, still locked in his cage.",
  ])("stays below the indicator when it is read from what stimulated him alone, a cage or the prostate: %s", (text) => {
    const d = orgasm(text)!;
    expect(d.confidence).toBeLessThan(0.75);
    expect(d.confidence).toBeGreaterThanOrEqual(0.6);
  });
  it("does not change the score of any other hint", () => {
    const d = desires("Morgan rubbed his cock against Rowan’s ass. Rowan arched his back.");
    expect(d.find((x) => x.via === "rut-against-ass")!.confidence).toBeCloseTo(0.56, 2);
    expect(d.find((x) => x.via === "arch-back")!.confidence).toBeCloseTo(0.29, 2);
  });
});

describe("hands-free scoring rules", () => {
  it("applies to hands-free and prostate orgasms only", () => {
    expect(handsFreeScoring("came-untouched", "hands-free orgasm")?.base).toBe(0.9);
    expect(handsFreeScoring("came-untouched~elided", "hands-free orgasm")?.base).toBe(0.9);
    expect(handsFreeScoring("prostate-orgasm", "prostate orgasm")?.base).toBe(0.7);
    expect(handsFreeScoring("body-sore-ass", "loose or sore after sex")).toBeUndefined();
    expect(handsFreeScoring("came-untouched", "anal sex")).toBeUndefined();
  });
  it("judges the person who comes by how they were found, not the partner", () => {
    const a = (bottom: "name" | "pronoun" | "pov" | "partner" | "rule") => ({ top: "partner" as const, bottom, topPronoun: false, bottomPronoun: false, elided: false, subjectCandidates: 1, partnerCandidates: 1, nearbyCharacters: 2 });
    expect(comerBasis(a("name"), true)).toBe("named");
    expect(comerBasis(a("pronoun"), true)).toBe("pronoun");
    expect(comerBasis(a("pov"), true)).toBe("pronoun");
    expect(comerBasis(a("partner"), true)).toBe("inferred");
    expect(comerBasis({ ...a("name"), top: "name", bottom: "partner" }, false)).toBe("named");
  });
});
