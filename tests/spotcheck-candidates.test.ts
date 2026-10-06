// The engine's side of `npm run spotcheck -- next` (skipped otherwise): finds every reading the engine still makes that carries a label made by a Claude
// pass (tests/right-set, source "claude"), with the sentence in its paragraph and how much the engine itself trusts the reading. Written as JSON to SPOT_OUT.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { baseVia, hashKey, slugOf } from "../scripts/right-set.mjs";
import { extractFromHtml } from "../src/extract";
import { analyzeWithPatterns } from "../src/heuristic";
import { probability } from "../src/heuristic/learned";
import { precisionOf } from "../src/heuristic/reliability";

const out = process.env.SPOT_OUT;
const dir = process.env.AO3_DIR ?? "ao3-samples";

describe.skipIf(!out)("spot-check candidates", () => {
  it("lists the readings that carry a Claude-made label", () => {
    type L = { claude: "ok" | "wrong"; who: string };
    const byFic = new Map<string, Map<string, L[]>>();
    const k = (e: { via?: string; h: string }) => `${baseVia(e.via ?? "")}#${e.h}`;
    const who = (e: { who?: string; top?: string }) => String(e.who ?? e.top ?? "").split(/\s+/)[0].toLowerCase();
    for (const f of readdirSync("tests/right-set").filter((x) => x.endsWith(".json"))) {
      const set = JSON.parse(readFileSync(join("tests/right-set", f), "utf8"));
      const m = new Map<string, L[]>();
      const add = (e: { via?: string; h: string; who?: string; top?: string }, claude: "ok" | "wrong") => m.set(k(e), [...(m.get(k(e)) ?? []), { claude, who: who(e) }]);
      for (const e of set.entries ?? []) if (e.source === "claude" && !e.retired && !(e.marks?.wrong > 0)) add(e, "ok");
      for (const n of set.negatives ?? []) if (n.source === "claude" && !n.retired && n.misread) add(n, "wrong");
      if (m.size) byFic.set(set.fic, m);
    }
    const cap = (s: string, n = 700) => (s.length > n ? `${s.slice(0, n)}…` : s);
    const rows: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".html")).sort()) {
      const work = extractFromHtml(readFileSync(join(dir, f), "utf8"));
      const m = byFic.get(slugOf(work.meta.title ?? ""));
      if (!m) continue;
      let paras: string[] = [];
      analyzeWithPatterns(work.text, work.meta, { quiet: true, debug: (d) => (paras = d.paras), audit: (h) => {
        const key = `${baseVia(h.via)}#${hashKey(h.sentence)}`;
        const labels = m.get(key);
        if (!labels || !h.f || seen.has(key)) return;
        const mine = labels.length > 1 ? labels.filter((l) => l.who === String(h.a).split(/\s+/)[0].toLowerCase()) : labels;
        if (mine.length !== 1) return; // two Claude labels on one sentence for different people: too ambiguous to ask about
        seen.add(key);
        const para = paras[h.para] ?? "", s = h.sentence.trim();
        rows.push({
          key, claude: mine[0].claude, fic: f.replace(/\.html$/, ""), via: h.via, kind: h.kind, act: h.act, a: h.a, b: h.b,
          p: Number(probability(precisionOf(h.via), h.f).toFixed(4)),
          before: cap(paras[h.para - 1] ?? ""), para: para.includes(s) ? cap(para.replace(s, `【${s}】`), 1400) : `【${cap(para, 1400)}】`, after: cap(paras[h.para + 1] ?? ""),
        });
      } });
    }
    writeFileSync(out!, JSON.stringify(rows));
  }, 1_500_000);
});
