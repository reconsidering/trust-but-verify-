// Turn the owner's verdicts on TODAY'S engine readings (October 4-5 Claude-label review) into confidence labels, after a claim-identity check.
//   CLAUDE_CURRENT_OUT=hits.json npx vitest run tests/claude-label-current.test.ts     (reads the fics; hashes only)
//   node scripts/import-claude-label-current.mjs <answers.json> <hits.json> [--date YYYY-MM-DD] [--dry]
// An answer becomes a label only when the item had exactly ONE current reading and that same reading (pattern, paragraph, people, role, act)
// is found again in the fic now. Groups of two or more readings are skipped (a verdict on a group says "at least one is wrong"), and so are
// items with no current reading, uncertain answers, and readings the engine no longer makes. Writes tests/labels/zz-owner-claude-oct4-5-current.json.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const [answersPath, hitsPath] = args.filter((a) => !a.startsWith("--"));
const date = args.includes("--date") ? args[args.indexOf("--date") + 1] : new Date().toISOString().slice(0, 10);
const dry = args.includes("--dry");
if (!answersPath || !hitsPath) { console.error("usage: node scripts/import-claude-label-current.mjs <answers.json> <hits.json> [--date YYYY-MM-DD] [--dry]"); process.exit(2); }

const batch = JSON.parse(readFileSync("public/review/claude-oct4-5.json", "utf8"));
const bytes = readFileSync(answersPath), feedback = JSON.parse(bytes), hits = JSON.parse(readFileSync(hitsPath, "utf8"));
if (feedback.schema !== batch.schema || feedback.batchId !== batch.batchId || feedback.engineCommit !== batch.engineCommit || !Array.isArray(feedback.answers)) throw Error("These answers belong to a different review batch.");

const stat = { answered: 0, labelled: 0, uncertain: 0, noCurrent: 0, group: 0, goneSince: 0, sameClaim: 0, differentClaim: 0 };
const byKey = new Map();
for (const a of feedback.answers) {
  const item = batch.items.find((x) => x.id === a.id), source = batch.sources.find((x) => x.file === item?.fic);
  if (!item || a.key !== item.key || a.sourceSha !== source?.sourceSha) throw Error(`Answer ${a.id} does not match its original claim.`);
  if (a.currentVerdict !== "correct" && a.currentVerdict !== "wrong") { if (a.currentVerdict === "uncertain") stat.uncertain++; continue; }
  stat.answered++;
  if (!item.current.length) { stat.noCurrent++; continue; }
  if (item.current.length > 1) { stat.group++; continue; }
  const c = item.current[0];
  const found = (hits[item.fic] ?? []).filter((h) => h.via === c.pattern && h.para === c.para && h.a === c.a && (h.b ?? "") === (c.b ?? "") && (h.role ?? "") === (c.role ?? "") && h.act === c.act);
  const keys = [...new Set(found.map((h) => h.key))];
  if (keys.length !== 1) { stat.goneSince++; continue; }
  const o = item.historical.original;
  if (o.a === c.a && (o.b ?? "") === (c.b ?? "") && (o.role ?? "") === (c.role ?? "") && o.act === c.act) stat.sameClaim++; else stat.differentClaim++;
  const claim = { fic: item.fic, sourceSha: source.sourceSha, paragraph: c.para, pattern: c.pattern, act: c.act, kind: c.kind, a: c.a, b: c.b ?? "", role: c.role ?? "" };
  const list = byKey.get(keys[0]) ?? []; list.push({ id: a.id, key: keys[0], fic: item.fic, paragraph: c.para, sourceSha: source.sourceSha, claim, verdict: a.currentVerdict, errors: a.errors ?? [], updatedAt: a.updatedAt }); byKey.set(keys[0], list);
}
const labels = {}, superseded = {}, answers = [];
for (const [key, list] of byKey) {
  const first = list[0];
  const same = (x, y) => ["fic", "paragraph", "pattern", "act", "kind", "a", "b", "role"].every((k) => x.claim[k] === y.claim[k]);
  if (list.some((x) => x.verdict !== first.verdict || !same(x, first))) { labels[key] = "unclear"; superseded[key] = { reason: "Conflicting owner decisions or different claims share this key." }; }
  else labels[key] = first.verdict === "correct" ? "ok" : "wrong";
  answers.push(...list.filter((x, i) => list.findIndex((y) => y.id === x.id) === i));
}
stat.labelled = Object.keys(labels).length;
console.log(stat, { ok: Object.values(labels).filter((v) => v === "ok").length, wrong: Object.values(labels).filter((v) => v === "wrong").length, unclear: Object.values(labels).filter((v) => v === "unclear").length });
const out = "tests/labels/zz-owner-claude-oct4-5-current.json";
if (!dry) writeFileSync(out, JSON.stringify({ made: date, how: "Owner verdicts on today's engine readings in the October 4-5 Claude-label review. Only items with exactly one current reading that the engine still makes at the same paragraph, pattern, people and role. Groups, absences and uncertain answers are excluded; no free text is kept.", batchId: batch.batchId, engineCommit: batch.engineCommit, labels, answers, superseded, feedbackSha: createHash("sha256").update(bytes).digest("hex") }, null, 1) + "\n");
