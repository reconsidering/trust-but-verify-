// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Round 91: guards for the classes of mistake the owner found in the October 4-5 review (habits and earlier occasions, conditionals,
// a bare "it" that is a toy, legs spread for a blowjob, fingers on a prostate, exposure asked for). Invented adult partners; paraphrased.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] };
const lead = "Morgan and Rowan were in bed, naked and kissing, hard and aching. Morgan kissed Rowan. Rowan kissed Morgan back, moaning. ".repeat(4) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  return (re: RegExp) => hits.filter((h) => re.test(h.via));
};
const kinds = (t: string, re: RegExp) => run(t)(re).map((h) => h.kind);

describe("round 91: October review classes", () => {
  it("a habit is not one event: ‘with some regularity’, ‘some nights’", () => {
    expect(kinds("Morgan had fucked Rowan with some regularity, and Rowan had learned to love it.", /^fuck/)).not.toContain("act");
    expect(kinds("Some nights, when Rowan closes his eyes and fists his own cock, he can feel Morgan above him.", /^mast-/)).not.toContain("masturbation");
  });
  it("an earlier occasion mentioned in passing is history", () => {
    expect(kinds("Morgan heard him jerking off in the shower last night.", /^mast-/)).not.toContain("masturbation");
    expect(kinds("Rowan had masturbated furiously on the shirt.", /^mast-/)).not.toContain("masturbation");
  });
  it("‘if he knew more, he might push his fingers inside himself’ is a conditional", () => {
    expect(kinds("Rowan feels the slick on his thighs, and if he knew a little more about the man, he might stick his fingers inside himself, but he does not dare.", /^dd2-finger/)).not.toContain("solo");
  });
  it("‘what happens if I don’t take it?’ is a question", () => {
    expect(kinds("“What happens if I don’t take it?” Rowan asks.", /^dialogue:anal sex/)).not.toContain("said");
  });
  it("‘show me your hole’ asks for exposure, not for anal sex", () => {
    expect(run("“Show me your hole,” Morgan says.")(/^dialogue:anal sex/)).toEqual([]);
    expect(run("“I want to fuck you,” Morgan says.")(/^dialogue:anal sex/).length).toBeGreaterThan(0);
  });
  it("legs opened for a blowjob, or kneeling that is only promised, is not an anal hint", () => {
    expect(run("Rowan spreads his legs and grips his cock. “I want you to suck me.”")(/^spread-legs/)).toEqual([]);
    expect(run("If Rowan still doubted it, Morgan would drop to his knees right there and suck him off.")(/^sinks-to-floor/)).toEqual([]);
    expect(run("Rowan spreads his legs on the bed while Morgan reaches for the lube and lines up.")(/^spread-legs/).length).toBeGreaterThan(0);
  });
  it("slick is arousal, not what is left after sex", () => {
    expect(run("He feels his slick trickling out of his hole.")(/^body-leaking-from/)).toEqual([]);
  });
});
