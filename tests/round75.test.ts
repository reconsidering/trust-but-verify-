// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: ["Knotting", "Omegaverse Alpha Eddie Munson"] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t, META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
  return { hits, anal: inst("anal"), blow: inst("blowjob"), rim: inst("rimming") };
};

describe("round 75: acts the Sugar Alpha report showed were missed", () => {
  it("adjectives with commas and “and” before a hole do not hide a penetration", () => {
    expect(run("Eddie’s cock drives into Steve’s wet and aching hole.").anal).toEqual(["Eddie>Steve"]);
    expect(run("He rolled Steve onto his back and, with one thrust, entered Steve’s wet, messy hole.").anal).toEqual(["Eddie>Steve"]);
  });
  it("fingers as the subject, and thrusting forward to fill someone", () => {
    expect(run("Three fingers enter Steve’s hole.").anal.length).toBe(1);
    expect(run("Eddie thrusts forward, filling him in one fierce push that makes Steve cry out.").anal).toEqual(["Eddie>Steve"]);
  });
  it("a tongue teasing or buried in a hole is rimming", () => {
    expect(run("Eddie’s warm tongue teases the pucker of his rim.").rim).toEqual(["Eddie>Steve"]);
    expect(run("Eddie holds him tightly, keeping his tongue inside of Steve, not stopping until he wrings out every drop.").rim).toEqual(["Eddie>Steve"]);
  });
  it("a knot locked inside, the owner of a knot, being locked inside, and a cock pulsing inside", () => {
    expect(run("One moment the room is theirs alone with Eddie’s knot locked snug inside of Steve, and the next the visitor is at the foot of the bed.").anal).toEqual(["Eddie>Steve"]);
    expect(run("Eddie is locked inside him, filling him so completely it hurts.").anal).toEqual(["Eddie>Steve"]);
    expect(run("A rush of heat surges inside Steve as Eddie’s cock pulses and his cum gushes.").anal).toEqual(["Eddie>Steve"]);
    expect(run("With a wet, squelching sound, Eddie’s knot pops out in a gush of cum.").hits.some((h) => h.via === "knot-owner")).toBe(true);
  });
  it("thrusts that push someone along the bed, and moving over someone with every thrust deep", () => {
    expect(run("Eddie’s hips quicken, the force of his thrusts pushing Steve further up the bed.").anal).toEqual(["Eddie>Steve"]);
    expect(run("Eddie moves over him with unrelenting force, every thrust deep and deliberate.").anal).toEqual(["Eddie>Steve"]);
  });
  it("suck and swallow, and a cock softening in a mouth", () => {
    expect(run("Eddie draws the orgasm out of him, continuing to suck and swallow everything Steve gives him.").blow).toEqual(["Steve>Eddie"]);
    expect(run("Eddie holds him in place until Steve’s cock softens in his mouth, and even then he lingers, slowly sucking.").blow).toEqual(["Steve>Eddie"]);
  });
  it("a bare knot word in a necktie or a stomach is not a knot", () => {
    expect(run("Steve’s stomach was in knots, and he tugged at the knot of his tie.").hits.filter((h) => /knot/.test(h.via))).toEqual([]);
  });
});

describe("round 75b: a tongue inside someone's mouth is a kiss", () => {
  it("is not rimming when the paragraph is about mouths", () => {
    expect(run("Steve made urgent sounds against Eddie as the brutal man swept his tongue inside of him. Eddie sucked on Steve’s tongue as if it sustained him.").rim).toEqual([]);
  });
  it("is still rimming with a hole in the sentence", () => {
    expect(run("Eddie’s tongue swept inside of Steve’s tight hole, taking everything he could.").rim).toEqual(["Eddie>Steve"]);
  });
});

describe("round 75c: more Sugar Alpha forms", () => {
  const D = (t: string) => {
    const a = analyzeWithPatterns(lead + t, { ...META, characters: ["Derek Hale", "Stiles Stilinski"], relationships: ["Derek Hale/Stiles Stilinski"] }, { quiet: true });
    const p = a.pairings[0];
    const f = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
    return { anal: f("anal"), blow: f("blowjob") };
  };
  it("lining up at a hole is penetration by the one lining up", () => {
    expect(D("Derek lines himself up with Stiles’ hole, and the head of his cock makes Stiles roll his eyes back.").anal).toEqual(["Derek>Stiles"]);
  });
  it("thrusts and aim as a possessive subject", () => {
    expect(D("Derek’s thrusts grow sharper, each one grinding Stiles against the hard edge of the bench.").anal).toEqual(["Derek>Stiles"]);
    expect(D("Derek’s cock is the perfect size, targeting that toe-curling spot inside him with every thrust.").anal).toEqual(["Derek>Stiles"]);
  });
  it("a cock that never leaves the hole", () => {
    expect(D("Derek flips Stiles onto his hands and knees in one move, his cock never leaving Stiles’ hole.").anal).toEqual(["Derek>Stiles"]);
  });
  it("swallowing the tip of a cock", () => {
    expect(D("Stiles arched off the bed. Derek swallows the tip of Stiles’ soft cock, sucking on the last drops of his orgasm.").blow).toEqual(["Stiles>Derek"]);
  });
});

