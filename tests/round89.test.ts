// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// The weakest patterns in the reliability table, checked against the labelled mistakes behind them; every sentence is paraphrased.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Rhys Calder/Theo Marsh"], characters: ["Rhys Calder", "Theo Marsh"], freeforms: [] };
const lead = "Rhys kissed Theo, naked and hard, hands on his hips. Theo moaned into the kiss. ".repeat(4) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const first = (s: string) => s.split(" ")[0];
  return { who: (re: RegExp) => hits.filter((h) => re.test(h.via)).map((h) => `${first(h.a)}:${h.kind}`) };
};

describe("round 89: weak patterns", () => {
  it("dropping to his knees next to someone, to help them, is not kneeling for sex", () => {
    expect(run("“Fuck, Rhys,” Theo gasped and dropped to his knees on the floor next to Rhys. “What happened?” He cradled Rhys’s face.").who(/^sinks-to-floor/)).toEqual([]);
  });
  it("‘restrained himself from pinning him to the wall’ is not pinning", () => {
    expect(run("Rhys had to restrain himself from pinning Theo to the wall and taking him right there.").who(/^dom-pin/)).toEqual([]);
  });
  it("smoothing or running his own hands over his own hair or suit comforts no one", () => {
    expect(run("Theo roughly ran his hands through his hair in frustration.").who(/^care-soothe/)).toEqual([]);
    expect(run("Rhys turned and admired himself in the mirror, smoothing his hands down the front of his suit.").who(/^care-soothe/)).toEqual([]);
  });
  it("someone outside the cast handing a glass of water is not a cast member looking after someone", () => {
    expect(run("In the kitchen the cousins were howling with laughter, but Milla, ever the practical one, handed Theo a glass of water and an aspirin.").who(/^care-bring/)).toEqual([]);
  });
  it("‘I can’t move’ and ‘come on’ are not asking to be held", () => {
    expect(run("“Theo, come on. I can’t move,” Rhys said.").who(/^dialogue:asking to be held/)).toEqual([]);
  });
  it("…but a sentence that merely opens with ‘Though,’ is not an outsider’s name, and a man running his fingers through the other’s chest hair is still caring", () => {
    expect(run("Though, if Rhys can ever get himself to finally fuck Theo, he’d much rather cockwarm like that.").who(/^fuck/).length).toBeGreaterThan(0);
    expect(run("Theo shivered as Rhys ran his fingers through his chest hair with a hum.").who(/^care-soothe/).length).toBeGreaterThan(0);
  });
  it("‘a desire to stop Theo from stammering’ still says Theo is stammering; only holding oneself back cancels the act", () => {
    expect(run("“No,” Rhys said, more out of a desire to stop Theo from stammering than anything else.").who(/^flustered/).length).toBeGreaterThan(0);
  });
});
