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

describe("round 93: a person outside every tagged pairing, reached only by fallback", () => {
  const META3: Ao3Meta = { ...META, characters: ["Morgan Vale", "Rowan Marsh", "Tommy Cole"], freeforms: [] };
  const hits3 = (t: string) => { const hits: AuditHit[] = []; analyzeWithPatterns("Morgan and Rowan were in bed, naked and kissing, hard and aching. Morgan kissed Rowan. Rowan kissed Morgan back, moaning. ".repeat(3) + "\n\n" + t.split("||").join("\n\n"), META3, { quiet: true, audit: (h) => hits.push(h) }); return hits; };
  it("the former friend who was last named is not credited with the act on the partner", () => {
    const h = hits3("Rowan remembered Tommy, who used to laugh at him. Tommy stood up and left.||He pushed into him and thrust deep, hard and slow.").filter((x) => /push/.test(x.via));
    expect(h.filter((x) => /Tommy/.test(x.a) || /Tommy/.test(x.b ?? ""))).toEqual([]);
  });
  it("the tagged pair is still read", () => {
    const h = hits3("Morgan pushed Rowan onto the bed.||Morgan pushed into Rowan and thrust deep.").filter((x) => /push/.test(x.via));
    expect(h.length).toBeGreaterThan(0);
  });
});

describe("round 93: a push with nothing sexual around it", () => {
  const plain = (t: string) => { const hits: AuditHit[] = []; analyzeWithPatterns(t, META, { quiet: true, audit: (h) => hits.push(h) }); return hits.filter((h) => /^(?:push-into|pushed-in|thrust-back)/.test(h.via)); };
  it("a crowd shoving and a shoulder pressed back, with nothing sexual in the paragraphs, are not readings", () => {
    const text = "Morgan walked through the market and Rowan followed him. Morgan bought bread and fruit and they talked about the weather for a while.\n\nSince the news broke, Morgan could not go anywhere without someone glowering at him, shoving into him on the pavement.\n\nRowan pressed back against the wall of the shop and waited for the crowd to thin.";
    expect(plain(text)).toEqual([]);
  });
  it("a push in a sexual paragraph is still read", () => {
    expect(plain("Morgan kissed Rowan, naked and hard. Morgan pushed into Rowan and Rowan moaned.").length).toBeGreaterThan(0);
  });
});
