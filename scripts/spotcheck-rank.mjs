// Which Claude-made labels is the owner most likely to disagree with? Learns from every answer the owner has given on spot-check pages
// (tests/spotcheck/rounds.json) and ranks the Claude-labelled readings not yet checked by the chance that Claude's label is wrong.
// A small ridge logistic regression, deliberately simple because there are only a few hundred answers:
//   - whether Claude called the reading wrong (its "wrong" calls held up far less often than its "right" ones);
//   - how much the engine itself trusts the reading (a "wrong" call on a reading the engine is sure of, a "right" call on one it doubts);
//   - the kind of reading (narrated act / solo / other);
//   - how often the owner disagreed with Claude on this fic, and on this pattern (smoothed, never counting the row itself).
const sig = (z) => 1 / (1 + Math.exp(-z));
const logit = (p) => Math.log(Math.min(0.995, Math.max(0.005, p)) / (1 - Math.min(0.995, Math.max(0.005, p))));
export const baseOf = (via) => String(via ?? "").replace(/~elided$/, "");
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

/** Rows the owner has answered Fine or Wrong on (Not sure teaches nothing), with whether the owner disagreed with Claude. */
export function answeredRows(rounds) {
  return rounds.flatMap((r) => r.answers).filter((a) => a.owner === "ok" || a.owner === "wrong").map((a) => ({ ...a, disagree: a.owner !== a.claude ? 1 : 0 }));
}

function rateTable(rows, keyOf, skip) {
  const t = new Map();
  for (const r of rows) { if (r === skip) continue; const k = keyOf(r); const e = t.get(k) ?? [0, 0]; e[0] += r.disagree; e[1]++; t.set(k, e); }
  return t;
}
export function makeFeaturizer(rows, skip) {
  const used = rows.filter((r) => r !== skip);
  const prior = used.length ? used.reduce((s, r) => s + r.disagree, 0) / used.length : 0.3;
  const byFic = rateTable(rows, (r) => r.fic, skip), byPat = rateTable(rows, (r) => baseOf(r.via), skip);
  const K = 3;
  const rate = (t, k) => { const e = t.get(k) ?? [0, 0]; return (e[0] + K * prior) / (e[1] + K) - prior; };
  return (c) => {
    const wrong = c.claude === "wrong" ? 1 : 0, lp = logit(c.p ?? 0.9);
    return [1, wrong, lp, wrong * lp, c.kind === "act" ? 1 : 0, c.kind === "solo" || c.kind === "masturbation" ? 1 : 0, rate(byFic, c.fic), rate(byPat, baseOf(c.via))];
  };
}

function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i]; }
  return x;
}
/** Ridge logistic regression by Newton steps; the bias (first column) is not penalised. */
export function fitLogistic(X, y, lambda = 2, iters = 25) {
  const d = X[0].length, w = new Array(d).fill(0);
  for (let it = 0; it < iters; it++) {
    const g = new Array(d).fill(0), H = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let i = 0; i < X.length; i++) {
      const p = sig(X[i].reduce((s, v, j) => s + v * w[j], 0)), r = p * (1 - p) + 1e-6;
      for (let j = 0; j < d; j++) { g[j] += (p - y[i]) * X[i][j]; for (let k = 0; k < d; k++) H[j][k] += r * X[i][j] * X[i][k]; }
    }
    for (let j = 1; j < d; j++) { g[j] += lambda * w[j]; H[j][j] += lambda; }
    const step = solve(H, g);
    for (let j = 0; j < d; j++) w[j] -= step[j];
  }
  return w;
}
export function auc(ps, ys) {
  let win = 0, tot = 0;
  for (let i = 0; i < ps.length; i++) if (ys[i] === 1) for (let j = 0; j < ps.length; j++) if (ys[j] === 0) { tot++; win += ps[i] > ps[j] ? 1 : ps[i] === ps[j] ? 0.5 : 0; }
  return tot ? win / tot : NaN;
}

/** Train on every answer so far. Returns the scoring function and how well it predicts the owner's disagreements on answers it has not seen (leave-one-out AUC). */
export function train(rounds) {
  const rows = answeredRows(rounds);
  if (rows.length < 20) return { score: null, rows: rows.length, loo: NaN };
  const fz = makeFeaturizer(rows);
  const w = fitLogistic(rows.map(fz), rows.map((r) => r.disagree));
  const loo = rows.map((r) => { const f = makeFeaturizer(rows, r); const ww = fitLogistic(rows.filter((x) => x !== r).map(makeFeaturizer(rows, r)), rows.filter((x) => x !== r).map((x) => x.disagree)); return sig(f(r).reduce((s, v, j) => s + v * ww[j], 0)); });
  return { score: (c) => sig(fz(c).reduce((s, v, j) => s + v * w[j], 0)), rows: rows.length, loo: auc(loo, rows.map((r) => r.disagree)), weights: w, base: rows.reduce((s, r) => s + r.disagree, 0) / rows.length };
}

/**
 * The next page: the `n` readings most likely to be mislabelled, at most `perPattern` of one pattern (so one pattern does not fill the page), plus
 * `explore` drawn at random from the rest (so the ranking is also checked on readings it did not pick, and its estimates stay honest).
 * Anything already answered, including Not sure, is left out.
 */
export function rank(cands, rounds, { n = 100, explore = 10, perPattern = 4 } = {}) {
  const asked = new Set(rounds.flatMap((r) => r.answers.map((a) => a.key)));
  const fresh = cands.filter((c) => !asked.has(c.key));
  const t = train(rounds);
  const scored = fresh.map((c) => ({ ...c, score: t.score ? t.score(c) : c.claude === "wrong" ? 0.6 : 0.2 })).sort((a, b) => b.score - a.score || hash(a.key) - hash(b.key));
  const per = new Map();
  const take = (list, limit, tag) => {
    const out = [];
    for (const c of list) {
      if (out.length >= limit) break;
      const b = baseOf(c.via);
      if ((per.get(b) ?? 0) >= perPattern) continue;
      per.set(b, (per.get(b) ?? 0) + 1);
      out.push({ ...c, picked: tag });
    }
    return out;
  };
  const top = take(scored, n - explore, "ranked");
  const chosen = new Set(top.map((c) => c.key));
  const rest = scored.filter((c) => !chosen.has(c.key)).sort((a, b) => hash(a.key + "x") - hash(b.key + "x"));
  const rnd = take(rest, explore, "random");
  const picked = [...top, ...rnd].sort((a, b) => hash(a.key + "p") - hash(b.key + "p"));
  return { picked, model: t, available: fresh.length };
}
