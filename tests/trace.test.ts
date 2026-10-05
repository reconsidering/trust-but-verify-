// @vitest-environment jsdom
// The engine's working, for `npm run trace` (skipped otherwise): which pattern matched where, who it made top and bottom, and what it was going on
// (the elided subject, the clause subject, the last subject, the point of view). Set by scripts/trace.mjs through TRACE_* variables.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { extractFromHtml } from "../src/extract";
import { analyzeWithPatterns } from "../src/heuristic";

const fic = process.env.TRACE_FIC;
describe.skipIf(!fic)("trace", () => {
  it("prints the matches", () => {
    const file = fic!.endsWith(".html") ? fic! : join(process.env.AO3_DIR ?? "ao3-samples", `${fic}.html`);
    const w = extractFromHtml(readFileSync(file, "utf8"));
    const re = new RegExp(process.env.TRACE_PAT || ".");
    const from = Number(process.env.TRACE_FROM ?? 0), to = Number(process.env.TRACE_TO ?? Infinity);
    const lines: string[] = [];
    // The engine reads the work twice when it learns epithets; only the last pass is the one that counts.
    const finals: string[] = [];
    let lastPara = -1;
    analyzeWithPatterns(w.text, w.meta, {
      quiet: true,
      audit: (h) => {
        if (h.para < from || h.para > to || !re.test(h.via)) return;
        finals.push(`${h.para}\t${h.via}\tFINAL ${h.kind} ${h.cat}: ${h.a} → ${h.b ?? "-"}\t${JSON.stringify(h.sentence.slice(0, 80))}`);
      },
      trace: (e) => {
        if (e.para < lastPara) lines.length = 0;
        lastPara = e.para;
        if (e.para < from || e.para > to || !re.test(e.via)) return;
        lines.push(`${e.para}\t${e.via}\t${JSON.stringify(e.match.slice(0, 70))}\tt=${e.tToken ?? "-"} b=${e.bToken ?? "-"}\t→ ${e.top ?? "?"} > ${e.bottom ?? "?"} (${e.basis ?? "none"})\telided=${e.elidedSubject ?? "-"} clause=${e.clauseSubject ?? "-"} last=${e.lastSubject ?? "-"} pov=${e.pov ?? "-"}`);
      },
    });
    const out = `# matches, as first resolved (before the guards that can drop or swap them):\n${lines.join("\n")}\n# readings that survived (final):\n${finals.sort((a, b) => parseInt(a) - parseInt(b)).join("\n")}\n`;
    if (process.env.TRACE_OUT) writeFileSync(process.env.TRACE_OUT, out);
    else process.stdout.write(out);
  }, 1_200_000);
});
