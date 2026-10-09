#!/usr/bin/env node
// Reads the owner's answers on the hands-free page and reports how well the detector did (precision and an estimate of recall).
//   node scripts/hands-free-import.mjs <answers dir> [round dir=ao3-samples/.hands-free/round-1] [--write tests/hands-free/round-1.json] [--include-peeked]
// <answers dir> is the page's saved "reviews" collection (one JSON file per answer: { n, key, v, note }), saved with ArtifactData (out_dir).
// --write keeps the answers (keys, verdicts, what the detector said; no story text or notes) as a record the next change can be measured against.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { summarise } from "./hands-free-summary.mjs";

const args = process.argv.slice(2);
const includePeeked = args.includes("--include-peeked");
const w = args.indexOf("--write");
const writeTo = w >= 0 ? args[w + 1] : undefined;
const pos = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--write");
const [answersDir, roundDir = "ao3-samples/.hands-free/round-1"] = pos;
if (!answersDir) { console.error("usage: hands-free-import.mjs <answers dir> [round dir] [--write file]"); process.exit(2); }
const manifest = JSON.parse(readFileSync(join(roundDir, "manifest.json"), "utf8"));
const dir = existsSync(join(answersDir, "reviews")) ? join(answersDir, "reviews") : answersDir;
const answers = {}, peeked = new Set();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(join(dir, f), "utf8")); const a = d.data ?? d;
  if (a && a.n && a.v) { answers[a.n] = a.v; if (a.peek === "before") peeked.add(a.n); if (a.key && a.key !== manifest.picked.find((p) => p.n === a.n)?.key) { console.error(`answer ${a.n}: key does not match the page that was built`); process.exit(1); } }
}
// An answer given after opening the analyzer's and Claude's panel is not blind, so it is left out of the numbers unless --include-peeked is given.
const dropped = includePeeked ? [] : [...peeked];
for (const n of dropped) delete answers[n];
if (peeked.size) console.log(`${peeked.size} answers were given after opening the answers panel${includePeeked ? " (kept)" : " (left out of the numbers; use --include-peeked to keep them)"}.`);
const s = summarise(manifest.picked, answers);
const pct = (x) => x === null ? "n/a" : `${Math.round(x * 100)}%`;
const line = (t) => `${t.n} passages: ${t.yes} hands-free, ${t.touched} touched, ${t.other} not him, ${t.unsure} not sure, ${t.unanswered} unanswered`;
console.log(`Passages the detector flagged: ${line(s.flagged)}\n  precision (hands-free among the judged): ${pct(s.precision)}`);
console.log(`Passages it did not flag, no hand nearby (a sample): ${line(s.clear)}\n  estimated hands-free passages it missed: ${s.estimatedMissed === null ? "n/a" : Math.round(s.estimatedMissed)}\n  estimated recall: ${pct(s.recall)}`);
console.log(`Unflagged, a hand nearby: ${line(s.manual)}`);
if (s.missedKeys.length) console.log(`Missed passages the owner marked hands-free (keys): ${s.missedKeys.join(", ")}`);
if (writeTo) {
  mkdirSync(dirname(writeTo), { recursive: true });
  const kept = manifest.picked.filter((p) => answers[p.n]).map((p) => ({ key: p.key, fic: p.fic, para: p.para, sourceSha256: p.sourceSha256, verdict: answers[p.n], detected: p.detected, detectedCredit: p.detectedCredit, manualNearby: p.manualNearby, stratumWeight: p.stratumWeight }));
  writeFileSync(writeTo, JSON.stringify({ made: new Date().toISOString().slice(0, 10), seed: manifest.seed, poolSize: manifest.poolSize, answers: kept }, null, 1) + "\n");
  console.log(`Saved ${kept.length} answers to ${writeTo} (no story text, no notes).`);
}
