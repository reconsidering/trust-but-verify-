// @vitest-environment jsdom
// Fast guards for mistakes that cost a full regression run to find, so they show up in the unit suite (about a minute) instead.
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { analyzeWithPatterns } from "../src/heuristic";

const base: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Rhys Calder/Theo Marsh"], characters: ["Rhys Calder", "Theo Marsh"], freeforms: ["Alpha/Beta/Omega Dynamics", "Alpha Rhys Calder", "Omega Theo Marsh"] };
const lead = "Rhys kissed Theo, naked and hard, hands on his hips. Theo moaned into the kiss. ".repeat(4) + "\n\n";
const desires = (text: string, meta: Ao3Meta) => analyzeWithPatterns(lead + text, meta, { quiet: true }).pairings[0].anal.desires?.map((d) => `${d.who.split(" ")[0]}:${d.role}`) ?? [];

describe("smoke: things that went wrong in earlier rounds", () => {
  it("long masked quotes and tags stay linear (a regex over runs of spaces once made one fic ten times slower)", () => {
    const quote = `“${"I want you so much, ".repeat(150)}”`;
    const para = `${quote} Theo says. He feels the heat. ${quote} he whispers.\n\n`;
    const t0 = Date.now();
    analyzeWithPatterns(lead + para.repeat(120), base, { quiet: true });
    expect(Date.now() - t0).toBeLessThan(20_000);
  });
  it("a long unpunctuated sentence does not blow up either", () => {
    const t0 = Date.now();
    analyzeWithPatterns(lead + ("Rhys and Theo and the bed and the sheets and the window and the light " .repeat(400) + ".\n\n").repeat(10), base, { quiet: true });
    expect(Date.now() - t0).toBeLessThan(20_000);
  });
  it("a woman in an M/F pair is still found when the partner is only named by pronoun", () => {
    const meta: Ao3Meta = { ...base, categories: ["M/M", "F/M"], relationships: ["Rhys Calder/Theo Marsh", "Rhys Calder/Mira Vance"], characters: ["Rhys Calder", "Theo Marsh", "Mira Vance"], freeforms: [] };
    const a = analyzeWithPatterns("Rhys and Mira lay together. She smiled at him and he kissed her.\n\nHe pressed a finger inside her and circled her clit with his thumb.", meta, { quiet: true });
    expect(a.pairings.some((p) => /Mira/.test(p.pairing))).toBe(true);
  });
  it("the alpha/omega tag rule moves an unnamed alpha-at-the-receiving-end reading to the omega, and only when the tags don't say both ways", () => {
    const line = "“Ugh, fuck, Rhys.” Theo complains as the plug spears deep inside him.";
    expect(desires(line, base)).not.toContain("Rhys:bottom");
    const both: Ao3Meta = { ...base, freeforms: [...base.freeforms, "Top Rhys Calder/Bottom Theo Marsh", "Bottom Rhys Calder/Top Theo Marsh"] };
    const switched = desires(line, both);
    // With roles tagged both ways the rule stays out of it; whatever the engine reads, it is not forced onto the omega.
    expect(switched.filter((d) => d === "Theo:bottom").length).toBeLessThanOrEqual(desires(line, base).filter((d) => d === "Theo:bottom").length);
  });
  it("an explicit speaker tag is not overruled by a shared term of address", () => {
    const lines = Array.from({ length: 4 }, () => "“Come here, baby,” Rhys said.\n\n“Okay, baby,” Theo said.\n\n").join("");
    const a = analyzeWithPatterns(lead + lines, { ...base, freeforms: [] }, { quiet: true });
    expect(a.pairings[0].dynamic?.every((d) => !d.factors?.some((f) => /pet name/.test(f.what)))).toBe(true);
  });
});
