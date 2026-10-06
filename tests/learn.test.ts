// Trains the context model in src/heuristic/learned.ts from the hand-labelled audit samples (tests/labels/*.json), and says
// whether it beats the plain per-pattern record on held-out labels.
//   AO3_DIR=ao3-samples npx vitest run tests/learn.test.ts --testTimeout=1500000          cross-validation report only
//   AO3_DIR=ao3-samples WRITE_LEARNED=1 npx vitest run tests/learn.test.ts ...            also writes the model into learned.ts
// The model is switched on only when it improves held-out log loss; the report goes to LEARN_REPORT.md in AO3_DIR.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type RightSet, baseVia, hashKey, slugOf, strengthOf, weightOf } from "../scripts/right-set.mjs";
import { extractFromHtml } from "../src/extract";
import { analyzeWithPatterns } from "../src/heuristic";
import { FEATURES, LEGACY_FEATURES, MODEL, probability } from "../src/heuristic/learned";

const dir = process.env.AO3_DIR;
const labelDir = join(__dirname, "labels");
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const PRIOR_MEAN = 0.9, PRIOR_STRENGTH = 4;

/** `wt` is how far the label is trusted (1 for the owner's own marks; less for an unverified pass). */
type Row = { key: string; id: string; f: number[]; y: number; wt: number; src?: "audit" | "report" | "weighted"; fic?: string };

function loadLabels(): Map<string, "ok" | "wrong"> {
  const out = new Map<string, "ok" | "wrong">();
  for (const f of readdirSync(labelDir).filter((x) => x.endsWith(".json")).sort()) {
    const { labels } = JSON.parse(readFileSync(join(labelDir, f), "utf8")) as { labels: Record<string, "ok" | "wrong" | "unclear"> };
    for (const [k, v] of Object.entries(labels)) if (v !== "unclear") out.set(k, v);
  }
  return out;
}

/**
 * Readings from mistake reports (tests/right-set): "looks right" is a positive, a reading reported wrong because it was misread is a negative.
 * Keyed by pattern and sentence like the audit labels, and only for the fic they came from. A reading marked both ways, a disputed or retired
 * one, and anything reported wrong for a reason other than a misreading (counted twice, too strong) teaches nothing and is left out.
 */
function rightSetLabels(): Map<string, Map<string, { lab: "ok" | "wrong"; wt: number }>> {
  const out = new Map<string, Map<string, { lab: "ok" | "wrong"; wt: number }>>();
  const dirp = join(__dirname, "right-set");
  if (!existsSync(dirp)) return out;
  for (const f of readdirSync(dirp).filter((x) => x.endsWith(".json"))) {
    const set = JSON.parse(readFileSync(join(dirp, f), "utf8")) as RightSet;
    const m = new Map<string, { lab: "ok" | "wrong"; wt: number }>();
    const k = (e: { via?: string; h: string }) => `${baseVia(e.via ?? "")}#${e.h}`;
    const rightKeys = new Set(set.entries.map(k));
    for (const e of set.entries) { const st = strengthOf(e); if (st === "strong" || st === "single" || st === "weighted") m.set(k(e), { lab: "ok", wt: weightOf(e) }); }
    for (const n of set.negatives ?? []) if (n.misread && !rightKeys.has(k(n)) && !n.retired) m.set(k(n), { lab: "wrong", wt: weightOf(n) });
    out.set(set.fic, m);
  }
  return out;
}

const baseId = (id: string) => id.replace(/~elided$/, "");
const logit = (p: number) => Math.log(p / (1 - p));
const sig = (z: number) => 1 / (1 + Math.exp(-z));

