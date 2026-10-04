import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const M = (pov?: string): Ao3Meta => ({ ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Supernatural (TV 2005)"], relationships: ["Castiel/Dean Winchester"], characters: ["Dean Winchester", "Castiel"], freeforms: pov ? [`POV ${pov}`] : [] });
const lead = "Dean and Castiel were in bed, naked and kissing, hard and aching. Castiel kissed Dean. Dean kissed Castiel back, moaning. ".repeat(2) + "\n\n";
const run = (t: string, pov?: string) => { const hits: AuditHit[] = []; const r = analyzeWithPatterns(lead + t, M(pov), { quiet: true, audit: (h) => hits.push(h) }); return { p: r.pairings[0], hits }; };
const des = (t: string, pov?: string) => run(t, pov).p.anal.desires.map((d) => `${d.who.split(" ")[0]}:${d.role}${d.wants ? "" : "(NOT)"}:${d.kind}`);

describe("fixes from the Starving gods report", () => {
  it("‘would be lying if he said he didn’t’ is a yes, and a wish to be taken is the wisher’s own", () => {
    expect(des("Honestly, Dean would be lying if he said he didn’t get flashes of him getting fucked against the window.", "Dean Winchester")).toEqual(["Dean:bottom:hypothetical"]);
  });
  it("in Dean’s point of view, ‘all he wants is a room where Castiel can fuck him’ is Dean wanting to bottom", () => {
    expect(des("All he wants and needs right now is to get to a room where Castiel can fuck him and everything will be fine.", "Dean Winchester")).toEqual(["Dean:bottom:hypothetical"]);
  });
  it("‘Dean’s whole body … just imagining himself … while Castiel plows him’ is Dean’s fantasy", () => {
    expect(des("Dean’s whole body hums with arousal just imagining himself tied to that headrest while Castiel plows him relentlessly.", "Dean Winchester")).toEqual(["Dean:bottom:fantasy"]);
  });
  it("‘staring at Dean as he stretches himself’: the one stretching is the one watched", () => {
    const { p } = run("Cas is watching. He’s staring at Dean as he stretches himself, and Dean puts on a show, moaning, his hips rocking.", "Dean Winchester");
    expect(p?.solo?.instances.map((i) => i.who.split(" ")[0])).toEqual(["Dean"]);
  });
  it("‘this man and as he rides him’ is the partner, not other men in the past", () => {
    expect(des("Dean wants this man and as he rides him to completion, as he feels Cas shudder, he can only feel the same want in Cas’ every touch.", "Dean Winchester")).not.toContain("Dean:bottom:history");
  });
  it("‘the fingers he presses inside himself’ is not one partner fingering the other", () => {
    expect(run("Cas is looking, eyes homed in on Dean’s hole and the fingers he presses inside himself too fast.", "Dean Winchester").p.anal.instances).toHaveLength(0);
  });
  it("touching your own nipples is not masturbation", () => {
    expect(run("The boy takes to touching his own nipples, flicking his fingers over them as he gasps, eyes unfocused, his cock hard.", "Castiel").p?.solo?.instances).toHaveLength(0);
  });
  it("…but a hand on your own cock still is", () => {
    expect(run("Dean lay back, naked, stroking his own cock slowly while Castiel watched, hard.", "Dean Winchester").p?.solo?.instances.length).toBeGreaterThan(0);
  });
});

describe("fixes from the third review round", () => {
  const fm = { ...M(), categories: ["F/F"], relationships: ["Glinda/Elphaba"], characters: ["Glinda", "Elphaba"] } as Ao3Meta;
  const hitsOf = (t: string, meta: Ao3Meta, pre: string) => { const hits: AuditHit[] = []; analyzeWithPatterns(pre + t, meta, { quiet: true, audit: (h) => hits.push(h) }); return hits; };
  const ff = "Glinda and Elphaba were in bed, naked and kissing, wet and aching. Glinda kissed Elphaba. Elphaba kissed Glinda back, moaning. ".repeat(2) + "\n\n";
  it("an arched back between two women is not an anal hint", () => {
    expect(hitsOf("Glinda’s breath hitched, her spine arched, her fists clutched the sheets.", fm, ff).filter((h) => h.via.startsWith("arch-"))).toHaveLength(0);
  });
  it("…but arching toward an ass still is, in a pairing with a penis", () => {
    expect(run("Dean arched his back, pushing his ass up toward Castiel, naked and hard.", "Dean Winchester").hits.some((h) => h.via.startsWith("arch-"))).toBe(true);
  });
  it("spreading her partner’s thighs from between her legs is not offering herself", () => {
    expect(hitsOf("“Shh,” Glinda whispered, crawling back up between her legs, spreading her thighs open slowly. “Let me.”", fm, ff).filter((h) => h.via.startsWith("spread-legs"))).toHaveLength(0);
  });
  it("‘bared his throat to daggers’ is a metaphor", () => {
    expect(run("He bared his throat to daggers; he could not say why he bled.").hits.filter((h) => h.via.startsWith("abo-bare-neck"))).toHaveLength(0);
  });
});
