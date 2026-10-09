// @vitest-environment jsdom
import { expect, it } from "vitest";
import { emptyMeta } from "../src/ao3";
import { analyzeWithPatterns, type AuditHit } from "../src/heuristic";

// Invented adult partners; no source passages are copied.
const meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] };
const run = (text: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns("Morgan and Rowan were adult lovers. Morgan kissed Rowan, naked and aroused.\n\n" + text, meta, { quiet: true, audit: h => hits.push(h) });
  return hits.filter(h => h.via.startsWith("dialogue:"));
};
const speaker = (text: string, via: string) => run(text).filter(h => h.via === via).map(h => h.a);

it("keeps a tagged speaker after the listener hums and the speaker physically reacts", () => {
  expect(speaker('“Nearly there,” Morgan rasps. Rowan hums in response, and Morgan’s hips shake with the vibration. “I will come down your throat.”', "dialogue:blowjob")).toEqual(["Morgan Vale"]);
});
it("keeps a tagged speaker after a listener's perception of the speaker's touch", () => {
  expect(speaker('“Lovely,” Morgan pants. He cannot help the sound he makes at the praise. “You look wonderful.” Morgan’s fingers trail across his belly. He feels Morgan’s hand settle at his throat. “I want to fuck you.”', "dialogue:anal sex")).toEqual(["Morgan Vale"]);
});
it("attributes speech to the performer rather than a named listener reacting as he acts", () => {
  expect(speaker('Morgan cups Rowan’s face. “Stay with me.”\n\nRowan chokes on a moan as Morgan sucks his cock. “I could milk your pretty cock all evening.”', "dialogue:checking out a cock")).toEqual(["Morgan Vale", "Morgan Vale"]);
});
it("respects a new named speech tag after a reaction", () => {
  expect(speaker('“Nearly there,” Morgan rasps. Rowan hums in response. “I want you to fuck me,” Rowan says.', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("respects a new pronoun speech tag attached to the listener's reaction", () => {
  expect(speaker('“Nearly there,” Morgan rasps. Rowan shivers at the praise. “I want you to fuck me,” he says.', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("keeps an independently acting new speaker", () => {
  expect(speaker('“Wait,” Morgan says. Rowan stands up. Rowan pulls Morgan close. “I want to fuck you.”', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("does not force a listener who reacts and then speaks to be the performer", () => {
  expect(speaker('Rowan shivers as Morgan strokes his cock. “I want you to fuck me,” Rowan whispers.', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("does not treat a listener's isolated reaction as proof the previous speaker continues", () => {
  expect(speaker('“Wait,” Morgan says. Rowan shivers. “I want you to fuck me.”', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("does not choose a performer from a reaction alone without an established voice", () => {
  expect(speaker('Rowan shivers as Morgan strokes his cock. “I want you to fuck me.”', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("does not carry a stale voice past an intervening paragraph", () => {
  expect(speaker('“Stay here,” Morgan says.\n\nRowan sits down beside him.\n\nRowan shivers as Morgan strokes his cock. “I want you to fuck me.”', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
it("allows the reacting partner to request an act despite the preceding paragraph's speaker", () => {
  expect(speaker('“Stay here,” Morgan says.\n\nRowan shivers as Morgan strokes his cock. “I want you to fuck me.”', "dialogue:anal sex")).toEqual(["Rowan Marsh"]);
});
