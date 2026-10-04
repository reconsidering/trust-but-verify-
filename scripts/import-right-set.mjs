#!/usr/bin/env node
// Add a mistake report's "looks right" items to tests/right-set/<fic>.json.
//   node scripts/import-right-set.mjs report.md            fold the report in (right marks add or confirm; wrong marks dispute)
//   node scripts/import-right-set.mjs --retire <fic> <hash> [why]   stop enforcing one reading (a deliberate fix, or your own mistake)
// The report is the text copied from the page. Only hashes and names are stored, never the fic's text.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeReport, parseReport, strengthOf } from "./right-set.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "right-set");
mkdirSync(dir, { recursive: true });
const args = process.argv.slice(2);
if (args[0] === "--retire") {
  const [, fic, hash, ...why] = args;
  const file = join(dir, `${fic}.json`);
  if (!existsSync(file)) { console.error(`no ${file}`); process.exit(2); }
  const set = JSON.parse(readFileSync(file, "utf8"));
  const hit = set.entries.filter((e) => e.h === hash);
  hit.forEach((e) => { e.retired = why.join(" ") || true; });
  writeFileSync(file, JSON.stringify(set, null, 1) + "\n");
  console.log(`retired ${hit.length} entr${hit.length === 1 ? "y" : "ies"}`);
  process.exit(0);
}
if (!args[0]) { console.error("usage: import-right-set.mjs report.md | --retire <fic> <hash> [why]"); process.exit(2); }
const parsed = parseReport(readFileSync(args[0], "utf8"));
if (!parsed.slug) { console.error("no “- Title:” line found in the report"); process.exit(2); }
const file = join(dir, `${parsed.slug}.json`);
const set = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { entries: [] };
const date = new Date().toISOString().slice(0, 10);
const r = mergeReport(set, parsed, date);
writeFileSync(file, JSON.stringify(set, null, 1) + "\n");
const tally = {};
for (const e of set.entries) tally[strengthOf(e)] = (tally[strengthOf(e)] ?? 0) + 1;
console.log(`${parsed.title}: ${parsed.right.length} right and ${parsed.wrong.length} wrong items read; ${r.added} added, ${r.confirmed} confirmed, ${r.disputed} disputed. Set now: ${JSON.stringify(tally)}`);
