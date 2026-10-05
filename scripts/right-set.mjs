// The locked set of readings the owner marked "looks right" in mistake reports, and the code to read a report into it.
// Stored in tests/right-set/<fic>.json as hashes and names only, never the fic's own text (same rule as tests/gold).
// People get things wrong, so an entry is only as strong as the evidence for it (see strengthOf): a reading marked right once and never
// confirmed is "single" and only reported when it changes; one marked right in two reports, or a scene the engine itself put at
// 70%+ when it was marked, is "strong" and fails the test when it changes. A sentence that any report also lists as wrong is "disputed"
// and is never enforced. A reading whose change is deliberate (a fix, or the owner's own mistake) is retired, not deleted.

/** The reason labels (src/report.ts FLAG_REASONS) that say the reading itself was wrong. tests/right-set.test.ts checks this list against WRONG_REASONS. */
export const MISREAD_LABELS = [
  "Wrong character is flagged as topping / doing it",
  "Wrong character is flagged as bottoming / receiving",
  "Roles are reversed (top and bottom swapped)",
  "Credited to the wrong character",
  "Wrong speaker: someone else said this line",
  "A pronoun (he / him / his) points at the wrong person",
  "Wrong people (someone outside this pairing)",
  "Wrong sexual act is flagged (e.g. oral shown as anal)",
  "Not a sex act, or not that kind of cue, at all",
  "An everyday action, not in a sexual scene",
  "Figure of speech, idiom or joke, not literal",
  "Solo or reflexive act (himself, his own…) shown as a scene with the partner",
  "A wish, fantasy or \"what if\", not something that happens",
  "Negated or refused (didn't, wouldn't, never)",
];

