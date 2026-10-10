// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Readings the owner and reviewers marked wrong on the verb patterns (push-into, pushed-in, fuck) and on collar-wearer; every sentence is paraphrased.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Rhys Calder/Theo Marsh"], characters: ["Rhys Calder", "Theo Marsh"], freeform: [] } as Ao3Meta;
const lead = "Rhys kissed Theo, naked and hard, hands on his hips. Theo moaned into the kiss. ".repeat(4) + "\n\n";
const run = (t: string, withLead = true) => {
  const hits: AuditHit[] = [];
  analyzeWithPatterns((withLead ? lead : "") + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  return { acts: (re: RegExp) => hits.filter((h) => re.test(h.via)).map((h) => `${h.act}:${h.kind}`) };
};

describe("round 94: verb patterns and collars", () => {
  it("‘snapped in two’ is a break, not a push", () => {
    expect(run("Whatever hope Theo had left inside of him snapped in two, and it was not a clean break.").acts(/^pushed-in/)).toEqual([]);
  });
  it("sinking into a bath up to the chin is not a penetration", () => {
    expect(run("Rhys propped his feet on the rim and sank in up to his chin, dissolving in the heat of the water.").acts(/^pushed-in/)).toEqual([]);
  });
  it("sliding back inside a car or pushing inside a door is walking in", () => {
    expect(run("When Rhys finally reached the old Chevy and slid back inside, the heater blasting against his frozen cheeks, the clock read half past one.").acts(/^pushed-in/)).toEqual([]);
    expect(run("Rhys unlocked it and pushed inside, stepping aside so Theo could enter first.").acts(/^pushed-in/)).toEqual([]);
  });
  it("pressing in so that two chests touch is a hug", () => {
    expect(run("Theo pulled off his own shirt, too, and Rhys immediately pressed in again, shoving their chests together.").acts(/^pushed-in/)).toEqual([]);
  });
  it("a stranger shoving into someone in the street is not sex", () => {
    expect(run("Since the news broke he could not go anywhere without someone glowering at him, shoving into him as they passed on the street.").acts(/^push-into/)).toEqual([]);
  });
  it("a thumb pulled out and then a cock driven in is anal sex, not fingering", () => {
    const a = run("Rhys was moving at last, sliding his thumb out and ramming into Theo with his cock in one hard stroke.").acts(/^push-into|^fuck|^ram/);
    expect(a.some((x) => x.startsWith("fingering"))).toBe(false);
  });
  it("a shirt collar or a leash on a dog is not a kink collar", () => {
    expect(run("Rhys kissed up the side of Theo’s throat, down to where his shoulder met the frayed collar of his sweatshirt.").acts(/^collar-wearer/)).toEqual([]);
    expect(run("The blush was spreading down Theo’s collar now, his stammer thickening.").acts(/^collar-wearer/)).toEqual([]);
    expect(run("Rhys straightened the collar of Theo’s coat, his knuckles brushing his skin.").acts(/^collar-wearer/)).toEqual([]);
    expect(run("The father held a leash they had brought from home, new and bright red, and Rhys knelt to greet the puppy.").acts(/^collar-wearer/)).toEqual([]);
  });
});
