// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t, META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
  return { hits, anal: inst("anal"), blow: inst("blowjob"), rim: inst("rimming") };
};

describe("round 81: deep-dive on three long fics", () => {
  it("acts the benchmark showed were missed", () => {
    expect(run("Steve's cock twitches, spent, between Eddie's lips.").blow).toEqual(["Steve>Eddie"]);
    expect(run("Eddie laps at Steve's dripping cock, holding it steady.").blow).toEqual(["Steve>Eddie"]);
    expect(run("Eddie pulls out almost all the way and slams back into Steve.").anal).toEqual(["Eddie>Steve"]);
  });
  it("wishes, daydreams and negated thoughts are not acts", () => {
    expect(run("Eddie almost reaches out to touch himself, but Steve glances over.").hits.some((h) => h.via?.startsWith("mast"))).toBe(false);
    expect(run("(Later, if he ends up holding the fabric to his nose, he might jerk himself off.)").hits.some((h) => h.via?.startsWith("mast"))).toBe(false);
    expect(run("Eddie loves the weight of a dick on his tongue.").blow).toEqual([]);
  });
});

describe("round 81: a cock pulled out toward a mouth is not a handjob", () => {
  it("pulling out of a mouth, or out to feed it to one, is oral", () => {
    expect(run("Eddie pulls his cock out of his mouth, lifting Steve by the arms.").hits.some((h) => h.via.startsWith("dd-hj-pulled-out"))).toBe(false);
    expect(run("Then Eddie is unzipping to pull his cock out and feed it between Steve's lips.").hits.some((h) => h.via.startsWith("dd-hj-pulled-out"))).toBe(false);
  });
});
