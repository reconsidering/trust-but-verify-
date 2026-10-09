// @vitest-environment jsdom
// Lists the engine's readings (pattern, paragraph, people, sentence hash) for the fics in the October 4-5 Claude-label review, for
// scripts/import-claude-label-current.mjs. Skipped unless CLAUDE_CURRENT_OUT is set. Writes hashes only, never the fic's text.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { extractFromHtml } from "../src/extract";
import { analyzeWithPatterns } from "../src/heuristic";

const out = process.env.CLAUDE_CURRENT_OUT;
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
describe.skipIf(!out)("claude label current readings", () => {
  it("reads the fics", () => {
    const batch = JSON.parse(readFileSync("public/review/claude-oct4-5.json", "utf8"));
    const result: Record<string, unknown[]> = {};
    for (const s of batch.sources) {
      const w = extractFromHtml(readFileSync(join(process.env.AO3_DIR ?? "ao3-samples", s.file), "utf8"));
      const hits: unknown[] = [];
      analyzeWithPatterns(w.text, w.meta, { quiet: true, audit: (h) => hits.push({ via: h.via, kind: h.kind, act: h.act, para: h.para, a: h.a, b: h.b ?? "", role: h.role ?? "", key: `${h.via}#${hash(h.sentence).toString(16)}` }) });
      result[s.file] = hits;
    }
    writeFileSync(out!, JSON.stringify(result));
  }, 3_600_000);
});