/** Normalise a sentence to a short stable key: letters only, lower case, the first 60. */
export function normKey(s) {
  return String(s).toLowerCase().replace(/[^a-z]+/g, "").slice(0, 60);
}
export function hashKey(s) {
  let h = 2166136261;
  const k = normKey(s);
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
export function slugOf(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const baseVia = (v) => String(v || "").replace(/~(?:elided|one-sided)$/, "");
export { baseVia };

/** Read a pasted mistake report. Items without a sentence (tag checks, vibe ratings) are left out: they cannot be found again. */
export function parseReport(md) {
  const title = /^- Title:\s*(.+)$/m.exec(md)?.[1]?.trim() ?? "";
  const sections = { right: "", wrong: "" };
  const wrongAt = md.search(/^## Things I think are wrong/m);
  const rightAt = md.search(/^## Things I checked that look right/m);
  const endAt = md.search(/^## How well the confidence/m);
  const cut = (a, b) => (a < 0 ? "" : md.slice(a, b > a ? b : md.length));
  if (wrongAt >= 0 && rightAt > wrongAt) { sections.wrong = cut(wrongAt, rightAt); sections.right = cut(rightAt, endAt); }
  else if (rightAt >= 0 && wrongAt > rightAt) { sections.right = cut(rightAt, wrongAt); sections.wrong = cut(wrongAt, endAt); }
  else { sections.wrong = cut(wrongAt, endAt); sections.right = cut(rightAt, endAt); }
  const items = (text, side) => {
    const out = [];
    for (const block of text.split(/^### \d+\.\s+/m).slice(1)) {
      const head = block.split("\n")[0];
      const m = /^(.+?)\s+·\s+(.+)$/.exec(head);
      if (!m) continue;
      const pairing = m[1].trim();
      const label = m[2].trim();
      const field = (name) => new RegExp(`^- ${name}:\\s*(.+)$`, "m").exec(block)?.[1]?.trim();
      const sentence = field("Sentence")?.replace(/^[“"]|[”"]$/g, "");
      if (!sentence) continue;
      const card = /^(anal|blowjob|rimming|cunnilingus|vaginal)\b/i.exec(label)?.[1]?.toLowerCase() ?? (/^solo/i.test(label) ? "solo" : "");
      if (!card) continue;
      const hint = /\bhint$/i.test(label);
      const shown = field("Shown as") ?? "";
      const conf = /confidence (\d+)%/.exec(block)?.[1];
      const via = field("Pattern");
      let entry;
      if (card === "solo") {
        const who = /^- Shown as a solo act by \*\*(.+?)\*\*/m.exec(block)?.[1] ?? /by \*\*(.+?)\*\*/.exec(shown)?.[1];
        if (!who) continue;
        entry = { kind: "solo", card, pairing, who, via: via ?? "", h: hashKey(sentence) };
      } else if (hint) {
        const hm = /\*\*(.+?)\*\* points toward (NOT )?(top|bottom)/.exec(shown);
        if (!hm) continue;
        entry = { kind: "hint", card, pairing, who: hm[1], role: hm[3], wants: !hm[2], via: baseVia(via), h: hashKey(sentence) };
      } else {
        const tm = /\*\*(.+?)\*\*[^*]*\(top\),\s*\*\*(.+?)\*\*[^*]*\(bottom\)/.exec(shown);
        if (!tm) continue;
        entry = { kind: "scene", card, pairing, top: tm[1], bottom: tm[2], via: baseVia(via), h: hashKey(sentence) };
      }
      if (conf) entry.conf = Number(conf);
      if (side === "wrong") entry.misread = MISREAD_LABELS.some((l) => (field("What is wrong") ?? "").includes(l));
      entry.side = side;
      out.push(entry);
    }
    return out;
  };
  return { title, slug: slugOf(title), right: items(sections.right, "right"), wrong: items(sections.wrong, "wrong") };
}

const idOf = (e) => [e.kind, e.card, e.h, e.who ?? e.top ?? "", e.role ?? e.bottom ?? "", e.via ?? ""].join("|");
export { idOf };

/** Fold a parsed report into a stored set (an object {fic, title, entries}). Returns counts. */
export function mergeReport(set, parsed, date, opts = {}) {
  const weight = typeof opts.weight === "number" && opts.weight > 0 && opts.weight < 1 ? opts.weight : undefined;
  const stamp = weight === undefined ? {} : { weight, source: opts.source ?? "unverified" };
  set.fic = parsed.slug;
  set.title = parsed.title;
  set.entries ??= [];
  const byId = new Map(set.entries.map((e) => [idOf(e), e]));
  let added = 0, confirmed = 0, disputed = 0;
  for (const it of parsed.right) {
    const { side, ...rest } = it;
    const have = byId.get(idOf(rest));
    if (have) {
      if (!(have.seen ?? []).includes(date)) {
        // The owner confirming an entry that came from an unverified pass makes it theirs: full weight. Another unverified pass adds nothing.
        if (weight === undefined) { delete have.weight; have.source = "owner"; have.marks.right++; confirmed++; }
        have.seen = [...(have.seen ?? []), date];
      }
    } else {
      const e = { ...rest, ...stamp, marks: { right: 1, wrong: 0 }, seen: [date] };
      set.entries.push(e); byId.set(idOf(e), e); added++;
    }
  }
  // The same reading listed as wrong in any report (same sentence, act, pattern and person) puts a right mark on it in doubt.
  // A different reading of the same sentence does not: "He kept working the vibe inside him" can be wrong for Eddie and right for Steve.
  const who = (e) => String(e.who ?? e.top ?? "").split(/\s+/)[0].toLowerCase();
  const same = (a, b) => a.h === b.h && a.card === b.card && baseVia(a.via) === baseVia(b.via) && who(a) === who(b);
  for (const it of parsed.wrong) {
    if (!it.misread) continue; // "counted twice" or "something else" does not say the reading itself is wrong
    // An unverified pass cannot overturn something the owner marked right.
    for (const e of set.entries) if (same(e, it) && !(e.disputedOn ?? []).includes(date) && !(weight !== undefined && weightOf(e) === 1)) { e.marks.wrong++; e.disputedOn = [...(e.disputedOn ?? []), date]; disputed++; }
  }
  // Every reading reported wrong is kept (so a later right mark on it is caught); only those marked `misread` (the reasons say the reading itself
  // was off) teach the context model and the reliability table.
  set.negatives ??= [];
  const negIds = new Set(set.negatives.map(idOf));
  for (const it of parsed.wrong) {
    const { side, ...rest } = it;
    if (!negIds.has(idOf(rest))) { set.negatives.push({ ...rest, ...stamp, seen: [date] }); negIds.add(idOf(rest)); }
  }
  // The other way round: a right mark on a reading already reported wrong keeps it disputed.
  for (const it of parsed.right) for (const e of set.entries) if (same(e, it) && (set.negatives ?? []).some((n) => n.misread && same(n, it)) && !(e.disputedOn ?? []).includes(date)) { e.marks.wrong++; e.disputedOn = [...(e.disputedOn ?? []), date]; }
  return { added, confirmed, disputed };
}

/** strong: enforced hard; single: reported only; weighted: reported, and enforced only in bulk; disputed / retired: ignored. */
/** How far a label can be trusted, 0-1. The owner's own marks are 1 (no field); an automated or second-hand pass stores a lower number, e.g. 0.9. */
export const weightOf = (e) => (typeof e.weight === "number" && e.weight > 0 && e.weight < 1 ? e.weight : 1);

/** How many unverified readings in one set may change before it counts as a regression: the label noise (1 minus their mean weight), plus 5 points of margin, never fewer than 2. */
export function allowedWeightedChanges(n, meanWeight) {
  return Math.max(2, Math.floor(n * (1 - meanWeight + 0.05) + 1e-9));
}

export function strengthOf(e) {
  if (e.retired) return "retired";
  if ((e.marks?.wrong ?? 0) > 0) return "disputed";
  // A label that is not fully trusted never fails the check by itself (see tests/right-set.test.ts): it is reported, and counted in bulk.
  if (weightOf(e) < 1) return "weighted";
  if ((e.marks?.right ?? 0) >= 2) return "strong";
  if (e.kind === "scene" && (e.conf ?? 0) >= 70) return "strong";
  return "single";
}
