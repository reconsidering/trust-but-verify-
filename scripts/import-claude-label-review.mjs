// Apply the owner's answers on the October 4-5 Claude labels (review/claude-oct4-5.html, schema claude-label-review/v1) to tests/right-set.
//   node scripts/import-claude-label-review.mjs <answers.json> [--date YYYY-MM-DD] [--dry]
// Only the owner's verdict on the ORIGINAL reading is applied here, to the Claude label it was made about, at full weight:
//   original right, Claude said right  -> the entry becomes the owner's (no weight, a second right mark)
//   original wrong, Claude said wrong  -> the negative becomes the owner's (no weight)
//   original right, Claude said wrong  -> Claude's negative is retired (it stops teaching "wrong")
//   original wrong, Claude said right  -> Claude's entry is retired and the owner's "wrong" is stored as a full-weight negative
// Uncertain, unanswered and "disagree" decisions change nothing. The verdict on today's engine readings is NOT applied: it needs a fresh
// claim-identity check first (docs/CLAUDE_OCT4_5_REVIEW.md). Free-text notes are never copied into tracked files.
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const dry = args.includes("--dry");
const date = opt("date") ?? new Date().toISOString().slice(0, 10);
if (!file) { console.error("usage: node scripts/import-claude-label-review.mjs <answers.json> [--date YYYY-MM-DD] [--dry]"); process.exit(2); }

const batch = JSON.parse(readFileSync("public/review/claude-oct4-5.json", "utf8"));
const feedback = JSON.parse(readFileSync(file, "utf8"));
if (feedback.schema !== batch.schema || feedback.batchId !== batch.batchId || feedback.engineCommit !== batch.engineCommit || feedback.historicalCommit !== batch.historicalCommit || !Array.isArray(feedback.answers)) throw Error("These answers belong to a different review batch.");

// Validate the whole file before changing anything.
const seen = new Set();
for (const a of feedback.answers) {
  const r = batch.items.find((x) => x.id === a.id), s = r && batch.sources.find((x) => x.file === r.fic);
  if (!r || seen.has(a.id) || a.key !== r.key || a.fic !== r.fic || a.paragraph !== r.paragraph || a.sourceSha !== s?.sourceSha || a.proposalRevision !== r.proposal.revision ||
      a.historicalLabel !== r.historical.label || JSON.stringify(a.historicalRecord) !== JSON.stringify(r.historical.record)) throw Error(`Answer ${a.id} does not match its original claim.`);
  seen.add(a.id);
}

const via = (v) => String(v ?? "").replace(/~(?:elided|one-sided)$/, "");
const first = (s) => String(s ?? "").split(/\s+/)[0].toLowerCase();
const same = (e, rec) => via(e.via) === via(rec.via) && e.h === rec.h && e.kind === rec.kind && first(e.who ?? e.top) === first(rec.who ?? rec.top) && first(e.bottom) === first(rec.bottom) && (e.role ?? "") === (rec.role ?? "");

const sets = new Map();
const load = (p) => { if (!sets.has(p)) sets.set(p, JSON.parse(readFileSync(p, "utf8"))); return sets.get(p); };
const done = { keptRight: 0, keptWrong: 0, retiredNegative: 0, retiredEntry: 0, skipped: 0, alreadyOwner: 0, alreadySettled: 0, conflicts: 0, notFound: 0 };
const missing = [], conflicts = [];
for (const a of feedback.answers) {
  const item = batch.items.find((x) => x.id === a.id), rec = a.historicalRecord;
  if (a.proposalReview === "disagree" || (a.originalVerdict !== "correct" && a.originalVerdict !== "wrong")) { done.skipped++; continue; }
  const set = load(item.historical.path);
  const list = rec.misread || a.historicalLabel === "wrong" ? set.negatives ?? [] : set.entries ?? [];
  const hits = list.filter((e) => same(e, rec) && !e.retired);
  if (!hits.length) {
    // Already settled by an earlier owner answer? A live owner entry means "right", a live owner negative means "wrong".
    const all = [...(set.entries ?? []).map((e) => ({ e, v: "correct" })), ...(set.negatives ?? []).map((e) => ({ e, v: "wrong" }))].filter(({ e }) => same(e, rec) && !e.retired && e.source === "owner");
    // Or retired by an earlier owner judgment ("owner judged this wrong …"): that judgment is the owner's label.
    const retired = [...(set.entries ?? []), ...(set.negatives ?? [])].filter((e) => same(e, rec) && e.retired).map((e) => /\b(right|wrong)\b/.exec(e.retired)?.[1]).filter(Boolean).map((v) => (v === "right" ? "correct" : "wrong"));
    if (!all.length && retired.length) { if (retired.includes(a.originalVerdict)) done.alreadySettled++; else { done.conflicts++; conflicts.push(a.id); } }
    else if (!all.length) { done.notFound++; missing.push(a.id); }
    else if (all.some(({ v }) => v === a.originalVerdict)) done.alreadySettled++;
    else { done.conflicts++; conflicts.push(a.id); }
    continue;
  }
  for (const e of hits) {
    if (e.source !== "claude") { if (a.originalVerdict === a.historicalLabel) done.alreadyOwner++; else { done.conflicts++; conflicts.push(a.id); } continue; }
    if (a.originalVerdict === "correct" && a.historicalLabel === "correct") { delete e.weight; e.source = "owner"; e.marks.right++; e.seen = [...new Set([...(e.seen ?? []), date])]; done.keptRight++; }
    else if (a.originalVerdict === "wrong" && a.historicalLabel === "wrong") { delete e.weight; e.source = "owner"; e.seen = [...new Set([...(e.seen ?? []), date])]; done.keptWrong++; }
    else if (a.originalVerdict === "correct") { e.retired = `owner judged this right in the October 4-5 review ${date}`; done.retiredNegative++; }
    else {
      e.retired = `owner judged this wrong in the October 4-5 review ${date}`;
      const { marks, seen: _s, weight, source, retired, ...rest } = e;
      (set.negatives ??= []).push({ ...rest, misread: true, source: "owner", seen: [date] });
      done.retiredEntry++;
    }
  }
}
console.log(`${feedback.answers.length} answers`, done);
if (missing.length) console.log(`no live label found (retired or never stored): ${missing.join(", ")}`);
if (conflicts.length) console.log(`differs from an earlier owner label, left alone: ${conflicts.join(", ")}`);
if (!dry) for (const [p, set] of sets) writeFileSync(p, JSON.stringify(set, null, 1) + "\n");
