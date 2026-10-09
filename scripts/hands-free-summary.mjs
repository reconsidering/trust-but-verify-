// What the owner's answers on the hands-free page say about the detector. Pure function, tested in tests/hands-free-summary.test.ts.
// picked: manifest.json "picked" rows; answers: { [n]: "yes" | "touched" | "other" | "unsure" }.
//   precision  = of the detector's flagged passages, how many were hands-free ("yes") against the ones the owner judged "touched" or "not him"
//   recall     = flagged "yes" over (flagged "yes" + the estimated hands-free passages it did NOT flag). The estimate weights each sampled unflagged
//                passage by how many like it its fic has (stratumWeight), so it stands for the whole pool, not only the sample.
export function summarise(picked, answers) {
  const tally = () => ({ n: 0, yes: 0, touched: 0, other: 0, unsure: 0, unanswered: 0 });
  const flagged = tally(), clear = tally(), manual = tally();
  let missedEstimate = 0, weightAnswered = 0, weightAll = 0;
  const missedKeys = [];
  for (const p of picked) {
    const v = answers[p.n] ?? answers[String(p.n)];
    const t = p.detected ? flagged : p.manualNearby ? manual : clear;
    t.n++;
    if (!v) { t.unanswered++; continue; }
    t[v] = (t[v] ?? 0) + 1;
    if (!p.detected && !p.manualNearby && p.stratumWeight) {
      weightAll += p.stratumWeight;
      if (v !== "unsure") { weightAnswered += p.stratumWeight; if (v === "yes") { missedEstimate += p.stratumWeight; missedKeys.push(p.key); } }
    }
  }
  const judged = flagged.yes + flagged.touched + flagged.other;
  const precision = judged ? flagged.yes / judged : null;
  // Unsure answers are left out of the estimate, so scale it up to the weight that was actually answered.
  const missed = weightAnswered ? missedEstimate * (weightAll / weightAnswered) : null;
  const recall = missed === null ? null : flagged.yes + missed ? flagged.yes / (flagged.yes + missed) : null;
  return { flagged, clear, manual, precision, estimatedMissed: missed, recall, missedKeys };
}
