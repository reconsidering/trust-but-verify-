import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(6) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  return { hits, p, scenes: p?.anal.instances.map((i) => i.evidence) ?? [], hints: (p?.anal.desires ?? []).map((h) => `${h.who}:${h.role}:${h.kind}`) };
};

describe("round 71: report fixes", () => {
  it("a squeezed cheek next to a mouth is a face, not an ass", () => {
    const r = run("Steve growled as he squeezed Eddie’s cheeks tighter, forcing him to open his mouth just enough to push two fingers in.");
    expect(r.hits.some((h) => h.via.startsWith("grab-ass"))).toBe(false);
  });
  it("“began” is not a wish: a narrated start of the act is an act", () => {
    const r = run("Not able to wait any longer, his cock throbbing with need, Steve began pushing himself into Eddie’s ass. Eddie let out a keening noise.");
    expect(r.scenes.length).toBeGreaterThan(0);
    expect(r.hints.some((h) => h.endsWith(":wanted"))).toBe(false);
  });
  it("something else that wanted to do something is not a wish of the people", () => {
    const r = run("Eddie’s body couldn’t decide what it wanted to do, his cock half hard from the feeling of Steve inside him, but the noise from the hall kept him from going fully hard.");
    expect(r.hints.some((h) => h.endsWith(":wanted"))).toBe(false);
  });
  it("a would in a described routine is a thing that happened", () => {
    const r = run("A routine was established during those three days. Steve would fuck Eddie in the morning and leave, and would come back for lunch and fuck Eddie again.");
    expect(r.scenes.length).toBeGreaterThan(0);
  });
  it("a priest’s fingers are not the lead’s", () => {
    const r = run("The priest pushed two of his fingers into Eddie’s ass and Eddie let out a huff of discomfort.");
    expect(r.scenes).toEqual([]);
    expect(r.hints.some((h) => h.startsWith("Steve:top"))).toBe(false);
  });
  it("one request in dialogue is one hint", () => {
    const r = run("“I need your cum, I need to be bred.” Eddie moaned.");
    expect(r.hits.filter((h) => h.via.startsWith("dialogue:anal")).length).toBeLessThanOrEqual(1);
  });
  it("working a spot inside oneself is solo fingering", () => {
    const r = run("The pleasure felt good enough to push through the pain, and his abuse of the bundle of nerves inside himself had him shouting.");
    expect(r.hits.some((h) => h.via.startsWith("self-prostate"))).toBe(true);
  });
});
