#!/usr/bin/env node
// Set up the sample fics in a new session: unzip them into ao3-samples/ and read every one once, so later checks and regressions are cached.
//   npm run setup-fics -- path/to/ao3-samples.zip [--no-eval]
// The fics are never committed (ao3-samples/ is git-ignored); keep the zip on your own machine and upload it at the start of a session.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const zip = args.find((a) => !a.startsWith("--"));
if (!zip || !existsSync(zip)) { console.error("usage: npm run setup-fics -- <path to ao3-samples.zip> [--no-eval]"); process.exit(2); }
const dir = resolve("ao3-samples");
mkdirSync(dir, { recursive: true });
let r = spawnSync("unzip", ["-o", "-q", resolve(zip), "-d", dir], { stdio: "inherit" });
if (r.error || r.status) r = spawnSync("python3", ["-c", "import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])", resolve(zip), dir], { stdio: "inherit" });
if (r.status) { console.error("could not unzip"); process.exit(1); }
const n = readdirSync(dir).filter((f) => f.endsWith(".html")).length;
console.log(`${n} fics in ${dir}`);
if (args.includes("--no-eval")) process.exit(0);
console.log("reading every fic once so later checks are cached (about 6 minutes)…");
process.exit(spawnSync("node", ["scripts/eval.mjs", dir], { stdio: "inherit" }).status ?? 1);
