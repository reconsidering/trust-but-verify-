// @vitest-environment jsdom
// Re-runs the hands-free detector on the passages the owner answered (tests/hands-free/*.json) and compares: npm run hands-free-check (skipped otherwise;
// needs the sample fics, whose checksums must match the record). Fails if a hands-free passage the detector used to find is lost, or if a passage the
// owner marked touched or not him is now flagged. Prints the recall estimate, so a change that finds more shows up.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractFromHtml } from "../src/extract";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const dir = process.env.AO3_DIR ?? "ao3-samples";
describe.skipIf(!process.env.HF_CHECK)("hands-free record", () => {
  for (const file of readdirSync("tests/hands-free").filter((f) => f.endsWith(".json"))) {
    it(`still finds what ${file} says it found`, () => {
      const rec = JSON.parse(readFileSync(join("tests/hands-free", file), "utf8")) as { answers: any[] };
      const now = new Map<string, Set<number>>(); // fic -> paragraphs flagged now
      const skipped: string[] = [];
      for (const fic of [...new Set(rec.answers.map((a) => a.fic as string))]) {
        const buf = readFileSync(join(dir, fic));
        const want = rec.answers.find((a) => a.fic === fic).sourceSha256;
        if (createHash("sha256").update(buf).digest("hex") !== want) { skipped.push(fic); continue; }
        const w = extractFromHtml(buf.toString("utf8"));
        const hits: AuditHit[] = [];
        analyzeWithPatterns(w.text, w.meta, { quiet: true, audit: (h) => hits.push(h) });
        now.set(fic, new Set(hits.filter((h) => h.act === "hands-free orgasm" || h.act === "prostate orgasm").map((h) => h.para)));
      }
      const used = rec.answers.filter((a) => now.has(a.fic));
      const flagged = (a: any) => now.get(a.fic)!.has(a.para);
      const lost = used.filter((a) => a.verdict === "yes" && a.detected && !flagged(a)).map((a) => a.key);
      const falseNew = used.filter((a) => (a.verdict === "touched" || a.verdict === "other") && flagged(a)).map((a) => a.key);
      const gained = used.filter((a) => a.verdict === "yes" && !a.detected && flagged(a)).map((a) => a.key);
      const clear = used.filter((a) => !a.detected && !a.manualNearby && a.stratumWeight && a.verdict !== "unsure");
      const clearAll = used.filter((a) => !a.detected && !a.manualNearby && a.stratumWeight);
      const scale = clear.length ? clearAll.reduce((s, a) => s + a.stratumWeight, 0) / clear.reduce((s, a) => s + a.stratumWeight, 0) : 1;
      const flaggedYes = used.filter((a) => a.detected && a.verdict === "yes").length;
      const missedBefore = clear.filter((a) => a.verdict === "yes").reduce((s, a) => s + a.stratumWeight, 0) * scale;
      const foundNow = flaggedYes - lost.length + clear.filter((a) => a.verdict === "yes" && flagged(a)).reduce((s, a) => s + a.stratumWeight, 0) * scale;
      const total = flaggedYes + missedBefore;
      console.log(`HF_CHECK ${file}: ${used.length} answers re-run${skipped.length ? `, ${skipped.length} fics skipped (checksum differs)` : ""}; lost ${lost.length}, newly flagged wrongly ${falseNew.length}, newly found ${gained.length}; estimated recall now ${total ? Math.round((foundNow / total) * 100) : "n/a"}%`);
      expect({ lost, falseNew }).toEqual({ lost: [], falseNew: [] });
    });
  }
});
