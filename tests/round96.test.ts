// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Instrument continuity: the finger or toy belongs to the action it was used in, and stops at withdrawal, replacement or a change of people. Adult paraphrases.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] } as Ao3Meta;
const lead = "Morgan and Rowan are adult men. Morgan kissed Rowan, naked and hard, hands on his hips. Rowan moaned into the kiss. ".repeat(3) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  // acts in paragraph i of the test text (the lead is paragraph 0)
  const at = (i: number) => hits.filter((h) => h.kind === "act" && h.cat === "anal" && h.para === i).map((h) => `${h.act}:${h.a.split(" ")[0]}>${(h.b ?? "").split(" ")[0]}`);
  return { at };
};

describe("round 96: instrument continuity", () => {
  it("fingers, then a penis: the push after the fingers are out is anal sex, not fingering", () => {
    const r = run("Morgan worked two slick fingers into Rowan until he was loose and pliant.||Morgan pulled his fingers out, rolled on a condom and pushed in slowly, groaning at the heat.");
    expect(r.at(2).some((x) => x.startsWith("anal sex"))).toBe(true);
    expect(r.at(2).some((x) => x.startsWith("fingering"))).toBe(false);
  });
  it("a toy, then a penis: the push after the toy is out is anal sex, not a toy", () => {
    const r = run("Morgan eased the plug into Rowan and left it there while they kissed.||Morgan took the plug out, lined himself up and pushed inside Rowan with a groan.");
    expect(r.at(2).some((x) => x.startsWith("anal sex") && !x.includes("toy"))).toBe(true);
    expect(r.at(2).some((x) => x.includes("toy"))).toBe(false);
  });
  it("a penis, then a toy: the toy push is a toy act", () => {
    const r = run("Morgan fucked Rowan slowly, then pulled out and reached for the dildo.||Morgan slicked it and pushed it into Rowan, watching him take it.");
    expect(r.at(2).some((x) => x.includes("toy"))).toBe(true);
  });
  it("fingers in hair or at the mouth do not turn a penis thrust into fingering", () => {
    expect(run("Morgan pushed inside Rowan, his fingers tangled in Rowan’s hair, and Rowan gasped.").at(1).some((x) => x.startsWith("fingering"))).toBe(false);
    expect(run("Morgan slid his fingers over Rowan’s lips, then thrust into him hard with his cock.").at(1).some((x) => x.startsWith("fingering"))).toBe(false);
  });
  it("fingers in one person while the other is sucked: both acts survive, each with its own people", () => {
    const r = run("Morgan sucked Rowan’s cock while working two fingers into him, slow and deep.");
    expect(r.at(1).some((x) => x.startsWith("fingering") && x.endsWith("Morgan>Rowan"))).toBe(true);
  });
  it("a new person ends the carried instrument", () => {
    const r = run("Morgan worked two slick fingers into Rowan.||Rowan pushed Morgan down, straddled him and pushed inside, fucking himself on Morgan’s cock.");
    expect(r.at(2).some((x) => x.startsWith("fingering"))).toBe(false);
  });
});

describe("round 96: who performs it", () => {
  it("a spoken command does not make the speaker the performer: ‘He obeyed’ is the one told", () => {
    const hits: AuditHit[] = [];
    analyzeWithPatterns(lead + ["Rowan fumbled with the screen and set the phone beside him. Morgan’s voice filled the room, disembodied and commanding.", "“Get the dildo,” Morgan said. “I want to hear you ride it.”", "“Yes.” Rowan’s hand trembled as he slicked the toy.", "“Good. Now sit down on it. Slowly,” Morgan said.", "He obeyed, lowering himself onto the dildo with a shaky breath."].join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
    const mine = hits.filter((h) => h.para === 5 && /toy|himself/.test(h.act));
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((h) => h.a.startsWith("Rowan"))).toBe(true);
  });
  it("a self-act is credited to the one man the sentence names, not to his partner from the line before", () => {
    const hits: AuditHit[] = [];
    analyzeWithPatterns(lead + ["It is the way Morgan is moving beneath him, with him, rocking as though he were the one being opened.", "It has been a year since they last did this, and Rowan is sloppy and uncoordinated as he scissors his fingers, trying to stretch himself quickly."].join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
    const solo = hits.filter((h) => h.para === 2 && h.kind === "solo" && /himself/.test(h.act));
    expect(solo.length).toBeGreaterThan(0);
    expect(solo.every((h) => h.a.startsWith("Rowan"))).toBe(true);
  });
});
