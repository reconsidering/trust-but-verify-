// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
const run = (t: string) => analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true }).pairings[0];

describe("round 84: every reading on every card has a confidence", () => {
  it("hands & body play", () => {
    const p = run("Eddie wrapped his fingers around Steve's cock and stroked him slowly.");
    expect(p.manual!.instances.length).toBeGreaterThan(0);
    for (const i of p.manual!.instances) { expect(i.confidence).toBeGreaterThan(0); expect(i.confidence).toBeLessThanOrEqual(1); expect(i.reasons!.length).toBeGreaterThan(0); }
  });
  it("solo acts", () => {
    const p = run("Steve jerked himself off in the shower, thinking of Eddie.");
    expect(p.solo!.instances.length).toBeGreaterThan(0);
    for (const i of p.solo!.instances) { expect(i.confidence).toBeGreaterThan(0); expect(i.reasons!.length).toBeGreaterThan(0); }
  });
  it("a hedged or hypothetical reading scores lower than a plain one", () => {
    const plain = run("Eddie wrapped his fingers around Steve's cock and stroked him slowly.").manual!.instances[0].confidence!;
    const hedged = run("Maybe Eddie almost wrapped his fingers around Steve's cock, as if he might stroke him.").manual!.instances[0]?.confidence ?? 0;
    expect(hedged).toBeLessThanOrEqual(plain);
  });

  it("pronouns: a participle phrase after a quote belongs to the speaker; everything after “watched as X” is X’s", () => {
    const rim = analyzeWithPatterns(lead + "“Please, Eddie,” Steve whispered, shaking.\n\n“You beg so prettily, baby,” taking a step back, he drops to his knees and licks over his hole.", META, { quiet: true }).pairings[0].rimming.instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
    expect(rim).toEqual(["Eddie>Steve"]);
    const solo = analyzeWithPatterns(lead + "Steve was exhausted. He watched as Eddie put lube onto his fingers and then reached back so he could begin to open himself up.", META, { quiet: true }).pairings[0];
    expect(solo.solo!.instances.map((x) => x.who.split(" ")[0])).toContain("Eddie");
    expect(solo.solo!.instances.map((x) => x.who.split(" ")[0])).not.toContain("Steve");
  });
});