/** Smoothed precision of each pattern from the rows given, leaving out `skip` (its own label) when set. */
function precisions(rows: Row[], skip?: Row): (id: string) => number {
  const c = new Map<string, [number, number]>();
  for (const r of rows) {
    if (r === skip) continue;
    const v = c.get(baseId(r.id)) ?? [0, 0];
    const q = r.wt ?? 1; v[0] += r.y * q; v[1] += q;
    c.set(baseId(r.id), v);
  }
  return (id) => { const [ok, n] = c.get(baseId(id)) ?? [0, 0]; return (ok + PRIOR_MEAN * PRIOR_STRENGTH) / (n + PRIOR_STRENGTH); };
}

/** Ridge logistic regression by Newton steps. x rows are [logit(precision), ...features]; returns [bias, ...weights]. */
function fit(X: number[][], y: number[], lambda: number, wt: number[] = []): number[] {
  const d = X[0].length + 1;
  const w = new Array(d).fill(0);
  w[1] = 1; // start by trusting the pattern record as it is
  for (let it = 0; it < 30; it++) {
    const g = new Array(d).fill(0);
    const H = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let n = 0; n < X.length; n++) {
      const x = [1, ...X[n]];
      let z = 0;
      for (let k = 0; k < d; k++) z += w[k] * x[k];
      const p = sig(z), q = wt[n] ?? 1;
      for (let k = 0; k < d; k++) {
        g[k] += q * (p - y[n]) * x[k];
        for (let l = 0; l < d; l++) H[k][l] += q * p * (1 - p) * x[k] * x[l];
      }
    }
    // Ridge on everything except the intercept and the pattern-record coefficient (which is shrunk toward 1).
    for (let k = 2; k < d; k++) { g[k] += lambda * w[k]; H[k][k] += lambda; }
    g[1] += lambda * (w[1] - 1); H[1][1] += lambda;
    H[0][0] += 1e-6;
    const step = solve(H, g);
    let big = 0;
    for (let k = 0; k < d; k++) { w[k] -= step[k]; big = Math.max(big, Math.abs(step[k])); }
    if (big < 1e-6) break;
  }
  return w;
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = i + 1; r < n; r++) {
      const f = M[r][i] / M[i][i];
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
    x[i] = s / M[i][i];
  }
  return x;
}

const clampP = (p: number) => Math.min(0.995, Math.max(0.005, p));
/** Optional per-row trust (a label made by an unverified pass counts for less); omitted = every row counts 1. */
const W = (ws: number[] | undefined, i: number) => (ws ? ws[i] : 1);
const wlogloss = (ps: number[], ys: number[], ws?: number[]) => { let s = 0, t = 0; for (let i = 0; i < ps.length; i++) { const w = W(ws, i); s -= w * (ys[i] ? Math.log(clampP(ps[i])) : Math.log(1 - clampP(ps[i]))); t += w; } return s / t; };
const wbrier = (ps: number[], ys: number[], ws?: number[]) => { let s = 0, t = 0; for (let i = 0; i < ps.length; i++) { const w = W(ws, i); s += w * (ps[i] - ys[i]) ** 2; t += w; } return s / t; };
function wauc(ps: number[], ys: number[], ws?: number[]): number {
  let win = 0, tot = 0;
  for (let i = 0; i < ps.length; i++) if (ys[i] === 1) for (let j = 0; j < ps.length; j++) if (ys[j] === 0) { const w = W(ws, i) * W(ws, j); tot += w; win += w * (ps[i] > ps[j] ? 1 : ps[i] === ps[j] ? 0.5 : 0); }
  return tot ? win / tot : NaN;
}
const logloss = (ps: number[], ys: number[]) => -ps.reduce((s, p, i) => s + (ys[i] ? Math.log(clampP(p)) : Math.log(1 - clampP(p))), 0) / ps.length;
const brier = (ps: number[], ys: number[]) => ps.reduce((s, p, i) => s + (p - ys[i]) ** 2, 0) / ps.length;
function auc(ps: number[], ys: number[]): number {
  // Probability a right hit scores above a wrong one (ties count half).
  let win = 0, tot = 0;
  for (let i = 0; i < ps.length; i++) if (ys[i] === 1) for (let j = 0; j < ps.length; j++) if (ys[j] === 0) { tot++; win += ps[i] > ps[j] ? 1 : ps[i] === ps[j] ? 0.5 : 0; }
  return tot ? win / tot : NaN;
}

