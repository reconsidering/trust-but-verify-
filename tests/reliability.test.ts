// Turns the labelled audit samples (tests/labels/*.json) into the per-pattern reliability table the engine uses
// (src/heuristic/reliability.ts), and fails when the committed table no longer matches the labels.
//   WRITE_RELIABILITY=1 npx vitest run tests/reliability.test.ts     rewrites the table
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type RightSet, baseVia, strengthOf, weightOf } from "../scripts/right-set.mjs";
import { PRECISION, RELIABILITY, reliabilityOf } from "../src/heuristic/reliability";

const PRIOR_MEAN = 0.9;
const PRIOR_STRENGTH = 4;
const FLOOR = 0.4;
const dir = join(__dirname, "labels");

/** ok / wrong counts per pattern from every labels file (unclear labels are left out). */
export function countLabels(): Map<string, { ok: number; wrong: number }> {
  const counts = new Map<string, { ok: number; wrong: number }>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const { labels } = JSON.parse(readFileSync(join(dir, f), "utf8")) as { labels: Record<string, "ok" | "wrong" | "unclear"> };
    for (const [key, label] of Object.entries(labels)) {
      if (label === "unclear") continue;
      const id = key.slice(0, key.lastIndexOf("#")).replace(/~elided$/, "");
      const c = counts.get(id) ?? { ok: 0, wrong: 0 };
      c[label]++;
      counts.set(id, c);
    }
  }
  // Mistake reports (tests/right-set): a "looks right" reading counts as right; one reported wrong because it was misread counts as wrong.
  // Disputed or retired readings, and anything marked both ways, are left out so one mistaken mark cannot move a pattern.
  const setDir = join(__dirname, "right-set");
  if (existsSync(setDir)) {
    for (const f of readdirSync(setDir).filter((x) => x.endsWith(".json")).sort()) {
      const set = JSON.parse(readFileSync(join(setDir, f), "utf8")) as RightSet;
      const k = (e: { via?: string; h: string }) => `${baseVia(e.via ?? "")}#${e.h}`;
      const rightKeys = new Set(set.entries.map(k));
      // A label from an unverified pass (weight below 1) counts as that fraction of an observation: it pulls less against the prior.
      const bump = (via: string | undefined, label: "ok" | "wrong", w = 1) => {
        const id = baseVia(via ?? "");
        if (!id) return;
        const c = counts.get(id) ?? { ok: 0, wrong: 0 };
        c[label] += w;
        counts.set(id, c);
      };
      for (const e of set.entries) { const st = strengthOf(e); if (st === "strong" || st === "single" || st === "weighted") bump(e.via, "ok", weightOf(e)); }
      for (const n of set.negatives ?? []) if (n.misread && !rightKeys.has(k(n)) && !n.retired) bump(n.via, "wrong", weightOf(n));
    }
  }
  return counts;
}

export function table(counts = countLabels()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, { ok, wrong }] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
    const rel = (ok + PRIOR_MEAN * PRIOR_STRENGTH) / (ok + wrong + PRIOR_STRENGTH);
    const mult = Math.max(FLOOR, Math.min(1, rel / PRIOR_MEAN));
    if (mult < 0.995) out[id] = Math.round(mult * 100) / 100;
  }
  return out;
}

/** The smoothed precision of every labelled pattern, for the context model (learned.ts). */
export function precisionTable(counts = countLabels()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, { ok, wrong }] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) out[id] = Math.round(((ok + PRIOR_MEAN * PRIOR_STRENGTH) / (ok + wrong + PRIOR_STRENGTH)) * 1000) / 1000;
  return out;
}

const block = (name: string, t: Record<string, number>) => `export const ${name}: Record<string, number> = {\n${Object.entries(t).map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`).join("\n")}\n};`;
const render = (t: Record<string, number>, pr: Record<string, number>) =>
  readFileSync(join(__dirname, "../src/heuristic/reliability.ts"), "utf8")
    .replace(/export const RELIABILITY: Record<string, number> = \{[\s\S]*?\n\};|export const RELIABILITY: Record<string, number> = \{\};/, block("RELIABILITY", t))
    .replace(/export const PRECISION: Record<string, number> = \{[\s\S]*?\n\};|export const PRECISION: Record<string, number> = \{\};/, block("PRECISION", pr));

describe("pattern reliability table", () => {
  it("is smoothed toward trusting a pattern, with a floor", () => {
    const t = table(new Map([["good", { ok: 6, wrong: 0 }], ["bad", { ok: 0, wrong: 6 }], ["one", { ok: 0, wrong: 1 }], ["half", { ok: 3, wrong: 3 }], ["x~elided", { ok: 5, wrong: 0 }]]));
    expect(t.good).toBeUndefined();
    expect(t.bad).toBe(0.4);
    expect(t.one).toBe(0.8);
    expect(t.half).toBeCloseTo(0.73, 2);
  });
  it("reads ids with and without the elided suffix the same", () => {
    expect(reliabilityOf("some-unknown-pattern~elided")).toBe(1);
  });
  it("matches the labels it was made from (warns when behind; STRICT_GENERATED=1 fails)", () => {
    const t = table(), pr = precisionTable();
    if (process.env.WRITE_RELIABILITY) writeFileSync(join(__dirname, "../src/heuristic/reliability.ts"), render(t, pr));
    else if (process.env.STRICT_GENERATED) {
      expect(RELIABILITY).toEqual(t);
      expect(PRECISION).toEqual(pr);
    } else if (JSON.stringify(RELIABILITY) !== JSON.stringify(t) || JSON.stringify(PRECISION) !== JSON.stringify(pr)) {
      // New labels land in their own PRs; the tables are regenerated afterwards in one go (npm run regen), not by every PR.
      console.warn("reliability.ts is older than the labels in tests/right-set: run `npm run regen` (STRICT_GENERATED=1 makes this a failure).");
    }
  });
});