describe("round 75d: prostate and the spot", () => {
  const P = (t: string) => {
    const a = analyzeWithPatterns(lead + t, { ...META, characters: ["Derek Hale", "Stiles Stilinski"], relationships: ["Derek Hale/Stiles Stilinski"] }, { quiet: true });
    const p = a.pairings[0];
    return p.anal.instances.map((x) => `${x.act}:${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
  };
  it("finding the spot inside someone is penetration", () => {
    expect(P("Derek finds that spot deep inside Stiles and Stiles cries out.")).toEqual(["anal sex:Derek>Stiles"]);
  });
  it("fingers on the prostate are fingering by the finger’s owner", () => {
    expect(P("Derek’s fingers crook against Stiles’ prostate and Stiles shudders.")[0]).toMatch(/^fingering:Derek>Stiles/);
  });
  it("a cock dragging over the prostate is anal", () => {
    expect(P("Derek’s cock drags over Stiles’ prostate with every thrust.")[0]).toMatch(/^anal sex:Derek>Stiles/);
  });
  it("is not read from a doctor’s exam", () => {
    expect(P("The doctor said the prostate exam was routine and Stiles found that spot on the wall.")).toEqual([]);
  });
});

describe("progress reporting", () => {
  it("reports how far through the paragraphs the engine is, rising and below 1", () => {
    const seen: number[] = [];
    analyzeWithPatterns((lead + "Steve and Eddie talked.\n\n").repeat(30), META, { quiet: true, onProgress: (f) => seen.push(f) });
    expect(seen.length).toBeGreaterThan(1);
    expect(seen[0]).toBe(0);
    expect(seen.every((f, i) => f < 1 && (i === 0 || f >= seen[i - 1]))).toBe(true);
  });
});

describe("round 75e: something swallowing people up is not a blowjob", () => {
  it("water, darkness and the like swallowing someone whole", () => {
    const r = (t: string) => analyzeWithPatterns(lead + t, META, { quiet: true }).pairings[0].blowjob.instances.length;
    expect(r("Steve kept his eyes off the kids, as if the deep green water was going to swallow them whole, and Eddie (the little dick) just laughed.")).toBe(0);
    expect(r("The dark in the cellar looked ready to swallow a man whole, so Eddie stayed close to Steve.")).toBe(0);
  });
  it("still reads a person swallowing someone down", () => {
    const r = analyzeWithPatterns(lead + "Steve swallowed Eddie down to the root and Eddie shouted.", META, { quiet: true }).pairings[0].blowjob.instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
    expect(r).toEqual(["Eddie>Steve"]);
  });
});

describe("round 76: more anal acts the Strawberry Mama report showed were missed", () => {
  const M = { ...META, characters: ["Derek Hale", "Stiles Stilinski"], relationships: ["Derek Hale/Stiles Stilinski"], freeforms: ["Dom/sub"] };
  const A = (t: string) => {
    const a = analyzeWithPatterns(lead + t, M, { quiet: true });
    return a.pairings[0].anal.instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
  };
  it("driving a cock in and out, sliding to the hilt, giving thrusts, thrusts faltering", () => {
    expect(A("Derek looks wrecked, holding Stiles’ waist, hips rolling as he drives his cock in and out of him, slow and deep.")).toEqual(["Derek>Stiles"]);
    expect(A("Without warning, Stiles’ rim stretches and Derek slides to the hilt, filling Stiles up completely.")).toEqual(["Derek>Stiles"]);
    expect(A("Derek gives him a few lazy thrusts and then he rolls off Stiles with a sigh.")).toEqual(["Derek>Stiles"]);
    expect(A("It is almost a shame when Derek’s thrusts stutter to a halt and he swears into Stiles’ neck.")).toEqual(["Derek>Stiles"]);
  });
  it("the head of a cock battering the prostate, a body clenching around a length", () => {
    expect(A("One second Stiles is empty and the next Derek is shaking him like a doll, the head of his cock battering Stiles’ prostate without mercy.")).toEqual(["Derek>Stiles"]);
    expect(A("Stiles’ whole body seizes around the thick length of Derek’s cock and a wet sound escapes his throat.")).toEqual(["Derek>Stiles"]);
  });
  it("a rim gaping around emptiness, and a body for someone to fuck into", () => {
    expect(A("Derek’s cock slips out and Stiles’ rim gapes, clenching around the sudden emptiness.")).toEqual(["Derek>Stiles"]);
    expect(A("Derek starts moving again and Stiles lets himself be used, a soft and pliant body for Derek to fuck into.")).toEqual(["Derek>Stiles"]);
  });
  it("said during sex: come on my dick, fed dick, pregnant", () => {
    const via = (t: string) => {
      const hits: AuditHit[] = [];
      analyzeWithPatterns(lead + t, M, { quiet: true, audit: (h) => hits.push(h) });
      return hits.filter((h) => h.via.startsWith("dialogue")).map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`);
    };
    expect(via("“Make yourself come on my dick,” Derek said, his hands on Stiles’ hips.")).toContain("Derek>Stiles");
    expect(via("“A hole like yours should be fed dick every day,” Derek growled.")).toContain("Derek>Stiles");
    expect(via("“I’d get you fucking pregnant if I could,” Derek said, voice low.")).toContain("Derek>Stiles");
  });
  it("on the phone, the person who keeps talking is the speaker, not the one listening", () => {
    const text = "Stiles slid his fingers in alone on the bathroom floor, the phone on speaker.\n\n“That right? Can’t find your sweet spot by yourself?” Derek asked.\n\nStiles shook his head. “No.”\n\n“You were made to be fucked.” The breath left Stiles’ lungs but Derek still wasn’t done. “A hole like yours should be fed dick every day.” His voice was a rolling purr.";
    const a = analyzeWithPatterns(lead + text, M, { quiet: true });
    expect(a.pairings[0].anal.instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`)).not.toContain("Stiles>Derek");
  });
  it("a person’s own fingers grazing their own prostate say nothing about a partner", () => {
    expect(A("Stiles pumped his fingers faster, the tip of his digits grazing his prostate.")).toEqual([]);
  });
});

describe("round 77: the dumbassery report (a shared surname, and everyday actions)", () => {
  const SPN: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Supernatural"], relationships: ["Castiel/Dean Winchester"], characters: ["Dean Winchester", "Castiel", "Claire Novak", "Sam Winchester"], freeforms: [] };
  const spnLead = "Dean and Cas were in bed, naked and kissing, hard and aching. Cas kissed Dean. Dean kissed Cas back, moaning. ".repeat(5) + "\n\n";
  const hitsOf = (t: string) => {
    const hits: AuditHit[] = [];
    const a = analyzeWithPatterns(spnLead + t, SPN, { quiet: true, audit: (h) => hits.push(h) });
    return { a, hits };
  };
  it("Castiel is not swallowed by Claire Novak (whose surname is one of his nicknames)", () => {
    const { a } = hitsOf("Claire waved from the car and told Sam to hurry. Cas rides Dean on the couch hard enough to make the recliner spring out, and Dean sprawls backwards. Claire honked.\n\n".repeat(3));
    expect(a.pairings.map((p) => p.pairing)).toEqual(["Castiel/Dean Winchester"]);
    const who = new Set(a.pairings[0].anal.instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`));
    expect([...who]).toEqual(["Dean>Castiel"]);
  });
  it("fingers brushing over a coffee cup are not a touch at a hole", () => {
    expect(hitsOf("Dean offers Cas the coffee. Their fingers brush when Cas takes it, and Dean’s heart turns over.").hits.filter((h) => h.via === "finger-at-entrance")).toEqual([]);
    expect(hitsOf("Dean’s finger traces Cas’ hole, tapping against the entrance.").hits.some((h) => h.via === "finger-at-entrance")).toBe(true);
  });
  it("slipping in and out of sleeves is not penetration", () => {
    expect(hitsOf("“You just want to fuck,” Dean says, running his fingers up and down Cas’ wrists, slipping in and out of his sleeves.").a.pairings[0].anal.instances.length).toBe(0);
  });
  it("a face pressed against a shoulder to hide a closed mouth is not a head pushed down", () => {
    expect(hitsOf("He still presses his face down against Cas’ shoulder, blocking his closed mouth in case anything tries to escape.").hits.filter((h) => h.via === "pushed-head-down")).toEqual([]);
  });
  it("opening himself up emotionally is not fingering", () => {
    expect(hitsOf("How does he open himself up and expose the kid to something like this?").hits.filter((h) => h.via === "self-finger")).toEqual([]);
    expect(hitsOf("Dean fingered himself open with slick fingers, breathing hard.").hits.some((h) => h.via === "self-finger")).toBe(true);
  });
});
