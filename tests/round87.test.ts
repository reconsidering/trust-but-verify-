// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

// Alpha Rhys, Omega Theo; the reports behind this round were an omegaverse pair and a dark prince-and-suitor fic.
const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Rhys Calder/Theo Marsh"], characters: ["Rhys Calder", "Theo Marsh"], freeforms: ["Alpha/Beta/Omega Dynamics", "Alpha Rhys Calder", "Omega Theo Marsh"] };
const lead = "Rhys kissed Theo, naked and hard, hands on his hips. Theo moaned into the kiss. ".repeat(4) + "\n\n";
const run = (t: string, meta = META) => {
  const hits: AuditHit[] = [];
  const a = analyzeWithPatterns(lead + t.split("||").join("\n\n"), meta, { quiet: true, audit: (h) => hits.push(h) });
  const p = a.pairings[0];
  const first = (s: string) => s.split(" ")[0];
  const inst = (k: "anal" | "blowjob" | "rimming") => p[k].instances.map((x) => `${first(x.top)}>${first(x.bottom)}`);
  const desire = (k: "anal" | "blowjob" | "rimming") => (p[k].desires ?? []).map((d) => `${first(d.who)}:${d.role}`);
  return { hits, via: (re: RegExp) => hits.some((h) => re.test(h.via)), anal: inst("anal"), blow: inst("blowjob"), rim: inst("rimming"), desires: desire("anal"), a };
};

describe("round 87: Belonging report (Alpha Castiel / Omega Dean) and the prince-and-suitor fic", () => {
  it("with one alpha and one omega tagged, a slick or hole cue with no name in it is the omega’s", () => {
    const r = run("His slick slips free and he cries out at the emptiness while his hole begs.||Rhys watched him with a steady hand on his hip.");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("…and so is a plug that goes ‘deep inside him’ when the alpha is the one pushing it", () => {
    const r = run("“Ugh, fuck, Rhys.” Theo complains as the plug spears deep inside him.");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("lowercase ‘please, alpha’ is said to the alpha, whichever way the speaker was guessed", () => {
    const r = run("Rhys held him down by the nape and waited.||“Please, alpha. Make us one. Claim me, breed me. I’ll be a good omega.”");
    expect(r.desires).not.toContain("Rhys:bottom");
  });
  it("‘against Theo’s grinding his cock’ is a possessive, not ‘Theo is’", () => {
    expect(run("Rhys rolls his hips against Theo’s grinding his cock deep inside him.").anal.every((x) => x === "Rhys>Theo")).toBe(true);
  });
  it("phrasings that were missed: the alpha slips his cock inside; presses it past his rim", () => {
    expect(run("Theo moans as the alpha slips his cock inside and begs for the knot.").anal).toEqual(["Rhys>Theo"]);
    expect(run("Rhys presses it past his rim once, twice, three times, and cums with a groan as it ties.").anal).toEqual(["Rhys>Theo"]);
  });
  it("a hole clenching around nothing with nothing before it, or while wishing, is not a scene", () => {
    expect(run("Theo sits stunned as his cock throbs and his hole clenches around nothing.").anal).toEqual([]);
    expect(run("Rhys unzips and his cock springs free. Theo’s hole clenches around nothing, wishing it was going inside him.").anal).toEqual([]);
  });
  it("‘Will he open him up or just spear his cock inside him’ is a worry", () => {
    expect(run("Will he open him up or just spear his cock inside him and hope Theo adjusts.").anal).toEqual([]);
  });
  it("pushing back in past someone’s lips is the mouth", () => {
    const r = run("Rhys rocks his hips gently. He pulls back a few centimeters before pushing back in.||He works himself past Theo’s locked open lips carefully.");
    expect(r.anal).toEqual([]);
  });
  it("‘takes his cock back behind his lips’ is a blowjob, not masturbation", () => {
    expect(run("Rhys guides his head back down and Theo takes his cock back behind his lips with a slurp.").a.pairings[0].solo?.instances ?? []).toEqual([]);
  });
  it("saliva spat on a hole is not rimming", () => {
    expect(run("Rhys spread Theo’s cheeks, gathered saliva in his mouth and spat on his hole.").rim).toEqual([]);
  });
});
