#!/usr/bin/env node
// Why did the engine read it that way? Prints every pattern match in a fic (or part of one): the pattern, the text it matched, who it made top and
// bottom, and what it was going on (the elided subject, the clause subject, the last subject, the point of view).
//   npm run trace -- <fic> [pattern-regex] [fromPara] [toPara]
//   npm run trace -- belonging "^(push-into|fuck)" 5200 5300
// <fic> is a name in ao3-samples or a path to an .html file. The pattern is a regular expression matched against the pattern id (default: all).
// The engine reads a work twice when it learns epithets; this prints the second, final pass.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [fic, pat, from, to] = process.argv.slice(2);
if (!fic) { console.error("usage: npm run trace -- <fic> [pattern-regex] [fromPara] [toPara]"); process.exit(2); }
const out = join(mkdtempSync(join(tmpdir(), "trace-")), "trace.txt");
const r = spawnSync("npx", ["vitest", "run", "tests/trace.test.ts", "--reporter=dot"], {
  env: { ...process.env, TRACE_FIC: fic, TRACE_PAT: pat ?? "", TRACE_FROM: from ?? "0", TRACE_TO: to ?? "Infinity", TRACE_OUT: out },
  stdio: ["ignore", "ignore", "inherit"],
});
if (r.status) process.exit(r.status);
process.stdout.write(readFileSync(out, "utf8"));
