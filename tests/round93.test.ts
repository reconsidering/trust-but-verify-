// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Round 93: in a story told from one man's point of view, "He only hopes … to get railed" / "He heard himself … demanding to be fucked" is that man.
// Invented adult partners; paraphrased.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: ["Morgan POV"] };
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const text = "Chapter 1: Morgan\n\n" + "Morgan lay in bed with Rowan, kissing him, naked and hard and aching. Rowan kissed Morgan back, moaning. Morgan wanted him. ".repeat(6) + "\n\n" + t.split("||").join("\n\n");
  analyzeWithPatterns(text, META, { quiet: true, audit: (h) => hits.push(h) });
  return hits;
};
const hint = (t: string, re: RegExp) => run(t).filter((h) => re.test(h.via)).map((h) => `${h.kind}:${h.a.split(" ")[0]}/${h.role ?? ""}`);

describe("round 93: point-of-view wishes", () => {
  it("‘He only hopes … to get railed’ is the point-of-view man wanting to bottom", () => {
    expect(hint("Rowan pulls him up from the bed, grinning. He only hopes that wherever they are headed has a comfortable surface to get railed on.", /passive-fucked/)).toEqual(["wanted:Morgan/bottom"]);
  });
  it("‘He sees himself … needs to get fucked’ is the point-of-view man being fucked, by the other", () => {
    const hits = run("Rowan kissed his neck. He sees himself, naked and sweaty and flushed, and knows that person needs to get fucked.").filter((h) => /be-fucked/.test(h.via) && h.kind === "act");
    expect(hits.map((h) => `${h.a.split(" ")[0]}>${(h.b ?? "").split(" ")[0]}`)).toEqual(["Rowan>Morgan"]);
  });
});
