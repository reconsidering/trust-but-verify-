#!/usr/bin/env node
// Did this change alter any verdict on the sample fics? One command instead of two eval runs and a compare.
//   npm run regress -- [--base <git ref>] [--hits] [--all] [--quick] [--jobs N] [--fast] [--only name,name] [dir=ao3-samples]
// Compares the working tree with a baseline over ALL the sample fics. It finds unlabelled changes; it cannot say whether a change is right, so
// read what moved (--hits lists each reading that appeared or disappeared) and, for ones you judge correct, add them to tests/gold.
// Per-change checks that DO say right/wrong (units, gold labels, right-set) are `npm run check`.
// --fast skips the 10 slowest fics: NOT a safe check (changes land in all kinds of fics, big ones included); only for a quick look.
// The baseline is the git ref (default: HEAD when src/ has uncommitted changes, else origin/main) built in a throwaway worktree. Its results
// are kept per engine version (<dir>/.eval/), so a baseline you have already run costs nothing; only the working tree is run each time.
// --only name,name compares just those fics (exact file names): the fast loop while working on one fic; run the full thing before committing.
// --quick runs only the tagged pass (about half the time). Exit status 1 when a verdict changed.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const dir = resolve(args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--base", "--jobs", "--only"].includes(args[i - 1])))[0] ?? "ao3-samples");
const quick = flag("quick");
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const dirty = git("status", "--porcelain", "--", "src").length > 0;
const base = opt("base") ?? (dirty ? "HEAD" : "origin/main");
const sha = (b) => createHash("sha1").update(b).digest("hex").slice(0, 16);
const full = !flag("fast");
const FAST_SKIP = 10;
// Fast set: all fics but the slowest ones (by the last recorded time, else file size), keeping any fic a right-set report came from.
const names = readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, "")).sort();
const timeOf = (() => {
  const ms = new Map();
  const evalRoot = join(dir, ".eval");
  if (existsSync(evalRoot)) for (const f of readdirSync(evalRoot).filter((f) => f.startsWith("v-") && f.endsWith(".json"))) {
    try { for (const r of JSON.parse(readFileSync(join(evalRoot, f), "utf8")).fics) ms.set(r.file, Math.max(ms.get(r.file) ?? 0, (r.ms?.tagged ?? 0) + (r.ms?.blind ?? 0))); } catch { /* skip a bad file */ }
  }
  return (n) => ms.get(n) ?? readFileSync(join(dir, `${n}.html`)).length / 100;
})();
const rightSlugs = existsSync("tests/right-set") ? readdirSync("tests/right-set").filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : [];
const fromReport = (n) => rightSlugs.some((r) => r === n || r.includes(n) || n.includes(r));
const slowest = new Set([...names].sort((a, b) => timeOf(b) - timeOf(a)).slice(0, FAST_SKIP).filter((n) => !fromReport(n)));
const fastSet = names.filter((n) => !slowest.has(n));
const onlyArg = opt("only")?.split(",").filter(Boolean);
const only = onlyArg ?? (full ? undefined : fastSet);
if (onlyArg) { const bad = onlyArg.filter((n) => !names.includes(n)); if (bad.length) { console.error(`No such fic in ${dir}: ${bad.join(", ")}`); process.exit(2); } console.log(`ONLY ${onlyArg.join(", ")}: not a full check.`); }
else if (!full) console.log(`FAST SET, NOT A SAFE CHECK: ${fastSet.length} of ${names.length} fics (left out: ${[...slowest].join(", ")}).`);
const evalArgs = (extra = []) => [dir, ...(quick ? ["--quick"] : []), ...(only ? ["--only", only.join(",")] : []), ...(opt("jobs") ? ["--jobs", opt("jobs")] : []), ...extra];

// The engine version of the baseline, worked out the same way scripts/eval.mjs does it, from the files at that ref.
const files = git("ls-tree", "-r", "--name-only", base, "--", "src").split("\n").filter((f) => f.endsWith(".ts")).sort();
const baseKey = sha(files.map((f) => execFileSync("git", ["show", `${base}:${f}`], { maxBuffer: 1 << 28 })).reduce((h, b) => h + sha(b), ""));
const baseJson = join(dir, ".eval", `v-${baseKey}${quick ? "-quick" : ""}.json`);

const run = (cwd) => {
  const r = spawnSync("node", [join(cwd, "scripts", "eval.mjs"), ...evalArgs()], { cwd, stdio: "inherit" });
  if (r.status) { console.error("eval failed"); process.exit(r.status); }
};

const baseHasAll = existsSync(baseJson) && (!only || (() => { try { const have = new Set(JSON.parse(readFileSync(baseJson, "utf8")).fics.map((f) => f.file)); return only.every((n) => have.has(n)); } catch { return false; } })());
if (baseHasAll) console.log(`baseline ${base} (engine ${baseKey.slice(0, 8)}): already run, reusing it`);
else {
  console.log(`baseline ${base} (engine ${baseKey.slice(0, 8)}): running it in a temporary copy`);
  const tmp = mkdtempSync(join(tmpdir(), "regress-"));
  try {
    git("worktree", "add", "--detach", tmp, base);
    symlinkSync(resolve("node_modules"), join(tmp, "node_modules"));
    // The baseline's engine (src/), but today's evaluation scripts and test, so both sides are measured the same way.
    cpSync("scripts", join(tmp, "scripts"), { recursive: true });
    cpSync("tests/ao3-eval.test.ts", join(tmp, "tests", "ao3-eval.test.ts"));
    run(tmp);
  } finally {
    try { git("worktree", "remove", "--force", tmp); } catch { rmSync(tmp, { recursive: true, force: true }); }
  }
}

console.log("working tree:");
run(process.cwd());
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".ts") ? [join(d, e.name)] : []));
const nowKey = sha(walk("src").sort().map((f) => readFileSync(f)).reduce((h, b) => h + sha(b), ""));
const nowJson = join(dir, ".eval", `v-${nowKey}${quick ? "-quick" : ""}.json`);
// Results for other fics may sit in the same version folder from earlier runs: compare only the fics in this tier.
const tierOnly = (path) => {
  if (!only) return path;
  const j = JSON.parse(readFileSync(path, "utf8"));
  const out = join(mkdtempSync(join(tmpdir(), "regress-cmp-")), "eval.json");
  writeFileSync(out, JSON.stringify({ ...j, fics: j.fics.filter((f) => only.includes(f.file)) }));
  return out;
};
const cmp = spawnSync("node", ["scripts/eval-compare.mjs", tierOnly(baseJson), tierOnly(nowJson), ...(flag("all") ? ["--all"] : []), ...(flag("hits") ? ["--hits"] : [])], { stdio: "inherit" });
process.exit(cmp.status ?? 1);