describe.skipIf(!dir)("context model", () => {
  it("trains on the labels and reports held-out accuracy", () => {
    const labels = loadLabels();
    let rows: Row[] = [];
    const seen = new Set<string>();
    const missing: Record<string, string> = {};
    let reportNote = "";
    const cache = process.env.ROWS_CACHE;
    const cached = cache && existsSync(cache) ? JSON.parse(readFileSync(cache, "utf8")) as Row[] : undefined;
    const validCache = cached?.length && cached.every((r) => r.f.length === FEATURES.length && r.f.every(Number.isFinite));
    if (validCache) rows = cached;
    else {
      const reported = rightSetLabels();
      let fromReports = 0, clashes = 0;
      for (const f of readdirSync(dir!).filter((x) => x.endsWith(".html")).sort()) {
        const work = extractFromHtml(readFileSync(join(dir!, f), "utf8"));
        const rs = reported.get(slugOf(work.meta.title ?? ""));
        analyzeWithPatterns(work.text, work.meta, {
          quiet: true,
          audit: (h) => {
            const key = `${h.via}#${hash(h.sentence).toString(16)}`;
            let lab = labels.get(key);
            const rep = rs?.get(`${baseVia(h.via)}#${hashKey(h.sentence)}`);
            const fromReport = rep?.lab;
            // People get things wrong: where the audit review and a report disagree, neither is used.
            if (lab && fromReport && lab !== fromReport) { clashes++; if (!seen.has(key)) seen.add(key); return; }
            if (!lab && fromReport) { lab = fromReport; if (h.f && !seen.has(key)) fromReports++; }
            if (!h.f) { if (lab) missing[key] = h.kind; return; }
            if (!lab || seen.has(key)) return;
            seen.add(key);
            rows.push({ key, id: h.via, f: h.f, y: lab === "ok" ? 1 : 0, wt: !labels.get(key) && rep ? rep.wt : 1, src: labels.get(key) ? "audit" : rep && rep.wt < 1 ? "weighted" : "report", fic: f });
          },
        });
      }
      reportNote = `${fromReports} of them come from mistake reports (tests/right-set); ${clashes} were left out because a report and the audit review disagreed.`;
    }
    if (cache && !validCache) writeFileSync(cache, JSON.stringify(rows));
    // LEARN_FILTER=audit,report keeps only rows from those sources (a diagnostic: which labels move the held-out numbers).
    if (process.env.LEARN_FILTER) { const keep = process.env.LEARN_FILTER.split(","); rows = rows.filter((r) => keep.includes(r.src ?? "audit")); }
    if (process.env.MISSING_OUT) writeFileSync(process.env.MISSING_OUT, JSON.stringify(missing));
    const lines: string[] = ["# Context model", "", `${rows.length} labelled hits found again in the samples (of ${labels.size} labels); ${rows.filter((r) => !r.y).length} wrong.`, ...(reportNote ? [reportNote] : []), ""];
    expect(rows.length).toBeGreaterThan(200);

    const designs = (set: Row[], pre: (id: string, r?: Row) => number) => set.map((r) => [logit(clampP(pre(r.id, r))), ...r.f]);
    // 5-fold cross-validation; pattern precision for a held-out row comes from the other folds only. Two ways to split the rows:
    //  - at random (the original: hits from the same fic can sit on both sides, which flatters the model; kept so the history in docs/METRICS.md stays comparable);
    //  - by fic (every hit of a fic is held out together, so the score is for fics the model has not seen: the honest one).
    const K = 5, lambda = Number(process.env.LAMBDA ?? 8);
    type Pred = { pb: number[]; pm: number[]; ys: number[]; src: string[]; ws: number[] };
    const cv = (fold: (r: Row) => number, featureCount: number = FEATURES.length): Pred => {
      const out: Pred = { pb: [], pm: [], ys: [], src: [], ws: [] };
      const testOnly = process.env.LEARN_TEST_ON?.split(","); // a diagnostic: train on every row, score only rows from these sources
      for (let k = 0; k < K; k++) {
        const train = rows.filter((r) => fold(r) !== k), test = rows.filter((r) => fold(r) === k && (!testOnly || testOnly.includes(r.src ?? "audit")));
        const prec = precisions(train);
        // Inside training, each row's own label is left out of its pattern's precision.
        const Xtr = train.map((r) => [logit(clampP(precisions(train, r)(r.id))), ...r.f.slice(0, featureCount)]);
        const w = fit(Xtr, train.map((r) => r.y), lambda, train.map((r) => r.wt ?? 1));
        for (const r of test) {
          const base = prec(r.id);
          const x = [logit(clampP(base)), ...r.f.slice(0, featureCount)];
          let z = w[0];
          for (let i = 0; i < x.length; i++) z += w[i + 1] * x[i];
          out.pb.push(base); out.pm.push(sig(z)); out.ys.push(r.y); out.src.push(r.src ?? "audit"); out.ws.push(r.wt ?? 1);
        }
      }
      return out;
    };
    const rnd = cv((r) => hash(r.key) % K);
    const unseen = cv((r) => hash(r.fic ?? r.key) % K);
    const { pb, pm, ys } = rnd;
    const row = (name: string, ps: number[], y: number[], w?: number[]) => `| ${name} | ${wlogloss(ps, y, w).toFixed(4)} | ${wbrier(ps, y, w).toFixed(4)} | ${wauc(ps, y, w).toFixed(3)} |`;
    if (process.env.COMPARE_FEATURES) {
      const legacy = cv((r) => hash(r.fic ?? r.key) % K, LEGACY_FEATURES.length);
      lines.push("Feature comparison on identical labels and held-out fic folds:", "", "| | log loss | Brier | AUC |", "|---|---|---|---|",
        row("original 15 features", legacy.pm, legacy.ys, legacy.ws),
        row("expanded 49 features", unseen.pm, unseen.ys, unseen.ws), "");
    }
    const rep = (name: string, ps: number[]) => row(name, ps, ys);
    lines.push(`Held-out (${K}-fold, ridge ${lambda}):`, "", "| | log loss | Brier | AUC |", "|---|---|---|---|", rep("pattern record only", pb), rep("pattern record + context", pm), "");
    // Fics the model has not seen, and the same split by where each label came from.
    lines.push("Held-out by fic (every hit of a fic held out together; fics the model has not seen):", "", "| | log loss | Brier | AUC |", "|---|---|---|---|", row("unseen fics: pattern record only", unseen.pb, unseen.ys, unseen.ws), row("unseen fics: pattern record + context", unseen.pm, unseen.ys, unseen.ws), "", "(The unseen-fics rows count each label by how far it is trusted: the owner's own marks 1, a Claude pass less. The random-split rows above count every label 1, as in earlier reports.)", "");
    lines.push("By label source (unseen fics):", "", "| source | hits (wrong) | log loss: record → +context | AUC: record → +context |", "|---|---|---|---|");
    for (const src of ["audit", "report", "weighted"]) {
      const ix = unseen.src.map((x, i) => (x === src ? i : -1)).filter((i) => i >= 0);
      if (!ix.length) continue;
      const pick = (a: number[]) => ix.map((i) => a[i]);
      const y = pick(unseen.ys);
      const a = (ps: number[]) => (y.some((v) => !v) && y.some((v) => v) ? auc(ps, y).toFixed(3) : "n/a");
      lines.push(`| ${src} | ${ix.length} (${y.filter((v) => !v).length}) | ${logloss(pick(unseen.pb), y).toFixed(3)} → ${logloss(pick(unseen.pm), y).toFixed(3)} | ${a(pick(unseen.pb))} → ${a(pick(unseen.pm))} |`);
    }
    lines.push("");
    // What the model is for: pushing mistakes to the front of the review queue. Of the wrong hits, how many are among the 10% least-trusted hits?
    const caught = (ps: number[], y: number[]) => {
      const order = ps.map((p, i) => [p, i] as const).sort((a, b) => a[0] - b[0]);
      const n = Math.ceil(order.length * 0.1), wrong = y.filter((v) => !v).length;
      return wrong ? order.slice(0, n).filter(([, i]) => !y[i]).length / wrong : NaN;
    };
    lines.push(`Wrong hits among the 10% least-trusted (unseen fics): ${(100 * caught(unseen.pb, unseen.ys)).toFixed(0)}% by the pattern record alone, ${(100 * caught(unseen.pm, unseen.ys)).toFixed(0)}% with context (10% would be chance).`, "");
    const better = logloss(pm, ys) < logloss(pb, ys) - 0.002 && auc(pm, ys) > auc(pb, ys);
    if (wlogloss(unseen.pm, unseen.ys, unseen.ws) >= wlogloss(unseen.pb, unseen.ys, unseen.ws)) lines.push("WARNING: on fics the model has not seen, the context does not lower log loss.", "");

    // Final model on everything.
    const precAll = precisions(rows);
    const Xall = rows.map((r) => [logit(clampP(precisions(rows, r)(r.id))), ...r.f]);
    const wAll = fit(Xall, rows.map((r) => r.y), lambda, rows.map((r) => r.wt ?? 1));
    lines.push("Weights:", "", `- bias ${wAll[0].toFixed(3)}, pattern record ${wAll[1].toFixed(3)}`, ...FEATURES.map((n, i) => `- ${n}: ${wAll[i + 2].toFixed(3)}`), "", `Switch on: ${better ? "yes" : "no"} (needs lower held-out log loss and higher AUC).`);
    // What it would do to the wrong rows: share of wrong hits trusted below 0.8, vs right hits.
    const mult = (r: Row) => Math.max(0.4, Math.min(1, probability(precAll(r.id), r.f, { enabled: true, bias: wAll[0], prior: wAll[1], weights: wAll.slice(2) }) / 0.9));
    const low = (set: Row[]) => (set.filter((r) => mult(r) < 0.8).length / Math.max(1, set.length)) * 100;
    lines.push(`In-sample: ${low(rows.filter((r) => !r.y)).toFixed(0)}% of wrong hits trusted below 0.8 vs ${low(rows.filter((r) => r.y)).toFixed(0)}% of right ones.`);
    writeFileSync(join(dir!, "LEARN_REPORT.md"), lines.join("\n"));
    console.log(lines.slice(0, 12).join("\n"));
    if (process.env.WRITE_LEARNED) {
      const p = join(__dirname, "../src/heuristic/learned.ts");
      const src = readFileSync(p, "utf8").replace(
        /export const MODEL: \{[^}]*\} = \{[\s\S]*?\n\};/,
        `export const MODEL: { enabled: boolean; bias: number; prior: number; weights: number[] } = {\n  enabled: ${process.env.FORCE_ENABLE ? "true" : better},\n  bias: ${wAll[0].toFixed(4)},\n  prior: ${wAll[1].toFixed(4)},\n  weights: [${wAll.slice(2).map((v) => v.toFixed(4)).join(", ")}],\n};`,
      );
      writeFileSync(p, src);
    }
    expect(MODEL.weights.length === 0 || MODEL.weights.length === LEGACY_FEATURES.length || MODEL.weights.length === FEATURES.length).toBe(true);
  }, 1_500_000);
});
