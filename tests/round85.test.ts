// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Obi-Wan Kenobi/Anakin Skywalker"], characters: ["Obi-Wan Kenobi", "Anakin Skywalker"], freeforms: [] };
const lead = "Anakin and Obi-Wan were in bed, naked and kissing, hard and aching. Obi-Wan kissed Anakin. Anakin kissed Obi-Wan back, moaning. ".repeat(5) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${x.top.split(" ")[0].split("-")[0]}>${x.bottom.split(" ")[0].split("-")[0]}`);
  return { hits, via: (re: RegExp) => hits.some((h) => re.test(h.via)), anal: inst("anal"), blow: inst("blowjob"), manual: p.manual?.instances ?? [] };
};

describe("round 85: Negotiation report (Obi-Wan/Anakin)", () => {
  it("a hyphenated name is not cut in two: fingers in Obi-Wan’s hair are not fingers in Obi", () => {
    expect(run("Anakin’s fingers tangle in Obi-Wan’s already untidy hair and tug.").anal).toEqual([]);
    expect(run("Anakin slid two fingers inside Obi-Wan.").anal).toEqual(["Anakin>Obi"]);
  });
  it("leaning over to pluck something up is not presenting", () => {
    expect(run("Instead he watches Anakin lean over and pluck the photograph from the desk.").via(/^ogle-bend-over/)).toBe(false);
  });
  it("arching back into someone’s chest is closeness, not pushing back onto a cock", () => {
    expect(run("The other arm is wrapped around Anakin, forcing him to arch back into Obi-Wan’s chest.").via(/^thrust-back/)).toBe(false);
  });
  it("‘the thought that he had decided to fuck him’ is a thought, not a scene", () => {
    expect(run("Anakin covers his face as he tries to swallow down the nausea that comes with the thought that he had apparently decided to just go ahead and fuck Obi-Wan.").anal).toEqual([]);
  });
  it("a tongue-and-lips span does not cross into the next clause: Obi-Wan’s lips, then Anakin dragging teeth along Obi-Wan’s shaft", () => {
    const r = run("“So good for me,” Obi-Wan hisses, a curse falling from his lips when Anakin carefully drags teeth along his shaft.");
    expect(r.via(/^tongue-on-cock-area/)).toBe(false);
    expect(r.blow).toEqual(["Obi>Anakin"]);
  });
  it("oral phrasings that were missed: kisses up the shaft, swallows what he can, sucked cock, fits it in his mouth, guided down on his cock", () => {
    expect(run("He kisses his way up the shaft, taking hold of Obi-Wan’s cock and licking the liquid from its tip.").blow).toEqual(["Obi>Anakin"]);
    expect(run("He swallows down what he can of Obi-Wan’s length.").blow).toEqual(["Obi>Anakin"]);
    expect(run("It has been a while since Anakin sucked cock, but the rhythm comes back.").blow).toEqual(["Obi>Anakin"]);
    expect(run("Anakin can fit most of it in his mouth without choking.").blow).toEqual(["Obi>Anakin"]);
    expect(run("He guides Anakin further down on his cock than Anakin might prefer.").blow).toEqual(["Obi>Anakin"]);
  });
  it("‘he turns his head to mouth at the base of Obi-Wan’s cock’: he is the other one", () => {
    expect(run("Anakin hesitates. So instead he turns his head just enough to mouth gently at the base of Obi-Wan’s cock.").blow).toEqual(["Obi>Anakin"]);
  });
  it("hand and hip acts that were missed", () => {
    expect(run("Anakin gasps when the man reaches down past the band of his pants, drawing his cock out and stroking it.").via(/^dd4-hj-reaches-past-waistband/)).toBe(true);
    expect(run("Obi-Wan drags Anakin’s body closer and grinds their hips together.").via(/^dd4-frot-grind-hips-together/)).toBe(true);
  });
  it("‘residual soreness from deepthroating’ and ‘he liked being told to suck cock’ are not scenes", () => {
    expect(run("Anakin was clearing his throat of the soreness from deepthroating.").blow).toEqual([]);
    expect(run("He liked calling Obi-Wan sir and being told to get on his knees and suck cock as a thank you for dinner.").blow).toEqual([]);
    expect(run("Anakin got on his knees and sucked cock.").blow).toEqual(["Obi>Anakin"]);
  });
  it("a want or need before ‘X inside him’ is a wish, not a scene", () => {
    expect(run("He needs Obi-Wan inside him, and he needs him now.").anal).toEqual([]);
    expect(run("Obi-Wan was inside him, buried to the hilt.").anal).toEqual(["Obi>Anakin"]);
  });
  it("the person feeling ‘the man’s erection’ is the man’s partner", () => {
    const r = run("He can feel the hard line of the man’s erection through both of their pants as it grinds against his ass and struggles with the urge to rock back into the contact.");
    expect(r.hits.some((h) => /^thrust-back/.test(h.via) && h.a.startsWith("Obi"))).toBe(false);
  });
  it("‘no need to fuck him’, ‘being able to fuck him’ and ‘what it means to suck him’ are not scenes; a lips-to-cock span may still cross ‘as he worked’", () => {
    expect(run("There’s no frantic need to fuck into Anakin or perform some hard scene.").anal).toEqual([]);
    expect(run("He focuses on being able to fuck Anakin good.").anal).toEqual([]);
    expect(run("Obi-Wan’s tongue moved in all the right places and the heat of his mouth made Anakin moan, which Obi-Wan echoed as he worked around his cock.").blow.length).toBeGreaterThan(0);
  });
});
