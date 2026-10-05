#!/usr/bin/env node
// Compare two evaluation runs (folders holding eval.json, or the eval.json files themselves).
//   node scripts/eval-compare.mjs <old> <new> [--all] [--hits] [--full] [--hits-file <path>]
// Prints verdict changes (anal / blowjob / rimming / cunnilingus, who is top and bottom) and, with --all, every change in
// scene counts, hint counts and confidence. Exit status 1 when any verdict changed.
// --hits lists the readings that moved. By default it prints a short summary per fic (counts, the patterns involved, readings that only changed
// person, and a few examples) and writes every reading to --hits-file (default: eval-hits.txt in the temp folder); --full prints everything.
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const all = process.argv.includes("--all");
const showHits = process.argv.includes("--hits");
if (!a || !b) { console.error("usage: eval-compare.mjs <old> <new> [--all]"); process.exit(2); }
const load = (p) => JSON.parse(readFileSync(statSync(p).isDirectory() ? join(p, "eval.json") : p, "utf8")).fics;
for (const p of [a, b]) if (!existsSync(p)) { console.error(`missing ${p}`); process.exit(2); }
const old = new Map(load(a).map((f) => [f.file, f]));
const ACTS = ["anal", "blowjob", "rimming", "cunnilingus"];
let verdicts = 0, small = 0;
for (const f of load(b)) {
  const o = old.get(f.file);
  if (!o) { console.log(`+ new fic ${f.file}`); continue; }
  for (const mode of ["blind", "tagged"]) {
    const oldP = new Map(o[mode].map((p) => [p.pairing, p]));
    for (const p of f[mode]) {
      const q = oldP.get(p.pairing);
      if (!q) { console.log(`${f.file} [${mode}] new pairing ${p.pairing}`); continue; }
      for (const act of ACTS) {
        const x = q[act], y = p[act];
        const who = (r) => `${r.verdict}${r.top ? ` ${r.top} / ${r.bottom}` : ""}`;
        if (who(x) !== who(y)) { verdicts++; console.log(`VERDICT ${f.file} [${mode}] ${p.pairing} ${act}: ${who(x)} -> ${who(y)}`); }
        else if (all && (x.scenes !== y.scenes || x.hints !== y.hints || x.confidence !== y.confidence)) { small++; console.log(`  ${f.file} [${mode}] ${p.pairing} ${act}: scenes ${x.scenes}->${y.scenes}, hints ${x.hints}->${y.hints}, confidence ${x.confidence}->${y.confidence}`); }
      }
    }
    for (const q of o[mode]) if (!f[mode].some((p) => p.pairing === q.pairing)) console.log(`${f.file} [${mode}] pairing gone: ${q.pairing}`);
  }
}
// --hits: which individual readings moved (hint or scene credited to someone, with the sentence), so each change can be read and judged.
if (showHits) {
  const full = process.argv.includes("--full");
  const hi = process.argv.indexOf("--hits-file");
  const hitsFile = hi >= 0 ? process.argv[hi + 1] : join(tmpdir(), "eval-hits.txt");
  const detail = [];
  const fmt = (x) => { const [via, who, kind, para, sentence] = x.split("|"); return `${via} · ${who} · ${kind} · para ${para} · ${sentence}`; };
  const viaOf = (x) => x.split("|")[0].replace(/~elided$/, "");
  const sameButWho = (x) => { const [via, , kind, para, sentence] = x.split("|"); return `${via}|${kind}|${para}|${sentence}`; };
  const tally = (xs) => { const m = new Map(); for (const x of xs) m.set(viaOf(x), (m.get(viaOf(x)) ?? 0) + 1); return [...m].sort((p, q) => q[1] - p[1]).map(([v, n]) => (n > 1 ? `${v}×${n}` : v)).join(", "); };
  let changed = 0, goneAll = 0, newAll = 0, movedAll = 0;
  for (const f of load(b)) {
    const o = old.get(f.file);
    if (!o?.hits || !f.hits) continue;
    const so = new Set(o.hits), sn = new Set(f.hits);
    const lost = o.hits.filter((x) => !sn.has(x)), gained = f.hits.filter((x) => !so.has(x));
    if (!lost.length && !gained.length) continue;
    changed++;
    // The same sentence read by the same pattern but credited to someone else: a person change, not a reading that appeared or went.
    const gainedBy = new Map(gained.map((x) => [sameButWho(x), x]));
    const moved = lost.filter((x) => gainedBy.has(sameButWho(x)));
    const movedSet = new Set(moved), movedNew = new Set(moved.map((x) => gainedBy.get(sameButWho(x))));
    const goneOnly = lost.filter((x) => !movedSet.has(x)), newOnly = gained.filter((x) => !movedNew.has(x));
    goneAll += goneOnly.length; newAll += newOnly.length; movedAll += moved.length;
    detail.push(`\n${f.file}: ${lost.length} gone, ${gained.length} new (${moved.length} only changed person)`);
    for (const x of lost) detail.push(`  - ${fmt(x)}`);
    for (const x of gained) detail.push(`  + ${fmt(x)}`);
    if (full) {
      console.log(`\n${f.file}: ${lost.length} reading${lost.length === 1 ? "" : "s"} gone, ${gained.length} new`);
      for (const x of lost) console.log(`  - ${fmt(x)}`);
      for (const x of gained) console.log(`  + ${fmt(x)}`);
      continue;
    }
    console.log(`\n${f.file}: ${goneOnly.length} gone, ${newOnly.length} new, ${moved.length} moved to another person`);
    if (goneOnly.length) console.log(`  gone: ${tally(goneOnly)}`);
    if (newOnly.length) console.log(`  new: ${tally(newOnly)}`);
    if (moved.length) console.log(`  moved: ${tally(moved)}; e.g. ${moved[0].split("|")[1]} → ${gainedBy.get(sameButWho(moved[0])).split("|")[1]} (${moved[0].split("|")[4].slice(0, 60)})`);
    for (const x of goneOnly.slice(0, 2)) console.log(`  - ${fmt(x).slice(0, 150)}`);
    for (const x of newOnly.slice(0, 2)) console.log(`  + ${fmt(x).slice(0, 150)}`);
  }
  writeFileSync(hitsFile, detail.join("\n") + "\n");
  if (!full) console.log(`\n${changed} fic${changed === 1 ? "" : "s"} with moved readings: ${goneAll} gone, ${newAll} new, ${movedAll} only changed person. Every reading is in ${hitsFile}; --full prints them all.`);
}
for (const [n] of old) if (!load(b).some((f) => f.file === n)) console.log(`- fic gone ${n}`);
console.log(`${verdicts} verdict change${verdicts === 1 ? "" : "s"}${all ? `, ${small} count/confidence change${small === 1 ? "" : "s"}` : ""}`);
process.exit(verdicts ? 1 : 0);
