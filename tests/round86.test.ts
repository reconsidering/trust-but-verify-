// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// An omegaverse pair told close-third from one side, the way the report fic is: Alpha Rhys, Omega Theo.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Rhys Calder/Theo Marsh"], characters: ["Rhys Calder", "Theo Marsh", "Boyd Mercer"], freeforms: ["Alpha/Beta/Omega Dynamics", "Alpha Rhys Calder", "Omega Theo Marsh"] };
const lead = "Theo wanted the Alpha. Theo felt his pulse race. Theo knew he was ready. Theo thought of the contract. Theo hoped Rhys would be gentle. Theo wondered what Rhys wanted. Theo noticed the heat in the room. Theo felt the slick on his thighs.\n\nRhys kissed Theo, naked and hard, hands on his hips.\n\n".repeat(3);
const run = (t: string) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), META, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const first = (s: string) => s.split(" ")[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${first(x.top)}>${first(x.bottom)}`);
  const desire = (k: "anal" | "blowjob" | "rimming") => (p[k].desires ?? []).map((d) => `${first(d.who)}:${d.role}`);
  return { hits, via: (re: RegExp) => hits.some((h) => re.test(h.via)), anal: inst("anal"), blow: inst("blowjob"), rim: inst("rimming"), desires: desire("anal"), a };
};

describe("round 86: WereCompeer report (Derek/Stiles, close third on Stiles)", () => {
  it("‘Fill me, Alpha,’ he says: the one saying Alpha is not the Alpha", () => {
    const r = run("Theo sank down on Rhys, slow. Rhys lay still beneath him, jaw tight.||“Fill me, Alpha,” he says, rolling his hips.");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("the same line with no tag: ‘Yes, Alpha.’ is said to Rhys", () => {
    const r = run("Rhys pushed two fingers into Theo and curled them.||“Please, Alpha. Fill me.”");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("a sentence that opens on the viewpoint character’s feelings stays with him even if the Alpha is named later", () => {
    const r = run("“We can discuss it tonight,” the Alpha says.||He feels his slick running down his thigh, and if he knew a little more about the Alpha, he might slide his fingers inside himself.");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("‘He spasms around Rhys’s cock, … but Rhys pulls out’ is Theo taking it, whoever was last in the room", () => {
    const r = run("Boyd had set out the balm earlier.||Rhys thrusts hard, biting along Theo’s neck.||He spasms around Rhys’s cock, trying to milk it, but Rhys pulls out abruptly and Theo tenses.");
    expect(r.anal.every((x) => x === "Rhys>Theo")).toBe(true);
    expect(r.anal.join()).not.toMatch(/Boyd/);
  });
  it("a bystander who fetches things is not a stray partner for later he/him lines", () => {
    const r = run("Boyd held the door and left.||Rhys rolled Theo onto his back and pushed into him.||He grips the sheets as his hips lift to meet Rhys.||He spasms around Rhys’s cock, trying to milk it, but Rhys pulls out and Theo whimpers.");
    expect(r.anal.join()).not.toMatch(/Boyd/);
  });
  it("‘Pulling out the plug from Theo, he slams his dick inside him’: the he is Rhys", () => {
    expect(run("Pulling out the plug from Theo, he slams his dick inside him without hesitation.").anal).toEqual(["Rhys>Theo"]);
  });
  it("‘fuck me, Der—Alpha.’ then ‘He pushes back’: the one pushing back is the speaker", () => {
    const r = run("Rhys uses his tongue, then his fingers again, stretching him.||“Fuck, Rhy—Alpha.” He pushes back, wanting more of that tongue.");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("a quote tag leaves its speaker as the subject of the next sentence", () => {
    const r = run("All the slick leaking out of him makes it easy for Rhys to slide into him in one smooth move. “Finally,” Theo says. He’s been waiting for this, needed to be filled by a warm cock.");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("someone shoving a hand into his own hole is not a scene with the partner", () => {
    const r = run("“Get out!” Theo whines. “Don’t do this to me.” He shoves his hand inside of his wet, sloppy hole.");
    expect(r.anal.join()).not.toMatch(/Theo>Rhys/);
  });
  it("‘after hours of having him inside of him’ is not Theo fucking Rhys", () => {
    expect(run("Because there’s something kinky about fucking Rhys after hours of having him inside of him.").anal).toEqual([]);
  });
  it("‘the one he slips his cock inside of him’ with no names follows the firm scenes, not the sentence before", () => {
    const text = [
      "Rhys fucked Theo over the table, Rhys thrusting hard.", "Rhys pushed into Theo, slow and deep.", "Rhys slammed his cock into Theo against the wall.", "Rhys thrust into Theo from behind.", "Rhys drove into Theo, hands on his hips.",
      "Now that Theo can come untouched, he’s found it’s easier to keep up. He’s not worried about pleasing Rhys anymore, because Theo feels his pleasure every time he slips his cock inside of him.",
    ].join("||");
    expect(run(text).anal.filter((x) => x === "Theo>Rhys")).toEqual([]);
  });
  it("a work where only one of them is ever penetrated reads one-way, not switch", () => {
    const text = [
      "Rhys fucked Theo over the table, Rhys thrusting hard.", "Rhys pushed into Theo, slow and deep.", "Rhys slammed his cock into Theo against the wall.", "Rhys thrust into Theo from behind.",
      "Theo straddled Rhys, and Theo sank down on him, riding him.", "Rhys knotted Theo while they lay together.",
    ].join("||\n\n---\n\n||");
    expect(run(text).a.pairings[0].anal.verdict).not.toBe("switch");
  });
  it("‘So full, Theo.’ is said to Theo about Theo", () => {
    const r = run("Rhys eased in, watching his face.||“So full, Theo.”");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("‘spreading his legs’ style toys: a plug he has to work in is his own", () => {
    expect(run("Clenching his ass at the thought of Rhys, he’s reminded of the hour he has to work the largest plug inside of him.").desires).not.toContain("Theo:top");
  });
  it("‘mated to a man who likes to fuck him’ is the partner, not an ex", () => {
    const r = run("He gets to spend the rest of his life with a man who likes to fuck him exactly the way he likes to be fucked.");
    expect(r.desires).not.toContain("Theo:top");
  });
  it("‘Rhys will shove his fingers inside Theo’, said of tomorrow, has not happened", () => {
    expect(run("And maybe, tomorrow, after they’ve played with the other things in the box, Rhys will shove his fingers inside Theo, twisting his knuckles around.").a.pairings[0].anal.instances).toEqual([]);
  });
  it("an ass nestled against a cock is not penetration", () => {
    expect(run("Rhys pulls him to his chest, so Theo’s ass is nestled tightly against Rhys’s cock.").anal).toEqual([]);
  });
  it("‘every time he masturbates’ is a habit, not an act", () => {
    expect(run("He doesn’t want the painful reminder following him around every time he masturbates or has sex.").a.pairings[0].solo?.instances ?? []).toEqual([]);
  });
  it("‘disobey the rule about touching himself’ is a rule, not an act", () => {
    expect(run("He could act up again, disobey the rule about touching himself and wait for his punishment.").a.pairings[0].solo?.instances ?? []).toEqual([]);
  });
  it("‘take his cock all the way down his throat’ is a blowjob, not masturbation", () => {
    expect(run("He takes all of it, feeling the Alpha’s surprise that he can take his cock all the way down his throat.").a.pairings[0].solo?.instances ?? []).toEqual([]);
  });
  it("fingering phrasings that were missed: circling his hole, in and out of, pushes a finger in", () => {
    expect(run("Rhys’s fingers trail down his backside circling his hole a few times before a finger breaches Theo.").anal.length).toBeGreaterThan(0);
    expect(run("His fingers move in and out of Theo with a squelching sound at how wet and open he is.").anal).toEqual(["Rhys>Theo"]);
    expect(run("Rhys pushes his pinky finger inside, twisting it around.").anal).toEqual(["Rhys>Theo"]);
  });
  it("rimming phrased as the feel of a tongue", () => {
    expect(run("He bucks at the feel of Rhys’s tongue, licking at his walls, the scruff of his chin scratching along his sensitive skin.").rim).toEqual(["Rhys>Theo"]);
  });
});
