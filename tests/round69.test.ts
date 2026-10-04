// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { analyzeWithPatterns } from "../src/heuristic";
import { buildReport } from "../src/report";
import { testSkeletons } from "../src/testgen";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(6) + "\n\n";
const kleon = "Kleon laughed at the door. Kleon wiped the table. Kleon smiled at the guards. Kleon waved at Steve.\n\n";
const others = (t: string) => analyzeWithPatterns(lead + t, META, { quiet: true }).pairings[0]?.others;

describe("scenes with others", () => {
  it("a named minor character: the cast member's role is clear and the partner is named", () => {
    const o = others(`${kleon}Kleon’s mouth wrapped around Steve’s cock and Steve moaned, naked and hard.`);
    expect(o?.occurs).toBe(true);
    const i = o!.instances.find((x) => x.who.startsWith("Steve"));
    expect(i).toMatchObject({ role: "top", kind: "scene", other: { label: "Kleon", kind: "named" } });
    expect(o!.partners.find((p) => p.label === "Kleon")?.count).toBeGreaterThan(0);
  });
  it("a stranger label is kept as the label", () => {
    const o = others("The twink did as he was told and gagged on Steve’s length. He was shaking, naked.");
    expect(o?.instances.some((x) => x.who.startsWith("Steve") && x.other.label === "the twink" && x.other.kind === "stranger")).toBe(true);
  });
  it("an unresolved ‘he’ with no sign of an outsider is probably the other lead, so it is not listed", () => {
    const o = analyzeWithPatterns(`${lead}He took Steve’s cock down his throat, sucking hard, naked and shaking.\n\n`, META, { quiet: true }).pairings[0]?.others;
    expect(o?.occurs ?? false).toBe(false);
  });
  it("a past partner is listed as someone else in the past", () => {
    const o = analyzeWithPatterns(`${lead}Steve noticed the tub and thought how nice it would be to use it without being fucked open by older men in it.\n\n`, META, { quiet: true }).pairings[0]?.others;
    if (o?.occurs) expect(o.instances.every((x) => x.kind === "history" && x.other.kind === "unnamed")).toBe(true);
  });
  it("a pair-only scene produces no card", () => {
    expect(others("Eddie fucked Steve hard, naked and sweating.")?.occurs ?? false).toBe(false);
  });
  it("a plain wish or negation about someone else is not recorded", () => {
    expect(others(`${kleon}Kleon never gagged on Steve’s length, naked and hard.`)?.occurs ?? false).toBe(false);
  });
});

describe("the card in the report and the test skeletons", () => {
  const item = { id: "x|Steve Harrington/Eddie Munson|others|0", kind: "hint" as const, pairing: "Steve Harrington/Eddie Munson", card: "others", top: "Steve Harrington (top)", bottom: "Kleon", act: "blowjob", where: "Chapter 2", evidence: "Kleon’s mouth wrapped around Steve’s cock.", reasons: ["wrong_person" as const], note: "" };
  it("the report names the other person and says they are not in the cast", () => {
    const text = buildReport({ source: "patterns", summaries: [], flags: [item], missed: [], general: "" });
    expect(text).toContain("moment with someone outside the cast");
    expect(text).toContain("who is not in the cast list");
    expect(text).toContain("Kleon");
  });
  it("the test skeleton points at the others result", () => {
    expect(testSkeletons([item], [])).toContain("pairings[0].others");
  });
});
