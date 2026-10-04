// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";
import { canonEpithet } from "../src/heuristic/epithets";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const d = (k: "anal" | "blowjob" | "rimming") => p[k].desires.map((x) => `${x.who.split(" ")[0]}:${x.role}:${x.kind}:${x.via}`);
  const i = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${x.top.split(" ")[0]}>${x.bottom.split(" ")[0]}:${x.via}`);
  return { hits, p, anal: d("anal"), blow: d("blowjob"), analI: i("anal"), blowI: i("blowjob"), rimI: i("rimming") };
};

describe("round 74: report fixes (Pact of Ice and Fire)", () => {
  it("a bare “need to be fucked” in a line that goes on to say you need is about the listener", () => {
    const r = run("“I think you need to be filled,” Eddie murmured, quickening his fist. “Need to be fucked hard…think you need to be pleasured, too. To learn pleasure.” Eddie cupped Steve’s sac.");
    expect(r.anal.some((x) => x.startsWith("Eddie:top:said"))).toBe(true);
    expect(r.anal.some((x) => x.startsWith("Eddie:bottom:said"))).toBe(false);
  });
  it("a short call-out, its bare tag, then the same voice goes on", () => {
    const r = run("Eddie worked a finger in and out, slow and careful, but Steve soon grew impatient. He broke their kiss and pressed hard into Eddie’s hand. “Eddie,” he said quietly. “Stop treating me like a maiden and fuck me.”");
    expect(r.anal.some((x) => x.startsWith("Steve:bottom:said"))).toBe(true);
    expect(r.anal.some((x) => x.startsWith("Eddie:bottom:said"))).toBe(false);
  });
  it("“you’re so big” over two cocks held together is frottage, not anal sex", () => {
    const r = run("Steve leaned his forehead against Eddie’s, gathering their cocks between his palms. He peered down at where they were pressed together and was suddenly shy. “You’re so big,” he muttered, half in awe.");
    expect(r.anal.some((x) => x.includes("dialogue:anal sex"))).toBe(false);
  });
  it("rocking back onto a tongue is rimming, not a hint of anal sex or a blowjob", () => {
    const r = run("Eddie’s tongue delved deeper, licking into Steve and begging the pucker to relax.||Steve rocked back into Eddie’s mouth, unable to be still, and the tongue licked into him with every stroke.");
    expect(r.anal.some((x) => x.includes("thrust-back"))).toBe(false);
    expect(r.blowI.concat(r.blow).some((x) => x.includes("fucked-mouth"))).toBe(false);
  });
  it("“as though he hasn’t just been fucked” is the author pretending, so he has been", () => {
    const r = run("Eddie rolled him onto his back and covered him, pressing a deep, filthy kiss into Steve’s mouth as Steve accepted it greedily, as though he hasn’t just been fucked into a new realm.");
    expect(r.hits.some((h) => h.via.startsWith("passive-fucked") && h.kind === "act")).toBe(true);
  });
  it("“Mayhaps they’d be mid-fuck” is a what-if", () => {
    const r = run("Mayhaps they’d have reached an inn by now. Mayhaps they’d be mid-fuck; Eddie’s cock nestled in Steve’s warm hole, their mouths pressed together.");
    expect(r.analI).toEqual([]);
  });
  it("a pronoun line that reverses the last two paragraphs’ act is the pronoun losing track", () => {
    const r = run("Eddie bottomed out slowly in Steve, who clenched around him and trembled.||He laved his tongue over Steve’s collarbone while he pushed the head of his aching cock deeper into the tight ring of muscle, holding his palm over Steve’s belly.");
    expect(r.analI.some((x) => x.startsWith("Steve>Eddie"))).toBe(false);
  });
  it("a hole that flutters belongs to the one being fingered, not the one fingering", () => {
    const r = run("Eddie realized as he sank his finger in deeper that there was nothing he wanted more.||“How long since you’ve done this?” Eddie asked quietly. He assumed Steve had at least explored, yet with the way his hole fluttered so beautifully against the intrusion of a single finger, well.");
    expect(r.anal.some((x) => x.startsWith("Eddie:bottom") && x.includes("body-hole-ache"))).toBe(false);
  });
  it("small guards: finger in a mouth, a tongue opening him, preparing for war, waves, a comparison, squeezing through a gap", () => {
    const r = run("Eddie slipped a finger between Steve’s lips and pulled his mouth open.||Eddie licked into Steve’s body like it was as wet as a cunt, humming as he worked the boy open.||They all wanted to protect him, to prepare him for war to come.||The water rippled, lapping at the tip of Eddie’s cock.||The sky flushed as pink as Steve’s cheeks do when Eddie has Steve’s cock in his mouth.||There was a part so narrow that Eddie had to strip his cloak and squeeze himself sideways.");
    expect(r.analI.filter((x) => /adds-finger|stretched-open/.test(x))).toEqual([]);
    expect(r.hits.some((h) => /^licked-cock/.test(h.via) || /^had-cock-in-mouth/.test(h.via))).toBe(false);
    expect(r.p.solo?.occurs ?? false).toBe(false);
  });
  it("doesn’t hesitate and doesn’t resist the temptation mean he does", () => {
    const r = run("Eddie sat up higher in the water, holding the base of his cock, and Steve didn’t hesitate to slide down and suck him into his mouth.");
    expect(r.blow.some((x) => x.includes("false"))).toBe(false);
    expect(r.blowI.length + r.hits.filter((h) => h.cat === "oral" && h.kind === "act").length).toBeGreaterThan(0);
  });
  it("“his desire to fuck into Steve’s body is too strong to delay” leans Eddie top", () => {
    const r = run("The sex grew rougher, until Eddie’s desire to fuck into Steve’s body was too strong to delay any longer.");
    expect(r.hits.some((h) => h.via === "desire-to-fuck-into" && h.a.startsWith("Eddie"))).toBe(true);
  });
  it("“northern” and “southern” are regions, not nationalities that pick one of two people", () => {
    expect(canonEpithet("the northern lord").keys.some((k) => k === "nat:northern")).toBe(false);
  });
  it("“than he’d imagined” is not a fantasy", () => {
    const r = run("The need to possess him burned hotter than he’d imagined possible.||Steve slid down and wrapped his mouth around Eddie’s cock, sucking him deep.");
    expect(r.blowI.length).toBeGreaterThan(0);
  });
});
