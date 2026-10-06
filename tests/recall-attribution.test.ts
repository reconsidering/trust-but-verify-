import { describe, expect, it } from "vitest";
import { emptyMeta, type Ao3Meta } from "../src/ao3";
import { analyzeWithPatterns, type AuditHit } from "../src/heuristic";

// Invented adult characters; these examples cover act selection and attribution, not fic wording.
const meta: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], characters: ["Alex Vale", "Sam Reed", "Lee Park"], relationships: ["Alex Vale/Sam Reed", "Alex Vale/Lee Park", "Sam Reed/Lee Park"] };
const lead = "Alex, Sam and Lee were adults. Alex kissed Sam in bed. They were naked and aroused. Sam kissed Alex back.\n\n";
const run = (text: string) => {
  const hits: AuditHit[] = [];
  const result = analyzeWithPatterns(lead + text.replaceAll("||", "\n\n"), meta, { quiet: true, audit: (h) => hits.push(h) });
  return { hits: hits.filter((h) => h.para >= 1), result };
};
const acts = (text: string, act: string) => run(text).hits.filter((h) => h.kind === "act" && h.act.startsWith(act)).map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`);

describe("recall with explicit body-part evidence", () => {
  it("recognizes a grip around both cocks as mutual manual stimulation", () => {
    const r = run("Sam leans toward Alex and wraps his fingers around both their cocks, stroking them together.");
    expect(r.hits.some((h) => h.kind === "handjob" && h.act === "mutual handjob" && h.a === "Sam Reed" && h.b === "Alex Vale")).toBe(true);
  });
  it("recognizes a spit-slick finger past a rim", () => {
    expect(acts("Alex leans over Sam. Sam sinks a spit-slick finger past Alex's rim.", "fingering")).toContain("Sam>Alex");
  });
  it("recognizes a named finger dipping past the ring of a rim", () => {
    expect(acts("Sam's index finger dips just past the tight ring of Alex's rim.", "fingering")).toContain("Sam>Alex");
  });
  it("recognizes a mouth making contact with a named rim", () => {
    expect(acts("When Sam's mouth makes contact with Alex's rim, Lee watches quietly.", "rimming")).toContain("Sam>Alex");
  });
  it("recognizes a named finger still buried inside despite an intervening aside", () => {
    expect(acts("Sam notices Lee's finger, still buried in the warmth of Alex's ass.", "fingering")).toContain("Lee>Alex");
  });
  it("does not infer penetration from fingers touching a lip or an ordinary ring", () => {
    expect(acts("Sam presses a second finger to Alex's lip.", "fingering")).toEqual([]);
    expect(acts("Sam's index finger dips past the ring on Alex's hand.", "fingering")).toEqual([]);
  });
});

describe("person selection in a three-adult scene", () => {
  it("uses the controlling subject as the mouth owner when he lets a named shaft fill his throat", () => {
    expect(acts("Alex keeps Sam's gaze as he kneels, letting Lee's shaft fill his throat.", "blowjob")).toContain("Lee>Alex");
    expect(acts("Alex keeps Sam's gaze as he kneels, letting Lee's shaft fill Sam's throat.", "blowjob")).toContain("Lee>Sam");
  });
  it("attributes a following he to the owner of a breath that catches", () => {
    expect(acts("Alex hears Sam's breath catch when he pushes his middle finger past Alex's rim.", "fingering")).toContain("Sam>Alex");
  });
  it("keeps the observed hand's owner through a following hearing fragment", () => {
    const r = run("Alex sees Lee's hand reach for a towel. Hears the sound of his mouth leaving Sam's cock as he jerks Sam's cock.");
    expect(r.hits.filter((h) => h.kind === "handjob").map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toContain("Lee>Sam");
  });
  it("keeps the established penetrating actor when a third person's hand moves onto his back", () => {
    const r = acts("Lee thrusts into Alex.||Sam's hand settles on Lee's back while he moves. His body trembles but he keeps going, thrusting into Alex.", "anal sex");
    expect(r).toContain("Lee>Alex");
    expect(r).not.toContain("Sam>Alex");
  });
  it("keeps the named entering actor through a following cock-inside fragment", () => {
    expect(acts("Lee thrusts into Alex.||Sam's hand rests on Lee's back while he moves. He thrusts into Alex.||Alex makes a sound when Lee angles into him again. Pulling back, his cock is inside his channel.", "anal sex")).not.toContain("Sam>Lee");
    const hits = run("Alex makes a sound when Lee angles into him again. Pulling back, his cock is inside his channel.").hits.filter((h) => h.via === "penis-inside");
    expect(hits.map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toEqual(["Lee>Alex"]);
  });
  it("carries an explicitly named requester's hand through permission", () => {
    const r = run('Sam reaches out, wondering before touching, “May I?”||“Yeah,” Alex answers. The instant he has his hand around Alex\'s cock, Lee watches.');
    const hits = r.hits.filter((h) => h.via === "dd2-hj-hand-to-dick");
    expect(hits.map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toEqual(["Sam>Alex"]);
    expect(hits[0].attribution?.top).toBe("rule");
  });
  it("uses the explicitly named kissing respondent instead of the last sexual partner", () => {
    const r = run('Sam thrusts into Alex.||Lee leans down to kiss Alex.||Alex asks, “You wanna fuck my mouth?”||Lee presses his lips to Alex\'s again, admitting between kisses, “I already came.”');
    expect(r.hits.filter((h) => h.via === "dialogue:asking to be fed a cock").map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toEqual(["Alex>Lee"]);
  });
  it("continues the two locally named participants from a forehead kiss to rubbing", () => {
    const r = run("Alex thrusts into Sam.||Sam nods, Lee's happiness making him smile, watching his eyes until he leans down to kiss Sam's forehead. He grinds his hard cock against Sam's ass.");
    expect(r.hits.filter((h) => h.via === "rut-against-ass").map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toEqual(["Lee>Sam"]);
  });
  it("keeps the explicitly named fingers and named body owner through a rim-touch fragment", () => {
    const r = run("Lee thrusts into Alex.||Alex jerks under his touch, Sam's fingers tightening around his hips. His lips trace the curve of Alex's ass. He lingers on his hole, to press at his rim.");
    const hits = r.hits.filter((h) => h.via === "pressure-at-hole~elided");
    expect(hits.map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toEqual(["Sam>Alex"]);
    expect(hits[0].attribution?.top).toBe("rule");
  });
  it("uses the invited person when someone makes room between his legs", () => {
    const r = run("Alex opens his legs, making a place for Lee to lie down.");
    expect(r.hits.filter((h) => h.via === "spread-legs").map((h) => `${h.a.split(" ")[0]}>${h.b?.split(" ")[0]}`)).toEqual(["Alex>Lee"]);
  });
});

describe("act selection excludes other contact", () => {
  it("excludes a kiss even when earlier paragraphs contain genital words", () => {
    expect(acts("Alex's cock is hard.||Sam parts his lips, allowing Alex to sink into him and catch his lower lip.", "anal sex")).toEqual([]);
    expect(acts("Sam sighs into their kiss, opening his mouth, letting Alex in.", "anal sex")).toEqual([]);
    expect(acts("Sam parts his lips to kiss Alex. He opens at the touch, letting Alex in.", "anal sex")).toEqual([]);
  });
  it("keeps explicit penetration beside kissing", () => {
    expect(acts("Alex kisses Sam as he pushes his cock into Sam's ass.", "anal sex")).toContain("Alex>Sam");
    expect(acts("Alex sinks into Sam again, putting his lips to Sam's ear. Sam tightens his legs around Alex's hips.", "anal sex")).toContain("Alex>Sam");
  });
  it("does not invent anal penetration when a mouth gets to work on a cock", () => {
    const text = "Alex hears Sam's mouth getting to work on Lee's cock.";
    expect(acts(text, "anal sex")).toEqual([]);
    expect(acts(text, "blowjob")).toContain("Lee>Sam");
  });
  it("does not use an earlier prostate as the subject of a later swallowing clause", () => {
    expect(acts("Pressure builds against his prostate as Sam swallows around Alex's cock.", "anal sex")).toEqual([]);
    expect(acts("Alex's hole clenches around Sam's cock.", "anal sex")).toContain("Sam>Alex");
  });
  it("does not turn guidance toward a bed or tickling into penetration", () => {
    expect(acts("Sam nudges into Alex, steering him toward the bed.", "anal sex")).toEqual([]);
    expect(acts("Sam stops tickling Alex, sinking into him as Alex parts his legs to make room.", "anal sex")).toEqual([]);
  });
});
