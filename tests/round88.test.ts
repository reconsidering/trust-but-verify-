// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// A plain M/M pair. This round comes from the owner's notes on readings in the spot-check (rounds 1 and 2); every sentence here is paraphrased.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Rhys Calder/Theo Marsh"], characters: ["Rhys Calder", "Theo Marsh"], freeforms: [] };
const lead = "Rhys kissed Theo, naked and hard, hands on his hips. Theo moaned into the kiss. ".repeat(4) + "\n\n";
const run = (t: string, meta = META) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), meta, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const first = (s: string) => s.split(" ")[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${first(x.top)}>${first(x.bottom)}`);
  const desire = (k: "anal" | "blowjob" | "rimming") => (p[k].desires ?? []).map((d) => `${first(d.who)}:${d.role}`);
  const who = (re: RegExp) => hits.filter((h) => re.test(h.via)).map((h) => `${first(h.a)}:${h.kind}`);
  return { hits, who, anal: inst("anal"), blow: inst("blowjob"), desires: desire("anal"), blowDesires: desire("blowjob"), a };
};

describe("round 88: the owner’s notes on spot-check readings", () => {
  it("‘a bit sore, as could be expected from getting fucked’ is the body afterwards, not a scene", () => {
    expect(run("He was a bit sore here and there, as could be expected from getting fucked on the marble table.").anal).toEqual([]);
  });
  it("looking at his own cock after a yelp of pain is not ogling the partner", () => {
    const r = run("“Ow!” Theo yelped as he pulled away and looked at his cock in betrayal.");
    expect(r.who(/^ogle-crotch/)).toEqual([]);
  });
  it("‘give him what he wanted, sliding inside and bottoming out’ is something that happens", () => {
    expect(run("Theo was a shuddering mess under him and Rhys was quick to give him what he wanted, sliding inside and bottoming out with a groan.").anal).toEqual(["Rhys>Theo"]);
  });
  it("a memory of an act while jerking off is not a scene now, but it is kept as a weaker, imagined-style reading", () => {
    const r = run("With a flick of his wrist and the memory of Theo on his knees with his mouth wrapped around his cock, Rhys was spilling into a wad of paper.");
    expect(r.blow).toEqual([]);
    expect(r.who(/^lips-around/)).toEqual(["Theo:hypothetical"]);
  });
  it("…and ‘remember?’ in dialogue is not a memory: the thought of him jerking himself off still counts", () => {
    const r = run("“We had to be quick, remember?” Theo smirked, and Rhys felt giddy at the thought of Theo jerking himself off.");
    expect(r.who(/^mast-himself/)).toEqual(["Theo:masturbation"]);
  });
  it("‘his throat pulses around his cock’ after a grip in Theo’s hair is Theo’s throat", () => {
    expect(run("But Rhys has a vice grip in Theo’s hair, keeping him still as his throat pulses around his cock.").blow).toEqual(["Rhys>Theo"]);
  });
  it("‘takes his own cock in his hand’ is the one who was just named, not the other man", () => {
    const r = run("Rhys lay back against the pillows, watching.||Theo lazily takes his own cock in his hand.");
    expect(r.who(/^dd2-mast-take-in-hand/)).toEqual(["Theo:masturbation"]);
  });
  it("‘rocked himself’ while someone is inside him is not masturbation", () => {
    const r = run("Rhys was buried deep inside Theo and held still.||Theo rocked himself shamelessly.");
    expect(r.who(/^mast-himself/)).toEqual([]);
  });
  it("a hand that slips into briefs and curls around him is at the front, not the back", () => {
    const r = run("Theo moaned, hips bucking into Rhys’s hand as it slipped into his briefs, curling around him.");
    expect(r.desires).not.toContain("Rhys:top");
  });
  it("‘barely touching himself’ while the other man is sucking him is not masturbation", () => {
    const r = run("“You look lovely with my cock in your mouth,” Rhys whispers, brushing his fingers over Theo’s lips, barely touching himself.");
    expect(r.who(/^mast-himself/)).toEqual([]);
  });
  it("‘pushing back in’ right after a paragraph about fucking a mouth is the mouth", () => {
    const r = run("Rhys held Theo’s head and fucked his mouth, slow and deep, Theo’s lips stretched around him.||He pulls back a few centimeters before pushing back in.");
    expect(r.anal).toEqual([]);
  });
});
