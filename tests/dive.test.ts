// @vitest-environment jsdom
// The engine's side of `npm run dive` (skipped otherwise): reads one fic and writes what it found as JSON, so scripts/dive.mjs can pack it for
// labelling and later compare the readings of two engine versions. Set by scripts/dive.mjs through DIVE_* variables.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { extractFromHtml } from "../src/extract";
import { analyzeWithPatterns } from "../src/heuristic";

const fic = process.env.DIVE_FIC;
const CARDS = ["anal", "blowjob", "rimming", "cunnilingus"] as const;

describe.skipIf(!fic || !process.env.DIVE_OUT)("dive: read a fic", () => {
  it("writes the readings", () => {
    const file = fic!.endsWith(".html") ? fic! : join(process.env.AO3_DIR ?? "ao3-samples", `${fic}.html`);
    const w = extractFromHtml(readFileSync(file, "utf8"));
    let paras: string[] = [];
    const a = analyzeWithPatterns(w.text, w.meta, { quiet: true, debug: (d) => (paras = d.paras) });
    const readings: Record<string, unknown>[] = [];
    // The three most prominent pairings, like the review pages.
    for (const p of a.pairings.slice(0, 3)) {
      for (const card of CARDS) {
        const r = p[card];
        if (!r) continue;
        for (const i of r.instances) readings.push({ kind: "scene", card, pairing: p.pairing, top: i.top, bottom: i.bottom, via: i.via, ev: i.evidence, para: i.para, conf: Math.round((i.confidence ?? 0) * 100), act: i.act });
        for (const d of r.desires ?? []) readings.push({ kind: "hint", card, pairing: p.pairing, who: d.who, role: d.role, wants: d.wants !== false, via: d.via, ev: d.evidence, conf: Math.round((d.confidence ?? 0) * 100), act: d.act, dkind: d.kind });
      }
      for (const i of p.solo?.instances ?? []) readings.push({ kind: "solo", card: "solo", pairing: p.pairing, who: i.who, via: i.via ?? "", ev: i.evidence, act: i.act });
    }
    readings.sort((x, y) => ((x.para as number | undefined) ?? 0) - ((y.para as number | undefined) ?? 0));
    writeFileSync(process.env.DIVE_OUT!, JSON.stringify({ title: w.meta.title ?? fic, relationships: w.meta.relationships, characters: w.meta.characters, paras, readings }));
  }, 1_200_000);
});
