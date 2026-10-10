#!/usr/bin/env node
// The checks that say whether a change is RIGHT, run on every change.
//   npm run check -- [--accept] [--jobs N] [--quick] [--only name,name] [dir=ao3-samples]
//   1. the unit suite and the build,
//   2. the gold labels (tests/gold: hand-checked verdicts, scenes, point of view, text senders), scored against the last accepted totals,
//   3. the right-set replay (the readings you marked right in mistake reports; a "strong" one that changed fails).
// The gold and right-set runs are spread over the other cores, a few fics each. Without the sample fics (they are local only) only 1 runs.
// --accept records this run's gold totals as the new baseline (after you have judged any drop to be a deliberate, correct change).
// --quick is the fast inner loop while you work on one fic: the unit suite and the build, plus the gold and right-set runs only for the fics named
// with --only (a part of a name is enough: --only belonging,werecompeer). Run the full check once before you commit.
// The other half is `npm run regress`: it finds changes nobody has labelled, and you read what moved.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const dir = resolve(args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--jobs", "--only", "--heap"].includes(args[i - 1])))[0] ?? "ao3-samples");
// Reading even the longest fic takes about 1.3 GB (measured, scripts/profile.mjs), and a shard replays several fics one after another, so the
// number of jobs is capped by memory: the unit suite runs alongside and keeps about 3 GB, and a shard's process measured about 4 GB (a 3 GB heap plus the rest);
// with one per 3 GB on a 15 GB machine all four shards were killed and re-run one at a time. --jobs overrides it.
const memJobs = Math.max(2, Math.floor((totalmem() / 2 ** 30 - 3) / 4));
const jobs = Math.max(2, Number(opt("jobs") ?? Math.min(cpus().length, memJobs)));
const heapMb = Number(opt("heap") ?? 3000); // per shard: makes V8 collect garbage between fics instead of growing to several GB
const hasSamples = existsSync(dir);
const outDir = join(dir, ".check");
if (hasSamples) mkdirSync(outDir, { recursive: true });

const run = (label, cmd, cmdArgs, env = {}) =>
  new Promise((ok) => {
    const t0 = Date.now();
    const p = spawn(cmd, cmdArgs, { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    p.stdout.on("data", (d) => (log += d));
    p.stderr.on("data", (d) => (log += d));
    p.on("close", (code) => ok({ label, code: code ?? 1, log, secs: Math.round((Date.now() - t0) / 1000) }));
  });

const onlyNames = opt("only")?.split(",").filter(Boolean);
const squash = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
const wanted = (n) => !onlyNames || onlyNames.some((o) => squash(n).includes(squash(o)) || squash(o).includes(squash(n)));
const quickMode = flag("quick") || !!onlyNames;
const goldFics = existsSync("tests/gold") ? readdirSync("tests/gold").filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join("tests/gold", f), "utf8")).fic).filter(wanted) : [];
const sets = existsSync("tests/right-set") ? readdirSync("tests/right-set").filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).filter(wanted) : [];
const shardCount = hasSamples && (!quickMode || goldFics.length + sets.length) ? Math.max(1, Math.min(jobs, quickMode ? goldFics.length + sets.length : Infinity)) : 0;
const shards = Array.from({ length: shardCount }, () => ({ gold: [], sets: [], load: 0 }));
// Biggest first onto the least-loaded shard; a fic's cost is its file size (a set is matched to its fic by name, else the median size).
const sizes = hasSamples ? readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => [squash(f.replace(/\.html$/, "")), statSync(join(dir, f)).size]) : [];
// Time is better than size when an earlier eval recorded it (<dir>/.eval/v-*.json).
const recorded = new Map();
const evalRoot = join(dir, ".eval");
if (hasSamples && existsSync(evalRoot)) for (const f of readdirSync(evalRoot).filter((f) => f.startsWith("v-") && f.endsWith(".json"))) {
  try { for (const r of JSON.parse(readFileSync(join(evalRoot, f), "utf8")).fics) recorded.set(squash(r.file), Math.max(recorded.get(squash(r.file)) ?? 0, (r.ms?.tagged ?? 0) * 1e4)); } catch { /* skip a bad file */ }
}
const median = sizes.map((x) => x[1]).sort((a, b) => a - b)[sizes.length >> 1] ?? 1;
const costOf = (n) => recorded.get(squash(n)) ?? (sizes.find((x) => x[0] === squash(n)) ?? sizes.find((x) => x[0].includes(squash(n)) || squash(n).includes(x[0])))?.[1] ?? median;
const ficOfSet = (slug) => { try { return JSON.parse(readFileSync(join("tests/right-set", `${slug}.json`), "utf8")).fic ?? slug; } catch { return slug; } };
for (const j of [...goldFics.map((n) => ({ n, kind: "gold" })), ...sets.map((n) => ({ n, kind: "sets" }))].map((j) => ({ ...j, cost: costOf(j.kind === "sets" ? ficOfSet(j.n) : j.n) })).sort((a, b) => b.cost - a.cost)) {
  const sh = shards.reduce((a, b) => (b.load < a.load ? b : a));
  sh[j.kind].push(j.n);
  sh.load += j.cost;
}

