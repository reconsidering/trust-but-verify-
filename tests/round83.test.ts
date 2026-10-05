// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}`);
  const via = (re: RegExp) => hits.some((h) => re.test(h.via));
  return { hits, via, anal: inst("anal"), blow: inst("blowjob"), rim: inst("rimming") };
};

describe("round 83: rimming, anal and oral accuracy", () => {
  it("rimming phrased without ‘his hole’ right after the verb", () => {
    expect(run("Eddie licks a teasing circle around that fluttering rim.").rim).toEqual(["Eddie>Steve"]);
    expect(run("Eddie licks the rim, then pushes his tongue in.").via(/^dd3-licks-the-rim/)).toBe(true);
    expect(run("Steve gasped as Eddie's tongue swept over his hole.").rim).toEqual(["Eddie>Steve"]);
    expect(run("Eddie penetrated Steve's leaking hole with his tongue.").via(/^dd3-penetrates-with-tongue/)).toBe(true);
    expect(run("Eddie pressed his mouth back to Steve's hole, groaning.").via(/^dd3-mouth-to-hole/)).toBe(true);
    expect(run("Eddie licked between Steve's cheeks, slow and wet.").via(/^dd3-licks-between-cheeks/)).toBe(true);
    expect(run("It's Eddie, licking at his hole like he wants nothing else.").via(/^dd3-appositive-licking/)).toBe(true);
  });
  it("a finger, plug or cock at the rim is not rimming", () => {
    expect(run("Eddie circled his finger around Steve's rim, teasing.").rim).toEqual([]);
    expect(run("Eddie teased the plug against Steve's hole.").rim).toEqual([]);
    expect(run("Eddie's eyes were red-rimmed and tired.").rim).toEqual([]);
  });
  it("rubbing a rim while sucking, and thrusting into a fist, are not rimming or anal sex", () => {
    expect(run("Eddie took the head of his cock back into his mouth, suckling hard as he rubbed firmly over Steve's rim.").rim).toEqual([]);
    expect(run("He picked up the pace of his thrusts and his fist, working Steve over.").anal).toEqual([]);
  });
  it("a stray opening quote typed where a closing one belongs does not hide the narration", () => {
    expect(run("“Wh—“ the air left Steve's lungs when Eddie slipped a tongue over Steve's hole.").rim).toEqual(["Eddie>Steve"]);
  });
  it("anal and finger acts phrased with ‘thrusts get deeper’, impaling, spend at the entrance", () => {
    expect(run("Eddie's thrusts somehow got deeper and Steve's head went fuzzy.").via(/^dd3-thrusts-deeper/)).toBe(true);
    expect(run("Eddie yanked Steve's thighs back and impaled Steve once more.").via(/^dd3-impaling/)).toBe(true);
    expect(run("Eddie's own spend frothed at Steve's entrance as he pulled back.").via(/^dd3-spend-at-entrance/)).toBe(true);
    expect(run("Eddie pressed with one finger and quickly slipped a second.").via(/^dd3-slipping-second/)).toBe(true);
    expect(run("Eddie stroked Steve in time with his own heartbeat.").via(/^dd3-hj-strokes-in-time/)).toBe(true);
    expect(run("Steve dragged his tongue and cheek along the side of Eddie's prick.").blow).toEqual(["Eddie>Steve"]);
  });
  it("a surrounding oral scene does not turn a line about a knot or an ass into an oral cue", () => {
    const r = run("Steve sucked Eddie's cock, swallowing around him.||“I don't know if I can even knot you,” Eddie said.");
    expect(r.hits.filter((h) => /^dialogue:blowjob/.test(h.via) && /knot/.test(String(h.sentence)))).toEqual([]);
    const k = run("Steve sucked Eddie's cock, swallowing around him.||“You're so tight, I could fuck you all night,” Eddie said.");
    expect(k.hits.filter((h) => /^dialogue:blowjob/.test(h.via))).toEqual([]);
  });
  it("a feeling ‘buried deep inside him’ is not a cock", () => {
    expect(run("Steve wanted him close, if only Steve could find the courage, buried deep inside him.").hits.some((h) => /^(?:push-into|inside)/.test(h.via))).toBe(false);
    expect(run("Eddie was buried deep inside him, groaning.").anal).toEqual(["Eddie>Steve"]);
  });
});
