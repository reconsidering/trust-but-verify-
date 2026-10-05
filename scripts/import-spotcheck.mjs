#!/usr/bin/env node
// Turns the owner's answers on a blind spot-check page (rows built from Claude-made right-set labels) into the owner's own labels.
//   node scripts/import-spotcheck.mjs rows.json <answers dir> [--date YYYY-MM-DD]
// rows.json: the page's rows (each has key = "<pattern>#<hash>", fic, a). <answers dir>: where ArtifactData saved the page's "reviews" collection.
// For every row the owner marked Fine or Wrong (Not sure is skipped), the matching Claude-made label in tests/right-set/*.json is replaced by theirs:
//   Fine, Claude said right   -> the entry becomes the owner's (full weight, a second right mark, so it is enforced like any owner mark)
//   Wrong, Claude said wrong  -> the negative becomes the owner's (full weight)
//   Fine, Claude said wrong   -> Claude's negative is retired (it stops teaching "wrong")
//   Wrong, Claude said right  -> Claude's entry is retired and the owner's "wrong" is stored as a full-weight negative
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { baseVia } from "./right-set.mjs";

const args = process.argv.slice(2);
const di = args.indexOf("--date");
const date = di >= 0 ? args.splice(di, 2)[1] : new Date().toISOString().slice(0, 10);
const [rowsPath, answersDir] = args;
if (!rowsPath || !answersDir) { console.error("usage: import-spotcheck.mjs rows.json answersDir [--date YYYY-MM-DD]"); process.exit(2); }
const rows = JSON.parse(readFileSync(rowsPath, "utf8")).rows;
const dir = existsSync(join(answersDir, "reviews")) ? join(answersDir, "reviews") : answersDir;
const MAP = { wrong: "wrong", fine: "ok" };
const answers = new Map();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(join(dir, f), "utf8")); const a = d.data ?? d;
  if (MAP[a.v]) answers.set(a.key || rows.find((r) => r.n === a.n)?.key, MAP[a.v]);
}
const setDir = "tests/right-set";
const files = readdirSync(setDir).filter((f) => f.endsWith(".json"));
const sets = new Map(files.map((f) => [f, JSON.parse(readFileSync(join(setDir, f), "utf8"))]));
const k = (e) => `${baseVia(e.via ?? "")}#${e.h}`;
const first = (s) => String(s ?? "").split(/\s+/)[0].toLowerCase();
const who = (e) => first(e.who ?? e.top);
const done = { sameRight: 0, sameWrong: 0, retiredNegative: 0, retiredEntry: 0, notFound: 0 };
for (const r of rows) {
  const you = answers.get(r.key);
  if (!you) continue;
  let hit = false;
  for (const [f, set] of sets) {
    const es = (set.entries ?? []).filter((e) => k(e) === r.key && e.source === "claude");
    const ns = (set.negatives ?? []).filter((e) => k(e) === r.key && e.source === "claude");
    const narrow = (xs) => (xs.length > 1 ? xs.filter((e) => who(e) === first(r.a)) : xs);
    for (const e of narrow(es)) {
      hit = true;
      if (you === "ok") { delete e.weight; e.source = "owner"; e.marks.right++; e.seen = [...new Set([...(e.seen ?? []), date])]; done.sameRight++; }
      else {
        e.retired = `owner judged this wrong in the blind spot-check ${date}`;
        const { marks, seen, weight, source, retired, ...rest } = e;
        (set.negatives ??= []).push({ ...rest, misread: true, source: "owner", seen: [date] });
        done.retiredEntry++;
      }
    }
    for (const n of narrow(ns)) {
      hit = true;
      if (you === "wrong") { delete n.weight; n.source = "owner"; n.seen = [...new Set([...(n.seen ?? []), date])]; done.sameWrong++; }
      else { n.retired = `owner judged this right in the blind spot-check ${date}`; done.retiredNegative++; }
    }
  }
  if (!hit) done.notFound++;
}
for (const [f, set] of sets) writeFileSync(join(setDir, f), JSON.stringify(set, null, 1) + "\n");
console.log(done);
