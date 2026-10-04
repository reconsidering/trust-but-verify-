import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M", "F/M"], fandoms: ["Supernatural"], relationships: ["Castiel/Dean Winchester", "Jessica Moore/Sam Winchester"], characters: ["Dean Winchester", "Castiel", "Sam Winchester", "Jessica Moore"], freeforms: ["Cock Cage", "Cas puts Dean in a cock cage", "Dom!Cas", "Sub!Dean"] };
const lead = "Dean and Cas were in bed, naked and kissing, hard and aching. Cas kissed Dean. Dean kissed Cas back, moaning. ".repeat(2) + "\n\n";
const run = (t: string, meta: Ao3Meta = META) => { const hits: AuditHit[] = []; const r = analyzeWithPatterns(lead + t, meta, { quiet: true, audit: (h) => hits.push(h) }); return { p: r.pairings[0], hits }; };
const who = (hits: AuditHit[], prefix: string) => hits.filter((h) => h.via.startsWith(prefix)).map((h) => `${h.via}:${h.a.split(" ")[0]}`);

describe("chastity: the tags name the wearer", () => {
  it("every sentence about the cage credits Dean as the wearer, whoever the pronouns point at", () => {
    const { hits } = run("Cas was massaging his balls gently and his dick was straining against the cage with nowhere to go.");
    expect(new Set(who(hits, "chastity-wearer"))).toEqual(new Set(["chastity-wearer:Dean", "chastity-wearer-anal:Dean", "chastity-wearer-oral:Dean"]));
  });
  it("…not the brother whose wedding it is", () => {
    const { hits } = run("At Sam’s wedding his cock twitched against the cage and he bit his cheek.");
    expect(hits.filter((h) => h.via.startsWith("chastity-wearer") && !h.a.startsWith("Dean"))).toHaveLength(0);
  });
  it("catches ‘wearing a cock cage’, ‘a cage around his cock’ and a quoted ‘cage around my dick’", () => {
    expect(who(run("He was in public, wearing a cock cage, and nobody knew.").hits, "chastity-wearer")).toContain("chastity-wearer:Dean");
    expect(who(run("He was reminded that there was a cage around his cock.").hits, "chastity-wearer")).toContain("chastity-wearer:Dean");
    expect(who(run("“There’s a cage around my dick and you put it there,” he said.").hits, "chastity-wearer")).toContain("chastity-wearer:Dean");
  });
  it("a bird cage in a chastity fic is not a device", () => {
    expect(who(run("Cas carried the bird cage out to the porch, his dick hard.").hits, "chastity-wearer")).toHaveLength(0);
  });
  it("without a named wearer or a lone sub in the tags, the pattern versions are used as before", () => {
    const meta = { ...META, freeforms: ["Chastity Device"] };
    expect(who(run("Castiel was locked in a cage all week, whining.", meta).hits, "chastity-wearer").length).toBeGreaterThan(0);
  });
  it("the keyholder: securing the cage, freeing from it, the key, tapping it", () => {
    const has = (t: string, id: string) => run(t).hits.some((h) => h.via.replace(/~elided$/, "") === id && h.a.startsWith("Castiel"));
    expect(has("Cas got to work securing the cage around his dick.", "chastity-lock-on-ing")).toBe(true);
    expect(has("Cas got to work freeing Dean from the cage.", "chastity-keyholder-free")).toBe(true);
    expect(has("Cas grinned and pulled the key to the cage from his pocket.", "chastity-keyholder-key")).toBe(true);
    expect(has("Cas smiled and tapped the cage with one finger.", "chastity-keyholder-tap")).toBe(true);
    // fetching the key is not Dean wearing it
    expect(who(run("Cas grinned and pulled the key to the cage from his pocket.").hits, "chastity-wearer")).toHaveLength(0);
  });
  it("the one saying ‘I’m going to cage you’ is the keyholder", () => {
    expect(who(run("Cas leaned in. “As long as you’re wearing that cage, you’re mine,” he said.").hits, "chastity-keyholder")).toContain("chastity-keyholder:Castiel");
  });
});

describe("other misses from the Tricks of the Trade dive", () => {
  const acts = (t: string) => run(t).hits.filter((h) => h.kind === "act").map((h) => `${h.via}:${h.cat}:${h.a.split(" ")[0]}>${(h.b ?? "").split(" ")[0]}`);
  it("‘the first press of Cas’s lubed finger to his hole’ is Cas fingering Dean", () => {
    expect(acts("The first press of Cas’s lubed finger to his hole had Dean wanting more.")).toContain("finger-noun-to-hole:anal:Castiel>Dean");
  });
  it("‘stuck a third finger into Dean’ and ‘finger the outer rim of Dean’s hole’", () => {
    expect(acts("Cas stuck a third finger into Dean, slowly.").some((x) => x.endsWith("Castiel>Dean"))).toBe(true);
    expect(acts("Cas continued to finger the outer rim of Dean’s hole.").some((x) => x.endsWith("Castiel>Dean"))).toBe(true);
  });
  it("‘shoved his dick into Dean’s mouth’ is a blowjob", () => {
    expect(acts("Without warning, Cas shoved his dick into Dean’s mouth.")).toContain("fed-cock:oral:Castiel>Dean");
  });
  it("‘Dean opened his mouth and Cas slid inside’ is oral, not anal", () => {
    const a = acts("“Open up.” Dean opened his mouth and Cas easily slid inside.");
    expect(a.some((x) => x.includes(":anal:"))).toBe(false);
    expect(a.some((x) => x.includes(":oral:Castiel>Dean"))).toBe(true);
  });
  it("a plug worn by the sub is read even with ‘your ass’ or no possessive", () => {
    expect(run("Sitting with a plug in your ass was a contradiction, and the vibrations of the plug stopped.").hits.filter((h) => h.via === "plug-worn").map((h) => h.a.split(" ")[0])).toContain("Dean");
    expect(run("She plugged the lamp in and the plug in the wall sparked.").hits.filter((h) => h.via === "plug-worn")).toHaveLength(0);
  });
  it("the unnamed ‘he’ after Cas is Dean’s tagged partner, never the brother", () => {
    const { hits } = run("Dean was a wonderful cocksucker. His tongue moved just right and Cas let out a moan. He pulled at Dean’s hair and continued to fuck his mouth.");
    expect(hits.filter((h) => h.kind === "act" && /Sam|Jessica/.test(h.a + (h.b ?? "")))).toHaveLength(0);
  });
});
