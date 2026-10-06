// Replaces Claude-made labels in tests/right-set with the owner's own, from spot-check answers.
//   Fine, Claude said right   -> the entry becomes the owner's (full weight, a second right mark, so it is enforced like any owner mark)
//   Wrong, Claude said wrong  -> the negative becomes the owner's (full weight)
//   Fine, Claude said wrong   -> Claude's negative is retired (it stops teaching "wrong")
//   Wrong, Claude said right  -> Claude's entry is retired and the owner's "wrong" is stored as a full-weight negative
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { baseVia } from "./right-set.mjs";

/** answers: [{ key, owner: "ok"|"wrong", a? }] (a = the person the reading credits, to tell apart two labels on one sentence). */
export function applyOwnerAnswers(answers, date, setDir = "tests/right-set") {
  const files = readdirSync(setDir).filter((f) => f.endsWith(".json"));
  const sets = new Map(files.map((f) => [f, JSON.parse(readFileSync(join(setDir, f), "utf8"))]));
  const k = (e) => `${baseVia(e.via ?? "")}#${e.h}`;
  const first = (s) => String(s ?? "").split(/\s+/)[0].toLowerCase();
  const who = (e) => first(e.who ?? e.top);
  const done = { sameRight: 0, sameWrong: 0, retiredNegative: 0, retiredEntry: 0, notFound: 0 };
  for (const r of answers) {
    if (r.owner !== "ok" && r.owner !== "wrong") continue;
    let hit = false;
    for (const set of sets.values()) {
      const es = (set.entries ?? []).filter((e) => k(e) === r.key && e.source === "claude");
      const ns = (set.negatives ?? []).filter((e) => k(e) === r.key && e.source === "claude");
      const narrow = (xs) => (xs.length > 1 && r.a ? xs.filter((e) => who(e) === first(r.a)) : xs);
      for (const e of narrow(es)) {
        hit = true;
        if (r.owner === "ok") { delete e.weight; e.source = "owner"; e.marks.right++; e.seen = [...new Set([...(e.seen ?? []), date])]; done.sameRight++; }
        else {
          e.retired = `owner judged this wrong in a blind spot-check ${date}`;
          const { marks, seen, weight, source, retired, ...rest } = e;
          (set.negatives ??= []).push({ ...rest, misread: true, source: "owner", seen: [date] });
          done.retiredEntry++;
        }
      }
      for (const n of narrow(ns)) {
        hit = true;
        if (r.owner === "wrong") { delete n.weight; n.source = "owner"; n.seen = [...new Set([...(n.seen ?? []), date])]; done.sameWrong++; }
        else { n.retired = `owner judged this right in a blind spot-check ${date}`; done.retiredNegative++; }
      }
    }
    if (!hit) done.notFound++;
  }
  for (const [f, set] of sets) writeFileSync(join(setDir, f), JSON.stringify(set, null, 1) + "\n");
  return done;
}

/**
 * The owner answered a reading again and changed their mind (or the first question was worded wrongly): make the labels say exactly the new answer,
 * whatever state the earlier answer left them in. answers: [{ key, owner: "ok"|"wrong" }].
 */
export function overrideOwnerAnswers(answers, date, setDir = "tests/right-set") {
  const files = readdirSync(setDir).filter((f) => f.endsWith(".json"));
  const sets = new Map(files.map((f) => [f, JSON.parse(readFileSync(join(setDir, f), "utf8"))]));
  const k = (e) => `${baseVia(e.via ?? "")}#${e.h}`;
  const done = { entriesRestored: 0, entriesRetired: 0, negativesRetired: 0, negativesRestored: 0, negativesCreated: 0, notFound: 0 };
  for (const r of answers) {
    if (r.owner !== "ok" && r.owner !== "wrong") continue;
    let hit = false;
    for (const set of sets.values()) {
      const es = (set.entries ?? []).filter((e) => k(e) === r.key);
      const ns = (set.negatives ?? []).filter((e) => k(e) === r.key);
      if (!es.length && !ns.length) continue;
      hit = true;
      if (r.owner === "ok") {
        for (const e of es) { if (e.retired || e.source !== "owner") { delete e.retired; delete e.weight; e.source = "owner"; e.marks.right = Math.max(e.marks.right, 2); e.seen = [...new Set([...(e.seen ?? []), date])]; done.entriesRestored++; } }
        for (const n of ns) if (!n.retired) { n.retired = `owner re-judged this right ${date}`; done.negativesRetired++; }
      } else {
        for (const n of ns) { if (n.retired || n.source !== "owner") { delete n.retired; delete n.weight; n.source = "owner"; n.misread = true; n.seen = [...new Set([...(n.seen ?? []), date])]; done.negativesRestored++; } }
        for (const e of es) if (!e.retired) { e.retired = `owner re-judged this wrong ${date}`; done.entriesRetired++; }
        if (!ns.length && es.length) { const { marks, seen, weight, source, retired, ...rest } = es[0]; (set.negatives ??= []).push({ ...rest, misread: true, source: "owner", seen: [date] }); done.negativesCreated++; }
      }
    }
    if (!hit) done.notFound++;
  }
  for (const [f, set] of sets) writeFileSync(join(setDir, f), JSON.stringify(set, null, 1) + "\n");
  return done;
}
