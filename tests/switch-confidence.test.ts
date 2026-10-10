import { describe, expect, it } from "vitest";
import { emptyMeta } from "../src/ao3";
import { buildAct, type PairTags } from "../src/heuristic/builders";
import type { Character } from "../src/heuristic/characters";
import type { ActHit } from "../src/heuristic/hits";

const morgan: Character = { name: "Morgan", aliases: ["Morgan"], gender: "m", penis: true, vulva: false };
const rowan: Character = { name: "Rowan", aliases: ["Rowan"], gender: "m", penis: true, vulva: false };
const tags: PairTags = { roles: [], dynamics: [], switching: [], dynamicTags: [], actTags: { anal: [], oral: [], blowjob: [], rimming: [], cunnilingus: [] } };
const hit = (top: Character, bottom: Character, sentence: string, para: number, weight: number, basis: ActHit["basis"] = "pronoun"): ActHit => ({
  cat: "anal", act: "anal sex", top, bottom, sentence, para, weight, basis,
});
// Invented adults: Morgan penetrates Rowan in one scene; Rowan takes a turn in another.
const first = [
  hit(morgan, rowan, "Morgan penetrated Rowan anally.", 0, 1, "named"),
  hit(morgan, rowan, "Morgan kept thrusting into Rowan.", 1, 1, "named"),
];
const reverse = (weight: number): ActHit[] => [
  hit(rowan, morgan, "He entered him and began to thrust.", 30, weight),
  hit(rowan, morgan, "He continued penetrating him.", 31, weight),
];
const result = (other: ActHit[]) => buildAct("anal", [...first, ...other], [], tags, [morgan, rowan], emptyMeta(), () => "Chapter 1");

describe("corroborated role switching after a confidence retrain", () => {
  it("keeps switching when two confident sentences fall just below the old combined-weight cutoff", () => {
    for (const weight of [0.74, 0.76]) {
      const r = result(reverse(weight));
      expect(r.instances).toHaveLength(2);
      expect(r.instances.find(i => i.top === "Rowan")?.confidence).toBeGreaterThanOrEqual(0.75);
      expect(r.verdict).toBe("switch");
    }
  });
  it("does not promote a lone contrary sentence or two patterns matching that same sentence", () => {
    const [one] = reverse(0.74);
    expect(result([one]).verdict).toBe("one_way");
    expect(result([one, { ...one, via: "another-pattern" }]).verdict).toBe("one_way");
  });
  it("keeps low-confidence and shaky contrary scenes as possible exceptions", () => {
    expect(result(reverse(0.69)).verdict).toBe("one_way");
    expect(result(reverse(0.74).map(h => ({ ...h, shaky: "ambiguous direction" }))).verdict).toBe("one_way");
    expect(result(reverse(0.74).map(h => ({ ...h, basis: "inferred" }))).verdict).toBe("one_way");
    const inferred = reverse(0.95).map((h, i) => ({ ...h, weight: i ? 0.4 : 0.95, basis: "inferred" as const }));
    expect(result(inferred).instances.find(i => i.top === "Rowan")?.confidence).toBeGreaterThanOrEqual(0.75);
    expect(result(inferred).verdict).toBe("one_way");
  });
});
