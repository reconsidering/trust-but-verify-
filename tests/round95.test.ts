// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Fingering and toys: contact at the anal entrance counts without insertion (AGENTS.md); no contact at all does not. Adult paraphrases.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] } as Ao3Meta;
const lead = "Morgan and Rowan are adult men. Morgan kissed Rowan, naked and hard, hands on his hips. Rowan moaned into the kiss. ".repeat(3) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const acts = (re: RegExp) => hits.filter((h) => h.kind === "act" && re.test(h.act)).map((h) => `${h.act}:${h.a.split(" ")[0]}>${h.b.split(" ")[0]}`);
  const solos = (re: RegExp) => hits.filter((h) => h.kind === "solo" && re.test(h.act)).map((h) => `${h.act}:${h.a.split(" ")[0]}`);
  return { acts, solos };
};

describe("round 95: contact at the entrance", () => {
  it("a finger circling the opening without going in is fingering", () => {
    expect(run("Morgan’s finger circled Rowan’s rim, pressing but not putting it in.").acts(/^fingering/)).toEqual(["fingering:Morgan>Rowan"]);
    expect(run("Morgan circled Rowan’s entrance with a finger and did not push it inside.").acts(/^fingering/)).toEqual(["fingering:Morgan>Rowan"]);
  });
  it("a finger that stopped before touching is not performed", () => {
    expect(run("Morgan’s finger circled the air above Rowan’s rim, stopping short of touching it.").acts(/^fingering/)).toEqual([]);
    expect(run("Morgan’s hand went toward Rowan’s hole but he stopped before touching him, and pulled away.").acts(/^fingering/)).toEqual([]);
  });
  it("a toy pressed against the opening without going in is a toy act", () => {
    expect(run("Morgan pressed the head of the plug against Rowan’s hole, not pushing it in yet.").acts(/toy|plug/)).toEqual(["anal sex (strap-on/toy):Morgan>Rowan"]);
  });
  it("a toy that never reached the opening is not performed", () => {
    expect(run("Morgan held the plug an inch from Rowan’s hole, then set it down without touching him.").acts(/toy|plug/)).toEqual([]);
  });
});

describe("round 95: wording that was missed (adult paraphrases)", () => {
  it("‘a second finger stretches into him’ is fingering by the other man", () => {
    expect(run("Morgan’s slick finger was already in him. “Take another.” A second finger stretched into Rowan and his hips faltered.").acts(/^fingering/).length).toBeGreaterThan(0);
  });
  it("‘slicked his fingers and pressed two inside’ is fingering; two inside without fingers is not", () => {
    expect(run("Morgan slicked his fingers with lube and pressed two inside, slowly.").acts(/^fingering/)).toEqual(["fingering:Morgan>Rowan"]);
    expect(run("Morgan packed the bags and pressed two inside, zipping the pocket shut.").acts(/^fingering/)).toEqual([]);
  });
  it("a finger pushed into himself, or fingers worked in after reaching behind him, is his own hole", () => {
    const a = run("Rowan pressed the tip of his index finger into himself and held his breath.");
    expect(a.acts(/^fingering/)).toEqual([]);
    expect(a.solos(/^fingering himself/)).toEqual(["fingering himself:Rowan"]);
    const b = run("Rowan reached behind him to work two fingers into his slick hole, gasping.");
    expect(b.acts(/^fingering/)).toEqual([]);
    expect(b.solos(/^fingering himself/)).toEqual(["fingering himself:Rowan"]);
  });
});
