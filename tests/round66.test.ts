import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const M = (pov?: string): Ao3Meta => ({ ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Miles McKinnon/Jordan Olivera"], characters: ["Miles McKinnon", "Jordan Olivera"], freeforms: pov ? [`POV ${pov}`] : [] });
const lead = "Miles and Jordan were in bed, naked and kissing, hard and aching. Jordan kissed Miles. Miles kissed Jordan back, moaning. ".repeat(8) + "\n\n";
const run = (t: string, pov?: string) => { const hits: AuditHit[] = []; const r = analyzeWithPatterns(lead + t, M(pov), { quiet: true, audit: (h) => hits.push(h) }); return { p: r.pairings[0], hits }; };
const one = (t: string, pov?: string) => run(t, pov).hits.filter((h) => h.via.endsWith("~one-sided")).map((h) => `${h.cat}:${h.a.split(" ")[0]}`);
const greg = "Greg laughed at the bar. Greg wiped the counter. Greg smiled at everyone.\n\n";

describe("one identifiable person in an act", () => {
  it("‘gagged on Jordan’s length’ with a stranger doing it: Jordan is the one getting sucked", () => {
    expect(one("The twink did as he was told and gagged on Jordan’s length. He was shaking, naked.")).toContain("oral:Jordan");
  });
  it("a stranger fucking Miles: Miles is the bottom, whoever the other is", () => {
    const r = run(`${greg}Greg pushed in and fucked Miles hard, naked and sweating.`).hits.filter((h) => h.via.endsWith("~one-sided")).map((h) => `${h.cat}:${h.a.split(" ")[0]}`);
    expect(r).toContain("anal:Miles");
  });
  it("nothing is recorded for a wished-for, negated or imagined act", () => {
    expect(one("The twink wished he could gag on Jordan’s length, naked and hard.")).toHaveLength(0);
    expect(one("The twink never gagged on Jordan’s length, naked and hard.")).toHaveLength(0);
  });
  it("a normal two-person act is not doubled", () => {
    expect(one("Jordan fucked Miles hard, naked and sweating.")).toHaveLength(0);
  });
  it("it is a weak hint, not a scene", () => {
    const { p, hits } = run(`${greg}Greg pushed in and fucked Miles hard, naked and sweating.`);
    expect(hits.some((h) => h.via.endsWith("~one-sided") && h.kind === "touch")).toBe(true);
    expect(p?.anal.instances.length ?? 0).toBe(0);
  });
});
