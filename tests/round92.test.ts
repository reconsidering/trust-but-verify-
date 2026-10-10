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

describe("round 92: context for kneeling, shoving, blushing and neck hints", () => {
  it("dropping to his knees in a fight or from fear is not oral preparation", () => {
    expect(run("Rowan dropped to his knees on the cold tiles, retching and shaking with fear.")(/^sinks-to-floor/)).toEqual([]);
    expect(run("Rowan dropped to his knees and reached for Morgan’s belt, mouth already open.")(/^sinks-to-floor/).length).toBeGreaterThan(0);
  });
  it("a shove with a shoulder, a thigh or gloves is not pushing back onto a cock", () => {
    expect(run("Morgan shoved back, slamming his shoulder into Rowan’s chest.")(/^thrust-back/)).toEqual([]);
    expect(run("Rowan moans into the pillow and rocks back onto Morgan’s cock, hard and aching.")(/^thrust-back/).length).toBeGreaterThan(0);
  });
  it("a flushed cock, flushing with heat, or sputtering on water is not a blush", () => {
    expect(run("Rowan looks down at Morgan’s cock, hard and flushed.")(/^flustered/)).toEqual([]);
    expect(run("Rowan came up sputtering and choking on a mouthful of pool water.")(/^flustered/)).toEqual([]);
    expect(run("Rowan blushes and looks away from Morgan.")(/^flustered/).length).toBeGreaterThan(0);
  });
  it("craning his neck to look out of a window is not baring it", () => {
    const abo = (t: string) => { const hits: AuditHit[] = []; analyzeWithPatterns(lead + t, { ...META, freeforms: ["Alpha/Beta/Omega Dynamics"] }, { quiet: true, audit: (h) => hits.push(h) }); return hits.filter((h) => /^abo-bare-neck/.test(h.via)); };
    expect(abo("Rowan cranes his neck back, peering out of the window.")).toEqual([]);
    expect(abo("Rowan bares his neck to Morgan, whimpering.").length).toBeGreaterThan(0);
  });
});
