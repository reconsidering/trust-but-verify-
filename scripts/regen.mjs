#!/usr/bin/env node
// Regenerate the two files that are made from the labels: src/heuristic/reliability.ts (per-pattern precision) and src/heuristic/learned.ts
// (the context model). Do it once after a batch of label or pattern PRs has merged, not inside every PR: the files change on every label import,
// so PRs that carry them conflict with each other.
//   npm run regen -- [--reliability-only] [dir=ao3-samples]
// The model needs the local sample fics (ao3-samples) and takes about 9 minutes; the reliability table needs only tests/right-set (a few seconds).
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const dir = resolve(args.filter((a) => !a.startsWith("--"))[0] ?? "ao3-samples");
const run = (label, env, files) => {
  console.log(`${label}…`);
  const t0 = Date.now();
  const r = spawnSync("npx", ["vitest", "run", ...files, "--no-isolate"], { stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status) { console.error(`${label} failed`); process.exit(r.status); }
  console.log(`${label} done in ${Math.round((Date.now() - t0) / 1000)}s`);
};
run("reliability table", { WRITE_RELIABILITY: "1" }, ["tests/reliability.test.ts"]);
if (args.includes("--reliability-only")) process.exit(0);
if (!existsSync(dir)) { console.error(`No sample folder at ${dir}: the context model needs it (or pass --reliability-only).`); process.exit(2); }
run("context model", { AO3_DIR: dir, WRITE_LEARNED: "1" }, ["tests/learn.test.ts"]);
// Keep the history of the context model's held-out numbers in docs/METRICS.md (one row per retraining).
try {
  const rep = readFileSync(resolve(dir, "LEARN_REPORT.md"), "utf8");
  const hits = /(\d+) labelled hits found again[^;]*; (\d+) wrong/.exec(rep);
  const rows = [...rep.matchAll(/^\| pattern record(?: only| \+ context) \| ([\d.]+) \| [\d.]+ \| ([\d.]+) \|$/gm)];
  const unseen = [...rep.matchAll(/^\| unseen fics: pattern record(?: only| \+ context) \| ([\d.]+) \| [\d.]+ \| ([\d.]+) \|$/gm)];
  if (hits && rows.length === 2) {
    const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    const n = Number(hits[1]).toLocaleString("en-US");
    const un = unseen.length === 2 ? `${unseen[0][1]} → ${unseen[1][1]} | ${unseen[0][2]} → ${unseen[1][2]}` : "not recorded | not recorded";
    appendFileSync("docs/METRICS.md", `| ${new Date().toISOString().slice(0, 10)} | ${n} (${hits[2]}) | ${rows[0][1]} → ${rows[1][1]} | ${rows[0][2]} → ${rows[1][2]} | ${un} | ${sha} |\n`);
    console.log("Added a row to docs/METRICS.md.");
  }
} catch (e) { console.log(`(could not update docs/METRICS.md: ${e.message})`); }
console.log("Regenerated. Run `npm run check`, then commit src/heuristic/reliability.ts and learned.ts on their own.");
