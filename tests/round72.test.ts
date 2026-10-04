import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META = (freeforms: string[] = []): Ao3Meta => ({ ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms });
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
const run = (t: string, freeforms: string[] = []) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), META(freeforms), { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const d = (k: "anal" | "blowjob") => p[k].desires.map((x) => `${x.who.split(" ")[0]}:${x.role}:${x.kind}:${x.via}`);
  const i = (k: "anal" | "blowjob") => p[k].instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}:${x.via}`);
  return { hits, p, anal: d("anal"), blow: d("blowjob"), analI: i("anal"), blowI: i("blowjob") };
};
const CAGE = ["Chastity Device", "Steve Harrington is a bottom"];

describe("round 72: report fixes (Coming Full Circle)", () => {
  it("a toy worked into someone else is not a toy on the subject", () => {
    const r = run("Eddie decided to be Eddie. He kept working the vibe (a pink one he had picked out for Steve, apparently) inside him in tiny steps.");
    expect(r.hits.some((h) => /^(?:self-toy|wearing-plug)/.test(h.via))).toBe(false);
    expect(r.p.solo?.occurs ?? false).toBe(false);
  });
  it("a cursing imperative in front of names is not a sex act", () => {
    const r = run("“Oooh, he’s a feisty one, huh?” Honestly, fuck Seraphine and fuck Eddie. He should have known any friend of Eddie’s would be a sadistic asshole.");
    expect(r.hits.some((h) => h.via.startsWith("fuck"))).toBe(false);
  });
  it("“rushed to answer” names the speaker, and “can take it” is the bottom’s line", () => {
    const r = run("“Do you think you can take my fingers still?” Eddie teased.||Eddie laughed and Steve rushed to answer, “Can take it. Please. I can take them.”");
    expect(r.anal.some((x) => x.startsWith("Steve:bottom:said"))).toBe(true);
    expect(r.anal.some((x) => x.startsWith("Eddie:top:said"))).toBe(false);
  });
  it("a fragment opening “As he…” goes on with the sentence before", () => {
    const r = run("Steve nodded before he could stop himself, tears on his lashes as he let Eddie abuse his prostate. As he spread his thighs and asked for more.");
    expect(r.anal.some((x) => x.startsWith("Steve:bottom") && x.includes("spread-legs"))).toBe(true);
    expect(r.anal.some((x) => x.startsWith("Eddie:bottom") && x.includes("spread-legs"))).toBe(false);
  });
  it("“Like he wasn’t …” pretends the act is not happening, so it is", () => {
    const r = run("“I know, baby.” Eddie kissed his cheek, soft and chaste. Like he wasn’t finger fucking Steve into oblivion.");
    expect(r.analI.some((x) => x.startsWith("Eddie>Steve"))).toBe(true);
    expect(r.anal.some((x) => x.includes("hypothetical") && x.includes("fingered"))).toBe(false);
  });
  it("a mouth on the cage is a blowjob on the wearer; taking the cage off is not wearing it", () => {
    const r = run("Eddie patted his crotch where his cock was all caged up.||He leaned down and wrapped his mouth around the cage, licking through the slits. Coating Steve in wet heat.||Instead he reached between Steve’s legs, fumbling with the lock to his cage.||It made his hips sag so much that Eddie had to hold them up, tossing his cage aside.", CAGE);
    expect(r.blowI).toContain("Steve>Eddie:mouth-on-cage");
    expect(r.hits.filter((h) => h.via === "chastity-wearer").length).toBe(2);
  });
});

describe("round 73: report fixes (Ethan and Hank)", () => {
  it("a set-off description between the tongue and the verb still makes it rimming by the named person", () => {
    const r = run("“Yeah,” Steve agreed, his voice cracking. Then he leaned in and Eddie let out a surprised gasp as Steve’s tongue, hot and wet, licked over Eddie’s hole.");
    expect(r.p.rimming.instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`)).toEqual(["Steve>Eddie"]);
    expect(r.p.rimming.desires.some((d) => (d.via ?? "").includes("one-sided"))).toBe(false);
  });
});
