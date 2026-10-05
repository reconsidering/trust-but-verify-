#!/usr/bin/env node
// Did this change alter any verdict on the sample fics? One command instead of two eval runs and a compare.
//   npm run regress -- [--base <git ref>] [--quick] [--jobs N] [dir=ao3-samples] [--all]
// The baseline is the git ref (default: HEAD when src/ has uncommitted changes, else origin/main) built in a throwaway worktree. Its results
// are kept per engine version (<dir>/.eval/), so a baseline you have already run costs nothing; only the working tree is run each time.
// --quick runs only the tagged pass (about half the time). Exit status 1 when a verdict changed.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const dir = resolve(args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--base", "--jobs"].includes(args[i - 1])))[0] ?? "ao3-samples");
const quick = flag("quick");
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const dirty = git("status", "--porcelain", "--", "src").length > 0;
const base = opt("base") ?? (dirty ? "HEAD" : "origin/main");
const sha = (b) => createHash("sha1").update(b).digest("hex").slice(0, 16);
const evalArgs = (extra = []) => [dir, ...(quick ? ["--quick"] : []), ...(opt("jobs") ? ["--jobs", opt("jobs")] : []), ...extra];

// The engine version of the baseline, worked out the same way scripts/eval.mjs does it, from the files at that ref.
const files = git("ls-tree", "-r", "--name-only", base, "--", "src").split("\n").filter((f) => f.endsWith(".ts")).sort();
const baseKey = sha(files.map((f) => execFileSync("git", ["show", `${base}:${f}`], { maxBuffer: 1 << 28 })).reduce((h, b) => h + sha(b), ""));
const baseJson = join(dir, ".eval", `v-${baseKey}${quick ? "-quick" : ""}.json`);

const run = (cwd) => {
  const r = spawnSync("node", [join(cwd, "scripts", "eval.mjs"), ...evalArgs()], { cwd, stdio: "inherit" });
  if (r.status) { console.error("eval failed"); process.exit(r.status); }
};

if (existsSync(baseJson)) console.log(`baseline ${base} (engine ${baseKey.slice(0, 8)}): already run, reusing it`);
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
const cmp = spawnSync("node", ["scripts/eval-compare.mjs", baseJson, nowJson, ...(flag("all") ? ["--all"] : [])], { stdio: "inherit" });
process.exit(cmp.status ?? 1);
