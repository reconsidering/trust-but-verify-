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
  return { hits, via, anal: inst("anal"), blow: inst("blowjob") };
};

describe("round 82: jacks, tricks-of-the-trade and steady-eddie", () => {
  it("hand acts the benchmark showed were missed", () => {
    expect(run("Steve took Eddie back into his hand, pumping slowly.").via(/^dd2-hj-took-in-hand/)).toBe(true);
    expect(run("Eddie lazily stroked Steve inside his underwear, going nowhere near the pace Steve wanted.").via(/^dd2-hj-through-clothes/)).toBe(true);
    expect(run("Steve's thumb rubbed over the slit of Eddie's cock.").via(/^dd2-hj-thumb-over-head/)).toBe(true);
    expect(run("Eddie rolled his hips against Steve's ass, grinning.").via(/^dd2-frot-rolled-hips/)).toBe(true);
    expect(run("Steve pressed his knee into Eddie's groin and Eddie groaned.").via(/^dd2-frot-knee-groin/)).toBe(true);
  });
  it("mouth, finger and anal acts the benchmark showed were missed", () => {
    expect(run("Steve was cut off by Eddie licking a long, slow strip up his length.").blow).toEqual(["Steve>Eddie"]);
    expect(run("Eddie's hand wrapped around Steve before taking him into his mouth.").blow).toEqual(["Steve>Eddie"]);
    expect(run("Steve shoved a finger into Eddie's ass and Eddie keened.").via(/^dd2-finger-shoved-into/)).toBe(true);
    expect(run("Eddie pulled out of Steve slowly, careful not to hurt him.").anal).toEqual(["Eddie>Steve"]);
  });
  it("a hand wrapped round a cock is a handjob, not an anal touch cue", () => {
    const r = run("Eddie, grinning, finally slid his hand inside Steve's boxers, wrapping around his dick.");
    expect(r.via(/^hj-hand-in-pants/)).toBe(true);
    expect(r.via(/^hand-in-pants(?!-)|^hand-in-pants~/)).toBe(false);
  });
  it("a distant “if” does not hide a handjob that is actually happening", () => {
    expect(run("Eddie, knowing if he went on like this he might drive Steve insane, finally slid his hand into Steve's boxers.").via(/^hj-hand-in-pants/)).toBe(true);
  });
  it("things that look like acts but are not", () => {
    expect(run("Steve shushed Eddie, a finger pressed to his lips.").via(/^fingers-in-out-mouth/)).toBe(false);
    expect(run("At the last second Eddie dropped to his knees, the thug off balance from his unexpected miss.").via(/^sinks-to-floor/)).toBe(false);
    expect(run("Eddie pulled his lips off of Steve just enough to say, “Yes?” before going back to his neck.").via(/^mouth-off/)).toBe(false);
    expect(run("Steve responded with grunts and attempts to touch himself, but his wrists were held.").via(/^mast-himself/)).toBe(false);
    expect(run("Eddie cupped Steve's red ass in his palms, soothing the skin.").via(/^grab-ass/)).toBe(false);
    expect(run("Steve was sore and his whole ass felt like it was on fire after the spanking.").via(/^body-sore/)).toBe(false);
    expect(run("Steve dropped a hand between Eddie's legs and sucked at the junction of his neck and shoulder.").via(/^between-thighs-licked/)).toBe(false);
  });
  it("a plain smack on the ass is still a top cue", () => {
    expect(run("Eddie smacked Steve's ass and Steve jolted.").via(/^grab-ass/)).toBe(true);
  });
  it("“Your dick is mine” is possession, not an oral cue", () => {
    expect(run("“No touching. Your dick is mine today,” Eddie said.").hits.some((h) => /^dialogue:checking out a cock/.test(h.via))).toBe(false);
  });
});
