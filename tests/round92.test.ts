// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Round 92: a gesture on his own body is not an act on the partner's (full-text deep dives: 9 "comforting" readings of a man rubbing his own forehead).
// Invented adult partners; paraphrased.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] };
const lead = "Morgan and Rowan were in bed, naked and kissing, hard and aching. Morgan kissed Rowan. Rowan kissed Morgan back, moaning. ".repeat(4) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  return (re: RegExp) => hits.filter((h) => re.test(h.via));
};

describe("round 92: self-touch is not comfort", () => {
  it("rubbing his own forehead or temples is not comforting the partner", () => {
    expect(run("Rowan closes his eyes and rubs his forehead.")(/^care-soothe/)).toEqual([]);
    expect(run("Morgan squeezed his temples, rubbing at the ache.")(/^care-soothe/)).toEqual([]);
    expect(run("Rowan strokes his own hair back and sighs.")(/^care-soothe/)).toEqual([]);
  });
  it("comforting the partner still counts", () => {
    expect(run("Morgan rubs Rowan’s back and murmurs to him.")(/^care-soothe/).length).toBeGreaterThan(0);
  });
});
