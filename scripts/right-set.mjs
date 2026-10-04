// The locked set of readings the owner marked "looks right" in mistake reports, and the code to read a report into it.
// Stored in tests/right-set/<fic>.json as hashes and names only, never the fic's own text (same rule as tests/gold).
// People get things wrong, so an entry is only as strong as the evidence for it (see strengthOf): a reading marked right once and never
// confirmed is "single" and only reported when it changes; one marked right in two reports, or a scene the engine itself put at
// 70%+ when it was marked, is "strong" and fails the test when it changes. A sentence that any report also lists as wrong is "disputed"
// and is never enforced. A reading whose change is deliberate (a fix, or the owner's own mistake) is retired, not deleted.

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
        const who = /by \*\*(.+?)\*\*/.exec(shown)?.[1];
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
export function mergeReport(set, parsed, date) {
  set.fic = parsed.slug;
  set.title = parsed.title;
  set.entries ??= [];
  const byId = new Map(set.entries.map((e) => [idOf(e), e]));
  const bySentence = (h) => set.entries.filter((e) => e.h === h);
  let added = 0, confirmed = 0, disputed = 0;
  for (const it of parsed.right) {
    const { side, ...rest } = it;
    const have = byId.get(idOf(rest));
    if (have) {
      if (!(have.seen ?? []).includes(date)) { have.marks.right++; have.seen = [...(have.seen ?? []), date]; confirmed++; }
    } else {
      const e = { ...rest, marks: { right: 1, wrong: 0 }, seen: [date] };
      set.entries.push(e); byId.set(idOf(e), e); added++;
    }
  }
  // A sentence listed as wrong in any report puts every right-marked reading of it in doubt.
  for (const it of parsed.wrong) {
    for (const e of bySentence(it.h)) { if (!(e.disputedOn ?? []).includes(date)) { e.marks.wrong++; e.disputedOn = [...(e.disputedOn ?? []), date]; disputed++; } }
  }
  // The other way round: a right mark on a sentence already disputed keeps it disputed.
  const wrongHashes = new Set(parsed.wrong.map((w) => w.h));
  for (const e of set.entries) if (wrongHashes.has(e.h) && !(e.disputedOn ?? []).includes(date)) { e.marks.wrong++; e.disputedOn = [...(e.disputedOn ?? []), date]; }
  return { added, confirmed, disputed };
}

/** strong: enforced hard; single: reported only; disputed / retired: ignored. */
export function strengthOf(e) {
  if (e.retired) return "retired";
  if ((e.marks?.wrong ?? 0) > 0) return "disputed";
  if ((e.marks?.right ?? 0) >= 2) return "strong";
  if (e.kind === "scene" && (e.conf ?? 0) >= 70) return "strong";
  return "single";
}