const tasks = [run("unit suite", "npx", ["vitest", "run", "--no-isolate", "--reporter=dot"], { AO3_DIR: "", PERF_BUDGET_MS: "30000" })];
const shardTask = (s, i, heap) => run(`gold + right-set ${i + 1}/${shardCount}`, "npx", ["vitest", "run", "tests/gold-eval.test.ts", "tests/right-set.test.ts", "--reporter=dot", "--no-file-parallelism"], {
  AO3_DIR: dir,
  NODE_OPTIONS: `--max-old-space-size=${heap}`,
  GOLD_ONLY: s.gold.join(",") || "none",
  RIGHTSET_ONLY: s.sets.join(",") || "none",
  GOLD_REPORT_FILE: join(outDir, `gold-${i}.md`),
  GOLD_TOTALS_FILE: join(outDir, `gold-${i}.json`),
  RIGHTSET_REPORT_FILE: join(outDir, `rightset-${i}.md`),
});
shards.forEach((s, i) => {
  if (!s.gold.length && !s.sets.length) return;
  tasks.push(shardTask(s, i, heapMb));
});
const t0 = Date.now();
const results = await Promise.all(tasks);
// A shard that ran out of memory (not one whose test failed) is run again on its own with a bigger heap, once the others are done.
for (let k = 0; k < results.length; k++) {
  const m = /^gold \+ right-set (\d+)\//.exec(results[k].label);
  if (m && results[k].code && /OOMErrorHandler|heap out of memory|SIGKILL|SIGABRT/.test(results[k].log)) {
    console.log(`${results[k].label} ran out of memory; running it again alone with a bigger heap`);
    results[k] = await shardTask(shards[Number(m[1]) - 1], Number(m[1]) - 1, 8000);
  }
}
results.push(await run("build", "npm", ["run", "build"]));
let failed = false;
for (const r of results) {
  console.log(`${r.code ? "FAIL" : "ok  "} ${r.label} (${r.secs}s)`);
  if (r.code) { failed = true; console.log(r.log.split("\n").filter((l) => /FAIL|×|Error|expected|error/.test(l)).slice(0, 14).join("\n")); }
}

// Gold totals against the last accepted ones (a quick run covers only some fics, so its totals are shown but not compared or saved).
if (hasSamples && quickMode) {
  const keys = ["verdictOk", "verdicts", "sceneRight", "sceneFlipped", "sceneMissed", "falsePos"];
  const tot = Object.fromEntries(keys.map((k) => [k, 0]));
  for (let i = 0; i < shardCount; i++) { const f = join(outDir, `gold-${i}.json`); if (existsSync(f)) { const t = JSON.parse(readFileSync(f, "utf8")); for (const k of keys) tot[k] += t[k] ?? 0; } }
  console.log(`\nquick run (${onlyNames ? `only ${onlyNames.join(", ")}` : "unit suite only"}): gold verdicts ${tot.verdictOk}/${tot.verdicts}, scenes right ${tot.sceneRight} (flipped ${tot.sceneFlipped}, missed ${tot.sceneMissed}), false positives ${tot.falsePos}. Not compared with the baseline: run the full check before committing.`);
} else if (hasSamples) {
  const keys = ["verdictOk", "verdicts", "sceneRight", "sceneFlipped", "sceneMissed", "falsePos", "reported", "povOk", "povN", "textOk", "textN"];
  const tot = Object.fromEntries(keys.map((k) => [k, 0]));
  for (let i = 0; i < shardCount; i++) {
    const f = join(outDir, `gold-${i}.json`);
    if (!existsSync(f)) continue;
    const t = JSON.parse(readFileSync(f, "utf8"));
    for (const k of keys) tot[k] += t[k] ?? 0;
  }
  const baseFile = join(dir, ".eval", "gold-baseline.json");
  const base = existsSync(baseFile) ? JSON.parse(readFileSync(baseFile, "utf8")) : undefined;
  const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "n/a");
  console.log(`\ngold: verdicts ${tot.verdictOk}/${tot.verdicts}, scenes right ${tot.sceneRight} (flipped ${tot.sceneFlipped}, missed ${tot.sceneMissed}), false positives ${tot.falsePos}, point of view ${pct(tot.povOk, tot.povN)}, text senders ${tot.textOk}/${tot.textN}`);
  const worse = [];
  if (base) {
    if (tot.verdictOk < base.verdictOk) worse.push(`verdicts right ${base.verdictOk} → ${tot.verdictOk}`);
    if (tot.sceneRight < base.sceneRight) worse.push(`scenes right ${base.sceneRight} → ${tot.sceneRight}`);
    if (tot.sceneFlipped > base.sceneFlipped) worse.push(`scenes flipped ${base.sceneFlipped} → ${tot.sceneFlipped}`);
    if (tot.sceneMissed > base.sceneMissed) worse.push(`scenes missed ${base.sceneMissed} → ${tot.sceneMissed}`);
    if (tot.falsePos > base.falsePos) worse.push(`false positives ${base.falsePos} → ${tot.falsePos}`);
    if (tot.povN && base.povN && tot.povOk / tot.povN < base.povOk / base.povN - 0.005) worse.push(`point of view ${pct(base.povOk, base.povN)} → ${pct(tot.povOk, tot.povN)}`);
    if (tot.textOk < base.textOk) worse.push(`text senders right ${base.textOk} → ${tot.textOk}`);
    console.log(worse.length ? `gold got WORSE than the accepted baseline: ${worse.join("; ")}` : "gold is no worse than the accepted baseline");
    if (worse.length && !flag("accept")) failed = true;
  } else console.log("no accepted gold baseline yet: recording this run as the baseline");
  if (!base || flag("accept")) {
    mkdirSync(join(dir, ".eval"), { recursive: true });
    writeFileSync(baseFile, JSON.stringify(tot));
    console.log("gold baseline saved");
  }
} else console.log("\nno ao3-samples folder: gold labels and the right-set replay were skipped");
console.log(`\n${failed ? "CHECK FAILED" : "check passed"} in ${Math.round((Date.now() - t0) / 1000)}s`);
process.exit(failed ? 1 : 0);
