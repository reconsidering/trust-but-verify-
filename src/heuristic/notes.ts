// Context clues from the author's summary, notes and end notes. They are never scanned as story. Two uses:
//   1. explicit statements ("Top Eddie", "Steve is the sub", "Dean in a cock cage", "collared Steve") become tag-like strings that the
//      ordinary tag reader understands, marked "(from notes)" where they are shown;
//   2. keywords (cage, chastity, collar, leash) switch on the cage and collar scans when the tags don't mention them.

import type { Ao3Meta } from "../ao3";

export interface NoteContext {
  /** Tag-like strings, in forms readTags and the wearer logic already read. */
  tags: string[];
  cage: boolean;
  collar: boolean;
}

const NAME = "[A-Z][\\w'’-]*(?:\\s+[A-Z][\\w'’-]*)?";
const ROLE = "(?:[Tt]op|[Bb]ottom|[Dd]om|[Dd]omme|[Ss]ub|[Ss]witch|[Ss]ubmissive|[Dd]ominant|[Vv]ers|[Vv]ersatile)";
/** Role words that stand for a person, not a concept: "Top Eddie", "Bottom!Steve", "Dom Bucky". */
const ROLE_NAME = new RegExp(`\\b(${ROLE})(?:\\s*!\\s*|\\s+)(${NAME})`, "g");
/** "Steve is the sub", "Eddie's a total top". */
const NAME_IS = new RegExp(`\\b(${NAME})\\s+(?:is|was|'s|’s)\\s+(?:the\\s+|a\\s+|an\\s+)?(?:(?:total|power|service|pillow)\\s+)?(${ROLE})\\b`, "g");
const NAME_G = new RegExp(NAME, "g");
/** "in a cock cage", "wearing a chastity device": the wearer is the closest name before it ("Steve spends the whole story in a cock cage"). */
const CAGE_PHRASE = /\b(?:in|wearing|wears|is wearing|locked in|gets locked in)\s+(?:a\s+|the\s+)?(?:cock[- ]?cage|chastity(?:\s+(?:cage|device|belt))?)/g;
const COLLAR_PHRASE = /\b(?:in|wearing|wears|is wearing)\s+(?:a\s+)?(?:collar|leash)/g;
const PUTS_IN = new RegExp(`\\b(?:puts?|put|locks?|keeps?)\\s+(${NAME})\\s+in\\s+(?:a\\s+)?(?:cock[- ]?cage|chastity)`, "g");
const COLLARED = new RegExp(`\\b(?:[Cc]ollared|[Ll]eashed)\\s*!?\\s+(${NAME})`, "g");

/** Words that look like names at a sentence start but aren't. */
const NOT_NAME = /^(?:The|This|That|These|Those|He|She|They|It|We|You|I|His|Her|Their|Our|My|Your|There|Here|Some|Any|All|Both|Each|Every|One|No|Not|And|But|Or|So|If|When|While|As|After|Before|Then|Now|Just|Also|Very|Too|Gun|Gear)$/;

export function noteContext(meta: Pick<Ao3Meta, "summary" | "notes" | "endNotes" | "chapterNotes">): NoteContext {
  const text = [meta.summary, meta.notes, meta.endNotes, ...(meta.chapterNotes ?? [])].filter(Boolean).join("\n");
  const out = new Set<string>();
  if (!text) return { tags: [], cage: false, collar: false };
  const add = (s: string) => out.add(s.replace(/\s+/g, " ").trim());
  const clean = (n: string) => n.replace(/['’]s?$/, "").trim();
  const ok = (n: string) => !!n && !NOT_NAME.test(n.split(/\s+/)[0]);
  for (const m of text.matchAll(ROLE_NAME)) if (ok(m[2])) add(`${m[1][0].toUpperCase()}${m[1].slice(1)} ${clean(m[2])}`);
  for (const m of text.matchAll(NAME_IS)) if (ok(m[1])) add(`${clean(m[1])} is a ${m[2].toLowerCase()}`);
  const nearestName = (before: string) => [...before.slice(-60).matchAll(NAME_G)].map((x) => x[0]).filter(ok).pop();
  for (const m of text.matchAll(CAGE_PHRASE)) { const n = nearestName(text.slice(0, m.index)); if (n) add(`${clean(n)} in a cock cage`); }
  for (const m of text.matchAll(PUTS_IN)) if (ok(m[1])) add(`${clean(m[1])} in a cock cage`);
  for (const m of text.matchAll(COLLARED)) if (ok(m[1])) add(`Collared ${clean(m[1])}`);
  for (const m of text.matchAll(COLLAR_PHRASE)) { const n = nearestName(text.slice(0, m.index)); if (n) add(`${clean(n)} in a collar`); }
  const negated = (re: RegExp) => new RegExp(`\\b(?:no|without|not|zero)\\s+(?:\\w+\\s+){0,2}?${re.source}`, "i").test(text);
  const cageRe = /\b(?:cock[- ]?cages?|chastity|caged cock)\b/i;
  const collarRe = /\b(?:collars?|collared|leash(?:es|ed)?)\b(?!\s*bone)/i;
  return {
    tags: [...out],
    cage: cageRe.test(text) && !negated(cageRe),
    collar: collarRe.test(text.replace(/collarbones?/gi, "")) && !negated(collarRe),
  };
}
