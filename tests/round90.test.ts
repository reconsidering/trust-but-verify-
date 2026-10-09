// @vitest-environment jsdom
import { expect, it } from "vitest";
import { emptyMeta } from "../src/ao3";
import { analyzeWithPatterns, type AuditHit } from "../src/heuristic";

// Round 90: A Spoonful of Sugar report. Invented adult partners; paraphrased, no source text.
const meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Morgan Vale/Rowan Marsh"], characters: ["Morgan Vale", "Rowan Marsh"], freeforms: [] };
const run = (text: string) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns("Morgan and Rowan were adult lovers. Morgan kissed Rowan, naked and aroused.\n\n" + text.split("||").join("\n\n"), meta, { quiet: true, audit: (h) => hits.push(h) });
  return (re: RegExp) => hits.filter((h) => re.test(h.via));
};

it("a man rocking back out of a mouth as he comes is not a bottom pushing back", () => {
  expect(run("Rowan chokes, and Morgan’s hand at the back of his head holds him still.||Just as he is about to panic, Morgan rocks back, spraying come. Rowan coughs and swallows what he can.")(/^thrust-back/)).toEqual([]);
});
it("a bottom pushing back onto a cock is still a hint", () => {
  expect(run("Rowan moans into the pillow and rocks back, hard and aching, onto Morgan’s cock.")(/^thrust-back/).length).toBeGreaterThan(0);
});
it("‘milk your pretty cock’ is something done to a cock, not a compliment on it", () => {
  expect(run("Rowan shivers as Morgan sucks his cock. “I could milk your pretty cock all night.”")(/^dialogue:checking out a cock/)).toEqual([]);
  expect(run("Rowan shivers as Morgan sucks his cock. “You have a pretty cock.”")(/^dialogue:checking out a cock/).length).toBeGreaterThan(0);
});
it("‘you don’t wanna be taken for a villain’ is not a request to be taken", () => {
  expect(run("Rowan rolls his eyes. “Hey, you don’t wanna be taken for a villain, maybe don’t act like one.”")(/^dialogue:anal sex/)).toEqual([]);
  expect(run("Rowan pulls him down. “I wanna be taken, Morgan, right now, in bed.”")(/^dialogue:anal sex/).length).toBeGreaterThan(0);
});
