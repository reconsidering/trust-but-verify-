#!/usr/bin/env node
// Add a mistake report's "looks right" items to tests/right-set/<fic>.json.
//   node scripts/import-right-set.mjs report.md|looks-right-<fic>.json   fold a report, or the page's saved file, in (right marks add or confirm; wrong marks dispute)
//   node scripts/import-right-set.mjs report.md --title "Name" --weight 0.9 --source claude   the labels come from an unverified pass: counted at that weight, checked in bulk
//   node scripts/import-right-set.mjs --fixed <fic> [why]   the reported mistakes were fixed: stop counting them against their patterns
//   node scripts/import-right-set.mjs --retire <fic> <hash> [why]   stop enforcing one reading (a deliberate fix, or your own mistake)
// The report is the text copied from the page. Only hashes and names are stored, never the fic's text.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeReport, parseReport, slugOf, strengthOf } from "./right-set.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "right-set");
mkdirSync(dir, { recursive: true });
const args = process.argv.slice(2);
if (args[0] === "--retire") {
  const [, fic, hash, ...why] = args;
  const file = join(dir, `${fic}.json`);
  if (!existsSync(file)) { console.error(`no ${file}`); process.exit(2); }
  const set = JSON.parse(readFileSync(file, "utf8"));
  const hit = [...set.entries, ...(set.negatives ?? [])].filter((e) => e.h === hash);
  hit.forEach((e) => { e.retired = why.join(" ") || true; });
  writeFileSync(file, JSON.stringify(set, null, 1) + "\n");
  console.log(`retired ${hit.length} entr${hit.length === 1 ? "y" : "ies"}`);
  process.exit(0);
}
if (args[0] === "--fixed") {
  // The mistakes reported in this fic have been fixed in the engine, so they no longer happen and must not keep counting against the pattern.
  const [, fic, ...why] = args;
  const file = join(dir, `${fic}.json`);
  if (!existsSync(file)) { console.error(`no ${file}`); process.exit(2); }
  const set = JSON.parse(readFileSync(file, "utf8"));
  let n = 0;
  for (const e of set.negatives ?? []) if (!e.retired) { e.retired = why.join(" ") || "fixed"; n++; }
  writeFileSync(file, JSON.stringify(set, null, 1) + "\n");
  console.log(`marked ${n} reported mistakes as fixed`);
  process.exit(0);
}
if (!args[0]) { console.error("usage: import-right-set.mjs report.md [--title Name] [--weight 0.9 --source claude] | --fixed <fic> [why] | --retire <fic> <hash> [why]"); process.exit(2); }
// --weight 0.9 --source claude: the labels come from an unverified pass (a second reader, or Claude). They teach the reliability table and the context model
// at that weight and are checked in bulk, not one by one; a later mark of your own makes the entry yours at full weight.
const wi = args.indexOf("--weight");
const weightArg = wi >= 0 ? Number(args.splice(wi, 2)[1]) : undefined;
const si = args.indexOf("--source");
const sourceArg = si >= 0 ? args.splice(si, 2)[1] : undefined;
if (weightArg !== undefined && !(weightArg > 0 && weightArg < 1)) { console.error("--weight must be between 0 and 1 (exclusive); omit it for your own marks"); process.exit(2); }
const raw = readFileSync(args[0], "utf8");
// Either the mistake report text, or the file the page's "Save looks-right set" button downloads.
// A report copied from a plain-text or PDF upload has no “- Title:” line: --title "Name" supplies it.
const ti = args.indexOf("--title");
const titleArg = ti >= 0 ? args.splice(ti, 2)[1] : "";
const parsed = args[0].endsWith(".json") ? JSON.parse(raw) : parseReport(raw);
if (titleArg) { parsed.title = titleArg; parsed.slug = slugOf(titleArg); }
if (!parsed.slug) { console.error("no “- Title:” line found in the report"); process.exit(2); }
const file = join(dir, `${parsed.slug}.json`);
const set = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { entries: [] };
const date = new Date().toISOString().slice(0, 10);
const r = mergeReport(set, parsed, date, { weight: weightArg, source: sourceArg });
writeFileSync(file, JSON.stringify(set, null, 1) + "\n");
const tally = {};
for (const e of set.entries) tally[strengthOf(e)] = (tally[strengthOf(e)] ?? 0) + 1;
console.log(`${parsed.title}: ${parsed.right.length} right and ${parsed.wrong.length} wrong items read; ${r.added} added, ${r.confirmed} confirmed, ${r.disputed} disputed. Set now: ${JSON.stringify(tally)}`);
