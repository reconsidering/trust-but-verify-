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
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const dir = resolve(args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--jobs", "--only"].includes(args[i - 1])))[0] ?? "ao3-samples");
// The longest fics take about 4 GB to read each, so the number of jobs is also capped by memory (one job per 6 GB); --jobs overrides it.
const memJobs = Math.max(2, Math.floor(totalmem() / 2 ** 30 / 6) + 1);
const jobs = Math.max(2, Number(opt("jobs") ?? Math.min(cpus().length, memJobs)));
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
const shardCount = hasSamples && (!quickMode || goldFics.length + sets.length) ? Math.max(1, Math.min(jobs - 1, quickMode ? goldFics.length + sets.length : Infinity)) : 0;
const shards = Array.from({ length: shardCount }, () => ({ gold: [], sets: [] }));
goldFics.forEach((g, i) => shards[i % shardCount].gold.push(g));
sets.forEach((s, i) => shards[(i + goldFics.length) % shardCount].sets.push(s));

const tasks = [run("unit suite", "npx", ["vitest", "run", "--no-isolate", "--reporter=dot"], { AO3_DIR: "", PERF_BUDGET_MS: "30000" })];
shards.forEach((s, i) => {
  if (!s.gold.length && !s.sets.length) return;
  tasks.push(run(`gold + right-set ${i + 1}/${shardCount}`, "npx", ["vitest", "run", "tests/gold-eval.test.ts", "tests/right-set.test.ts", "--reporter=dot", "--no-file-parallelism"], {
    AO3_DIR: dir,
    GOLD_ONLY: s.gold.join(",") || "none",
    RIGHTSET_ONLY: s.sets.join(",") || "none",
    GOLD_REPORT_FILE: join(outDir, `gold-${i}.md`),
    GOLD_TOTALS_FILE: join(outDir, `gold-${i}.json`),
    RIGHTSET_REPORT_FILE: join(outDir, `rightset-${i}.md`),
  }));
});
const t0 = Date.now();
const results = await Promise.all(tasks);
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
