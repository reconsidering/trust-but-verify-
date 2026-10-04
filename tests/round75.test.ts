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
