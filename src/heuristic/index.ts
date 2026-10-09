import {PENIS_BUTTOCK_CONTACT,explicitPenisButtockContact} from "./contact";
// Free, offline top/bottom analysis using sentence patterns instead of AI.
//
// Pipeline: split into paragraphs and sentences → mask dialogue → find act patterns in narration →
// resolve names/pronouns to characters → classify each hit as an act, a desire, or a fantasy →
// read dialogue for what speakers ask for → group hits into scenes → verdict + confidence per pairing.

import { type Ao3Meta, romanticPairings } from "../ao3";
import { type Analysis, type Desire, type PairingResult, type Role } from "../types";
import { tagPriors } from "./ao3-prior";
import { type Character, type Gender, buildCast, escapeRe } from "./characters";
import { ANAL_CTX, type Cat, VULVA_CTX, type CompiledPattern, DIALOGUE, type DialogueDef, EPITHET_TOKEN, FINGER_CTX, PATTERNS, PENIS_CTX, SEX_CTX, compilePatterns } from "./patterns";
import { continuationInstrument, namedActionOwner, occurrenceContext, restraintOnlyHold } from "./event-evidence";
import { EPITHET, canonEpithet, learnEpithets } from "./epithets";
import { readTags } from "./tags";
import { noteContext } from "./notes";
import { checkTags } from "./tagcheck";
import { type TextingMap, detectTexts, looksLikeChat, looksLikeMessage, summarizeTexts } from "./texting";
import { detectPov, POV_SENTENCE } from "./pov";
import { ORAL_KINDS, oralKindOf } from "../roles";
import { escapeMarker, splitParagraphs, UNCERTAIN_NOTE_END, UNCERTAIN_NOTE_START } from "../text";
import { ActHit, Basis, DesireHit } from "./hits";
import { CHAPTER_RE, Quote, maskQuotes, sentenceSpans } from "./quotes";
import { ANAL_LINE_RE, ANAL_NEAR_RE, ANIMAL_NEAR, DANGER, DESIRE, DESIRE_LEAD, DESIRE_TAIL, FANTASY, FANTASY_PARA, FROTTAGE, HABIT_AUX, HYPO_AUX, HYPO_MATCH, HYPO_SENT, HYPO_WINDOW, IDIOM_ASS, IDIOM_SAFE, NEG, ORAL_LINE_RE, ORAL_NEAR_RE, ORAL_SCENE_RE, REFLEXIVE, SAY, SCENE_BREAK, SEX_STRICT, STRONG_FANTASY, contextAround, contextFor } from "./markers";
import { AddressBook } from "./address";
import { reliabilityOf } from "./reliability";
import { babyNear, featuresOf, trustOf } from "./learned";
import { Ctx, groupValue, pronoun, readSlot, resolvePair, stripPoss } from "./resolve";
import { PairTags, buildAct, buildDynamic, buildManual, buildOthers, buildSolo, buildVaginal, buildVibes, plural, soloIsAnal, tagsFor } from "./builders";
import type { AttributionEvidence, PersonOrigin } from "./decision-features";

// ───────────── main analysis ─────────────

export interface DecisionOutcome {
  initialTop:string;initialBottom:string;initialAct:string;
  topChanged:boolean;bottomChanged:boolean;actChanged:boolean;
  compatiblePronounCandidates:number;sentenceDistance:number;
  instrument:"penis"|"finger"|"toy"|"tongue"|"unknown";
}
export interface AuditHit {
  /** Final emitted decision alongside the initial resolver evidence; not a trained score. */
  decisionOutcome?:DecisionOutcome;
  /** Initial resolver choices; later role/act refinements may change a/b or act. */
  attribution?: AttributionEvidence;
  via: string;
  /** Context features of the hit (see learned.ts), where the engine computed them. */
  f?: number[];
  kind: string;
  cat: string;
  act: string;
  para: number;
  sentence: string;
  a: string;
  b?: string;
  /** For hints and desires: which role the line points the credited person toward (top / bottom). */
  role?: string;
}

export interface PatternOptions {
  /** Leave out the "how this works" caveats in notes (for tests). */
  quiet?: boolean;
  /** Called once for every act and desire hit with the pattern behind it (for the pattern audit report). */
  audit?: (hit: AuditHit) => void;
  /** Called once with what the engine worked from: its paragraphs, the point of view at each, and the texts it found (for the gold-label eval). */
  debug?: (d: { paras: string[]; pov: (string | undefined)[]; texts: { para: number; from?: string; to?: string }[] }) => void;
  /** Called for every pattern match once the people in it have been worked out, before the guards run (for `npm run trace`): who the engine made top and bottom and what it was going on. */
  trace?: (e: { para: number; via: string; match: string; sentence: string; tToken?: string; bToken?: string; top?: string; bottom?: string; basis?: string; elidedSubject?: string; clauseSubject?: string; lastSubject?: string; pov?: string }) => void;
  /** Called now and then with how far through the paragraphs the engine is (0 to 1), for a progress bar. */
  onProgress?: (fraction: number) => void;
}

const PRONOUN_ONLY = /^(?:he|him|his|she|her|they|them|their)$/i;

export function analyzeWithPatterns(text: string, meta: Ao3Meta, opts: PatternOptions = {}): Analysis {
  const hasUncertainNotes = text.includes(UNCERTAIN_NOTE_START);
  const analysisText0 = text.replace(
    new RegExp(`${escapeMarker(UNCERTAIN_NOTE_START)}[\\s\\S]*?${escapeMarker(UNCERTAIN_NOTE_END)}`, "g"),
    "",
  ).replace(/\[\[AO3_[A-Z_]+\]\]/g, "");
  // In some dom/sub fics a man's penis is his "clit" (or "clitty"). Where the tags say it's that kind of fic, there are no women
  // and nothing says anyone has a vulva, "his clit" is read as his cock.
  const clitIsCock =
    /master\/slave|dom\/sub|\bd\/s\b|bdsm|humiliat|chastity|cock cage|cock-cage|feminiz|sissy|gender words|degrad|dehumani|free use|slave|submission|dominance/i.test(meta.freeforms.join(" | ")) &&
    !/intersex|omega|trans(?:gender|\b)|vagina|cuntboy|cunt boy|pussy|mpreg|hermaphrodit|futa|bodyswap|genderswap|gender ?bender/i.test(meta.freeforms.join(" | ")) &&
    meta.categories.length > 0 && meta.categories.every((c) => c === "M/M");
  const analysisText = clitIsCock
    ? analysisText0.replace(/\b(his|their|[A-Z][\w-]*['’]s)(\s+(?:[a-z-]+\s+){0,2}?)clit(?:ty|oris)?\b/g, "$1$2cock")
    : analysisText0;
  // Arrow-style texts ("> hi" sent, "Hello <" received) are one line each and carry no end punctuation: keep each on its own paragraph.
  let paras = splitParagraphs(analysisText.replace(/^([ \t]*>[ \t]*\S.*|.*\S[ \t]*<[ \t]*)$/gm, "\n$1\n"));
  // Text messages shown as chat lines ("Shane: Why?") become dialogue with a speaker tag, so the rest of the engine reads them.
  let texting: TextingMap = { messages: [], rewritten: new Map() };
  if (looksLikeChat(paras)) {
    const pre = paras.map((p) => maskQuotes(p, false).masked);
    const preCast = buildCast(meta, pre.join("\n"), paras.join("\n"));
    // Whose phone it is comes from the point of view at that spot; a contact name above a thread isn't a POV heading.
    const povFirst = detectPov(paras.map((p, i) => (p.trim().length <= 28 && !/[.!?:,;]$/.test(p.trim()) && !looksLikeMessage(p) && looksLikeMessage(paras[i + 1] ?? "") ? "" : p)), (p) => CHAPTER_RE.test(p), preCast, meta.freeforms);
    texting = detectTexts(paras, preCast, (i) => povFirst.at[i]);
    if (texting.rewritten.size) paras = paras.map((p, i) => texting.rewritten.get(i) ?? p);
  }
  const doubleQuotes = (analysisText.match(/[“"]/g) ?? []).length;
  const singleQuotes = doubleQuotes < 4 && (analysisText.match(/(^|\s)‘/g) ?? []).length >= 4;
  const masked = paras.map((p) => maskQuotes(p, singleQuotes));
  const narration = masked.map((m) => m.masked).join("\n");

  // "Background Clint Barton/Bucky Barnes", "Past Dean/Lisa": the qualifier isn't part of anyone's name.
  const castMeta = { ...meta, relationships: meta.relationships.map((r) => r.replace(/^(?:background|past|brief|minor|implied|mentioned|one-sided|unrequited|ex|pre)[\s-]+/i, "")) };
  const cast = buildCast(castMeta, narration, paras.join("\n"));
  const tags = readTags(meta.freeforms, cast);
  // The author's summary and notes: explicit statements ("Top Eddie", "Steve is the sub", "Dean in a cock cage") read like tags, shown
  // as "(from notes)" and skipped when a tag already says the same; cage and collar words switch the device scans on.
  const noteCtx = noteContext(meta);
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, "");
  const noteTags = noteCtx.tags.filter((t) => !meta.freeforms.some((f) => norm(f) === norm(t)));
  if (noteTags.length) {
    const nt = readTags(noteTags, cast);
    const from = <T extends { tag: string }>(x: T): T => ({ ...x, tag: `${x.tag} (from notes)` });
    for (const r of nt.roles) if (!tags.roles.some((o) => o.char === r.char && o.role === r.role)) tags.roles.push(from(r));
    for (const d of nt.dynamics) if (!tags.dynamics.some((o) => o.char === d.char && o.lean === d.lean)) tags.dynamics.push(from(d));
    for (const t of nt.dynamicTags) if (!tags.dynamicTags.some((o) => norm(o) === norm(t))) tags.dynamicTags.push(`${t} (from notes)`);
    for (const t of nt.switching) if (!tags.switching.some((o) => norm(o) === norm(t))) tags.switching.push(`${t} (from notes)`);
  }
  const allTags = [...meta.freeforms, ...noteTags];
  const NAMES = cast.aliasPattern || "(?!)";
  const nameRe = new RegExp(`\\b(?:${NAMES})(?:['’]s)?\\b`, "g");
  // Who is on the page besides the cast: names that keep turning up as the subject of a sentence ("Sam smiled", "Greg had pulled") but
  // aren't cast members, and stand-ins for strangers ("the waiter", "the twink"). A he or a left-out subject right after one of
  // these is that person, not whichever lead was named before.
  const STRANGER_LABELS = "twink|twunk|bottom boy|slut|whore|virgin|newbie|stranger|brat|plaything|boy toy|hooker|escort|jock|waiter|waitress|bartender|barista|doctor|nurse|cop|officer|guard|driver|clerk|neighbou?r|landlord|teacher|bouncer|stripper|dancer|client|customer|cashier|receptionist|priest|priestess|healer|physician|surgeon|medic|monk|nun|servant|soldier|merchant|courtier";
  const outsiderNames = (() => {
    const counts = new Map<string, number>();
    const subj = /(?:^|[.!?”"]\s+|[,;]\s*(?:and|but|then|while|as)\s+)([A-Z][a-z]{2,})\s+(?:[a-z]{2,}(?:ed|s)|was|had|did|said|asked|would|could|will|looked|laughed|smiled|grinned)\b/gm;
    const castKnown = (n: string) => !!cast.byAlias.get(n);
    for (const mm of narration.matchAll(subj)) if (!castKnown(mm[1])) counts.set(mm[1], (counts.get(mm[1]) ?? 0) + 1);
    const SKIP = /^(?:The|This|That|These|Those|Then|There|Here|When|While|After|Before|And|But|Now|Just|Maybe|Not|His|Her|Their|Its|Our|Your|My|God|Jesus|Christ|Fuck|Shit|Oh|Yes|Okay|Please|Still|Again|Next|Later|Soon|Once|Some|Everyone|Someone|Anyone|Nobody|Everything|Something|Nothing|Both|Each|Every|Another|Other|Suddenly|Slowly|Finally|Instead|Always|Never|Today|Tonight|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;
    // A name is never written in lower case, so a word that also shows up that way ("more", "even", "she") is just a sentence opener.
    const PRON = /^(?:She|He|They|We|You|It|I|Her|Him|Them|Who|What|Why|How|Which|Where|Whose|With|From|Despite|Being|Only|Even|More|Most|Two|Three|Four|Five|Six|One|Silence|Really|Like)$/;
    // …and an outsider is a minor character: if the name comes up about as often as the cast does, it's a lead the cast missed.
    const castMentions = (narration.match(nameRe) ?? []).length / Math.max(1, cast.chars.length);
    const mentions = (n: string) => (narration.match(new RegExp(`\\b${n}\\b`, "g")) ?? []).length;
    // A name the author's own summary or notes mention needs one fewer appearance.
    const noted = new Set([meta.summary, meta.notes, meta.endNotes, ...(meta.chapterNotes ?? [])].join(" ").match(/\b[A-Z][a-z]{2,}\b/g) ?? []);
    return [...counts].filter(([n, c]) => c >= (noted.has(n) ? 2 : 3) && !SKIP.test(n) && !PRON.test(n) && !new RegExp(`\\b${n.toLowerCase()}\\b`).test(narration) && mentions(n) < 0.3 * castMentions).map(([n]) => n);
  })();
  // Outsiders can stand in either slot of an act pattern: the match is kept, the outsider side can't be resolved, and the one-sided
  // fallback credits whichever side is a cast member ("Kleon's mouth wrapped around his cock" still tells us about the one whose cock it is).
  const patterns = compilePatterns(PATTERNS, [cast.aliasPattern, ...outsiderNames].filter(Boolean).join("|"));
  const gateSeen = new Uint8Array(patterns.reduce((m, p) => Math.max(m, (p.gateId ?? -1) + 1), 0));
  const subjectRe = new RegExp(`(?:^|[\\s(—–-])((?:${NAMES}|${EPITHET_TOKEN})(?:['’]s)?|[Hh]e|[Ss]he|[Tt]hey|I|[Hh]is|[Hh]er|[Tt]heir|[Mm]y)\\b`);
  const epithetRe = new RegExp(EPITHET, "g");
  const ING_NOUNS =
    "morning|evening|wedding|building|feelings?|clothing|bedding|ceiling|thing|something|nothing|anything|everything|ring|king|wing|string|darling|sibling|stocking|ending|beginning|meaning|warning|painting|drawing|training|meeting|offering|blessing|pudding|earring|upbringing|being|wellbeing|well-being|belongings|surroundings|savings|lodgings|bring";
  // "Cas rolls his hips against Dean's grinding his cock deep inside him": after a preposition, Dean's is a possessive, not "Dean is".
  const contractionRe = new RegExp(
    `(?<!\\b(?:against|with|to|on|onto|of|from|for|by|at|into|toward|towards|over|under|inside|beside|between|around|than|like)\\s)\\b((?:${NAMES}|${EPITHET_TOKEN})|[Hh]e|[Ss]he)['’]s(?=\\s+(?:(?:\\w+ly|just|still|now|already|been|gonna|going|not|never|always|so|too)\\s+)?(?:(?!(?:${ING_NOUNS})\\b)[a-z]+ing\\b(?!\\s+(?:cock|dick|prick|length|shaft|erection|hard-?on|hole|entrance|rim|ass|arse|body|thighs?|hips?|nipples?|chest|mouth|lips|tongue|fingers?|hands?|heat|walls|muscles?|skin|balls)\\b)|(?:held|buried|seated|sheathed|lodged|inside|deep|balls-deep)\\b|(?:been|gonna|going|not|never|still|already|finally|fully)\\b(?!\\s+(?:[\\w-]+\\s+){0,2}(?:hair|face|eyes?|hands?|fingers?|cock|dick|skin|body|mouth|lips|chest|back|shoulders?|neck|ass|hole|thighs?|hips|arms?|legs?|voice|breath|heart|mind|name|beard|scruff|clothes|shirt)\\b)))`,
    "g",
  );
  // Prostate allusions. The owner comes from "inside X" or the possessive in front; otherwise "his".
  const OWNER = `(?:him|her|them|me|you|${NAMES}|${EPITHET_TOKEN})`;
  const POSS_FRONT = `(?:that|the|this|his|her|their|my|your|(?:${NAMES})['’]s)`;
  const P_ADJ = "(?:little|small|sweet|tender|sensitive|secret|magic(?:al)?|perfect|swollen|hidden|special|precious|wonderful|delicious|electric|oversensitive|abused|spongy|firm|walnut-sized)";
  const INSIDE = `(?:\\s+(?:deep\\s+|buried\\s+|hidden\\s+|tucked\\s+|right\\s+)?(?:inside|in|within)\\s+(?<in>${OWNER})\\b)`;
  // "that bundle of nerves (inside him)", "the cluster of nerves", "his little nub of nerves"
  const prostateRe = new RegExp(
    `\\b(?<front>${POSS_FRONT})\\s+(?:${P_ADJ}\\s+){0,2}(?:bundle|cluster|knot|nub|bunch|ball|nest)\\s+of\\s+(?:\\w+\\s+)?nerves${INSIDE}?`,
    "gi",
  );
  // "his sweet spot", "his p-spot (inside him)" — but not "the sweet spot on his neck"
  const sweetSpotRe = new RegExp(
    `\\b(?<front>${POSS_FRONT})\\s+(?:${P_ADJ}\\s+){0,2}(?:sweet\\s+spot|p-?spot)(?!\\s+(?:on|at|behind|below|under|just|of|along|between|beneath|where)\\b)${INSIDE}?`,
    "gi",
  );
  // "the spot inside Harry", "the gland inside him"
  const insideSpotRe = new RegExp(`\\b(?<front>${POSS_FRONT})\\s+(?:${P_ADJ}\\s+){0,2}(?:spot|place|gland|nub)${INSIDE}`, "gi");
  // "the spot that made him see stars"
  const seeStarsRe = new RegExp(
    `\\b(?<front>${POSS_FRONT})\\s+(?:${P_ADJ}\\s+){0,2}spot\\s+(?:that|which)\\s+(?:always\\s+)?(?:made|makes|had|has)\\s+(?<seer>${OWNER})\\s+(?:see\\s+(?:stars|white|spots)|scream|keen|cry out|shudder|jolt|arch|buck|sob|shake|whimper|moan|writhe|tremble|go cross-eyed|melt|lose it|come apart)`,
    "gi",
  );
  const PROSTATE_HINT = /\b(?:nerves|sweet\s+spot|p-?spot|spot|place|gland|nub)\b/i;
  const possOf = (who: string): string => {
    const w = who.toLowerCase();
    if (w === "him") return "his";
    if (w === "her") return "her";
    if (w === "them") return "their";
    if (w === "me") return "my";
    if (w === "you") return "your";
    return `${who}'s`;
  };
  function prostateOf(...args: unknown[]): string {
    const groups = args[args.length - 1] as { front?: string; in?: string; seer?: string };
    const front = groups.front ?? "";
    const who = groups.in ?? groups.seer;
    const owner = who ? possOf(who) : /^(?:that|the|this)$/i.test(front) ? "his" : front;
    return `${owner} prostate`;
  }

  const ctx = new Ctx(cast);
  ctx.epithets = learnEpithets(cast, meta.freeforms, narration);

  /** Whether the last speaker was named by a dialogue tag (“…,” Eddie says) rather than guessed from who the narration is about. */
  let attribExplicit = false;
  // Terms of address ("sir", "baby", "half man") that one character keeps using for the other; the previous pass's book also
  // helps tell who an untagged line is addressed to.
  const lowerAliases = new Set([...cast.byAlias.keys()].flatMap((a) => a.toLowerCase().split(/\s+/)));
  const isNameWord = (w: string) => lowerAliases.has(w);
  let addressBook = new AddressBook();
  let priorAddress = new AddressBook();
  let acts: ActHit[] = [];
  let ambiguousHoles = 0;
  let curParaIdx = -1;
  let defaultedAnal = 0;
  /** For each bottom, how many sentences clearly said anal vs vaginal. */
  const holeVotes = new Map<Character, { anal: number; vaginal: number }>();
  let desires: DesireHit[] = [];
  let chapters: string[] = [];
  let chapter = "";
  let prevSpeaker: Character | undefined;
  /** For a paragraph opening with a quote tagged only "he says": whoever didn't speak last. */
  let turnSpeaker: Character | undefined;
  let turnQuote: Quote | undefined;
  /** The viewpoint character, when the sentence being read opens on their inner life ("He feels his slick trickling…"). */
  let sentPovChar: Character | undefined;

  const subjectReG = new RegExp(subjectRe.source, "g");
  const firstEntity = (s: string): Character | undefined => {
    // A possessive name inside a prepositional phrase ("the look on Steve's face made Eddie so hard") isn't the
    // subject, if an actual name or subject pronoun follows it (not just "his"/"my", which say nothing more).
    subjectReG.lastIndex = 0;
    const first = subjectRe.exec(s);
    let m: RegExpExecArray | null = first;
    if (first && (/['’]s$/.test(first[1]) || /^(?:[Hh]is|[Hh]er|[Tt]heir|[Mm]y)$/.test(first[1])) && /\b(?:on|in|at|of|from|into|to|over|with|across|around|against|onto|under|beneath|behind|beside|near|by|for|through|toward|towards|past)\s+$/i.test(s.slice(0, first.index + first[0].length - first[1].length))) {
      let next: RegExpExecArray | null;
      subjectReG.lastIndex = first.index + first[0].length;
      next = subjectReG.exec(s);
      if (next && !/^(?:[Hh]is|[Hh]er|[Tt]heir|[Mm]y)$/.test(next[1]) && !/['’]s$/.test(next[1])) m = next;
    }
    if (!m || m.index > 80) return undefined;
    const tok = stripPoss(m[1]);
    const named = cast.byAlias.get(tok);
    if (named) return named;
    const viaEpithet = ctx.token(tok);
    if (viaEpithet !== null) return viaEpithet;
    const p = pronoun(tok);
    if (!p) return undefined;
    if ("fixed" in p) return ctx.fixed(p.fixed);
    return notNamedLater(ctx.subjectFor(p.gender), s.slice(m.index + m[0].length), p.gender);
  };

  /**
   * A subject pronoun can't mean someone the same sentence names afterwards ("He pushed Stiles' legs
   * open" — he isn't Stiles), so switch to the other person.
   */
  function notNamedLater(c: Character | undefined, rest: string, g: Gender | "any"): Character | undefined {
    if (!c || !c.aliases.length) return c;
    // '…inside him, Cas' eyes open. "You okay?" Dean asks.': names after a line of dialogue are another clause.
    rest = rest.split(/\s{3,}/)[0];
    const namedIn = (x: Character) =>
      x.aliases.length > 0 && new RegExp(`\\b(?:${x.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`).test(rest);
    if (!namedIn(c)) return c;
    // Not anyone else named later either: in a threesome, the pronoun is the third person.
    const later = new Set(cast.chars.filter(namedIn));
    const strict = ctx.partnerOf(c, g, later);
    if (strict && cast.pairings.some((p) => p.includes(strict) && p.includes(c))) return strict;
    // Everyone plausible was named later ("He hollowed his cheeks … for Cas … in Dean's mouth"): a later
    // possessive doesn't rule its owner out, rather than reaching for someone outside the scene.
    const namedPlain = (x: Character) =>
      x.aliases.length > 0 &&
      new RegExp(`\\b(?:${x.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b(?!['’]s?(?!\\w))`).test(rest);
    if (!namedPlain(c)) return c;
    const loose = ctx.partnerOf(c, g, new Set(cast.chars.filter(namedPlain)));
    return (loose && cast.pairings.some((p) => p.includes(loose) && p.includes(c)) ? loose : strict) ?? ctx.partnerOf(c, g) ?? c;
  }

  const decisionOutcomes=new WeakMap<number[],Omit<DecisionOutcome,"topChanged"|"bottomChanged"|"actChanged"|"instrument">>();
  const bodyCtxCache = new Map<number, boolean>();
  // Two passes when epithets are in play: the first learns which character "the blond" usually is.
  const pov = detectPov(paras, (p) => CHAPTER_RE.test(p), cast, allTags);
  // An omegaverse work: alpha/beta/omega in the tags, or the words all through the text. Only there do bared throats,
  // scenting and the alpha voice mean dominance and submission.
  // When both of them have knots ("Eddie's knot", "Jason's knot"), a knot says nothing about who is on top.
  const bothKnot = (() => {
    const counts = cast.chars.map((c) => {
      const names = [c.name, ...c.aliases].filter((a) => a.length > 2).map(escapeRe);
      return names.length ? paras.join(" ").match(new RegExp(`\\b(?:${names.join("|")})['’]s\\s+(?:[\\w-]+\\s+)?knots?\\b`, "g"))?.length ?? 0 : 0;
    });
    return counts.filter((n) => n >= 2).length >= 2;
  })();
  const isAbo = (() => {
    const tagText = [...meta.freeforms, ...meta.fandoms, ...meta.relationships, ...meta.characters].join(" | ");
    if (/omegaverse|alpha\/beta\/omega|a\/b\/o|\babo\b|\balpha\b|\bomega\b/i.test(tagText)) return true;
    const all = paras.join(" ");
    return (all.match(/\balphas?\b/gi) ?? []).length >= 8 && (all.match(/\bomegas?\b/gi) ?? []).length >= 4;
  })();
  // A chastity device or cock cage in the tags (male-only works): being locked up reads as submission, holding the key as control.
  const isChastity = (/chastity|cock[- ]?cage|\bkey ?hold|\bcaged\b/i.test(meta.freeforms.join(" | ")) || noteCtx.cage) && (meta.categories.length === 0 || meta.categories.includes("M/M"));
  // Who wears a device (cage, collar): named in a tag ("Cas puts Dean in a cock cage", "Collared Steve"), else the one tagged as the sub,
  // else a lone "Bottom X", else the one the device is attached to most often in the text ("Peter's erection … the cage", "Telemachus' neck").
  const findNamed = (n: string) => cast.byAlias.get(n.trim()) ?? cast.byAlias.get(n.trim().split(/\s+/)[0]) ?? cast.chars.find((c) => c.aliases.some((al) => n.toLowerCase().includes(al.toLowerCase())));
  const subOnly = (() => {
    const subs = tags.dynamics.filter((d) => d.lean === "bottom").map((d) => d.char);
    const doms = tags.dynamics.filter((d) => d.lean === "top").map((d) => d.char);
    if (subs.length >= 1 && new Set(subs).size === 1 && doms.every((d) => d !== subs[0])) return subs[0];
    const bots = [...new Set(tags.roles.filter((r) => r.role === "bottom").map((r) => r.char))];
    const sw = new Set(tags.roles.filter((r) => r.role === "switch").map((r) => r.char));
    return bots.length === 1 && !sw.has(bots[0]) ? bots[0] : undefined;
  })();
  function deviceWearer(tagRes: RegExp[], devRe: RegExp, partRe: string): Character | undefined {
    for (const f of allTags) for (const re of tagRes) {
      const m = re.exec(f);
      const c = m && findNamed(m[1]);
      if (c) return c;
    }
    if (subOnly) return subOnly;
    const votes = new Map<Character, number>();
    const vote = (n: string) => { const c = cast.byAlias.get(n.replace(/['’]s?$/, "")); if (c) votes.set(c, (votes.get(c) ?? 0) + 1); };
    const own = new RegExp(`(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+){0,2}?(?:${partRe})\\b`, "g");
    const onto = new RegExp(`\\b(?:on|onto|around|over|off|from|in|into)\\s+(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+){0,2}?(?:${partRe})\\b`, "g");
    const obj = new RegExp(`\\b(?:caged|collared|leashed|uncaged)\\s+(${NAMES})\\b`, "g");
    for (const para of paras) {
      if (!devRe.test(para)) continue;
      for (const sn of para.split(/(?<=[.!?”])\s+/)) {
        if (!devRe.test(sn)) continue;
        for (const re of [own, onto, obj]) { re.lastIndex = 0; for (const mm of sn.matchAll(re)) vote(mm[1]); }
      }
    }
    const ranked = [...votes].sort((a, b) => b[1] - a[1]);
    if (ranked.length && ranked[0][1] >= 2 && ranked[0][1] >= 2 * (ranked[1]?.[1] ?? 0)) return ranked[0][0];
    // One unopposed vote plus the point-of-view character being that person through most of the device's scenes is enough.
    if (ranked.length === 1) {
      let inPov = 0, total = 0;
      paras.forEach((para, i) => { if (devRe.test(para)) { total++; if (pov.at[i] === ranked[0][0]) inPov++; } });
      if ((total >= 3 && inPov / total > 0.5) || total >= 5) return ranked[0][0];
    }
    return undefined;
  }
  const chastityWearer: Character | undefined = !isChastity ? undefined : deviceWearer(
    [/\b(?:puts?|put|locks?|keeps?|has|makes?)\s+(.+?)\s+in\s+(?:a\s+|the\s+)?(?:cock[- ]?cage|chastity|cage)/i, /^(?:caged|chastity|cock[- ]?caged)\s*!?\s+(.+)$/i, /^(.+?)\s+(?:in|wearing|wears|is wearing)\s+(?:a\s+)?(?:cock[- ]?cage|chastity(?:\s+(?:cage|device|belt))?)$/i],
    /\b(?:cock[- ]?cages?|chastity|caged|(?:the|a|his|this|that|silicone|metal|steel)\s+(?:[\w-]+\s+){0,2}?cage)\b/i,
    "cock|dick|prick|erection|balls?|penis|length|cage",
  );
  // ── collars and leashes: the one collared reads as the bottom, the one who leads, tugs, buckles or unlocks reads as the top ──
  const COLLAR_RE = /\b(?:collars?|collared|leash(?:es|ed)?)\b/i;
  const NOT_COLLAR = /\b(?:shirt|jacket|coat|button\w*|cologne|polo|dress|blouse|uniform|suit|sweater|hoodie|starch\w*|turtle\w*)\b|\bby\s+(?:his|her|their|the|[A-Z][\w-]*['’]s)\s+collar\b|\bcollar\s+of\s+(?:his|her|their|the)\s+(?:shirt|jacket|coat|dress)|\bcollar\s*bone/i;
  const collarMentions = paras.reduce((n, p) => n + (COLLAR_RE.test(p) && !NOT_COLLAR.test(p) ? 1 : 0), 0);
  const isCollar = (/\bcollar|\bleash|\bchoker|pet ?play|(?:pup|puppy|kitten) play|human pet|master\/pet|owner\/pet/i.test(meta.freeforms.join(" | ")) || noteCtx.collar || collarMentions >= 8) && (meta.categories.length === 0 || meta.categories.includes("M/M"));
  const collarWearer: Character | undefined = !isCollar ? undefined : deviceWearer(
    [/^(?:collared|leashed)\s*!?\s+(.+)$/i, /^(.+?)\s+(?:in|wearing|wears|is wearing)\s+(?:a\s+)?(?:collar|leash)$/i, /\b(?:puts?|put|keeps?|has)\s+(.+?)\s+(?:in|on)\s+(?:a\s+)?(?:collar|leash)/i],
    /\b(?:collars?|collared|leash(?:es|ed)?)\b/i,
    "neck|throat|collar|nape",
  );
  const COLLAR_HOLD = /\b(?:led|leads|leading|lead|tugg?(?:ed|s|ing)?|yank(?:ed|s|ing)?|pull(?:ed|s|ing)?|jerk(?:ed|s|ing)?|clip(?:ped|s|ping)?|attach(?:ed|es|ing)?|buckl(?:ed|es|ing)|fasten(?:ed|s|ing)?|unlock(?:ed|s|ing)?|unhook(?:ed|s|ing)?|hook(?:ed|s|ing)?|swap(?:ped|s|ping)?|remov(?:ed|es|ing)|slip(?:ped|s|ping)?|slid|put|took|take|takes|grabb?(?:ed|s|ing)?|held|holds?|wrapp?(?:ed|s|ing)?|gave|gives|collar(?:ed|s|ing)|snapp?(?:ed|s|ing)?|locked|locks)\b/i;
  const COLLAR_WISH = /\b(?:want\w*|wish\w*|imagin\w*|fantas\w*|think(?:ing)? about|would|could|might|maybe|how do you feel|gonna|going to|if|someday|thought|hate[sd]?|never)\b/i;
  function collarScan(sent: string, original: string, pi: number) {
    if (!collarWearer || !COLLAR_RE.test(sent) || NOT_COLLAR.test(sent) || COLLAR_WISH.test(sent)) return;
    // Off the page of the scene: a collar in the sentence needs the neck, a lock, a chain or a leash, or someone wearing it.
    if (!/\b(?:neck|throat|leash|chain|lock\w*|key|buckl\w*|leather|bell|locket|wear\w*|wore|worn|collared|tug\w*|yank\w*|led|lead|attached|clipped|unhook\w*)\b/i.test(`${sent} ${paras[pi] ?? ""}`)) return;
    const w = collarWearer;
    const other = tagPartner(w);
    if (!other) return;
    const first = firstEntity(sent);
    const holds = first === other && COLLAR_HOLD.test(sent);
    const id = holds ? "collar-holder" : "collar-wearer";
    if (desires.some((d) => d.via === id && d.sentence === original)) return;
    if (holds) desires.push({ via: id, cat: "vibe", act: "leading or controlling a collared partner", who: other, partner: w, role: "top", wants: true, kind: "behavior", weight: 0.5, para: pi, sentence: original, basis: "named" });
    else desires.push({ via: id, cat: "vibe", act: "wearing a collar or leash", who: w, partner: other, role: "bottom", wants: true, kind: "behavior", weight: 0.5, para: pi, sentence: original, basis: "named" });
  }
  /** A character's tagged partner (first pairing that includes them), so "Sam's wedding" in a sentence doesn't make Sam Dean's partner. */
  const tagPartner = (c: Character): Character | undefined => {
    const pr = cast.pairings.find((x) => x.includes(c));
    return pr ? (pr[0] === c ? pr[1] : pr[0]) : ctx.partnerOf(c);
  };
  const CAGE_RE = /\b(?:cock[- ]?cages?|chastity(?:\s+(?:cage|device|belt|tube))?|(?:the|a|his|that|this|newly|tight|metal|steel|plastic|small|little)\s+(?:\w+\s+){0,2}?cage|caged|uncaged)\b/i;
  const NOT_CAGE = /\b(?:bird|rib|animal|lion|hamster|golden|mental|ribcage)\s*cage|\bcage\s+(?:match|fight)|damp cage|cage of (?:his|her|their|\w+['’]s)\b/i;
  const CAGE_BODY = /\b(?:cock|dick|prick|balls?|erection|plug|key|lock\w*|unlock\w*|ring|hard|strain\w*|tight\w*|throb\w*|twitch\w*|release|denial|wear\w*|wore|worn|chastity|caged|free\w*|secur\w*|put|placed|around|cock[- ]?cage)\b/i;
  /** A sentence about the device: the one who wears it reads as the bottom, whoever the pronouns point at. */
  function chastityScan(sent: string, original: string, pi: number) {
    if (!chastityWearer || !CAGE_RE.test(sent) || NOT_CAGE.test(sent)) return;
    if (!/cock[- ]?cage|chastity/i.test(sent) && !CAGE_BODY.test(`${sent} ${paras[pi] ?? ""}`)) return;
    // "Tanner was caged in, penned by Kyle's arms", "caged up for months": confined, not locked in a device, unless a cock or balls are in the sentence.
    if (/\bcaged\s+(?:in|up|by|between|against|inside|within)\b/i.test(sent) && !/cock|dick|balls?|prick|erection|chastity|lock|key/i.test(sent)) return;
    if (/\bcaged\b/i.test(sent) && !/cock[- ]?cage|chastity|(?:the|a|his|this|that)\s+(?:[\w-]+\s+){0,2}?cage/i.test(sent) && !/cock|dick|balls?|prick|erection|lock|key|plug/i.test(sent)) return;
    // Fetching, ordering or setting down the device says nothing about who is wearing it right now.
    if (/\b(?:key|box|ordered?|ordering|bought|buy|amazon|package|arrived|cart|clattered|came\b|set\s+(?:the\s+)?\w*\s*down)\b/i.test(sent) && !/\b(?:wearing|wore|worn|strain\w*|tight\w*|twitch\w*|caged)\b/i.test(sent)) return;
    // Taking the device off, or fumbling with its lock, is not wearing it: "tossing his cage aside", "fumbling with the lock to his cage".
    if (/\b(?:unlock\w*|unlatch\w*|remov\w*|took off|take off|taking off|taken off|toss\w*|threw|throw\w*|fumbl\w*|fiddl\w*)\b[^.!?]{0,50}\b(?:cage|lock|key)\b|\b(?:cage|lock)\b[^.!?]{0,30}\b(?:off|aside|away|removed|unlocked|came off|slid off|slipped off)\b|\block\s+out of\b|\bremoval\b/i.test(sent)) return;
    const w = chastityWearer;
    const other = tagPartner(w);
    if (!other) return;
    // "He leaned down and wrapped his warm mouth around the cage": the partner is sucking the wearer's caged cock, a blowjob (rare, but it happens).
    if (/\b(?:mouth|lips?|tongue)\b[^.!?]{0,40}\b(?:around|over|on|against|along|through)\s+(?:the|his|that)\s+(?:[\w-]+\s+){0,2}?cage\b|\b(?:lick|suck|kiss|mouth)\w*\s+(?:at\s+|on\s+|over\s+|through\s+)?(?:the|his|that)\s+(?:[\w-]+\s+){0,2}?cage\b/i.test(sent) && !acts.some((a) => a.via === "mouth-on-cage" && a.sentence === original)) {
      acts.push({ via: "mouth-on-cage", cat: "oral", act: "blowjob", top: w, bottom: other, weight: 0.7, basis: "named", para: pi, sentence: original, context: contextAround(paras[pi] ?? "", original) });
    }
    for (const [id, cat, kind, act, weight] of [
      ["chastity-wearer", "vibe", "behavior", "wearing a chastity device", 0.5],
    ] as const) {
      if (desires.some((d) => d.via === id && d.sentence === original)) continue;
      // The body-part hints count once a paragraph, and only where that part of the body is in the scene: anal words (ass, hole, plug, fingers,
      // lube…) or mouth words nearby. A cage at a party or in a shower is a power-dynamic hint, not a claim about anal or oral sex.
      if (cat !== "vibe") {
        if (desires.some((d) => d.via === id && d.para === pi)) continue;
        const near = `${sent} ${paras[pi - 1] ?? ""} ${paras[pi] ?? ""} ${paras[pi + 1] ?? ""}`;
        if (cat === "anal" ? !(ANAL_NEAR_RE.test(near) || ANAL_CTX.test(near) || FINGER_CTX.test(near) || /\bplug\b/i.test(near)) : !ORAL_NEAR_RE.test(near)) continue;
      }
      desires.push({ via: id, cat, act, who: w, partner: other, role: "bottom", wants: true, kind, weight, para: pi, sentence: original, basis: "named" });
    }
  }
  // A plug in the tags' sub (or the chastity wearer): "a plug in your ass", "the vibrations of the plug stopped", "the base of the plug".
  const plugWearer: Character | undefined = chastityWearer ?? subOnly;
  const PLUG_WORN = /\b(?:butt\s*plugs?|(?:vibrating|the|that|a|his|my|your)\s+(?:[\w-]+\s+){0,2}?(?:plug|vibe|vibrator))\b(?![\s-]*(?:socket|hole|cap))/i;
  const PLUG_BODY = /\b(?:ass|arse|hole|prostate|vibrat\w*|wedged|pressing|stopped|inside|wearing|wore|worn|base of|sitting|stretch\w*|full|shift\w*|cage|pulsing|deep|snug|kick(?:ed)? up)\b/i;
  function plugScan(sent: string, original: string, pi: number) {
    if (!plugWearer || !PLUG_WORN.test(sent) || !PLUG_BODY.test(`${sent} ${paras[pi] ?? ""}`) || /\b(?:power|electric|spark|bath|sink|tub|drain)\s+plug|plug\s+(?:in|into)\s+(?:the\s+)?(?:wall|socket|outlet|phone|charger)/i.test(sent)) return;
    // Taking one out or setting it down is someone else's hand, not the wearer's state.
    if (/\b(?:take|took|taking|pull|pulled|remov\w*|set|put)\s+(?:the\s+|a\s+|that\s+)?(?:\w+\s+)?plug\s+(?:out|down|away|aside)\b|\bplug\s+out\b/i.test(sent)) return;
    const other = tagPartner(plugWearer);
    if (!other || desires.some((d) => d.via === "plug-worn" && (d.sentence === original || d.para === pi)) || desires.filter((d) => d.via === "plug-worn").length >= 8) return;
    desires.push({ via: "plug-worn", cat: "anal", act: "wearing a plug", who: plugWearer, partner: other, role: "bottom", wants: true, kind: "prep", weight: 0.6, para: pi, sentence: original, basis: "named" });
  }
  scan();
  if (ctx.learnFromVotes()) scan();
  settlePronounPairs();
  settleAboRoles();

  /**
   * Alpha/Omega tags that name one of the pair each ("Alpha Castiel", "Omega Dean Winchester"): a reading that puts the alpha at the receiving end and
   * the omega at the giving end, where nothing in the sentence names who is who, is the pronouns and "his hole" falling on the wrong man. Skipped when
   * the tags say the roles are reversed or switched.
   */
  function settleAboRoles() {
    const alpha = ctx.epithets.get("noun:alpha"), omega = ctx.epithets.get("noun:omega");
    if (!alpha || !omega || alpha === omega || !cast.pairings.some((p) => p.includes(alpha) && p.includes(omega))) return;
    // Tags that give the alpha a bottom or the omega a top ("Bottom Castiel/Top Dean") say the roles go both ways.
    if (tags.roles.some((r) => (r.char === alpha && r.role !== "top") || (r.char === omega && r.role !== "bottom"))) return;
    if (/role[ -]?reversal|reverse[d]? roles|bottom alpha|top omega|alpha bottom|omega top|alpha\W+(?:\w+\W+){0,3}bottom|omega\W+(?:\w+\W+){0,3}top|\bswitch|versatile|power bottom/i.test(allTags.join(" | "))) return;
    for (const a of acts) {
      if (a.cat !== "anal" || a.basis === "named" || a.top !== omega || a.bottom !== alpha) continue;
      [a.top, a.bottom] = [a.bottom, a.top];
    }
    for (const d of desires) {
      if (d.cat !== "anal" || d.basis === "named" || d.kind === "solo" || d.kind === "history") continue;
      if (d.role === "bottom" && d.who === alpha && d.partner === omega) { d.who = omega; d.partner = alpha; }
      else if (d.role === "top" && d.who === omega && d.partner === alpha) { d.who = alpha; d.partner = omega; }
    }
  }

  /**
   * "He slips his cock inside of him" names no one, so which is which came from whoever was the subject a sentence earlier. When a work's firm,
   * named scenes all go one way for the pair (four or more, none the other way), a pronoun-only reading that goes against them is the
   * misresolved one: it takes the direction the firm scenes show.
   */
  function settlePronounPairs() {
    const firm = new Map<string, number>();
    const key = (a: ActHit) => `${a.cat}|${a.top.name}|${a.bottom.name}`;
    for (const a of acts) if (a.basis === "named" && a.weight >= 0.7 && !a.shaky) firm.set(key(a), (firm.get(key(a)) ?? 0) + 1);
    for (const a of acts) {
      if (!a.pronouns || a.basis === "named") continue;
      const forward = firm.get(`${a.cat}|${a.bottom.name}|${a.top.name}`) ?? 0;
      const against = firm.get(key(a)) ?? 0;
      if (forward >= 4 && against === 0) {
        [a.top, a.bottom] = [a.bottom, a.top];
        a.pronouns = undefined;
      }
    }
  }

  function scan() {
  acts = [];
  desires = [];
  chapters = [];
  chapter = "";
  prevSpeaker = undefined;
  priorAddress = addressBook;
  addressBook = new AddressBook();
  ctx.narratorNow = undefined;
  ambiguousHoles = 0;
  holeVotes.clear();
  ctx.partners.clear();
  ctx.reset();
  let dreamRun = 0;
  for (let pi = 0; pi < paras.length; pi++) {
    if (opts.onProgress && pi % 25 === 0) opts.onProgress(pi / paras.length);
    const para = paras[pi];
    curParaIdx = pi;
    const { masked: mp, quotes } = masked[pi];
    if (para.length < 120 && CHAPTER_RE.test(para)) {
      chapter = para.length > 60 ? para.slice(0, 60) + "…" : para;
    }
    chapters[pi] = chapter;
    ctx.povNow = cast.narrator ? undefined : pov.at[pi]; // in first person "he" is never the narrator
    // Alternating first person: a chapter headed with the narrator's name says whose "I" follows.
    if (cast.narrator && pov.source === "headings" && pov.at[pi]) ctx.narratorNow = pov.at[pi];
    // Alternating first person: a short heading that is just a character's name (and a date) says whose "I" follows.
    if (cast.narrator && para.length <= 80) {
      const head = new RegExp(`^\\s*(${NAMES})(?:\\s*[-–—:]\\s*[^.!?“”"]{0,60})?\\s*$`).exec(para);
      const who = head ? cast.byAlias.get(head[1]) : undefined;
      if (who) ctx.narratorNow = who;
    }
    // Turn-taking: '"Cock," he says, his slippery fingers…' answers the last speaker, and the narration
    // that follows is about the one who answered.
    turnSpeaker = undefined;
    const opensWithQuote = (q: Quote) => q === quotes[0] && !new RegExp(`\\b(?:${NAMES})\\b`).test(mp.slice(0, q.start));
    if (quotes.length && opensWithQuote(quotes[0]) && prevSpeaker) {
      const tag = para.slice(quotes[0].end, quotes[0].end + 40);
      // '"You beg so prettily, baby," taking a step back, he drops to his knees': a participle phrase picks the sentence back up, so its "he" is the speaker.
      const participial = new RegExp(`^[,.!?—–\\s]*[A-Za-z]+ing\\b[^.!?“”"]{0,60}?,\\s*(?:[Hh]e|[Ss]he)\\b`).test(para.slice(quotes[0].end, quotes[0].end + 110));
      if (participial || new RegExp(`^[,.!?—–\\s]*(?:[Hh]e|[Ss]he|[Tt]hey)\\s+(?:\\w+ly\\s+)?(?:${SAY})\\b`).test(tag)) {
        turnSpeaker = ctx.partnerOf(prevSpeaker);
        turnQuote = quotes[0];
        if (turnSpeaker) ctx.lastSubject = turnSpeaker;
      }
    }
    // “Fuck, Der—Alpha.” He pushes back, …: a paragraph that opens on a line spoken to someone, and goes on with a bare he, goes on about the speaker.
    if (!turnSpeaker && quotes.length && opensWithQuote(quotes[0])) {
      const narr = mp.slice(quotes[0].end);
      if (/^[\s,.!?—–]*(?:He|She)\b/.test(narr) && !new RegExp(`^[\\s,.!?—–]*(?:He|She|They)\\s+(?:\\w+ly\\s+)?(?:${SAY})\\b`).test(narr)) {
        const to = addresseeOf(quotes[0].text);
        const sp = to && ctx.partnerOf(to);
        if (sp && Ctx.compatible(sp, /^[\s,.!?—–]*She/.test(narr) ? "f" : "m")) ctx.lastSubject = sp;
      }
    }
    // A dream can run on into the next two paragraphs ("Louis's tongue feels so good…") until someone wakes.
    const WAKE = /\b(?:wak(?:e|es|ing)\s+up|woke|awake|jolt(?:s|ed)?\s+awake|snap(?:s|ped)?\s+out\s+of)\b/i;
    // "All the times he imagined this, and the real thing is so much more" is the reverse of a fantasy.
    const fantasyPara = (FANTASY_PARA.test(mp.slice(0, 160)) && !/\b(?:the real (?:thing|deal)|for real|in real life|really happening|(?:this|it|that) is real)\b/i.test(mp.slice(0, 260))) || (dreamRun > 0 && !WAKE.test(mp.slice(0, 160)) && !SCENE_BREAK.test(para));
    if (WAKE.test(mp) || SCENE_BREAK.test(para)) dreamRun = 0;
    else if (/(?<!\b(?:not|never|no)\s|n['’]t\s|\b(?:would|could|might|never)(?:['’]ve| have)\s)\b(?:(?<!\blike a (?:[\w'’]+ )?)dream(?:ed|t|s|ing)?(?![-‐ ]like\b| come true)|daydream\w*|fantasi[sz](?:ed|es|ing))\b/i.test(mp)) dreamRun = 2;
    else if (dreamRun) dreamRun--;
    const sexy = SEX_CTX.test(`${paras[pi - 1] ?? ""} ${para} ${paras[pi + 1] ?? ""}`);

    let lastLead: Character | undefined;
    for (const [s0, s1] of sentenceSpans(mp)) {
      // Swap epithets for short tokens once, instead of every pattern carrying the whole epithet list.
      const epiTable: string[] = [];
      let sent = mp.slice(s0, s1);
      if (/\b(?:[Tt]he|[Hh]is|[Hh]er|[Tt]heir)\s/.test(sent)) {
        sent = sent.replace(epithetRe, (e) => `Epithet${epiTable.push(e) - 1}`);
      }
      // "Derek's licking" means "Derek is licking", not a possessive.
      sent = sent.replace(contractionRe, (_, who: string) => `${who} is`);
      // "That bundle of nerves inside him", "his sweet spot": say "his prostate" so every pattern reads it.
      // "Pushed past the tight ring of muscle": whose ring is left to the partner logic, like "his".
      sent = sent.replace(/\b[Tt]he\s+((?:(?:tight|outer|inner|first|clenching|fluttering|puckered|furled|resisting|stubborn)\s+)?rings?\s+of\s+muscles?)\b/g, "his $1");
      if (PROSTATE_HINT.test(sent)) {
        sent = sent.replace(prostateRe, prostateOf).replace(seeStarsRe, prostateOf).replace(insideSpotRe, prostateOf).replace(sweetSpotRe, prostateOf);
      }
      const original = para.slice(s0, s1).trim();
      ctx.newSentence(epiTable);
      // The last sentence of a paragraph, and the next paragraph opens "Behind him, Negan works his pants open": the "he" in front is the other one.
      if (s1 >= mp.trimEnd().length && /^\W*he['’]?s?\b|\b(?:he|she|they)\b/i.test(sent) && !new RegExp(`\\b(?:${NAMES})\\b`).test(sent)) {
        const behind = new RegExp(`^\\W*(?:Behind|Above|Over|Beside|Next to) (?:him|her|them),?\\s+(${NAMES})\\b`).exec(paras[pi + 1] ?? "");
        const doer = behind ? cast.byAlias.get(stripPoss(behind[1])) : undefined;
        const front = doer && ctx.partnerOf(doer);
        if (front) ctx.lastSubject = front;
      }
      ctx.sentMentions = [...sent.matchAll(nameRe)]
        .map((m) => ({ c: cast.byAlias.get(stripPoss(m[0]))!, at: m.index! }))
        .filter((m) => !!m.c);
      ctx.cutoff = Infinity;
      // In this person's chapter, "He wanted…" / "His heart raced" is them, whoever was named in the line before.
      let povLed = false;
      sentPovChar = undefined;
      if (ctx.povNow && POV_SENTENCE.test(sent)) {
        const g: Gender = /^\W*(?:She|Her)\b/.test(sent) ? "f" : "m";
        if (Ctx.compatible(ctx.povNow, g)) { ctx.lastSubject = ctx.povNow; povLed = true; sentPovChar = ctx.povNow; }
      }
      // "He feels his slick trickling out of his hole, if he knew more about the Alpha…": the he who opens the sentence is the viewpoint
      // character, not whoever it names further on.
      const subj = firstEntity(sent);
      if (subj && !povLed) ctx.lastSubject = subj;
      // "Sam's hand rests on Lee's back while he moves": an established penetrating actor keeps moving;
      // the hand's owner is touching his back, not taking over the act.
      const backContact = new RegExp(`^\\W*(${NAMES})['’]s\\s+hand\\b[^.!?;]{0,90}?\\b(?:on|onto)\\s+(${NAMES})['’]s\\s+back\\b[^.!?;]{0,30}?\\b(?:as|while)\\s+he\\s+moves?\\b`).exec(sent);
      if (backContact) {
        const mover = cast.byAlias.get(backContact[2]);
        if (mover && acts.some((a) => a.top === mover && a.cat === "anal" && a.act !== "fingering" && a.para >= pi - 3 && a.para <= pi)) ctx.lastSubject = mover;
      }
      // "Steve was nodding … as he let Eddie abuse his prostate. As he spread his thighs and asked for more.": a fragment that opens on
      // "As / While / And he" carries on the sentence before, so its he is that sentence's subject, not whoever acted last.
      {
        const lead = new RegExp(`^\\W*(${NAMES})\\b`).exec(sent);
        const frag = /^\W*(?:As|While|When|And|Then|Before|After)\s+(he|she)\b/.exec(sent);
        if (frag && lastLead && Ctx.compatible(lastLead, frag[1].toLowerCase() === "she" ? "f" : "m")) ctx.lastSubject = lastLead;
        const lc = lead ? cast.byAlias.get(lead[1]) : undefined;
        lastLead = lc && lc !== cast.secondPerson ? lc : frag ? lastLead : undefined;
      }

      chastityScan(sent, original, pi);
      plugScan(sent, original, pi);
      collarScan(sent, original, pi);
      {
        const penisy = PENIS_CTX.test(sent);
        gateSeen.fill(0);
        for (const pat of patterns) {
          if (pat.abo && !isAbo) continue;
          if (pat.chastity && !isChastity) continue;
          if (pat.chastity && chastityWearer && pat.id.startsWith("chastity-wearer")) continue;
          if (pat.needsCtx && !sexy) continue;
          if (pat.needsPenis && !penisy) continue;
          // Many patterns share a gate (and each has an elided twin): test the sentence against each distinct gate once.
          if (pat.gate) {
            const g = pat.gateId!;
            if (gateSeen[g] === 0) gateSeen[g] = pat.gate.test(sent) ? 1 : 2;
            if (gateSeen[g] === 2) continue;
          }
          if (pat.needs && !pat.needs.test(sent)) continue;
          // The same matches as sent.matchAll(pat.re), without a copy of the regex for each of the hundreds of patterns tried on each sentence; all are
          // found before any is handled, as matchAll did, because handling a match can run other patterns.
          pat.re.lastIndex = 0;
          let found: RegExpExecArray[] | undefined;
          for (let m = pat.re.exec(sent); m; m = pat.re.exec(sent)) {
            (found ??= []).push(m);
            if (m[0] === "") pat.re.lastIndex += pat.re.unicode && /[\ud800-\udbff]/.test(sent[pat.re.lastIndex] ?? "") ? 2 : 1;
          }
          pat.re.lastIndex = 0;
          if (found) for (const m of found) handleMatch(pat, m, sent, original, pi, fantasyPara, para);
        }
      }

      // "All the slick leaking out of him makes it easy for Derek to slide in. “Finally,” Stiles says. He's been waiting for this": a sentence that ends on a
      // spoken line's tag leaves its speaker as the subject the next sentence's he picks up.
      {
        const tag = new RegExp(`(?<=\\s)[”"’]\\s*,?\\s*(${NAMES})\\s+(?:\\w+ly\\s+)?(?:${SAY})\\b[^.!?“”"]{0,40}[.!?]*\\s*$`).exec(sent);
        const speaker = tag ? cast.byAlias.get(tag[1]) : undefined;
        if (speaker && speaker !== cast.secondPerson) ctx.lastSubject = speaker;
      }

      // Update who's been mentioned, in order.
      for (const m of sent.matchAll(nameRe)) ctx.mention(cast.byAlias.get(stripPoss(m[0])));
      if (cast.narrator && /\b(?:I|me|my)\b/.test(sent)) ctx.mention(cast.narrator);
      if (subj) ctx.mention(subj);
    }

    // Dialogue: attribute each quote to a speaker and look for requests/desires.
    // Is sex happening around here? Narration only, so a "fuck me" in the dialogue doesn't count.
    const near = [pi - 3, pi - 2, pi - 1, pi, pi + 1, pi + 2, pi + 3].map((i) => masked[i]?.masked ?? "").join(" ");
    // "hard", "inside", "came", "bed" and "hips" turn up in every long fic: for the weak suggestive lines the narration
    // has to carry an unambiguous sexual word (or several of the loose ones).
    const strictHits = new Set((near.toLowerCase().match(SEX_STRICT) ?? []).map((w) => w.replace(/(?:s|es|ed|ing)$/, "")));
    const narrationSexy = strictHits.size >= 1 || (near.match(SEX_CTX) ?? []).length >= 4 || /\b(?:nipples?|pleasure|arous\w*|undress\w*|thighs?|lube|fingers? (?:in|inside)|crotch|bulge)\b/i.test(near);
    let paraSpeaker: Character | undefined;
    let lastQ: Quote | undefined;
    let lastQPrev: Quote | undefined;
    for (const q of quotes) {
      // '"You can take it, princess," he tells him tightly, "You're made to take my cock."': one speaker.
      // A second quote soon after the first is the same speaker, unless the narration between names someone else
      // ("“Please,” Steve whined a complaint, “Uh uh, be patient.”").
      const gapText = lastQ ? mp.slice(lastQ.end, q.start) : "";
      const gapWho = [...gapText.matchAll(nameRe)].map((m) => cast.byAlias.get(stripPoss(m[0]))).find((c) => !!c);
      // “Cregan,” he says quietly. “Stop treating me like a maiden.”: a short call out, its bare tag, then the same voice goes on.
      const tagOnly = !!lastQ && !!paraSpeaker && lastQ.text.trim().length < 30 && new RegExp(`^[\\s"”’]*(?:he|she|they)\\s+(?:\\w+ly\\s+)?(?:${SAY})(?:\\s+\\w+ly)?\\s*[.,]?\\s*$`, "i").test(gapText.replace(/["“]\s*$/, ""));
      const continues = lastQ && paraSpeaker && q.start - lastQ.end < 50 && ((!/[.!?]["”]?\s*$/.test(para.slice(lastQ.end, q.start).trim() || ".") && !(gapWho && gapWho !== paraSpeaker)) || (tagOnly && !gapWho));
      lastQPrev = lastQ;
      lastQ = q;
      const speaker = (continues ? paraSpeaker : undefined) ?? attributeSpeaker(para, mp, q, paraSpeaker, lastQPrev) ?? paraSpeaker ?? (mp.trim().length < 6 && prevSpeaker ? ctx.partnerOf(prevSpeaker) : undefined);
      chastityScan(q.text, `“${q.text.trim()}”`, pi);
      plugScan(q.text, `“${q.text.trim()}”`, pi);
      if (!speaker) continue;
      paraSpeaker = speaker;
      if (continues || attribExplicit) addressBook.record(speaker, ctx.partnerOf(speaker), q.text, pi, q.text, isNameWord);
      scanDialogue(q.text, speaker, pi, { animal: ANIMAL_NEAR.test(near), explicit: !!continues || attribExplicit, sexy: narrationSexy, oral: ORAL_SCENE_RE.test(near) && !ANAL_NEAR_RE.test(near), frot: FROTTAGE.test(near) && !/\b(?:hole|entrance|stretch\w*|prepar\w*|opens? (?:him|her|them)|inside (?:me|him|you))\b/i.test(near), after: para.slice(q.end, q.end + 60), before: para.slice(Math.max(0, q.start - 60), q.start) });
    }
    if (paraSpeaker) prevSpeaker = paraSpeaker;
  }
  // Lopsided titles and endearments between the pair are hints about who defers and who looks after whom.
  for (const [x, y] of cast.pairings) {
    for (const a of addressBook.asymmetries(x, y)) {
      desires.push(
        a.kind === "title"
          ? { via: "address-title", cat: "vibe", act: `addressing ${a.partner.name.split(" ")[0]} as “${a.terms[0]}”`, who: a.who, partner: a.partner, role: "bottom", wants: true, kind: "behavior", weight: 0.5, para: a.para, sentence: a.example }
          : { via: "address-endearment", cat: "vibe", act: `pet name “${a.terms[0]}” for ${a.partner.name.split(" ")[0]}`, who: a.who, partner: a.partner, role: "top", wants: true, kind: "petname", weight: 0.5, para: a.para, sentence: a.example },
      );
    }
  }
  }

  /** The subject of an earlier verb in "X smiled and sucked him off": nearest name/he/she that isn't an object. */
  function elidedSubject(prefix: string, suffix = "", observe?: (source: PersonOrigin) => void): Character | undefined {
    // A blanked-out quote is a clause boundary: "…," Alex says, choking…
    prefix = prefix.replace(/\s{3,}/g, (x) => `,${" ".repeat(x.length - 1)}`);
    // "Alex hears Sam's breath catch when he pushes…": the breath and the following he belong to Sam.
    const breathOwner = new RegExp(`\\b(${NAMES})['’]s\\s+breath\\s+(?:catch|catches|caught|hitch|hitches|hitched)\\s+(?:when|as|while)\\s*$`).exec(prefix);
    if (breathOwner && /^\s*(?:he|his)\b/i.test(suffix)) { observe?.("clause"); return cast.byAlias.get(breathOwner[1]); }
    // "The northern wolf is a patient man, but … slipping down to the hot springs to jerk off": a sentence that opens on an epithet and names no one
    // else before the left-out subject is about that epithet.
    {
      const ep = /^\W*(Epithet\d+)\b/.exec(prefix);
      if (ep && !new RegExp(`\\b(?:${NAMES})\\b`).test(prefix.slice(ep[0].length))) { const c = ctx.token(ep[1]); if (c) return c; }
    }
    // "Cas' ashamed expression after he fucked Dean": the he is the one whose expression it is.
    {
      const ph = new RegExp(`(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+){0,3}?(?:face|expression|look|eyes|voice|smile|words|shame|hands|mouth|reaction|gaze|stare|fear|anger|guilt|breathing|breath|pulse|heartbeat|moans?|sounds?|noises|gasps|cries|shudders|whimpers)\\s+(?:when|after|as|while|before|once|since)\\s*$`).exec(prefix);
      if (ph && /^\s*(?:he|she|they)\b/i.test(suffix)) { const c = cast.byAlias.get(ph[1]); if (c) return c; }
    }
    // "Dean arches underneath Cas' tongue as he swallows him down": he is the one whose tongue it is.
    const under = new RegExp(`\\b(?:under|underneath|beneath)\\s+(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+)?(?:tongue|mouth|lips|hands?|fingers|touch|ministrations|weight|body|attention)\\s*,?\\s*(?:as|while|when)\\s*$`).exec(prefix);
    if (under) return cast.byAlias.get(under[1]);
    // "Diarmuid trembled beneath him as he continued to lick his cock": he is the him of the first clause, the other one.
    const beneathHim = new RegExp(`(?:^|[.!?,;]\\s+)(${NAMES})\\s+(?:[\\w'’-]+\\s+){1,4}?(?:beneath|underneath|below|under)\\s+(?:him|her)\\s*,?\\s*(?:as|while|when)\\s*$`).exec(prefix);
    if (beneathHim && /^\s*(?:he|she)\b/i.test(suffix)) {
      const subj = cast.byAlias.get(beneathHim[1]);
      const other = subj && ctx.partnerOf(subj);
      if (other) return other;
    }
    // "When Buck looked down and realised that Chris had stopped listening, he blushed": after an opening clause, the he is the
    // opening clause's own subject, not the name inside "realised that Chris…".
    {
      const opening = new RegExp(`^\\W*(?:when|after|before|as|while|once|because|since|although|though|if)\\s+(?:[\\w'’-]+\\s+){0,2}?(${NAMES})\\b[^.!?;,]*?\\b(${NAMES})\\b[^.!?;,]*,\\s*$`, "i").exec(prefix);
      if (opening && /^\s*(?:he|she)\b/i.test(suffix)) {
        const first = cast.byAlias.get(opening[1]), second = cast.byAlias.get(opening[2]);
        if (first && second && first !== second) return first;
      }
    }
    // "He thought Dracula might break the door down and fuck him": after a thinking/seeing verb, the named subject of the
    // embedded clause carries on as the left-out subject.
    {
      const emb = [...prefix.matchAll(new RegExp(`\\b(?:thought|think|thinks|knew|know|knows|felt|feels|imagined|imagines|worried|worries|feared|fears|wondered|wonders|hoped|hopes|hoping|believed|believes|realized|realised|realizes|suspected|suspects|expected|expects|figured|guessed|assumed|sensed|saw|sees|heard|hears|watched|watches|noticed|notices|said|says|swore|promised|wished|wishes|dreaded|pictured|prays|prayed)\\s+(?:that\\s+)?(${NAMES})\\s+(?:(?:just|finally|ever|actually|really|even)\\s+)?(?:might|would|could|will|may|should|must|was|were|had|has|is|are|did|can|decides|decided|wants|wanted|needs|needed|tries|tried|starts|started|gets|got|lets|let|takes|took|does)\\b`, "gi"))].pop();
      if (emb && !new RegExp(`\\b(?:${NAMES})\\b|\\b(?:he|she|they)\\b`, "i").test(prefix.slice(emb.index! + emb[0].length))) {
        const c = cast.byAlias.get(emb[1]);
        if (c) return c;
      }
    }
    // "Dean arches underneath Cas' tongue as he swallows him down, humming around his length while his fingers slip inside
    // him": the "he" is the one whose tongue it is, for the rest of the sentence.
    const underLong = new RegExp(`\\b(?:under|underneath|beneath)\\s+(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+)?(?:tongue|mouth|lips|hands?|fingers|touch|ministrations|weight|body|attention)\\s*,?\\s*(?:as|while|when)\\s+(?:he|she)\\b([^.!?]*)$`).exec(prefix);
    if (underLong && !new RegExp(`\\b(?:${NAMES})\\b`).test(underLong[2])) return cast.byAlias.get(underLong[1]);
    // "…as Dunk's hands kneaded his arse as he pressed his tongue…": the hands' owner carries on as "he".
    const handsOf = new RegExp(`(?:^|[,;]|\\b(?:as|while|when|and|but|then|yet|so))\\s+(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+)?(?:hands?|fingers|mouth|lips|tongue|arms?|thumbs?|palms?)\\s+([^;—]*?)\\b(?:as|while|when)\\s*$`).exec(prefix);
    if (handsOf && !new RegExp(`\\b(?:${NAMES})\\b|\\b(?:he|she|they)\\b`, "i").test(handsOf[2])) return cast.byAlias.get(handsOf[1]);
    // "Stiles want to weep if he wasn't so intent on having Derek inside him, filling him up enough to breed him": the one inside does the filling.
    {
      const inside = new RegExp(`\\b(?:having|have|has|had|wanting|want|wants|wanted|needing|need|needs|needed)\\s+(${NAMES})\\s+(?:\\w+\\s+){0,2}?(?:inside|in|into)\\s+(?:of\\s+)?(?:him|her|them)\\b[^.!?;]*$`, "i").exec(prefix);
      if (inside) { const c = cast.byAlias.get(inside[1]); if (c) return c; }
    }
    // "Ethan close enough to touch, if only Hank could find the courage, buried deep inside him": the wish is Hank's, so the
    // participle that picks the sentence back up is Hank.
    {
      const wish = new RegExp(`\\bif\\s+only\\s+(${NAMES})\\b[^.!?;]*?(?:,\\s*)?$`, "i").exec(prefix);
      if (wish && /^[\s,]*\w+(?:ed|ing)\b/.test(suffix)) { const c = cast.byAlias.get(wish[1]); if (c) return c; }
    }
    // "Anakin was actually pretty sure he'd meant to feed him and fuck him": a he inside "X was sure he…" is the other one.
    {
      const sure = new RegExp(`(${NAMES})\\s+(?:(?:was|is|were|are|felt|feels|seemed|seems)\\s+)?(?:\\w+\\s+){0,2}?(?:sure|certain|convinced|positive|suspected)\\s+(?:that\\s+)?(?:he|she|they)(?:['’]d|['’]ll|['’]s)?\\b[^.!?;]*$`, "i").exec(prefix);
      // …but "sure he'd like to be fucked" is about himself: a passive wish keeps the same person.
      if (sure && !/\b(?:be|get|being|getting|been)\s+(?:\w+ly\s+)?(?:fucked|taken|filled|screwed|pounded|railed|bred|knotted|ridden|used|claimed|had|held|touched)\b/i.test(suffix.slice(0, 60))) { const x = cast.byAlias.get(sure[1]); const o = x && ctx.partnerOf(x); if (o) return o; }
    }
    // "Cas didn't wait for Dean to say anything else, he just pushed inside": the he after the comma is the main clause's
    // subject, not the name inside "for Dean to…".
    {
      const mainThenObj = new RegExp(`(?:^|[.!?]\\s+)(${NAMES})\\s+(?:[\\w'’-]+\\s+){1,5}?(?:for|to|at|with|until)\\s+(${NAMES})\\b[^.!?;,]*,\\s*$`).exec(prefix);
      if (mainThenObj && /^\s*(?:he|she)\b/i.test(suffix)) {
        const first = cast.byAlias.get(mainThenObj[1]), second = cast.byAlias.get(mainThenObj[2]);
        if (first && second && first !== second) return first;
      }
    }
    // "Dean hardly had any warning before he was pushing inside him": the "he" is the other one.
    const warned = new RegExp(`(${NAMES})\\s+(?:(?:hardly|barely|scarcely|never|still)\\s+)?(?:had|has|got|gets|received)\\s+(?:hardly|barely|scarcely|little|no|any|not much|not any|almost no)\\s+(?:\\w+\\s+)?warning\\s+before\\s*$`).exec(prefix);
    if (warned && /^\s*(?:he|she|they)\b/i.test(suffix)) { const w = cast.byAlias.get(warned[1]); const o = w && ctx.partnerOf(w); if (o) return o; }
    // "He can feel the hard line of the man's erection … as it grinds against his ass and struggles with the urge to rock back": the one feeling it is not the one
    // whose erection it is, so the left-out subject after it is that person's partner.
    {
      const feel = new RegExp(`^\\W*(?:he|she)\\s+(?:can|could|will|would)?\\s*(?:feel|felt|feels|sense|sensed)\\s+(?:the\\s+[\\w-]+\\s+(?:[\\w-]+\\s+)?(?:of\\s+)?)?(${NAMES}|${EPITHET_TOKEN})['’]s\\b`, "i").exec(prefix);
      if (feel) { const owner = resolveToken(feel[1]); const other = owner && ctx.partnerOf(owner); if (other) return other; }
    }
    // "He watched as Cas put lube on his fingers and then reached back so he could open himself up": after "watched as Cas", the rest of the sentence is Cas's.
    {
      const asClause = new RegExp(`^\\W*(?:he|she)\\s+(?:watched|saw|heard|felt|noticed|let|listened|observed)\\b[^.!?;]*?\\b(?:as|while|when)\\s+(${NAMES}|${EPITHET_TOKEN})\\b([^.!?;]*)$`, "i").exec(prefix);
      if (asClause && !new RegExp(`\\b(?:${NAMES})\\b`).test(asClause[2])) { const c = resolveToken(asClause[1], asClause[2] + suffix); if (c) return c; }
    }
    // "Cas’s hand wandered again, cupping his ass": the participle belongs to the hand's owner.
    const handPart = new RegExp(`(?:^|[,;.]|\\b(?:and|as|while|when))\\s*(${NAMES})['’]s?\\s+(?:[\\w-]+\\s+)?(?:hands?|fingers|mouth|lips|tongue|arms?|thumbs?|palms?)\\s+(?:\\w+(?:\\s+|(?=[,;]|$))){1,3}?[,;]?\\s*(?:and\\s+)?$`).exec(prefix);
    if (handPart && /^\W*[A-Za-z]+ing\b/.test(suffix)) return cast.byAlias.get(handPart[1]);
    // "—pressing him down, and Riddle with him—" is an aside, not the clause's subject.
    prefix = prefix.replace(/—[^—]*—/g, (x) => " ".repeat(x.length));
    const re = new RegExp(`(?:^|([\\w'’]+)?([\\s,]+))((?:${NAMES}|${EPITHET_TOKEN})(?![\\w'’])|[Hh]e|[Ss]he|[Tt]hey|I)(?=[\\s,])`, "g");
    const hits = [...prefix.matchAll(re)];
    // "Laurent needs Damianos to know he likes him … that he drags him": after "needs X to", a bare he/she is X.
    const ctl = [...prefix.matchAll(new RegExp(`\\b(?:need|want|ask|tell|told|beg|let|make|made|get|got|expect|order|allow|permit|force|forc|command|invite|encourage|instruct|coax|urge|help|wish|like)\\w*\\s+(${NAMES})\\s+to\\b`, "gi"))].pop();
    // "The count permitted Jack to wriggle beneath him … while he was impaled": the he that follows is Jack.
    if (ctl && /^\s*(?:he|she|they)\b/i.test(suffix) && !new RegExp(`\\b(?:${NAMES})\\b`).test(prefix.slice(ctl.index! + ctl[0].length))) {
      const named = cast.byAlias.get(ctl[1]);
      if (named) return named;
    }
    const lastHit = hits[hits.length - 1];
    if (ctl && lastHit && /^(?:he|she|they)$/i.test(lastHit[3]) && lastHit.index! > ctl.index!) {
      const named = cast.byAlias.get(ctl[1]);
      if (named) return named;
    }
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i];
      // After a comma we're at a clause start, so whatever came before doesn't make this an object.
      const prev = h[2]?.includes(",") ? "" : (h[1] ?? "").toLowerCase();
      // "Cas checking that Dean was ok and with a nod he lined up": "that Dean" is an embedded clause, so a later "he"
      // goes back to the main subject, if there is one.
      if (prev === "that" && i > 0 && /^(?:he|she|they|I)$/i.test(suffix.trim().split(/[\s,]/)[0] ?? "")) continue;
      // A name right after a verb or preposition is an object ("spread Draco open"), not a subject.
      const isObject =
        !!prev &&
        !/^(?:and|but|or|so|then|when|as|while|because|until|before|after|if|though|although|once|since|where|now|still|finally|later|suddenly|slowly|meanwhile|that|who|yes|no|oh|moment|instant|second|minute|time|day|night|morning|evening|afternoon)$/.test(prev) &&
        // "…," whispers Alex: a name after a speech verb is its subject.
        !/^(?:says|said|whispers|whispered|murmurs|murmured|asks|asked|groans|groaned|moans|moaned|breathes|breathed|growls|growled|gasps|gasped|mutters|muttered|replies|replied|begs|begged|pants|panted|laughs|laughed|sighs|sighed|whimpers|whimpered|hisses|hissed|purrs|purred|teases|teased|grunts|grunted|answers|answered|adds|added|continues|continued|corrects|corrected|leers|leered|demands|demanded|insists|insisted|admits|admitted|pleads|pleaded|chokes|choked|calls|called|cries|cried)$/.test(prev);
      // "…at Sam, who's leaning over Steve…": a relative clause makes Sam the subject of what follows.
      const relative = /^,?\s*who\b/.test(prefix.slice(h.index! + h[0].length)) ||
        // "with Cas clenched tight and rolling his hips": "with X" + participle is a subject.
        (prev === "with" && /^\s+(?:\w+ly\s+)?\w+(?:ed|ing)\b/.test(prefix.slice(h.index! + h[0].length))) ||
        // "it didn't take long for Dean to cum, spilling into his mouth": X in "for X to <verb>" is the verb's subject.
        (prev === "for" && /^\s+to\s+\w+/.test(prefix.slice(h.index! + h[0].length))) ||
        // "after a few minutes of Buck fucking his finger into him", "pictured Buck straddling him": X is the gerund's subject.
        (/^(?:of|after|before|from|despite|at|by|picture[sd]?|pictur\w+|imagin\w+|watch\w*|see|sees|saw|seen|hear\w*|heard)$/.test(prev) && /^\s+(?:\w+ly\s+)?(?:\w+ing|on top)\b/.test(prefix.slice(h.index! + h[0].length) + suffix));
      // "he wasn't the man who pushed Laurent to the door to fuck him": the epithet describes the copula's subject, who
      // is the one doing what follows.
      if (relative && /^Epithet\d+$/.test(h[3]) && i > 0 && /\b(?:was|were|is|am|are|be|been)(?:n['’]t| not)?\s+$/i.test(prefix.slice(0, h.index! + h[0].length - h[3].length))) continue;
      if (isObject && !relative && !/^(?:He|She|They|I)$/.test(h[3])) continue;
      return resolveToken(h[3], prefix.slice(h.index! + h[0].length) + suffix, observe);
    }
    return undefined;
  }

  /** A name, epithet token, or pronoun to a character (pronouns can't mean someone named in `rest`). */
  function resolveToken(tok: string, rest = "", observe?: (source: PersonOrigin) => void): Character | undefined {
    const named = cast.byAlias.get(stripPoss(tok));
    if (named) { observe?.("clause"); return named; }
    const viaEpithet = ctx.token(stripPoss(tok));
    if (viaEpithet !== null) { observe?.("epithet"); return viaEpithet; }
    const p = pronoun(stripPoss(tok));
    if (!p) return undefined;
    if ("fixed" in p) { observe?.("pov"); return ctx.fixed(p.fixed); }
    const subject = ctx.subjectFor(p.gender);
    const chosen = notNamedLater(subject, rest, p.gender);
    observe?.(chosen !== subject ? "partner" : subject === ctx.lastSubject ? "last-subject" : "recent");
    return chosen;
  }

  /** Who a line is spoken to, when it says so: a name, a term this pair keeps using for one of them, or a role the tags give ("Alpha"). */
  function nameAddressee(text: string): Character | undefined {
    const voc = new RegExp(`(?:^|[,.!?]\\s+|\\b(?:hey|oh|please|yes|no|god),?\\s+)(${NAMES})(?=\\s*[,.!?…]|\\s*$)|,\\s*(${NAMES})\\b`).exec(text);
    return voc ? cast.byAlias.get(voc[1] ?? voc[2]) : undefined;
  }
  function addresseeOf(text: string): Character | undefined {
    const byName = nameAddressee(text);
    if (byName) return byName;
    // “Fill me, Alpha,” he says: "Alpha" is what this pair keeps calling one of them, so that one is being spoken to, not speaking.
    const viaTerm = addressBook.listenerOf(text, isNameWord) ?? priorAddress.listenerOf(text, isNameWord);
    if (viaTerm) return viaTerm;
    // The same for a role the tags give one of them ("Alpha Derek Hale"): "Yes, Alpha." / "Fuck, Der—Alpha." is said to the Alpha.
    const role = /(?:^|[,.!?—–]\s*|\b(?:yes|no|please|oh|god|fuck|thank you),?\s+)(?:my\s+)?(Alpha|Omega)\s*(?:[,.!?…]|$)|,\s*(?:my\s+)?(Alpha|Omega)\s*(?:[,.!?…]|$)/i.exec(text);
    return role ? ctx.epithets.get(`noun:${(role[1] ?? role[2]).toLowerCase()}`) : undefined;
  }

  /** The speaker, unless the line speaks to that very person ("Your dick, Damianos." or "Yes, Alpha."), which makes it the other one. */
  function attributeSpeaker(para: string, mp: string, q: Quote, prevSpeaker?: Character, prevQ?: Quote): Character | undefined {
    attribExplicit = false;
    const who = attributeSpeakerFrom(para, mp, q, prevSpeaker, prevQ);
    if (!who) return who;
    // A tag that names the speaker ("…," Steve said) is not overruled by a term of address; a bare "he" or a guess is.
    const named = new RegExp(`^[,.!?—–\\s]*(?:${NAMES})\\s+(?:\\w+ly\\s+)?(?:${SAY})\\b`).test(para.slice(q.end, q.end + 80)) ||
      new RegExp(`(?:${NAMES})\\s+(?:\\w+ly\\s+)?(?:${SAY})(?:\\s+[\\w’']+){0,4}?[,:.]?\\s*["“‘]?\\s*$`).test(mp.slice(Math.max(0, q.start - 80), q.start));
    const to = named ? nameAddressee(q.text) : addresseeOf(q.text);
    return to && to === who ? (ctx.partnerOf(to) ?? who) : who;
  }

  function attributeSpeakerFrom(para: string, mp: string, q: Quote, prevSpeaker?: Character, prevQ?: Quote): Character | undefined {
    const after = para.slice(q.end, q.end + 80);
    const before = mp.slice(Math.max(0, q.start - 80), q.start);
    const resolve = (tok: string | undefined) => {
      if (!tok) return undefined;
      const named = cast.byAlias.get(stripPoss(tok));
      if (named) return named;
      const p = pronoun(tok);
      if (!p) return undefined;
      if ("fixed" in p) return ctx.fixed(p.fixed);
      // "Alex fucks him through it. 'You can take it,' he tells him": he is the narration's subject just before.
      // A paragraph that opens with "'Cock,' he says": the other person from the last line.
      if (q === turnQuote && turnSpeaker && Ctx.compatible(turnSpeaker, p.gender)) return turnSpeaker;
      // The main subject of the last sentence before the quote ("Henry moans … as Alex lifts him. 'Use me,' he whispers").
      const lastSentence = mp.slice(0, q.start).trim().split(/(?<=[.!?])\s+/).pop() ?? "";
      let prior = lastSentence.length > 5 ? (firstEntity(lastSentence) ?? elidedSubject(lastSentence)) : undefined;
      // “Peers down at where they're pressed together and is suddenly timid again. “You're so big,” he mutters”: a fragment with no name
      // carries on the sentence before it, whose subject opens it.
      if (!prior && lastSentence.length > 5 && !/\b(?:he|she|him|her)\b/i.test(lastSentence.slice(0, 3))) {
        const sents = mp.slice(0, q.start).trim().split(/(?<=[.!?])\s+/);
        for (let i = sents.length - 2; i >= Math.max(0, sents.length - 4) && !prior; i--) {
          const lead = new RegExp(`^\\W*(${NAMES})\\b`).exec(sents[i]);
          const c = lead ? cast.byAlias.get(stripPoss(lead[1])) : undefined;
          if (c && c !== cast.secondPerson) prior = c;
        }
      }
      if (prior && Ctx.compatible(prior, p.gender)) return prior;
      return ctx.subjectFor(p.gender);
    };
    // '"…," he heard Cas' voice': the voice's owner said it.
    const heard = new RegExp(`^[,.!?—–\\s]*(?:[Hh]e|[Ss]he|[Tt]hey|I)\\s+(?:\\w+\\s+)?(?:heard|hears|recognized|recognised)\\s+((?:${NAMES}))(?:['’]s?)?\\s+(?:\\w+\\s+)?voice`).exec(after);
    if (heard) { attribExplicit = true; return cast.byAlias.get(heard[1]); }
    // "Carl can hear how breathless he sounds, “I can see it”": what someone hears is the other person's voice.
    const hearing = new RegExp(`(${NAMES})\\s+(?:can |could )?(?:hear|hears|heard)\\s+[^"“.!?]{0,60}[,:]\\s*["“‘]?\\s*$`).exec(before);
    if (hearing) {
      const listener = cast.byAlias.get(stripPoss(hearing[1]));
      const talker = listener && ctx.partnerOf(listener);
      if (talker) { attribExplicit = true; return talker; }
    }
    // "…but Negan still isn't done. “Little hole like yours…”", "Relentlessly, Negan keeps going, “I’d pull out…”": the named person carries on talking.
    const carryOn = new RegExp(`(${NAMES})\\s+(?:still\\s+|just\\s+|already\\s+)?(?:isn['’]t done|isn['’]t finished|keeps going|keeps talking|continues|goes on|is (?:already )?speaking again|speaks again)[^"“]{0,30}$`).exec(before);
    if (carryOn) {
      const who = cast.byAlias.get(stripPoss(carryOn[1]));
      if (who) { attribExplicit = true; return who; }
    }
    const a1 = new RegExp(`^[,.!?—–\\s]*((?:${NAMES})|[Hh]e|[Ss]he|[Tt]hey|I)\\s+(?:\\w+ly\\s+)?(?:${SAY})\\b`).exec(after);
    if (a1) {
      attribExplicit = true;
      let who = resolve(a1[1]);
      // "“Good boy,” He says and Steve moans": the he of the tag isn't the person named later in the same sentence.
      if (/^(?:he|she|they)$/i.test(a1[1])) {
        const rest = after.slice(a1[0].length).split(/[.!?]/)[0];
        const m2 = new RegExp(`\\b(${NAMES})\\b`).exec(rest);
        const named = m2 ? cast.byAlias.get(stripPoss(m2[1])) : undefined;
        if (named && who === named) who = ctx.partnerOf(named) ?? who;
      }
      return who;
    }
    const a2 = new RegExp(`^[,.!?—–\\s]*(?:${SAY})\\s+((?:${NAMES})|he|she|they)\\b`).exec(after);
    if (a2) { attribExplicit = true; return resolve(a2[1]); }
    const b1 = new RegExp(`((?:${NAMES})|[Hh]e|[Ss]he|[Tt]hey|I)\\s+(?:\\w+ly\\s+)?(?:${SAY})(?:\\s+[\\w’']+){0,4}?[,:.]?\\s*["“‘]?\\s*$`).exec(before);
    // "“Eddie,” He moans raggedly. “Open your eyes.”": a tag sitting right after the previous quote belongs to that quote,
    // so the new line is the other person's turn.
    const tagOfPrev = !!b1 && (!before.slice(0, b1.index!).trim() || /\s{2,}$/.test(before.slice(0, b1.index!)) || /["”’]\s*$/.test(before.slice(0, b1.index!)));
    if (b1 && !tagOfPrev) { attribExplicit = true; return resolve(b1[1]); }
    // "“We don’t have to,” Spencer murmured. “Hell, no. I want you inside me.”": an answer straight after the other one's tagged line is theirs to give.
    if (b1 && tagOfPrev && /^\s*["“‘]?\s*(?:hell,?\s+)?(?:no|nah|nope)\b/i.test(para.slice(q.start, q.start + 20)) &&
        /\?|\b(?:don['’]t have to|you can|if you (?:need|want|like)|we can|do you|are you|want to|need to)\b/i.test(prevQ?.text ?? before.slice(0, b1.index!))) {
      const prevWho = resolve(b1[1]);
      const other = prevWho && ctx.partnerOf(prevWho);
      if (other) { attribExplicit = true; return other; }
    }
    // "“Want you to fuck me. You bring stuff?” ¶ “Yep.” Spencer didn’t seem in any hurry": the beat after the reply names who replied, so the line before it was the other one's.
    if (!para.slice(q.end).trim() && curParaIdx >= 0) {
      const nm = new RegExp(`^\\s*["“‘][^"”’]{0,80}["”’]\\s+(${NAMES})\\b`).exec(paras[curParaIdx + 1] ?? "");
      const replier = nm ? cast.byAlias.get(stripPoss(nm[1])) : undefined;
      const other = replier && ctx.partnerOf(replier);
      if (other) { attribExplicit = true; return other; }
    }

    // “I’m going to take the plug out now.” Dean’s breath hitched…: the narration right after the line is the listener's
    // reaction, so the speaker is the other one.
    if (!mp.slice(0, q.start).trim()) {
      const react = new RegExp(`^[,.!?—–\\s]*(${NAMES})(?:['’]s)?\\s+(?:(?:breath|heart|cock|dick|stomach|cheeks|knees|pulse|body|throat|skin)\\s+(?:\\w+\\s+)?(?:hitched|caught|stuttered|skipped|raced|twitched|throbbed|jerked|clenched|flushed|heated|weakened|trembled|shook|stalled)|(?:shivered|shuddered|swallowed|flushed|blushed|gulped|trembled|nodded))\\b`).exec(after);
      const reactor = react ? cast.byAlias.get(stripPoss(react[1])) : undefined;
      const other = reactor && ctx.partnerOf(reactor);
      if (other) { attribExplicit = true; return other; }
    }
    // “Spread your legs for me.” The sub did as asked…: a scene someone else is performing, not the pair's.
    if (/^\s*(?:The|His|Her|Their|A|An)\s+(?:sub|submissive|Dom|Domme|Master|Mistress|stranger|man|woman|bartender|waitress|server|couple|guy|girl|performer|performers|crowd|audience)\b/.test(mp.replace(/["“”‘’\[\]]\s*/g, " ").trim())) return undefined;
    // “Please,” he cried. Cas pulled his fingers free and moved up. “You’re doing so well.”: after a tag for the
    // previous line, the person whose action comes right before this line is the one speaking.
    if (prevQ) {
      const gapSents = mp.slice(prevQ.end, q.start).trim().split(/(?<=[.!?])\s+/).filter(Boolean);
      if (gapSents.length >= 2) {
        const ent = firstEntity(gapSents[gapSents.length - 1]);
        if (ent) { attribExplicit = true; return ent; }
      }
    }
    // Otherwise, whoever the narration in this paragraph is about.
    const narr = mp.replace(/["“”‘’\[\]]\s*/g, " ").trim();
    // "His friend listened, picking up the pace. '…'": the partner of the character whose point of view this is.
    if (/^(?:His|Her|Their)\s+(?:friend|lover|partner|boyfriend|husband|girlfriend|wife|date|companion|boss)\b/.test(narr) && ctx.lastSubject) {
      const other = ctx.partnerOf(ctx.lastSubject);
      if (other) return other;
    }
    const fromNarration = narr.length > 5 ? firstEntity(narr) : undefined;
    if (fromNarration) return fromNarration;
    // A term this pair keeps using for one of them ("sir", "half man") says who the line is for, so the other one said it.
    const viaTerm = addressBook.listenerOf(q.text, isNameWord) ?? priorAddress.listenerOf(q.text, isNameWord);
    if (viaTerm) { const sp = ctx.partnerOf(viaTerm); if (sp) return sp; }
    // A line that addresses someone by name ("…, Dean.") was said by the other person.
    const voc = new RegExp(`(?:^|[,.!?]\\s+|\\b(?:hey|oh|please|yes|no|god),?\\s+)(${NAMES})(?=\\s*[,.!?…]|\\s*$)|,\\s*(${NAMES})\\b`).exec(q.text);
    const addressed = voc ? cast.byAlias.get(voc[1] ?? voc[2]) : undefined;
    return addressed ? ctx.partnerOf(addressed) : undefined;
  }

  function scanDialogue(line: string, speaker: Character, pi: number, around: { animal?: boolean; explicit?: boolean; sexy: boolean; oral?: boolean; frot?: boolean; after: string; before: string }) {
    // "It's just three little words. ‘Please fuck me’.", "say ‘fuck me’ for me": words he is asking the other to say, not his own.
    line = line.replace(/(\b(?:words[.:,]?|say|says|repeat|beg|ask|whisper|tell\s+me)\s*(?:[^.!?‘']{0,30})?)[‘'][^’']{3,70}[’']/gi, "$1 …");
    // "so I don't feel the need to jump your bones every time you show up": a want that is being denied.
    line = line.replace(/\b(?:so\s+)?(?:i|we|you|he|she)\s+(?:don['’]t|do not|won['’]t|can['’]t|wouldn['’]t|didn['’]t)\s+(?:feel|have|get)\s+(?:the\s+)?(?:need|urge|desire|temptation|impulse)\s+to\s+[^.!?;]*/gi, " ");
    const lower = line.toLowerCase().replace(/’/g, "'");
    const seen = new Set<string>();
    // "I'm going to cage you now", "As long as you're wearing that cage, you're mine", "There's a cage around my dick": the one speaking
    // is the keyholder when they say "you", the wearer when they say "my".
    if (chastityWearer && /\b(?:cock[- ]?cage|chastity|(?:the|that|this|a|your|my)\s+cage|cage\s+(?:you|him|your|around|on))\b/.test(lower) && !NOT_CAGE.test(lower)) {
      const wearer = chastityWearer;
      const holder = tagPartner(wearer);
      const note = (who: Character, partner: Character | undefined, role: Role, via: string, act: string, cat: Cat = "vibe", kind: Desire["kind"] = "behavior", weight = 0.5) => {
        if (!partner || desires.some((d) => d.via === via && d.who === who && d.sentence === `“${line.trim()}”`)) return;
        if (cat !== "vibe") {
          if (desires.some((d) => d.via === via && d.para === pi)) return;
          const near = `${line} ${paras[pi - 1] ?? ""} ${paras[pi] ?? ""} ${paras[pi + 1] ?? ""}`;
          if (cat === "anal" ? !(ANAL_NEAR_RE.test(near) || ANAL_CTX.test(near) || FINGER_CTX.test(near) || /\bplug\b/i.test(near)) : !ORAL_NEAR_RE.test(near)) return;
        }
        desires.push({ via, cat, act, who, partner, role, wants: true, kind, weight, para: pi, sentence: `“${line.trim()}”`, basis: "named", guessed: around.explicit === false ? true : undefined });
      };
      if (speaker === wearer && /\b(?:my|me|i)\b/.test(lower)) {
        note(wearer, holder, "bottom", "chastity-wearer", "wearing a chastity device");
      } else if (speaker === holder && /\b(?:you|your)\b/.test(lower)) {
        note(holder, wearer, "top", "chastity-keyholder", "controlling a chastity device");
      }
    }
    // Generic "take it" / "you're so tight" talk is oral when the line itself mentions a mouth ("swallow me down") or the
    // scene around it is oral and not anal.
    const oralLine = ORAL_LINE_RE.test(lower) || (!!around.oral && !ANAL_LINE_RE.test(lower));
    for (const d0 of DIALOGUE) {
      const generic = d0.cat === "anal" && d0.kind === "said" && d0.weight !== undefined && d0.weight < 1;
      const d: DialogueDef = generic && oralLine ? { ...d0, cat: "oral", act: "blowjob" } : d0;
      const m = d.re.exec(lower);
      if (!m) continue;
      // Suggestive lines ("take it", "you're so tight", "you're huge") only count when the narration around them
      // is sexual: "please take it" can be a gift, "too proud to take it" help.
      if (d.weight !== undefined && d.weight < 1 && (d.kind === "said" || d.kind === "petname" || d.kind === "position" || d.kind === "aftercare") && !around.sexy) continue;
      // "How do you take it?" is coffee; "you were both trying to fuck me" is a report, not a request.
      if (d.kind === "said" && /\bhow (?:do|would|did|d['’]you)\s+(?:you\s+)?take (?:it|your \w+)\b/.test(lower)) continue;
      if (/^fuck me$/.test(m[0]) && /\b(?:trying|tried|tries|try|attempting|attempted)\s+to\s+$/.test(lower.slice(Math.max(0, m.index! - 24), m.index!))) continue;
      // “So full, Stiles.” is said to Stiles about Stiles: a bare "so full / so deep" followed by the other's name describes the listener.
      if (d.cat === "anal" && d.role === "bottom" && /^\W*so (?:full|deep)\b/.test(m[0]) && new RegExp(`^\\W*[Ss]o (?:full|deep)\\s*,\\s*(?:${NAMES})\\b`).test(line.trim())) continue;
      // "Good boy" said to a dog is a dog.
      if (d.kind === "petname" && around.animal) continue;
      // Pet names, care, check-ins and "I like to…" lines only count when the speaker was actually named, not guessed.
      if ((d.kind === "petname" || d.kind === "aftercare" || d.kind === "position" || d.kind === "stated") && around.explicit === false) continue;
      // “Please suck me off, Eddie… need your mouth on me” is about a cock, not an ass.
      if (d.act === "rimming" && /\b(?:suck|blow)\s+(?:me|my)\b|\bmouth on me\b/.test(lower) && !/\b(?:ass|arse|hole)\b/.test(lower)) continue;
      if (d.cat === "anal" && IDIOM_ASS.test(lower)) continue;
      // "You're so big" over two cocks held together is frottage, not anal sex.
      if (d.cat === "anal" && d.role === "bottom" && around.frot && /\bso\s+(?:big|huge|thick)\b|you(?:'re| are| feel| felt)\s+(?:so\s+)?(?:big|huge|thick)\b/.test(m[0])) continue;
      // "Fuck me, it's cold" / "Well, fuck me" / "fuck me sideways": an exclamation, not a request.
      if (/^fuck me$/.test(m[0]) && exasperated(lower, m.index!, around)) continue;
      // One line can match several phrasings of the same request ("I want you to fuck me").
      const key = `${d.cat}:${d.role}:${d.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const before = lower.slice(Math.max(0, m.index - 30), m.index);
      // "I think you need to be filled", "you want to get fucked": the want belongs to the listener, so the speaker is the one who
      // would do it. "He needs to be fucked" is about someone else and says nothing about the speaker.
      let role = d.role;
      if (d.cat === "anal" && d.role === "bottom" && /^(?:want|need|wanna)\w*\s+(?:to\s+)?(?:get|be|getting|being)\b/.test(m[0])) {
        const subj = /\b(you|u|he|she|they)\s+(?:(?:really|just|so|clearly|obviously|definitely|still|also|totally|fucking)\s+)*$/.exec(lower.slice(Math.max(0, m.index! - 40), m.index!));
        if (subj) { if (/^(?:you|u)$/.test(subj[1])) role = "top"; else continue; }
        // "Need to be fucked hard…think you need to be pleasured, too": a bare "need to be" in a line that goes on to say you need is about the listener.
        else if (/\byou\s+(?:really\s+)?(?:need|want|should|must|deserve)\b/.test(lower.slice(m.index!, m.index! + 100))) role = "top";
      }
      // "Won't you fuck me?" / "Sure you won't fuck me?" are requests, not refusals.
      const question = /\?\s*$/.test(lower.slice(m.index)) && !/[.!]/.test(lower.slice(m.index, m.index + m[0].length + 40).split("?")[0]);
      const negated =
        (!question && /\b(?:don't|do not|never|won't|will not|not|can't|cannot|no|wouldn't|shouldn't|stop)\s+(?:(?!hesitate|forget|stop|let)\w+\s+){0,3}$/.test(before)) ||
        /\bas if\b[^.!?]*$/.test(before);
      // "Because if I win, I want to breed you": a wish that hangs on a condition is a "what if", not a request now.
      // Other ways of putting it off or wondering: "someday I'll fuck you", "maybe next time I could", "what if I fucked you", "once we're married".
      const lead = lower.slice(Math.max(0, m.index! - 110), m.index! + m[0].length);
      const sentLead = lead.split(/[.!?;]\s+/).pop() ?? lead;
      const conditional =
        /\bif\b[^.!?;]{2,70},\s*(?:(?:then|and|so)\s+)?(?:i|we|you)\b[^.!?;]{0,30}$/.test(lead) ||
        /\b(?:what if|some ?day|one day|one of these days|next time|sometime|someday|maybe|perhaps|once (?:i|we|you|this)|when(?:ever)? (?:i|we|you) (?:get|got|can|could|finally|win|won|lose|lost|are|am)|i wonder|i bet|imagine|suppose|pretend|if i ever|if we ever|some other time)\b/.test(sentLead);
      const kind = d.kind === "said" && conditional ? "hypothetical" : d.kind;
      let listener = ctx.partnerOf(speaker);
      // A named kissing respondent answering an oral offer is its listener, rather than a third person from the last act.
      if (/\b(?:wanna|want to)\s+fuck\s+my\s+mouth\b/.test(lower)) {
        const next = paras[pi + 1] ?? "";
        const response = new RegExp(`^\\W*(${NAMES})\\s+presses\\s+(?:his|her|their)\\s+lips\\s+to\\s+(${NAMES})['’]s\\s+again\\b[^.!?]{0,80}\\badmitt?\\w*\\b`).exec(next);
        const respondent = response && cast.byAlias.get(response[1]), recipient = response && cast.byAlias.get(response[2]);
        if (respondent && recipient === speaker && respondent !== speaker) listener = respondent;
      }
      desires.push({
        via: `dialogue:${d.act}`,
        cat: d.cat,
        act: d.act,
        who: speaker,
        partner: listener,
        role,
        wants: !negated,
        kind,
        weight: (d.weight ?? (d.kind === "ogling" ? 0.6 : 1)) * reliabilityOf(`dialogue:${d.act}`) * (around.explicit === false ? 0.5 : 1),
        guessed: around.explicit === false ? true : undefined,
        para: pi,
        sentence: `“${line.trim()}”`,
      });
    }
  }

  /** Is this "fuck me" an exclamation rather than a request? */
  function exasperated(line: string, at: number, around: { sexy: boolean; after: string; before: string }): boolean {
    const before = line.slice(0, at);
    const after = line.slice(at + "fuck me".length);
    // A request says so: "please fuck me", "fuck me harder", "just fuck me already", "I need you to fuck me".
    const request =
      /\b(?:please|just|now|need|want|wanna|gonna|going to|will you|would you|can you|could you|come on|c'mon|you should|to)\s+(?:\w+\s+)?$/.test(before) ||
      /^[,!]?\s*(?:please|harder|faster|deeper|now|already|properly|slow(?:ly)?|hard|raw|open|good|right there|until|so|like|with (?:your|that|those) (?:cock|dick|fingers?|tongue|strap)|into|through|against|on|over (?:the|this|that|my)|from behind|again)\b/.test(after);
    // "Fuck me, so El really can move shit with her mind?": a comma and then a new clause.
    if (/^,\s*so\s+(?:\w+\s+){0,2}?(?:really|can|could|did|does|do|is|are|was|were|will|would|you|we|he|she|they|it)\b/.test(after)) return true;
    if (request) return false;
    // "Sure you won't fuck me?" is asking for it.
    if (/^\s*\?/.test(after)) return false;
    // "Oh, fuck me", "well fuck me", "holy shit, fuck me"
    if (/\b(?:oh|well|ah|god|jesus|christ|holy|bloody|shit|man|dude|ugh|wow|damn|hell|lord|mate|boy|seriously|honestly)\b[\s,!.]*$/.test(before)) return true;
    // An idiom: "fuck me sideways / running / dead / twice / gently with a chainsaw", "fuck me if I know"
    // "so fuck me for trying to keep my lungs healthy": an accusation.
    if (/^\s+for\b/.test(after)) return true;
    if (/^[,!]?\s*(?:sideways|running|dead|twice|blind|pink|silly|gently with|with a (?:spoon|chainsaw|cactus|rake|brick)|if\b|in the|up\b|over\b(?!\s+(?:the|this|that|my))|three ways|backwards)/.test(after)) return true;
    // A new clause after it: "Fuck me, it's cold", "fuck me, you're right", "fuck me, what a day"
    if (/^\s*[,!.—-]+\s*(?:i\b|i'm|i've|i'd|you're|you've|you were|it|it's|that|that's|this|there|we|he|she|they|so|but|what|how|why|who|where|when|look at|these|those|the|a\b|an\b|my|our|his|her)/.test(after)) return true;
    // Said like a curse: "Fuck me," he muttered / swore / sighed.
    if (/^\s*[,!.]?\W*\s*(?:\w+\s+){0,2}(?:mutter|swor|swear|curs|sigh|grumbl|groan(?:ed)? in (?:frustration|disbelief)|laugh|snort|scoff|exclaim|whistl)\w*/i.test(around.after)) return true;
    // Nothing sexual happening around it, and nothing marking it as a request.
    return !around.sexy;
  }

  /** Whether a paragraph mentions a cock, an ass, fingers or other sex-scene context (cached). */
  function bodyContext(i: number): boolean {
    if (i < 0 || i >= paras.length) return false;
    let v = bodyCtxCache.get(i);
    if (v === undefined) {
      const p = paras[i];
      v = PENIS_CTX.test(p) || ANAL_CTX.test(p) || FINGER_CTX.test(p) ||
        /\b(?:naked|legs\s+(?:apart|wide|open)|spread|thighs|hips|lube\w*|slick\w*|condom)\b/i.test(p);
      bodyCtxCache.set(i, v);
    }
    return v;
  }

  /** "…without being fucked open by older men": past experience with other people, a hint about this person's role. */
  function addHistory(cat: Cat, act: string, who: Character, role: Role, partner: Character, sentence: string, pi: number) {
    if (cat === "vaginal") return;
    desires.push({ via: "history", cat, act: "past experience with others", who, partner, role, wants: true, kind: "history", weight: 0.8, para: pi, sentence, other: { label: "someone else (in the past)", kind: "unnamed" } });
  }

  /**
   * One person in a plain narrated act is identifiable and the other is not ("eating Stiles out" with the eater unresolved, "he took me
   * deep" with the narrator the one sucked, "the twink gagged on Jordan's length"). The act can't be placed between two people, but the
   * identifiable one's role is clear, so it counts as a hint for them.
   */
  function oneSided(pat: CompiledPattern, m: RegExpMatchArray, tTok: string | undefined, bTok: string | undefined, sent: string, original: string, pi: number, actorOutside = false) {
    if (pat.signal || (pat.cat !== "anal" && pat.cat !== "oral")) return;
    const ts = readSlot(tTok, cast, ctx), bs = readSlot(bTok, cast, ctx);
    // When the sentence opens on someone outside the cast, they are the actor, whoever the left-out subject slot guessed.
    const known = actorOutside ? (bs?.char ? { c: bs.char, role: "bottom" as Role } : undefined)
      : ts?.char && !bs?.char ? { c: ts.char, role: "top" as Role } : bs?.char && !ts?.char ? { c: bs.char, role: "bottom" as Role } : undefined;
    if (!known) return;
    // Only plain statements: nothing negated, wished for, imagined, conditional or remembered in the sentence.
    if (NEG.test(sent) || /\b(?:want\w*|wish\w*|imagin\w*|fantas\w*|if|would|could|might|maybe|perhaps|never|used to|remember\w*|dream\w*|hope\w*|need\w*|let me|going to|gonna|beg\w*|almost|nearly|able to|getting to|get to|focus\w*|promis\w*|about to|ready to|tr(?:y|ies|ied|ying)|tempt\w*|so close to|threat\w*|ask\w*|plan\w*|decid\w*|ache\w* to|itch\w*|long\w* to|sound\w* like|as if|like he)\b/i.test(sent)) return;
    // The sentence must be about the body part, not fingers in a mouth or a kiss.
    if (pat.cat === "oral" && !/\b(?:cock|dick|prick|length|shaft|erection|balls|throat|clit|pussy|cunt|hole|rim)\b/i.test(sent)) return;
    if (pat.cat === "oral" && /\bsuck\w*\s+(?:\w+\s+){0,3}?(?:fingers?|thumbs?|nipples?|lip|tongue|neck|skin|bruise)\b/i.test(sent)) return;
    if (pat.cat === "anal" && !/\b(?:cock|dick|prick|ass|hole|rim|prostate|fuck\w*|rid(?:e|es|ing)|inside|thrust\w*|fill\w*|plug|dildo|fingers?|sliding|slid|pound\w*|stretch\w*)\b/i.test(sent)) return;
    if (known.c === cast.secondPerson && known.c.name === "Reader") return;
    const partner = tagPartner(known.c);
    if (!partner || partner === known.c) return;
    const via = `${pat.id.replace(/~elided$/, "")}~one-sided`;
    if (desires.some((d) => d.via === via && d.sentence === original && d.who === known.c)) return;
    // Who the other person was, as far as the sentence says: the outsider's name in the unresolved slot, else the nearest outsider name or
    // stranger label before the match, else no one in particular.
    const otherTok = known.role === "top" ? bTok : tTok;
    const stripP = (t: string) => t.replace(/['’]s?$/, "");
    const before = sent.slice(0, m.index!);
    const cands: { at: number; label: string; kind: "named" | "stranger" }[] = [];
    if (otherTok && /^[A-Z]/.test(stripP(otherTok)) && !cast.byAlias.get(stripP(otherTok)) && !/^Epithet\d+$/.test(stripP(otherTok))) cands.push({ at: Infinity, label: stripP(otherTok), kind: "named" });
    if (outsiderNames.length) for (const om of before.matchAll(new RegExp(`\\b(${outsiderNames.join("|")})\\b`, "g"))) cands.push({ at: om.index!, label: om[1], kind: "named" });
    for (const lm of before.matchAll(new RegExp(`\\b[Tt]he (${STRANGER_LABELS})\\b`, "g"))) cands.push({ at: lm.index!, label: `the ${lm[1]}`, kind: "stranger" });
    const nearest = cands.sort((x, y) => y.at - x.at)[0];
    desires.push({ via, cat: pat.cat, act: `${pat.act} (partner unclear)`, who: known.c, partner, role: known.role, wants: true, kind: "touch", weight: 0.5 * Math.min(1, pat.weight), para: pi, sentence: original, basis: "named", other: nearest ? { label: nearest.label, kind: nearest.kind } : { label: "an unnamed partner", kind: "unnamed" } });
  }

  function handleMatch(
    pat: CompiledPattern,
    m: RegExpMatchArray,
    sent: string,
    original: string,
    pi: number,
    fantasyPara: boolean,
    para: string,
  ) {
    ctx.cutoff = m.index! + m[0].length;
    const tTok = groupValue(m.groups, "t");
    const bTok = groupValue(m.groups, "b");
    // "Honestly, fuck Seraphine and fuck Eddie.": a bare "fuck" opening the sentence (or following another) in front of a name is a curse.
    if (pat.id.replace(/~elided$/, "") === "fuck" && /^\W*(?:and\s+)?fuck\b/i.test(m[0]) &&
        /^\W*(?:(?:honestly|well|oh|ugh|fine|great|yeah|and|but|so|god|christ|shit|damn|okay|ok),?\s+)*(?:fuck\b[^.!?]*?(?:\band)?\s*)?$/i.test(sent.slice(0, m.index!).replace(/[“"][^”"]*[”"]/g, " "))) return;
    const basePid = pat.id.replace(/~(?:elided|one-sided)$/, "");
    const reviewPrior=basePid.startsWith("review-") ? paras.slice(Math.max(0,pi-3),pi) : [];
    const reviewBoundary=reviewPrior.reduce((last,p,i)=>SCENE_BREAK.test(p)||CHAPTER_RE.test(p)?i:last,-1);
    const reviewBefore=basePid.startsWith("review-") ? [...reviewPrior.slice(reviewBoundary+1),para.slice(0,Math.max(0,para.indexOf(original))),sent.slice(0,m.index!)].join(" ").slice(-900) : "";
    if(basePid==="review-tongue-penetrates-person" &&
       (!ANAL_CTX.test(reviewBefore+sent) && !/\bhands and knees\b/i.test(reviewBefore+sent) || /\b(?:mouth|lips|throat)\b/i.test(m[0]))) return;
    if(/^review-(?:toy-tip-inside|inserts-named-toy)$/.test(basePid) && /^\s+(?:(?:a|the|his|her|their|its)\s+)?(?:box|case|drawer|bottle|bag|cup|cavity|sleeve)\b/i.test(sent.slice(m.index!+m[0].length))) return;
    if(basePid==="review-inserts-named-toy" && !ANAL_CTX.test(reviewBefore+sent) && !VULVA_CTX.test(reviewBefore+sent)) return;
    if(basePid==="review-toy-tip-inside" && continuationInstrument(m[0],reviewBefore,"")!=="toy") return;
    if(basePid==="review-replaces-anal-toy" &&
       (!/\b(?:plug|anal toy|dildo|toy)\b/i.test(reviewBefore) || !/\b(?:remov|unplug|pull|withdraw)\w*\b/i.test(reviewBefore) ||
        !/\b(?:ass|anus|hole|omega|knot)\b/i.test(reviewBefore+sent))) return;
    if(basePid==="review-tongue-summary" && (!/\b(?:rim|anus|asshole)\b/i.test(reviewBefore) || /\b(?:mouth|throat)\b/i.test(sent))) return;
    if(basePid==="review-takes-second-time" && (!/\b(?:breathless|sticky|thrust|orgasm|sex|cock|penis|hips)\b/i.test(sent) || /^\s+(?:to|on|for)\b/i.test(sent.slice(m.index!+m[0].length)))) return;
    if(basePid==="review-takes-second-time" && !acts.some(a=>a.cat==="anal" && a.act==="anal sex" && a.para>=pi-12 && !paras.slice(a.para+1,pi).some(p=>SCENE_BREAK.test(p)||CHAPTER_RE.test(p)))) return;
    const externalPenisButtockContact = !pat.signal && /^(?:penis-against|press-cock-against|hole-around)$/.test(basePid) &&
      /\b(?:cock|dick|penis|prick|shaft|erection|hard-?on)\b/i.test(m[0]) &&
      /\b(?:ass|arse|butt|buttocks|backside|bum)\b/i.test(m[0]) && /\b(?:against|between|along|over)\b/i.test(m[0]) &&
      !/\b(?:swallow\w*|took|takes?|accept\w*|squeez\w*|grip\w*|milk\w*|suck\w*|clench\w*|flutter\w*|tighten\w*|clamp\w*)\b/i.test(m[0]) &&
      !/^\s*(?:,?\s*(?:and|then)\s+)?(?:(?:push|slip|slide|slid|press|thrust|sink|sank)\w*\s+)?(?:in|inside|into)\b/i.test(sent.slice(m.index!+m[0].length));
    const penisButtockContact = explicitPenisButtockContact(basePid,m[0]) || externalPenisButtockContact;
    if(penisButtockContact && /\b(?:his|her|their)\s+own\s+(?:ass|arse|butt|buttocks|backside|bum)\b/i.test(m[0]))return;
    // An active mover's pronoun belongs to the action rule, not to a nested stationary-contact match.
    if(basePid==="penis-rests-against-buttocks" && /^(?:his|her|their)\b/i.test(m[0]) && /\b(?:grind|rut|rub|rock|hump)\w*\s+$/i.test(sent.slice(0,m.index!)))return;
    const contactPrefix = (sent.slice(0,m.index!).split(/\b(?:but|yet|however)\b/i).pop() ?? "")+" "+(m.groups?.aux ?? "");
    const contactWish = penisButtockContact && /\b(?:want\w*|wish\w*|urge|tempted)\b[^;.!?]{0,120}$/i.test(contactPrefix);
    const contactRecall = penisButtockContact && /\b(?:lingers?|lingering)\b[^;.!?]{0,90}\b(?:feeling|feel)\b/i.test(contactPrefix);
    const contactConditional = penisButtockContact && (HYPO_AUX.test(m.groups?.aux ?? "") || /\b(?:if|would|could|might|should)\b[^,;.!?]{0,65}$/i.test(contactPrefix));
    const occurrence = (penisButtockContact || !pat.signal || ["handjob","masturbation","solo"].includes(pat.signal.kind) ? occurrenceContext(sent.slice(0,m.index!+m[0].length), original, paras[pi-1] ?? "", paras[pi+1] ?? "") : undefined) ?? (contactWish ? "wanted" : contactRecall ? "history" : undefined);
    // Adult synthetic: gripping a counter to steady oneself is not genital stimulation.
    if(pat.signal?.kind==="masturbation" &&
       (/\b(?:counter|table|chair|doorframe|railing|wall)\b/i.test(m[0]+sent.slice(m.index!+m[0].length,m.index!+m[0].length+50)) ||
        (/\bground\w*\s+(?:himself|herself|themselves)\b/i.test(m[0]) && /\b(?:counter|steady|emotions?|thoughts?)\b/i.test(sent)))) return;
    // Adult synthetic: taking a penis after opening a mouth is an oral command, not masturbation.
    if(basePid==="dd2-mast-take-in-hand" && /\bopen\w*\s+(?:his|her|their)\s+mouth\b/i.test(sent.slice(Math.max(0,m.index!-100),m.index!))) return;
    // Adult synthetic: collecting a drop with a finger is not oral contact without mouth evidence.
    if(basePid==="dd4-licks-precome-from-tip" && /\b(?:collect|catch|swip)\w*\b/i.test(m[0]) &&
       !/\b(?:mouth|tongue|lips|lick|taste)\b/i.test(sent)) return;
    // Adult synthetic: a static genital hold keeps a receiver still during toy use.
    if(pat.signal?.kind==="handjob" && restraintOnlyHold(m[0],para.slice(Math.max(0,para.indexOf(original))+m.index!+m[0].length)+" "+(paras[pi+1] ?? ""))) return;

    // Adult synthetic: Morgan inserts fingers down a stranger's throat to clear an airway.
    // An optional anal target must not turn explicit nonsexual anatomy or a toy cavity into partner fingering.
    if (basePid === "dd2-finger-shoved-into") {
      const tail = sent.slice(m.index! + m[0].length);
      if (/^\s+(?:down|into|in|inside)\s+(?:[\w'’]+\s+){0,4}(?:throat|mouth|ears?|nose|fleshlight|toy)\b/i.test(tail)) return;
      if (/^\s+into\s+the\s+opening\b/i.test(tail) && /\b(?:fleshlight|sex toy)\b/i.test(paras.slice(Math.max(0, pi - 3), pi + 1).join(" "))) return;
    }
    // Adult synthetic: Rowan works himself open before adding a third finger; Morgan is only watching.
    if (basePid === "dd3-slipping-second" && /\b(?:work|open|stretch|prep)\w*\s+(?:himself|herself|themselves)\s+(?:open|up|more)\b/i.test(sent.slice(0, m.index! + m[0].length))) return;
    // Adult synthetic: a plug removed from a mouth is reinserted into an ass; this is not penile penetration.
    if (/^(?:push-into|pushed-in)$/.test(basePid) && /\b(?:shov|push|slid|slip|insert)\w*\s+it\s+(?:back\s+)?(?:into|in|inside)\b/i.test(m[0]) &&
        /\b(?:plug|dildo|vibrator|toy)\b[^.!?]{0,120}\b(?:out|remove\w*|pull\w*)\b/i.test(sent.slice(0, m.index!))) return;
    // "Sam's mouth getting to work on Lee's cock": the mouth is working, not an elided penetrating actor.
    if (basePid === "dd-grinds-onto-cock" && /\b(?:mouth|lips|tongue)\s+getting\s*$/i.test(sent.slice(0, m.index!))) return;
    // "his prostate as Sam swallows around Alex's cock": the prostate cannot reach across a new finite clause.
    if (basePid === "hole-around" && /\b(?:as|while|when|and|but)\s+(?:[\w'’]+\s+){1,2}(?:swallow|suck|clench|grip|tighten)\w*\b/i.test(m[0])) return;
    // "presses a second finger to Alex's lip": adding fingers in a mouth is not anal fingering.
    if (basePid === "dd3-slipping-second" && /^\s+(?:to|at|against|into|between|past|in)\s+(?:[\w'’]+\s+){0,3}(?:mouth|lips?|tongue|throat|teeth)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // A bare "sink into him" / "let Alex in" can describe a kiss, even with sexual words in the previous paragraph.
    if ((basePid === "let-in" || (basePid === "push-into" && /\b(?:sink|sinks|sank|sunk|sinking)\b/i.test(m[0]))) && !/\b(?:cock|dick|prick|shaft|ass|arse|hole|rim|anus|entrance|dildo|toy|plug)\b/i.test(m[0]) &&
        (/\b(?:lips?|tongues?|kiss\w*)\b/i.test(sent) || (/\b(?:lips?|tongues?|kiss\w*)\b/i.test(para) && !PENIS_CTX.test(para) && !ANAL_CTX.test(para))) &&
        !/\b(?:thrust\w*|penetrat\w*|lube\w*|condom|cock|dick|shaft|ass|arse|hole|rim|anus)\b/i.test(sent) && !/\b(?:hips|pelvis|push-pull)\b/i.test(para)) return;
    // "nudges into Alex, steering him toward the bed": guiding his whole body, not entering it.
    if (basePid === "push-into" && /\bnudg\w*\s+(?:into|in)\b/i.test(m[0]) && /^\s*,?\s*(?:prodd|steer|guid|usher)\w*\s+(?:him|her|them)\s+(?:toward|towards|to)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "stops tickling, sinking into him": settling together after tickling is not penetration.
    if (basePid === "push-into" && /\btickl\w*\b/i.test(sent) && !/\b(?:cock|dick|shaft|hole|rim|anus|dildo|toy)\b/i.test(m[0])) return;
    // "Jacaerys rocks back into Cregan's mouth … the lord's tongue delves deeper, licks into Jacaerys": backing onto a tongue is rimming, not a hint
    // of anal sex or of a blowjob. The rimming patterns read the same passage.
    if ((basePid === "thrust-back" || basePid === "fucked-mouth") && /\btongue\b[^.!?]{0,60}\b(?:delv\w*|lick\w*|lav\w*|swirl\w*|push\w*|press\w*)\b[^.!?]{0,40}\b(?:into|inside)\b|\b(?:pucker|rim)\b/i.test(sent)) return;
    // "slips a finger between his boy's lips and pulls Jace's mouth open": a finger in a mouth.
    if (basePid === "adds-finger" && /\bfingers?\b[^.!?]{0,30}\b(?:between|past|into|in)\s+(?:[\w’']+\s+){0,3}(?:lips|mouth)\b/i.test(sent)) return;
    // "Cregan licks into his body like his arse is as wet as a cunt; humming as he works the boy open": the tongue is what opens him, so it is rimming.
    if (basePid === "stretched-open" && /\b(?:licks?|licked|tongue|laves?|laved|mouth)\b/i.test(sent.slice(0, m.index! + m[0].length)) && !/\bfingers?\b/i.test(sent)) return;
    // "to prepare him for war": preparing someone for a fight, a journey or a life is not prepping a body.
    if (/\bprepar\w*\s+(?:him|her|them|\w+)\s+for\s+(?:the\s+)?(?:war|battle|combat|fight|journey|road|winter|wedding|life|what|whatever|coming|their|his|her)\b/i.test(m[0] + " " + sent.slice(m.index! + m[0].length, m.index! + m[0].length + 30))) return;
    // "causing the waves to ripple, to lap at the tip of Cregan's cock": water and wind lap at things; nobody's mouth is on him.
    if (/^(?:licked|licking|lap|laps|lapped)/.test(basePid.replace(/^licked-/, "licked")) || /^licked-(?:cock|head|shaft)/.test(basePid)) {
      if (/\b(?:waves?|water|ripples?|tide|breeze|wind|air|flames?|fire|steam|current)\b[^.!?]{0,60}$/i.test(sent.slice(0, m.index! + m[0].length))) return;
    }
    // "as pink as the prince's cheeks do when Cregan has the boy's cock in his mouth": a comparison with something that happens now and then,
    // not a scene.
    if (pat.cat === "oral" && /\bas\s+[\w-]+\s+as\b[^.!?]{0,60}\b(?:do|does|when|whenever)\b/i.test(sent.slice(0, m.index! + m[0].length))) return;
    // "He takes all of it, feeling the Alpha's surprise that he can take his cock all the way down his throat": someone else's cock, in a mouth.
    if (basePid === "dd2-mast-take-in-hand" && /^[^.!?]{0,40}\b(?:down|in|into|behind|between|past)\s+(?:his|her|their)\s+(?:throat|mouth|lips)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "every time he masturbates or has sex": a habit mentioned, not an act.
    if (/^mast-/.test(basePid) && /\b(?:every\s+time|each\s+time|whenever|any\s*time|the\s+next\s+time|next\s+time)\s+(?:that\s+)?$/i.test(sent.slice(0, m.index!))) return;
    // "disobey the rule about touching himself": a rule mentioned, not an act.
    if (/^mast-/.test(basePid) && /\b(?:rules?|banned?|forbid\w*|forbade|prohibit\w*|disobey\w*|disobeying|permission|(?:not|isn['’]t|aren['’]t) allowed)\b[^.!?]{0,40}$/i.test(sent.slice(0, m.index!))) return;
    // "Stiles' ass is nestled tightly against Derek's cock": resting against a cock, no one is inside anyone.
    if (basePid === "hole-around" && /\b(?:nestl\w+|press\w*|rest\w*|flush|pinned|grind\w*|rub\w*|brush\w*|cradl\w*|align\w*|lined|snug\w*|settl\w*|tuck\w*)\b/i.test(m[0]) && !/\b(?:swallow\w*|took|take|accept\w*|squeez\w*|grip\w*|milk\w*|suck\w*|clench\w*|flutter\w*|tighten\w*|clamp\w*)\b/i.test(m[0])) return;
    // "slid two fingers inside, resting them against Tanner's tongue": fingers in a mouth.
    if (basePid === "dd5-pushes-finger-in" && /\b(?:mouths?|tongues?|lips|throats?|teeth|hair|ears?|pockets?|wounds?|sleeves?|jackets?|collars?)\b/i.test(sent.slice(Math.max(0, m.index! - 50), m.index! + m[0].length + 70))) return;
    // "Stiles slid his fingers in alone on the bathroom floor": on his own, not with the partner.
    if (basePid === "dd5-pushes-finger-in" && /\b(?:alone|himself|herself|themselves|on (?:his|her|their) own|by (?:himself|herself|themselves)|own fingers)\b/i.test(sent)) return;
    // "his hole clenches around nothing": emptiness after something was just inside counts; wishing for it, or arousal with nothing before it, does not.
    if (basePid === "rim-stretches-around" && (/^\s*[^.!?]{0,40}\b(?:wish|want|need|long|ach|beg|crav|yearn|desper|hop)/i.test(sent.slice(m.index! + m[0].length)) || (/\bnothing|\bair\b/i.test(m[0]) && !acts.some((a) => a.cat === "anal" && a.para <= pi && pi - a.para <= 3) && !/\b(?:slip|slid|pull|withdr|eas|slide)\w*\s+out\b/i.test(sent.slice(0, m.index!))))) return;
    // "Will he open him up or just spear his cock inside him…": a question put as a statement.
    if (pat.cat === "anal" && /^\W*(?:will|would|does|did|can|could|should|shall)\s+(?:he|she|they|[A-Z][a-z]+)\s+(?:\w+\s+){0,2}\w+\s+(?:him|her|them|[A-Z]\w+)\b[^.!?]*\bor\b/i.test(sent)) return;
    // "He works himself past Dean's locked open lips": a mouth in the paragraph around it and no ass, so the "pushing back in" is oral.
    if (basePid.startsWith("pushed-in") && !/\b(?:lips|mouth|throat|gag\w*|jaw)\b/i.test(paras[pi] ?? "") && [pi - 1, pi + 1].some((i) => /\b(?:lips|mouth|throat|gag\w*|jaw)\b/i.test(paras[i] ?? "")) && ![pi - 1, pi, pi + 1].some((i) => ANAL_CTX.test(paras[i] ?? "") || FINGER_CTX.test(paras[i] ?? ""))) return;
    // "gathered some saliva in his mouth and spat on the prince's hole": spit on a hole, no mouth on it.
    if (pat.act === "rimming" && /\b(?:spat|spit|spits|spitting|drool\w*|dribbl\w*|saliva)\b/i.test(m[0]) && !/\b(?:lick\w*|lap\w*|tongue-?fuck\w*|kiss\w*|eat\w*|suck\w*)\b/i.test(m[0])) return;
    // "squeeze himself sideways" through a narrow tunnel is not masturbation.
    if (/^mast-/.test(basePid) && /\bsqueez\w*\s+(?:himself|herself|themselves)\s+(?:sideways|through|past|between|into|in|out|under|over|against|along)\b/i.test(m[0] + " " + sent.slice(m.index! + m[0].length, m.index! + m[0].length + 25))) return;
    let subjChar: Character | undefined;
    let subjOrigin: PersonOrigin = pat.elided ? "clause" : "rule";
    const observeSubject = (source: PersonOrigin) => { subjOrigin = source; };
    let subjFromObject = false;
    // "Cas chuckled as he bottomed the dildo out": a top seating a toy, not a bottom.
    if (/\bbottom(?:ed|ing|s)\s+(?:the\s+|a\s+|his\s+|her\s+)?(?:\w+\s+)?(?:dildo|toy|plug|vibrator|vibe|strap\S*|beads)\b/i.test(sent.slice(m.index!))) return;
    // "he’d done this to himself … stretched to fit three fingers": solo prep, not a scene with the partner.
    if (pat.cat === "anal" && /\b(?:stretch|finger|open)\w*/i.test(m[0]) && /\b(?:done|did|doing)\s+(?:this|that|it)\s+to\s+(?:himself|herself|themself)\b/i.test(sent)) return;
    // "something kinky about fucking Derek after hours of having him inside of him": the same sentence says the other one was inside the subject first.
    if (pat.cat === "anal" && pat.subj === "t" && /^(?:\s+\w+){0,3}?\s+(?:after|while|having|since|despite)\b[^.!?]{0,40}\b(?:having|had|take|taking|took|feeling|felt)\s+(?:him|her|them)\s+(?:\w+\s+){0,2}?inside\s+(?:of\s+)?(?:him|her|them)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "swirling his tongue over Dean’s slit, sucking along his shaft": the slit of a cock, not a vulva.
    if (pat.cat === "oral" && /\bslit\b/i.test(m[0]) && oralKindOf(pat.act) === "cunnilingus" && /\b(?:cock|dick|shaft|balls|erection|length|prick)\b/i.test(sent)) return;
    if (pat.elided) {
      // ", the plug bumps against…": a determiner after the trigger starts a new subject, not a left-out one.
      if (/^\W*(?:(?:and|then|of|about|before|after|while|by|without|from|to)\s+)?(?:the|a|an|this|that|these|those|its)\s/i.test(m[0])) return;
      const before = sent.slice(0, m.index);
      const trigger = /^\W*(\w+)/.exec(m[0])?.[1]?.toLowerCase() ?? "";
      const lastWord = (before.trim().split(/\s+/).pop() ?? "").replace(/[,;]$/, "");
      if (/^(?:kept|started|began|continued|finished|enjoyed|loved|tried|resumed)$/.test(trigger)) {
        // "…began pushing into him": whoever began must be right before it ("a finger began…" isn't a person).
        subjChar = resolveToken(lastWord, sent.slice(m.index!), observeSubject);
      } else if (trigger === "to") {
        // "asked Draco to fuck him" → Draco; "rose up on his knees to slide into him" → the clause's subject.
        const clauseSubj = elidedSubject(before, sent.slice(m.index!), observeSubject);
        subjChar = /^(?:him|her|them)$/.test(lastWord)
          ? clauseSubj && ctx.partnerOf(clauseSubj)
          : (resolveToken(lastWord, sent.slice(m.index!), observeSubject) ?? clauseSubj);
        if (/^(?:him|her|them)$/.test(lastWord) && subjChar) subjOrigin = "partner";
      } else {
        // "…as a finger breached him, sliding inside": the clause right before has a thing for its subject,
        // so the left-out subject is that thing, not a person.
        const lastClause = before.trimEnd().replace(/[,;]$/, "").split(/[,;:—]|\b(?:as|when|while|whenever|because|until|since|though|although|and|but|then)\b/).pop()?.trim() ?? "";
        if (/^(?:it|this|that|the|a|an|one|another|something)\b/i.test(lastClause) && /\b\w+(?:s|ed)\b/.test(lastClause)) return;
        // "He feels the pressure against his loosened rim, stretching him wide": the -ing is the pressure's, not the one who feels it.
        if (/^\w+ing\b/.test(trigger) && /\b(?:feels?|felt|sees?|saw|watch(?:es|ed)?|hears?|heard|notic(?:es|ed))\s+(?:the|a|an|that|this)\s+\w+/i.test(lastClause)) return;
        subjChar = elidedSubject(before, sent.slice(m.index!), observeSubject);
      }
      // "he turns his head just enough to mouth gently at the base of Kenobi's cock": the left-out subject can't be the person whose cock it is,
      // so it is that person's partner.
      if (!subjChar) {
        const objTok = pat.subj === "b" ? tTok : bTok;
        const obj = objTok ? cast.byAlias.get(stripPoss(objTok)) : undefined;
        if (obj) { subjChar = ctx.partnerOf(obj); subjFromObject = !!subjChar; if (subjChar) subjOrigin = "partner"; }
      }
      if (!subjChar) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
    }
    // "Dean could feel his cock pulse in his mouth": what someone feels, tastes or sees belongs to the other person.
    if (!pat.elided && !subjChar && pat.subj === "t" && /^(?:his|her|their)$/i.test(tTok ?? "")) {
      const pm = new RegExp(`(?:^|[\\s,;])(${NAMES}|[Hh]e|[Ss]he|[Tt]hey)\\s+(?:could\\s+|can\\s+|would\\s+|did\\s+)?(?:feel|felt|feels|taste|tasted|tastes|sense|sensed|senses|see|saw|sees|watch\\w*|hear|heard|hears)\\s+$`).exec(sent.slice(0, m.index));
      if (pm) {
        const perceiver = resolveToken(pm[1], sent.slice(m.index!));
        const other = perceiver && ctx.partnerOf(perceiver);
        if (other) subjChar = other;
      }
    }
    // "so he could still the man from fucking into his mouth": the one kept from doing it is the one doing it, not the sentence's subject.
    if (pat.elided) {
      const fm = new RegExp(`\\b(?:stop|stopped|stopping|still|stilled|stilling|keep|kept|keeping|prevent|prevented|preventing|hold|held|holding|restrain|restrained)\\s+(?:(?:the|that)\\s+(?:man|guy|boy|other\\s+\\w+)|Epithet\\d+|him|her|them|(${NAMES}))\\s+from\\s*$`, "i").exec(sent.slice(0, m.index) + (/^\W*from\b/i.exec(m[0])?.[0] ?? ""));
      if (fm) {
        const who = fm[1] ? cast.byAlias.get(stripPoss(fm[1])) : subjChar && ctx.partnerOf(subjChar);
        if (who) subjChar = who;
      }
    }
    // "He'd let him spread him open and shove his dick inside him": whose dick? The one who is let, not the one letting.
    if (!pat.elided && !subjChar && pat.subj === "t" && /^(?:his|her|their)$/i.test(tTok ?? "")) {
      const lm = new RegExp(`(${NAMES}|[Hh]e|[Ss]he|[Tt]hey)(?:['’]d| would| will| could| can)?\\s+(?:let|lets|allow|allows|allowed)\\s+(${NAMES}|him|her|them)\\b[^.!?“”]{0,80}$`).exec(sent.slice(0, m.index));
      if (lm) {
        const letter = resolveToken(lm[1], sent.slice(m.index!));
        const target = /^(?:him|her|them)$/i.test(lm[2]) ? (letter && ctx.partnerOf(letter)) : cast.byAlias.get(stripPoss(lm[2]));
        if (target && target !== letter) subjChar = target;
      }
    }
    // "Dracula … sat next to Jack pulling him into his lap": a name right after a preposition is that preposition's object;
    // the -ing verb that follows belongs to the sentence's subject.
    if (!pat.elided && !subjChar) {
      const st = pat.subj === "t" ? tTok : bTok;
      const pre = sent.slice(0, m.index);
      if (st && cast.byAlias.has(stripPoss(st)) && /\b(?:next to|beside|near|behind|against|toward|towards|beneath|under|around)\s+$/i.test(pre) && /^\S+\s+\w+ing\b/.test(m[0])) {
        const subjectOfSentence = elidedSubject(pre.replace(/\s+(?:next to|beside|near|behind|against|toward|towards|beneath|under|around)\s+$/i, " "), sent.slice(m.index!));
        if (subjectOfSentence && subjectOfSentence !== cast.byAlias.get(stripPoss(st))) subjChar = subjectOfSentence;
      }
    }
    // "He wished to fuck the count would at least let him know": a name followed by a finite verb starts a new clause, so it isn't the object.
    if (/^fuck/.test(pat.id) && /^\s+(?:would|could|should|might|will|can|had|was|were|did|does|is|are)\b/i.test(sent.slice(m.index! + m[0].length)) && !/^(?:him|her|them|me|you|it)$/i.test(bTok ?? "")) return;
    // "Dustin babbled and Mrs. Henderson looks at him like…": a left-out subject belongs to the one now named, and someone
    // who isn't in the cast can't be credited as the person before.
    if (pat.elided && new RegExp(`(?:^|(?:[,;]|\\b(?:and|but|while|as|then|yet|so))\\s+)(?:(?:Mr|Mrs|Ms|Miss|Dr)\\.?\\s+)?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)(?:,[^,.;]{2,50},)?\\s*$`).test(sent.slice(0, m.index!) + (/^\s*,/.test(m[0]) ? "," : ""))) {
      const named = new RegExp(`(?:^|(?:[,;]|\\b(?:and|but|while|as|then|yet|so))\\s+)(?:(?:Mr|Mrs|Ms|Miss|Dr)\\.?\\s+)?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)(?:,[^,.;]{2,50},)?\\s*$`).exec(sent.slice(0, m.index!) + (/^\s*,/.test(m[0]) ? "," : ""))![1];
      const candidate=basePid.startsWith("review-") ? named.replace(/^(?:And|But|When|While|Then|After|Before|So|Yet)\s+(?=[A-Z])/,"") : named;
      if (!cast.byAlias.get(candidate) && !cast.byAlias.get(candidate.split(" ")[0]) && !/^(?:Then|Now|Still|Instead|Maybe|Perhaps|God|Please|Fuck|Jesus|Christ|Just|Again|Next|Later|Soon|Once|Yes|No|Oh|Okay|Ok|Fine|Good|Hell|Shit|Damn|He|She|They|It|We|You|I|His|Her|Their|The|A|An|This|That|There|Some|Another)$/.test(named) && !/ly$/.test(named)) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
    }
    // "before Eustace placed a hand on his back and guided him out": the left-out subject is Eustace, whoever he is, when no one
    // in the cast (or a he / she) comes between his name and the verb.
    if (pat.elided) {
      const lead = sent.slice(0, m.index!) + (/^\s*(?:and\b|,)\s*/.exec(m[0])?.[0] ?? "");
      const o = /(?:^|[,;]\s*|\b(?:and|but|while|as|then|yet|so|before|after|when|until)\s+)(?:(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+((?:[\w'’-]+\s+){1,8}?)(?:and|,)\s*$/.exec(lead);
      if (o && !cast.byAlias.get(o[1]) && !cast.byAlias.get(o[1].split(" ")[0]) && !/ly$/.test(o[1]) &&
          !/^(?:Then|Now|Still|Instead|Maybe|Perhaps|God|Please|Fuck|Jesus|Christ|Just|Again|Next|Later|Soon|Once|Yes|No|Oh|Okay|Ok|Fine|Good|Hell|Shit|Damn|But|And|When|While|As|After|Before|If|So|Yet|Until|He|She|They|It|We|You|I|His|Her|Their|The|A|An|This|That|There|Some|Another)$/.test(o[1]) &&
          !new RegExp(`\\b(?:${NAMES})\\b|\\b(?:he|she|they|I|we|you)\\b`, "i").test(o[2])) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
    }
    // "The twink did as he was told and gagged on Jordan's length", "The bottom boy's roommates wouldn't hear him plead as he got fucked":
    // a generic label for someone who isn't in the cast is that stranger, not whichever character came before. Authors who keep
    // calling one of the leads "the twink" use it often, so only a label that turns up a few times is left alone.
    if (pat.elided || /^(?:he|him|she|her|his|their|them)$/i.test(tTok ?? "") || /^(?:he|him|she|her|his|their|them)$/i.test(bTok ?? "")) {
      const g = new RegExp(`(?:^|[,;]\\s*|\\b(?:and|but|as|while|then|when|before|after)\\s+)the\\s+(twink|twunk|bottom boy|bottom|slut|whore|virgin|newbie|stranger|brat|slave|plaything|boy toy|hooker|escort|jock)(?:['’]s)?\\b(?![^.!?]*\\b(?:${NAMES})\\b[^.!?]*$)`, "i").exec(sent.slice(0, m.index! + (/^\s*(?:and\b|,)\s*/.exec(m[0])?.[0].length ?? 0)));
      if (g && !cast.byAlias.get(g[1]) && !new RegExp(`\\b(?:${NAMES})\\b`).test(sent.slice(g.index! + g[0].length, m.index!)) &&
          (paras.join(" ").match(new RegExp(`\\bthe ${g[1]}\\b`, "gi")) ?? []).length < 5) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
    }
    // "Greg frowned. He pushed Dean against the wall": the he after a clause whose subject is someone outside the cast is that person,
    // and so is a left-out subject in a sentence that someone outside the cast starts.
    if (pat.elided || /^Epithet\d+$/.test(tTok ?? "") || /^(?:he|him|she|her|his|their|them)$/i.test(tTok ?? "") || /^(?:he|him|she|her|his|their|them)$/i.test(bTok ?? "")) {
      // "The priest pushed two fingers into Dean": a role noun nobody has been shown to stand for (a learned "the prince" is a cast
      // member) is someone else once it is back in the sentence.
      const stranger = new RegExp(`^[Tt]he (?:${STRANGER_LABELS})$`);
      const bare = (s: string) => s.replace(/Epithet(\d+)/g, (w, n: string) => {
        const t = ctx.epiTable[Number(n)];
        return t && stranger.test(t) && !canonEpithet(t).keys.some((k) => ctx.epithets.has(k)) ? t : w;
      });
      const startOf = (s0: string): "out" | "cast" | "pron" | undefined => {
        const s = bare(s0);
        const sm = new RegExp(`^\\W*(?:(?:[Aa]nd|[Bb]ut|[Tt]hen|[Ss]o|[Ww]hen|[Ww]hile|[Aa]s|[Aa]fter|[Bb]efore)\\s+)?(?:[A-Z]?\\w+ly,?\\s+)?(?:(?<cast>${NAMES})|(?<out>${outsiderNames.length ? outsiderNames.join("|") : "(?!)"})|(?<lab>[Tt]he (?:${STRANGER_LABELS}))|(?<pron>[Hh]e|[Ss]he))(?!['’])\\b\\s+[a-z]`).exec(s);
        const g = sm?.groups;
        return !g ? undefined : g.cast ? "cast" : g.pron ? "pron" : "out";
      };
      const at = para.indexOf(original.trim());
      const prevSent = at > 0 ? para.slice(Math.max(0, at - 240), at).trim().split(/(?<=[.!?”])\s+/).pop() ?? "" : "";
      const cur = startOf(sent);
      if (cur === "out" || (cur === "pron" && /[.!?”]$/.test(prevSent) && startOf(prevSent) === "out")) { oneSided(pat, m, tTok, bTok, sent, original, pi, pat.subj === "t"); return; }
    }
    // "He knew his whole focus was on serving him; … as he was getting railed": the he who serves is the one being taken, but the
    // last-named subject is the one served, so the pronoun can't be trusted.
    if (/^(?:passive-|be-|get-)/.test(pat.id) && /\b(?:serv(?:e|es|ed|ing)|pleas(?:e|es|ed|ing)|obey(?:s|ed|ing)?)\s+him\b/i.test(para.slice(Math.max(0, para.indexOf(sent) - 160), para.indexOf(sent) + sent.length)) && /^(?:he|him)$/i.test(tTok || bTok || "")) return;
    // "Sam said as he poured Dean a cup of tea": a he right after an outsider's name and "as / while / when" is that outsider.
    if (!pat.elided && /^(?:he|she)$/i.test(pat.subj === "t" ? tTok ?? "" : bTok ?? "")) {
      const o = /\b([A-Z][a-z]+)\s+(?:[\w'’-]+\s+){0,3}?(?:as|while|when|and|but|before|after)\s+$/.exec(sent.slice(0, m.index!));
      if (o && !cast.byAlias.get(o[1]) && !/ly$/.test(o[1]) && !/^(?:Then|Now|Still|Instead|Maybe|Perhaps|God|Please|Just|Again|Next|Later|Soon|Once|Yes|No|Oh|But|And|When|While|As|After|Before|If|So|Yet|Until|The|His|Her|Their|It|This|That|There)$/.test(o[1]) &&
          !new RegExp(`\\b(?:${NAMES})\\b|\\b(?:he|she|they|I|we|you)\\b`, "i").test(sent.slice(o.index! + o[1].length, m.index!))) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
    }
    // "…looks at him like she wants to pull him into a hug and feed him soup": the left-out subject is the "she" before it, and
    // nobody in this cast is a she.
    if (pat.elided) {
      const pr = [...sent.slice(0, m.index!).matchAll(/\b(?:she|he)\b(?!['’])/gi)].pop();
      if (pr && !/[.!?]\s+\S/.test(sent.slice(pr.index! + 3, m.index!))) {
        const g: Gender = /^she$/i.test(pr[0]) ? "f" : "m";
        if (!cast.chars.some((c) => Ctx.compatible(c, g))) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
      }
    }
    // "Steve never sucked Eddie off, taking him deep": a participle carries on the negated verb before it.
    if (pat.elided && /^\W*(?:\w+ly\s+)?\w+ing\b/.test(m[0]) && (/^\s*,/.test(m[0]) || /,\s*$/.test(sent.slice(0, m.index!))) && /\b(?:never|refus(?:ed|es|e|ing) to)\b/i.test(sent.slice(0, m.index!))) return;
    // Hints about how two people act (looking after, leading, protecting, pinning…) mean little around a baby: the one being
    // scooped up, fed or carried is a child. Only in stretches that aren't sexual, so "baby" as a pet name doesn't count.
    if (pat.cat === "vibe" && babyNear(paras, pi)) return;
    // "armies to protect him", "guards to keep him safe": the left-out subject is not a person in the scene.
    if (pat.id.startsWith("dom-protect") && pat.elided && /\b(?:armies|army|guards?|soldiers?|knights?|men|advisors?|servants?|laws?|walls?|shields?)\s+to\s+$/i.test(sent.slice(0, m.index!) + (/^\s*to\s+/i.exec(m[0])?.[0] ?? ""))) return;
    // "rubbing his hands together" warms hands; it comforts no one.
    if (pat.id.startsWith("care-soothe") && /\bhands?\s+together\b/i.test(sent.slice(m.index!, m.index! + m[0].length + 20))) return;
    // A handjob on oneself ("fists his own cock") is solo.
    if (pat.id.startsWith("hj-") && /\b(?:his|her|their)\s+own\b/i.test(m[0])) return;
    // A wish or fantasy before the verb: "wanted to hold him close and continue to stroke his cock", "fantasies of pressing him down".
    if (pat.cat === "vibe" && (pat.signal?.kind === "handjob" || pat.id.startsWith("dom-pin")) &&
        (/\b(?:want(?:ed|s|ing)?|wish(?:ed|es)?|long(?:ed|s|ing)?|crav(?:ed|es|ing)|hop(?:ed|es|ing)|need(?:ed|s)?)\s+(?:to|for)\b[^.!?;]*$/i.test(sent.slice(0, m.index!)) ||
         /\b(?:fantas(?:y|ies|ised|ized|ising|izing)|dream(?:s|ed|t|ing)?|imagin\w+|daydream\w*)\s+(?:of|about)\b[^.!?;]*$/i.test(sent.slice(0, m.index!)))) return;
    // Arms around him pinning him to a chest is a hug, not a hold-down.
    if (pat.id.startsWith("dom-pin") && /\bto\s*$/i.test(m[0]) && /^\s*(?:the\s+|his\s+|her\s+|their\s+|my\s+)?(?:warm\s+|broad\s+|solid\s+|firm\s+)?(?:mass of\s+)?chest\b/i.test(sent.slice(m.index! + m[0].length)) && /\barms?\b[^.!?]*$/i.test(sent.slice(0, m.index!))) return;
    // "dropped to his knees and began pulling Molotovs out of his backpack": kneeling to do something.
    if (pat.id.startsWith("sinks-to-floor") && /^\s*(?:and\s+)?(?:began|started|proceeded)?\s*(?:to\s+)?(?:pull|pick|grab|search|dig|rummag|check|examin|tie|tend|fix|bandag|gather|collect|retriev|scrabbl)/i.test(sent.slice(m.index! + m[0].length))) return;
    // Kneeling at a ceremony is not spreading for a lover.
    if (pat.id.startsWith("spread-legs") && !SEX_CTX.test(`${paras[pi - 1] ?? ""} ${para} ${paras[pi + 1] ?? ""}`) && /\bkneel\w*|\bknees\s+further\b/i.test(sent)) return;
    // "palm a dragon egg from top to bottom": the end of a thing, not a role.
    if (pat.id.startsWith("bottomed-for") && /\b(?:top|tops)\s+(?:to|and)\s+$/i.test(sent.slice(0, m.index!) + (/^\s*(?:to|and)\s+/i.exec(m[0])?.[0] ?? ""))) return;
    // "still slightly sore from being stretched open" is a bodily sign after sex, not a scene: it belongs with the soreness hints.
    // "had to restrain himself from pinning Dean to the wall": the act is held back, not done.
    if (pat.signal && /\b(?:(?:restrain\w*|resist\w*|stop\w*|prevent\w*|keep\w*|hold(?:ing)?\s+back)\s+(?:himself|herself|themselves)|refrain\w*|abstain\w*)\s+from\s*$/i.test(sent.slice(Math.max(0, m.index! - 60), m.index!) + (/^\s*from\b/i.exec(m[0])?.[0] ?? ""))) return;
    // "ran his hands through his hair in frustration", "smoothing his hands down the front of his suit": his own hair, his own clothes.
    if (pat.id.startsWith("care-soothe") && (
      // His own hair, when the same sentence says it is about his own state (in frustration, fixing it, trying to stop his hands shaking…); with two men the same "his" can be either.
      (/\bran\s+(his|her|their)\s+(?:hands?|fingers|knuckles)\s+(?:\w+\s+)?(?:through|over|across|down)\s+\1\b/i.test(m[0]) && /\b(?:in\s+(?:his|her|their\s+)?(?:frustration|exasperation|desperation|anxiety|nervousness)|nervously|anxiously|wearily|tiredly|restlessly|roughly|making sure|wondering|fix(?:ed|ing)|a mess|mirror|keep\s+(?:them|his hands)\s+from\s+shaking)\b/i.test(sent)) ||
      // His own clothes.
      (/^(?:his|her|their)$/i.test(bTok ?? "") && /\bhands?\s+(?:down|over|along|on)\s+(?:the\s+)?(?:front|sides?|lap|legs?|thighs?|suit|shirt|jacket|dress|skirt|apron|trousers|pants|jeans|tie)\b/i.test(sent.slice(m.index!, m.index! + m[0].length + 40))))) return;
    // "“Ow!” he yelped as he pulled away and looked at his cock in betrayal": he is looking at his own, hurt, body.
    if (pat.id.startsWith("ogle-crotch") && /\b(?:yelp\w*|winc\w*|flinch\w*|hiss\w*|grimac\w*|ouch|ow)\b/i.test(sent) && /\b(?:his|her)\s+(?:\w+\s+)?(?:dick|cock|penis|erection|hard-?on|crotch|groin)\b/i.test(m[0])) return;
    // "the memory of Dean on his knees with his mouth wrapped around his cock" while jerking off: remembered, not a scene now.
    // It did happen earlier, so it is kept as a weaker, imagined-style reading rather than dropped (see `remembered` where the kind is chosen).
    const remembered = !pat.signal && /\b(?:memor(?:y|ies)\s+of|remember(?:ed|ing)\s+(?:how|when|the|that|him|her|them|what)|recall(?:ed|ing)\s+(?:how|when|the|that)|reminisc\w+)\b/i.test(sent.slice(Math.max(0, m.index! - 90), m.index!));
    // "Theo rocked himself shamelessly" with the other man inside him is being fucked, and "barely touching himself" with someone's mouth on him is being sucked.
    if (pat.id.startsWith("mast-himself")) {
      if (/\b(?:grind|ground|rock|thrust)\w*\s+(?:himself|herself|themselves|themself)\b/i.test(m[0]) && /\b(?:inside|buried|fucking|fucked|filling|filled|knot\w*|impaled|stretch\w*|thrust\w* into)\b/i.test(`${paras[pi - 1] ?? ""} ${sent}`)) return;
      if (/\b(?:cock|dick|length)\s+in\s+(?:your|his|her|their)\s+(?:mouth|throat)\b/i.test(original)) return;
    }
    // "a bit sore here and there, as could be expected from getting fucked on the table": the same, with words in between and "getting".
    if (pat.cat === "anal" && !pat.signal && /\b(?:sore|aching|achy|tender|raw)\b[^.!?;]{0,50}?\b(?:from|after)\s+(?:being\s+|getting\s+|having\s+been\s+)(?:stretched|fucked|opened|taken|filled|used|ridden|pounded|bred|knotted|plowed|wrecked)\b/i.test(sent.slice(Math.max(0, m.index! - 90), m.index! + m[0].length))) return;
    // "He fists Cregan from root to tip": a hand on a cock, not a fist in an ass.
    if (pat.id.startsWith("fisting") && /\b(?:root to tip|base to tip|tip to base|from the base|up and down|his (?:cock|dick|length|shaft)|(?:cock|dick|prick|shaft|length|erection))\b/i.test(sent.slice(m.index!, m.index! + m[0].length + 40)) && !/\b(?:ass|arse|hole|anus|rim|inside)\b/i.test(sent)) return;
    // "he tugged him gently to where he wanted him": a pull, not a handjob. Only "tugged him off" is.
    if (pat.id.startsWith("hj-jerk-him") && /\btugg?\w*\s+\S+\s+(?!off\b)/i.test(m[0])) return;
    // Arching a back while being sucked or stroked is pleasure, not offering an ass: only count it in a stretch about the ass.
    // "crawling back up between her legs, spreading her thighs open": the one doing the spreading is spreading someone else's legs.
    if (pat.id.startsWith("spread-legs") && /\bbetween\s+(?:his|her|their|\w+['’]s)\s+(?:legs|thighs|knees)\b[^.!?]{0,40}$/i.test(sent.slice(0, m.index! + m[0].length))) return;
    // "He bared his throat to daggers": a figure of speech, not a gesture of submission.
    if (pat.id.startsWith("abo-bare-neck") && /\b(?:daggers?|knives|knife|blades?|swords?|axes?|bullets?|guns?|wolves|fangs?|claws?|the world|the storm|fate|death|the executioner)\b/i.test(sent)) return;
    if (pat.id.startsWith("arch-back") && !ANAL_CTX.test(para) && !ANAL_CTX.test(paras[pi - 1] ?? "") && /\b(?:suck\w*|blowjob|mouth|throat|lips|tongue|hand(?:job)?|stroke\w*|jerk\w*|cock|dick)\b/i.test(para)) return;
    // "arched his back and stretched": easing a stiff back is not a yielding posture.
    if (pat.id.startsWith("arch-") && /\b(?:stretch\w*|crack\w*|popp\w*|stiff|kink|from sitting|desk|chair)\b/i.test(sent) && !ANAL_CTX.test(para)) return;
    // Cuddling up while they choose something to watch ("cuddling up against his chest as he reached for the iPad … another episode")
    // is company, not aftercare.
    if (pat.id.startsWith("aftercare-") && /\b(?:episodes?|show|movie|film|tv|iPad|remote|netflix|stream\w*|youtube|game|podcast)\b/i.test(para)) return;
    // "Anakin spreads his legs until they're bracketing Obi-Wan's knees": his own legs.
    if (pat.id.startsWith("spread-their-legs") && /^\s*(?:apart\s+|wide\s+)?until\s+(?:they|his legs|her legs|their legs)(?:['’]re|\s+(?:are|were))\s+(?:bracketing|framing|around|on either side)/i.test(sent.slice(m.index! + m[0].length))) return;
    // "he sucks on Obi-Wan's tongue": kissing, not a blowjob.
    if (pat.id.startsWith("sucked") && /\bsuck\w*\s+(?:on\s+|at\s+)?(?:[\w'’-]+['’]s\s+|his\s+|her\s+|their\s+)?(?:tongue|lips?|neck|earlobe|ear|collarbone|jaw|shoulder|nipples?|skin|bruise|pulse point)\b/i.test(sent.slice(m.index!))) return;
    // A fight is not dominance: "He slammed Cas up against the wall, fist pulling back to land another blow."
    if (pat.id.startsWith("dom-") && /\b(?:punch\w*|slugg\w*|(?:land|landed|landing|throw|threw|throwing)\s+(?:another\s+|a\s+)?(?:blow|punch|hit)|fist\s+(?:pulling|drawing|cocking|swinging)\s+back|swung|knife|blade|gun|bleed\w*|bruis\w*|broke\s+(?:his|her|their)\s+(?:nose|jaw|ribs?))\b/i.test(sent)) return;
    // "Castiel grabbed his leg and, using it as leverage, he started thrusting": "he" is the nearest clause's subject.
    const subjTok = pat.subj === "t" ? tTok : bTok;
    // "When Alex manages…, one of his digits slips lower": a possessive pronoun works the same way.
    // "Dunk would… make him take him to the back of his throat": "him" after make/let is the one being made to,
    // i.e. the causer's partner. (Not perception verbs: "Brad watched him getting fucked by Kyle".)
    // "the change in position that has him presenting himself": "him" is the sentence's own subject, not the partner.
    if (!subjChar && !pat.elided && /^(?:him|her|them)$/i.test(subjTok ?? "") && /\b(?:that|which|what)\s+(?:has|had|have|keeps|kept|leaves|left)\s+$/i.test(sent.slice(0, m.index))) {
      const main = firstEntity(sent.slice(0, m.index));
      if (main) subjChar = main;
    }
    // "the hand on his cock and the tongue probing into him": a subject-less sentence where "his" and "him" are one
    // person, the one on the receiving end, not the partner of whoever the last sentence was about.
    if (!subjChar && !pat.elided && !tTok && pat.subj === "b" && /^(?:him|her)$/i.test(bTok ?? "")) {
      const before = sent.slice(0, m.index);
      const poss = bTok!.toLowerCase() === "him" ? /\bhis\s+(?:\w+\s+)?(?:cock|dick|prick|hips?|thighs?|back|chest|nipples?|skin|neck|hair)\b/i : /\bher\s+(?:\w+\s+)?(?:cock|dick|hips?|thighs?|back|chest|breasts?|nipples?|skin|neck|hair)\b/i;
      if (poss.test(before) && !ctx.sentMentions.some((x) => x.at < m.index!) && !/\b(?:he|she|they)\b/i.test(before)) {
        const same = ctx.subjectFor(bTok!.toLowerCase() === "him" ? "m" : "f");
        if (same) subjChar = same;
      }
    }
    const causative = /^(?:him|her|them)$/.test(subjTok ?? "") && /\b(?:make|makes|made|making|let|lets|letting)\s+$/i.test(sent.slice(0, m.index));
    let clauseOrigin: PersonOrigin = "clause";
    const clauseSubj =
      !pat.elided && subjTok && (pronoun(subjTok) || /^(?:[Hh]is|[Hh]er|[Tt]heir)$/.test(subjTok)) && m.index! > 0
        ? elidedSubject(sent.slice(0, m.index), sent.slice(m.index!), (source) => { clauseOrigin = source; })
        : undefined;
    const causer = causative ? (clauseSubj ?? firstEntity(sent.slice(0, m.index)) ?? ctx.lastSubject) : undefined;
    // "He’s simply staring at Dean as he stretches himself": a body act on oneself, in a clause that follows a watching clause, is done by the one watched.
    const watched = !causative && !pat.elided && /^(?:he|she)$/i.test(subjTok ?? "") && REFLEXIVE.test(m[0])
      ? new RegExp(`\\b(?:star(?:e|es|ed|ing)|watch(?:es|ed|ing)?|look(?:s|ed|ing)?|gaz(?:e|es|ed|ing)|eye(?:s|d|ing)?|ogl(?:e|es|ed|ing))\\s+(?:at\\s+)?(${NAMES})\\s*,?\\s*(?:as|while|when)\\s*$`).exec(sent.slice(0, m.index))
      : null;
    const watchedChar = watched ? cast.byAlias.get(watched[1]) : undefined;
    // The viewpoint character's own body, in a sentence that opens on their feelings and names no one before it: "He feels his slick trickling
    // out of his hole, if he knew more about the Alpha, …".
    const povBody = sentPovChar && !pat.elided && /^(?:his|her|their|he|she)$/i.test(subjTok ?? "") && !new RegExp(`\\b(?:${NAMES})\\b|Epithet\\d+`).test(sent.slice(0, m.index))
      ? sentPovChar : undefined;
    const nearSubj = watchedChar ?? povBody ?? (causative ? causer && ctx.partnerOf(causer) : clauseSubj);
    const co = /([\p{L}'’]+)\s+and\s+$/u.exec(sent.slice(0, m.index));
    const coChar = co ? resolveToken(co[1]) : undefined;
    ctx.coSubjects = new Set(coChar ? [coChar] : []);
    ctx.curCat = pat.cat;
    // "slips fingers through Dean's slick and collects it to shove into a cock sleeve": gathering slick, not fingering.
    if (pat.act === "fingering" && /\b(?:collect|gather|scoop|wipe|smear|coat)\w*\b/i.test(sent.slice(m.index!))) return;
    // "grinding into the hardness he can feel through their layers of clothing" is touch over clothes, not sex.
    if (pat.cat === "anal" && !pat.signal && /\bthrough\s+(?:[\w-]+\s+){0,3}?(?:clothes|clothing|clothed|jeans|pants|trousers|fabric|layers|boxers|underwear|slacks|denim)\b/i.test(sent.slice(m.index!))) return;
    // "pushes his hips back into the alpha": the one pushing back is the bottom, which the grinding-back cue reads.
    if (/^(?:push-into|rock-into|fuck|hips-|penis-into|spread)/.test(pat.id) && (/\b(?:hips|ass|body|butt)\s+back\s+(?:in|into|onto|against|toward|towards)\b/i.test(m[0]) || /\b(?:sink|sank|sinks|sunk|sinking|settle|settles|settled|melt|melts|melted|lean|leans|leaned|press|presses|pressed|pressing|push|pushes|pushed|pushing|arch|arches|arched|arching)\s+back\s+(?:in|into|against|onto)\b/i.test(m[0]))) return;
    // "Dean wanted to beg him to just fuck him": the first "him" is the one asked, the second is the asker.
    let asked: { top: Character; bottom: Character } | undefined;
    if (pat.cat === "anal" && pat.subj === "t" && /^(?:him|her)$/i.test(tTok ?? "") && /^(?:him|her|me)$/i.test(bTok ?? "")) {
      const ask = /\b(?:beg|ask|tell|order|plead|urge|coax|command|invite|get|make|let|help|want|need|expect|wish)\w*\s+(?:him|her)\s+to\s+(?:(?:just|please|finally|really|only)\s+)*\w+\s+(?:him|her|me)\s*$/i.exec(sent.slice(0, m.index! + m[0].length));
      const asker = ask ? firstEntity(sent.slice(0, ask.index)) : undefined;
      const askedChar = asker ? ctx.partnerOf(asker) : undefined;
      if (asker && askedChar) asked = { top: askedChar, bottom: asker };
    }
    // "it made him flush": with only that one person in the pattern, "him" is the one made to flush, i.e. the causer's partner,
    // not the partner of that person.
    if (causative && !subjChar && nearSubj && !(pat.subj === "t" ? bTok : tTok)) subjChar = nearSubj;
    // "Rhys has a vice grip in Theo’s hair, keeping him still as his throat pulses around his cock": the throat is the held man’s, the cock the holder’s.
    let held: { top: Character; bottom: Character } | undefined;
    if (pat.id === "lips-around" && /^(?:his|her|their)$/i.test(tTok ?? "") && /^(?:his|her|their)$/i.test(bTok ?? "") && /\b(?:keeping|holding|pinning|forcing|stilling|guiding|pushing|pulling)\s+(?:him|her|them)\b[^.!?]*\b(?:as|while|and|so)\s*$/i.test(sent.slice(0, m.index!))) {
      const named = [...new Set(ctx.sentMentions.filter((x) => x.at < m.index!).map((x) => x.c))];
      if (named.length === 2) held = { top: named[0], bottom: named[1] };
    }
    let bodyPair: { top: Character; bottom: Character } | undefined;
    // "Sam makes a sound when Alex angles into him. Pulling back, his cock is inside his channel":
    // the explicit actor in the preceding clause owns the cock, not the subject who reacts.
    if (basePid === "penis-inside" && /^(?:his|her|their)$/i.test(tTok ?? "") && /^(?:his|her|their)$/i.test(bTok ?? "")) {
      const before = para.slice(0, Math.max(0, para.indexOf(original))).trim().split(/(?<=[.!?])\s+/).pop() ?? "";
      const entering = new RegExp(`\\b(${NAMES})\\s+angles?\\s+into\\s+(?:him|her|them)\\b`).exec(before);
      const actor = entering && cast.byAlias.get(entering[1]), receiver = firstEntity(before);
      if (actor && receiver && actor !== receiver) bodyPair = { top: actor, bottom: receiver };
    }
    // "Alex reaches out, asking May I?" followed by permission and a hand around Sam's cock:
    // the asker continues the requested touch, not the third person's remembered role.
    if (basePid === "dd2-hj-hand-to-dick" && /^(?:he|she|they)$/i.test(tTok ?? "")) {
      const previous = paras[pi - 1] ?? "";
      const request = new RegExp(`\\b(${NAMES})\\s+reaches?\\s+out\\b[^.!?]{0,80}?["“]May I\\?["”]`, "i").exec(previous);
      const actor = request && cast.byAlias.get(request[1]), receiver = bTok && cast.byAlias.get(stripPoss(bTok));
      if (actor && receiver && actor !== receiver && /^\W*["“]Yeah[,!?]?["”]/i.test(para)) bodyPair = { top: actor, bottom: receiver };
    }
    // A forehead kiss with two locally named participants continues into the following rubbing sentence.
    if (/^(?:rut-against-ass|grind-cock-on-ass)$/.test(basePid) && /^(?:he|she|they)$/i.test(tTok ?? "")) {
      const before = para.slice(0, Math.max(0, para.indexOf(original))).trim();
      const kiss = new RegExp(`\\bleans?\\s+down\\s+to\\s+kiss\\s+(${NAMES})['’]s\\s+forehead[.!?]?$`).exec(before);
      const receiver = bTok && cast.byAlias.get(stripPoss(bTok));
      const named = [...new Set([...before.matchAll(new RegExp(`\\b(${NAMES})\\b`, "g"))].map((m) => cast.byAlias.get(m[1])).filter((c): c is Character => !!c))];
      if (receiver && kiss && cast.byAlias.get(kiss[1]) === receiver && named.length === 2 && named.includes(receiver)) bodyPair = { top: named.find((c) => c !== receiver)!, bottom: receiver };
    }
    // Named fingers maintaining a hold, followed by lips on the other named person's ass and a rim-touch fragment.
    if (basePid === "pressure-at-hole" && !tTok && /^(?:his|her|their)$/i.test(bTok ?? "")) {
      const before = para.slice(0, Math.max(0, para.indexOf(original))).trim();
      const grip = new RegExp(`\\b(${NAMES})['’]s\\s+fingers\\s+tightening\\s+around\\b`).exec(before);
      const bodies = [...before.matchAll(new RegExp(`\\b(${NAMES})['’]s\\s+ass\\b`, "g"))];
      const actor = grip && cast.byAlias.get(grip[1]), receiver = bodies.length && cast.byAlias.get(bodies.at(-1)![1]);
      const named = new Set([...before.matchAll(new RegExp(`\\b(${NAMES})\\b`, "g"))].map((m) => cast.byAlias.get(m[1])).filter(Boolean));
      if (actor && receiver && actor !== receiver && named.size === 2) bodyPair = { top: actor, bottom: receiver };
    }
    // "Alex opens his legs, making a place for Lee to lie down": the invited person is explicit.
    if (/^spread-(?:their-)?legs$/.test(basePid)) {
      const invitation = new RegExp(`\\bmaking\\s+a\\s+place\\s+for\\s+(${NAMES})\\s+to\\s+(?:lay|lie)\\s+down\\b`).exec(sent);
      const guest = invitation && cast.byAlias.get(invitation[1]);
      const hostToken = pat.subj === "b" ? bTok : tTok;
      const host = hostToken && cast.byAlias.get(stripPoss(hostToken));
      if (host && guest && host !== guest) bodyPair = pat.subj === "b" ? { top: guest, bottom: host } : { top: host, bottom: guest };
    }
    // "Alex kneels, letting Lee's shaft fill his throat": the controlling subject owns the throat.
    if (basePid === "penis-in-mouth" && /^(?:his|her|their)$/i.test(bTok ?? "") && /\bletting\s*$/i.test(sent.slice(0, m.index!))) {
      const owner = firstEntity(sent.slice(0, m.index!));
      const giver = tTok && cast.byAlias.get(stripPoss(tTok));
      if (owner && giver && owner !== giver) bodyPair = { top: giver, bottom: owner };
    }
    // "Alex sees Lee's hand reach for a towel. Hears … his mouth … as he strokes Sam":
    // a hearing fragment continues the observed performer, rather than assigning his act to the observer.
    if (/^Hears\b/.test(original) && (pat.cat === "oral" || pat.signal?.kind === "handjob")) {
      const at = para.indexOf(original);
      const before = at > 0 ? para.slice(0, at).trim().split(/(?<=[.!?])\s+/).pop() ?? "" : "";
      const seen = new RegExp(`\\b(?:sees?|saw|watches?|watched)\\s+(${NAMES})['’]s\\s+(?:hand|mouth|lips)\\b`).exec(before);
      const performer = seen && cast.byAlias.get(seen[1]);
      const tName = tTok && cast.byAlias.get(stripPoss(tTok)), bName = bTok && cast.byAlias.get(stripPoss(bTok));
      if (performer && tName && performer !== tName && /^(?:his|her|their)$/i.test(bTok ?? "")) bodyPair = { top: tName, bottom: performer };
      if (performer && bName && performer !== bName && /^(?:he|she|his|her|their)$/i.test(tTok ?? "")) bodyPair = { top: performer, bottom: bName };
    }
    let desiredReceiver: Character | undefined;
    // Adult synthetic: Rowan pushes onto Morgan's fingers as he thrusts in; the fingers establish the actor.
    if (basePid === "pushed-in" && /^he$/i.test(tTok ?? "")) {
      const onto = new RegExp(`\\b(?:push|press|sink|sank)\\w*\\s+down\\s+on\\s+(${NAMES})['’]s\\s+fingers?\\b`).exec(sent.slice(0, m.index!));
      const fingerOwner = onto && cast.byAlias.get(onto[1]);
      const receiver = firstEntity(sent.slice(0, m.index!));
      if (fingerOwner && receiver && fingerOwner !== receiver) bodyPair = {top:fingerOwner,bottom:receiver};
      // Adult synthetic: Rowan relaxes, which Morgan did not expect, because he slides inside.
      const reaction = new RegExp(`\\b(${NAMES})\\s+(?:clearly\\s+)?(?:didn['’]t|did not)\\s+expect,?\\s+because\\s*$`).exec(sent.slice(0, m.index!));
      const actor = reaction && cast.byAlias.get(reaction[1]);
      if (actor && receiver && actor !== receiver) bodyPair = {top:actor,bottom:receiver};
    }
    // Adult synthetic: Rowan moans, but Morgan does not linger and instead adds another finger.
    if (basePid === "dd3-slipping-second") {
      const coordinated = new RegExp(`\\bbut\\s+(${NAMES})\\s+(?:didn['’]t|did not)\\s+linger\\b[^.!?]{0,50}?\\binstead\\s+(?:he|she)\\s+add\\w*`).exec(m[0]);
      const actor = coordinated && cast.byAlias.get(coordinated[1]);
      const receiver = actor && ctx.partnerOf(actor);
      if (actor && receiver) bodyPair = {top:actor,bottom:receiver};
    }
    // Adult synthetic: Rowan needs to be one with Morgan and wants him inside; a former partner is not involved.
    if (basePid === "push-into" && /^(?:him|her)$/i.test(tTok ?? "") && /^(?:him|her)$/i.test(bTok ?? "") && /\bdriven\s+inside\b/i.test(m[0])) {
      const desired = new RegExp(`\\bone\\s+with\\s+(${NAMES})\\b`).exec(sent.slice(0,m.index!));
      const actor = desired && cast.byAlias.get(desired[1]);
      const receiver = firstEntity(paras[pi - 1] ?? "");
      if (actor && receiver && actor !== receiver && cast.pairings.some(pair => pair.includes(actor) && pair.includes(receiver))) {bodyPair = {top:actor,bottom:receiver}; desiredReceiver = receiver;}
    }
    const ruled = asked ?? held ?? bodyPair;
    const resolved = ruled ? { ...ruled, basis: "pronoun" as Basis } : resolvePair(tTok, bTok, pat.subj, cast, ctx, subjChar, nearSubj, subjOrigin, povBody ? "pov" : watchedChar || causative ? "rule" : clauseOrigin);
    const attribution: AttributionEvidence = {
      top: "rule", bottom: "rule", topPronoun: !!(tTok && pronoun(stripPoss(tTok))), bottomPronoun: !!(bTok && pronoun(stripPoss(bTok))),
      subjectCandidates: 0, partnerCandidates: 0,
      nearbyCharacters: new Set([...ctx.recent.slice(0, 6), ...ctx.sentMentions.map((x) => x.c)]).size,
      ...("attribution" in (resolved ?? {}) ? (resolved as { attribution: AttributionEvidence }).attribution : {}),
      elided: !!pat.elided,
    };
    ctx.coSubjects.clear();
    opts.trace?.({ para: pi, via: pat.id, match: m[0], sentence: original, tToken: tTok, bToken: bTok, top: resolved?.top?.name, bottom: resolved?.bottom?.name, basis: resolved?.basis, elidedSubject: subjChar?.name, clauseSubject: nearSubj?.name, lastSubject: ctx.lastSubject?.name, pov: ctx.povNow?.name });
    if (!resolved) { oneSided(pat, m, tTok, bTok, sent, original, pi); return; }
    {
      // "She" or "her" can't be a man (and "he"/"him" can't be a woman): the pronoun meant someone outside the pair.
      const wrong = (tok: string | undefined, c: Character | undefined) =>
        !!c && ((/^(?:she|her|hers|herself)$/i.test(tok ?? "") && c.gender === "m" && c.vulva !== true) ||
          (/^(?:he|him|his|himself)$/i.test(tok ?? "") && c.gender === "f" && c.penis !== true));
      const r = resolved as { top?: Character; bottom?: Character };
      if (wrong(tTok, r.top) || wrong(bTok, r.bottom)) return;
    }
    let { top, bottom } = resolved as { top: Character; bottom: Character };
    // Arching in a pairing where neither has a penis is pleasure, not offering an ass: an anal hint needs anal words nearby.
    if (pat.id.startsWith("arch-") && top.penis === false && bottom.penis === false && !ANAL_CTX.test(para) && !ANAL_CTX.test(paras[pi - 1] ?? "") && !ANAL_CTX.test(paras[pi + 1] ?? "")) return;
    // "His eyes were glued to Buck's cock", "his hand wrapped around Steve's cock": the possessive pronoun in front is not the
    // person named after it.
    if (pat.subj === "t" && /^(?:his|her|their)$/i.test(tTok ?? "") && bTok) {
      const named = cast.byAlias.get(stripPoss(bTok));
      if (named && named !== cast.secondPerson) {
        bottom = named;
        if (top === named) top = ctx.partnerOf(named) ?? top;
      }
    }
    // "the cock inside him starts grinding into him": the one it's inside is the bottom, and it isn't his own cock.
    if (pat.cat === "anal" && /^the$/i.test(tTok ?? "") && /\b(?:inside|in)\s+(?:him|her)\b/i.test(m[0])) {
      const sub = firstEntity(sent.slice(0, m.index)) ?? ctx.lastSubject;
      const partner = sub && ctx.partnerOf(sub);
      if (sub && partner) { top = partner; bottom = sub; }
    }
    // "Dean tries to slip Cas's cock inside him": whose cock it is tops, and the one slipping it in is taking it.
    if (pat.cat === "anal") {
      const own = new RegExp(`\\b(${NAMES})['’]s\\s+(?:[\\w-]+\\s+){0,2}?(?:cock|dick|prick|length|shaft)\\b`).exec(m[0]);
      const owner = own ? cast.byAlias.get(own[1]) : undefined;
      if (owner && owner !== top && owner === bottom && pat.subj === "t" && !pat.signal) [top, bottom] = [bottom, top];
      // "Derek fucked my cock into Stiles" (or "Derek's cock … into Stiles" said of a third person's): whoever the cock belongs to
      // tops; the one moving it is only helping.
      if (pat.subj === "t" && /\b(?:in|into|inside)\s+\S/.test(m[0])) {
        const mine = /\b(?:fuck|push|guid|shov|eas|drove|drive|slid|slip|work|press)\w*\s+my\s+(?:[\w-]+\s+){0,2}?(?:cock|dick|prick|length|shaft)\b/i.test(m[0]);
        const who = mine ? (ctx.narratorNow ?? cast.narrator) : owner;
        if (who && who !== top && who !== bottom && cast.pairings.some((pr) => pr.includes(who) && pr.includes(bottom))) top = who;
      }
      // "Cas jackhammers Dean's own fingers inside him": his own fingers, so it's Dean fingering himself, not a scene with Cas.
      const fing = new RegExp(`\\b(${NAMES})['’]s\\s+(?:own\\s+)?(?:[\\w-]+\\s+){0,1}?(?:fingers?|digits?)\\b`).exec(m[0]);
      const fowner = fing ? cast.byAlias.get(fing[1]) : undefined;
      if (fowner && /\bown\b/i.test(m[0])) return;
    }
    // "…and then he's sliding in, swallowed by the tight heat of Eddie": a pronoun can't be someone the same sentence
    // names plainly after it, so it is the other one.
    if (!pat.elided && !subjChar && !nearSubj && /^(?:he|she)$/i.test(subjTok ?? "")) {
      const S = pat.subj === "t" ? top : bottom;
      const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (S.aliases.length) {
        const alt = S.aliases.map(esc).join("|");
        // Only the same clause: "He spasms around Derek's cock, …, but Derek pulls out and Stiles tenses" does not make the he Derek.
        const rest = sent.slice(m.index! + m[0].length).split(/\s{3,}|[;—]|,?\s+(?:but|yet|and then|then|while|as soon as)\b/)[0];
        if (new RegExp(`\\b(?:${alt})\\b(?!['’]s?(?!\\w))`).test(rest) && !new RegExp(`\\b(?:${alt})\\b`).test(m[0])) [top, bottom] = [bottom, top];
      }
    }
    // '"Laurent." He hisses and swats his ass': a line that is just a name is spoken to that person, so the "He" after it
    // is the other one.
    {
      const subjectChar = pat.subj === "t" ? top : bottom;
      const tokOfSubject = pat.subj === "t" ? tTok : bTok;
      const spoken = new RegExp(`[“"]\\s*(${NAMES})\\s*[.,!?…]*\\s*[”"]\\s*(?:He|She|They)\\b[^“"”]*$`).exec(original.slice(0, m.index!));
      if (spoken && (pat.elided || /^(?:he|she|they)$/i.test(tokOfSubject ?? "")) && cast.byAlias.get(spoken[1]) === subjectChar) [top, bottom] = [bottom, top];
    }
    // "Pulling out the rabbit tail plug from Stiles, he slams his dick inside him": the he of the main clause is the one doing the pulling,
    // not the person the opening phrase ends on.
    {
      const subjectChar = pat.subj === "t" ? top : bottom;
      const tokOfSubject = pat.subj === "t" ? tTok : bTok;
      const intro = new RegExp(`^\\W*[A-Z][a-z]+ing\\b[^,.;!?“”"]*?\\b(${NAMES})\\s*,\\s*(?:he|she)\\b`).exec(sent);
      if (intro && /^(?:he|she)$/i.test(tokOfSubject ?? "") && m.index! >= intro[0].length - 4 && cast.byAlias.get(stripPoss(intro[1])) === subjectChar) [top, bottom] = [bottom, top];
    }
    let { basis } = resolved;
    let act = pat.act;
    let cat = pat.cat;
    if(penisButtockContact){act=PENIS_BUTTOCK_CONTACT;cat="anal";}
    // A hip adjustment and prostate-directed thrust continue penile penetration only when this same pair just established it.
    if (basePid === "hips-thrust-prostate") {
      const previous = acts.filter(a => a.top === top && a.bottom === bottom && a.para >= pi - 4 && a.para < pi && (a.act === "fingering" || a.act.startsWith("anal sex"))).pop();
      if (!previous?.act.startsWith("anal sex") || FINGER_CTX.test(sent)) return;
    }
    const actor = pat.subj === "t" ? top : bottom;
    const originalAt = para.indexOf(original);
    const surrounding = [
      paras[pi - 1] ?? "",
      originalAt < 0 ? "" : para.slice(0, originalAt) + " " + para.slice(originalAt + original.length),
      sent.slice(0, m.index!) + " " + sent.slice(m.index! + m[0].length),
      paras[pi + 1] ?? "",
    ].join(" ");
    const feat = featuresOf({
      sent, paras, pi, basis: basis ?? "inferred", elided: !!pat.elided,
      pairBoth: cast.pairings.some((pr) => pr.includes(top) && pr.includes(bottom)),
      actorNamed: ctx.sentMentions.some((x) => x.c === actor),
      anyNamed: ctx.sentMentions.length > 0,
      decision: { attribution, match: m[0], surrounding, category: pat.cat, act: pat.act, hint: !!pat.signal },
    });
    const pronounInput=pronoun(subjTok ?? "");
    const compatible=pronounInput && "gender" in pronounInput ? new Set([...ctx.recent,...ctx.sentMentions.map(x=>x.c)].filter(c=>Ctx.compatible(c,pronounInput.gender))).size : 0;
    const distance=(c:Character)=>ctx.sentMentions.some(m=>m.c===c)?0:Math.max(0,ctx.sentenceIndex-(ctx.mentionedAt.get(c) ?? ctx.sentenceIndex));
    decisionOutcomes.set(feat,{initialTop:top.name,initialBottom:bottom.name,initialAct:act,
      compatiblePronounCandidates:compatible,sentenceDistance:Math.max(distance(top),distance(bottom))});
    let weight = pat.weight * trustOf(pat.id, feat) * (basis === "named" ? 1 : basis === "pronoun" ? 0.75 : 0.5);
    const matchText = m[0];
    const after = sent.slice(m.index! + matchText.length, m.index! + matchText.length + 70);
    // Invented adults: a penis between buttocks is contact evidence, not independent proof of insertion.
    if(externalPenisButtockContact){
      if(NEG.test(m.groups?.aux ?? "") || /\b(?:not|never|didn[’\']t|doesn[’\']t|wasn[’\']t|isn[’\']t)\b[^;.!?]{0,65}$/i.test(contactPrefix))return;
      if(!desires.some(d=>d.sentence===original && d.act===PENIS_BUTTOCK_CONTACT &&
        (d.who===top && d.partner===bottom || d.who===bottom && d.partner===top)))
        desires.push({via:pat.id,cat:"anal",act:PENIS_BUTTOCK_CONTACT,who:top,partner:bottom,role:"top",wants:true,
          kind:occurrence==="history"||occurrence==="recording"?"history":occurrence==="habitual"?"identity":occurrence ?? (contactConditional?"hypothetical":"touch"),
          weight:weight*Math.min(1,0.6/pat.weight),para:pi,sentence:original,basis,feat,attribution});
      return;
    }

    // Refinements.
    if (pat.id === "fuck") {
      if (/^\s+(?:[\w']+\s+){0,4}?with\s+(?:his|her|their|my|your)\s+tongue\b/.test(after)) { cat = "oral"; act = "rimming"; }
      else if (/^\s+(?:[\w']+\s+){0,4}?with\s+(?:his|her|their|my|your|a|one|two|three|four)\s+(?:\w+\s+)?(?:fingers?|digits?|knuckles?)\b/.test(after)) act = "fingering";
      else if (/^\s+(?:[\w']+\s+){0,3}?(?:between|with)\s+(?:his|her|their|my|your)\s+(?:thighs|breasts|tits|hand|fist)\b/.test(after)) return;
      else if (/^\s+(?:[\w']+\s+){0,4}?with\s+(?:a|the|her|his|their|my|your)\s+(?:strap|dildo|toy|vibrator|plug)/.test(after)) act = "anal sex (strap-on/toy)";
    }
    // Adult synthetic: a stated reflexive finger insertion belongs to the actor, not a partner.
    if(!pat.signal && act==="fingering" && (/\b(?:himself|herself|themselves|themself)\b/i.test(matchText) || /^\s*(?:(?:in|inside|into)\s+)?(?:himself|herself|themselves|themself)\b/i.test(after))) {
      const self=readSlot(tTok,cast,ctx)?.char ?? top;
      const target=holeType(matchText,sent,para,self,self);
      desires.push({via:pat.id,feat,attribution,cat:target==="ambiguous"?"vibe":target,act:"fingering himself",who:self,partner:ctx.partnerOf(self) ?? (self===top?bottom:top),
        role:"bottom",wants:true,kind:occurrence==="history"||occurrence==="recording"?"history":occurrence==="habitual"?"identity":occurrence ?? "solo",weight,para:pi,sentence:original,basis});
      return;
    }
    // Adult synthetic: Rowan's own finger enters Rowan's hole during a remote phone conversation.
    // Both body references must share a possessive, and the partner is only remotely present.
    if(act==="fingering" && basePid==="fingers-enter-hole" && !tTok &&
       /^(?:his|her|their)\b/i.test(matchText) && /^(?:his|her|their)$/i.test(bTok ?? "") &&
       /\b(?:phone|telephone|on the line)\b/i.test(paras.slice(Math.max(0,pi-3),pi+1).join(" ")) &&
       !new RegExp(`\\b(?:${NAMES})['’]s\\s+(?:finger|hand)`).test(sent)) {
      const target=holeType(matchText,sent,para,bottom,bottom);
      desires.push({via:pat.id,feat,attribution,cat:target==="ambiguous"?"vibe":target,act:"fingering himself",who:bottom,partner:top,
        role:"bottom",wants:true,kind:occurrence==="history"||occurrence==="recording"?"history":occurrence==="habitual"?"identity":occurrence ?? "solo",weight:weight,para:pi,sentence:original,basis});
      return;
    }
    // "Sinking his fingers into his hole…", "His finger sinks into his hole": with nobody named, he's on his own.
    // "he might stick his fingers inside himself": the fingers are going into the one doing it.
    if ((act === "fingering" || act === "fisting") && pat.subj === "t" && /^\s*(?:in|inside|into)\s+(?:of\s+)?(?:himself|herself|themselves)\b/i.test(sent.slice(m.index! + m[0].length))) {
      if (!NEG.test(sent.slice(0, m.index).slice(-40))) {
        const other = ctx.partnerOf(top);
        if (other) desires.push({ via: pat.id, cat: "anal", act: "fingering himself", who: top, partner: other, role: "bottom", wants: true, kind: "solo", weight: 0.5, para: pi, sentence: original });
      }
      return;
    }
    // "He shoves his hand inside of his wet, sloppy hole" is the same.
    if ((act === "fingering" || act === "fisting") && /^(?:[Hh]is|[Hh]er|[Tt]heir|[Hh]e|[Ss]he)$/.test(tTok ?? "") && /^(?:[Hh]is|[Hh]er|[Tt]heir)$/.test(bTok ?? "") &&
        (!/^(?:[Hh]e|[Ss]he)$/.test(tTok ?? "") || /\b(?:his|her|their)\s+(?:[\w,-]+\s+){0,3}(?:hole|ass|arse|entrance|rim|pussy|cunt|cheeks|opening)\b/i.test(m[0])) &&
        !new RegExp(`\\b(?:${NAMES})\\b`).test(sent.slice(0, m.index!).replace(/^.*[”"]/s, "") + sent.slice(m.index!))) {
      const self = ctx.lastSubject ?? top;
      const other = ctx.partnerOf(self);
      if (other && !NEG.test(sent.slice(0, m.index).slice(-40))) {
        desires.push({ via: pat.id, cat: "anal", act: "fingering himself", who: self, partner: other, role: "bottom", wants: true, kind: "solo", weight: 0.5, para: pi, sentence: original });
      }
      return;
    }
    // "cupping his cheeks" while kissing: a face, not an ass.
    // "scoots forwards, pushing his knees apart" before a blowjob: getting between someone's knees to kneel and suck.
    // "gently works his mouth open … as he licks into Buck": a kiss.
    if (pat.id.startsWith("licked-into") && !/\b(?:ass|arse|hole|rim|crack|cheeks|entrance|pucker)\b/i.test(matchText) && /\b(?:mouth|lips|kiss\w*)\b/i.test(para)) return;
    // "had his face in his ass and started licking": the object left out is the ass just named.
    if (pat.id.startsWith("began-to-suck") && /\b(?:ass|arse|asshole|hole|rim|cheeks|crack)\b/i.test(sent.slice(0, m.index!)) && !PENIS_CTX.test(sent)) return;
    // "got between Stiles' legs and buried my tongue in his hole" is rimming, not this.
    if (pat.id === "between-thighs-licked" && /\b(?:ass|arse|asshole|hole|rim|crack|cheeks)\b/i.test(sent.slice(m.index!, m.index! + m[0].length + 40))) return;
    // "I'm top of my class", "stripped, top first, then trousers": the noun, not a role.
    if (pat.id.startsWith("topped") && (/^\W*top\s+(?:of|off|first|half|layer|button|and\b)/i.test(sent.slice(m.index!)) || /\btops?\b/i.test(matchText) && /\b(?:strip\w*|undress\w*|shirts?|removed?|shed|peel\w*|took off|clothes|clothing|trousers|pants|skirts?|bras?|dress\w*|blouses?|sweater|hoodie|jacket|frilly|pastel|crop|tank|outfits?|wear\w*)\b/i.test(sent))) return;
    // "circled her clit" with a hand, palm or thumb and no mouth about is touch, not oral.
    if (pat.id.startsWith("licked-vulva") && /\b(?:circl|flick)/i.test(matchText) && !/\b(?:tongue|mouth|lips|licked|sucked|kissed)\b/i.test(sent)) return;
    // "He buried himself in the Egyptian cotton", "buried himself in his neck": bedding and bodies, not penetration.
    if (pat.id.startsWith("push-into") && /\bbur(?:y|ied|ies|ying)\s+(?:himself|herself|themselves|themself)\s+in\s+(?:the\s+|his\s+|her\s+|their\s+|a\s+)?(?:[\w-]+\s+){0,2}(?:cotton|sheets?|pillows?|blankets?|duvet|covers?|bedding|hair|fur|snow|sand|work|books?|neck|chest|arms|shoulder)\b/i.test(original)) return;
    // "swirled his tongue around him … taking in his whole length": that is a blowjob, which has its own patterns.
    if (pat.id.startsWith("tongue-into") && /\b(?:length|cock|dick|shaft|cockhead)\b/i.test(sent.slice(m.index!)) && !/\b(?:ass|arse|hole|rim|crack|cheeks)\b/i.test(sent)) return;
    // "his thighs clenched around Steve" and a cock that only brushed against an ass are not sex.
    if (pat.id.startsWith("clenched-around") && /\b(?:thighs?|legs?|arms?|fingers|hands|fists?|jaw)\b[^.!?]{0,60}\b(?:clench|tighten)/i.test(sent) && !ANAL_CTX.test(sent)) return;
    if (pat.id === "penis-against" && /\b(?:brush|graz|ghost|skim|bump|flick)\w*\s+(?:against|over|along|across)/i.test(matchText)) return;
    // "cum in his own mouth" is not a blowjob.
    if (cat === "oral" && /\bin\s+(?:his|her|their)\s+own\s+mouth\b/i.test(matchText)) return;
    // "pushed two fingers into his own ass", "sucked his own cock": the object belongs to the one acting, so it is a solo act, never a scene with the partner.
    if (/\b(?:his|her|their)\s+own\s+(?:[\w-]+\s+){0,2}?(?:ass|arse|asshole|hole|entrance|rim|cunt|pussy)\b/i.test(matchText) && (cat === "anal" || pat.id.startsWith("self-")) && !/\b(?:cock|dick|prick|length)\b/i.test(matchText.slice(0, matchText.search(/\b(?:his|her|their)\s+own\b/i)))) {
      const other = ctx.partnerOf(top);
      if (other && !NEG.test(sent.slice(0, m.index).slice(-40))) {
        desires.push({ via: pat.id, cat: "anal", act: /\b(?:dildo|vibrator|vibe|plug|beads|toy)\b/i.test(matchText) ? "using a toy on himself" : "fingering himself", who: top, partner: other, role: "bottom", wants: true, kind: "solo", weight: 0.5, para: pi, sentence: original, reflexive: true });
      }
      return;
    }
    if (cat === "oral" && act === "blowjob" && /\b(?:his|her|their)\s+own\s+(?:[\w-]+\s+){0,2}?(?:cock|dick|prick|length|shaft)\b/i.test(matchText) && /^(?:his|her|their)$/i.test(tTok ?? "")) return;
    // "sink down onto it" only counts when the "it" is a cock just mentioned (not a horse or a chair).
    if (pat.id.startsWith("riding-it")) {
      const at = para.indexOf(sent);
      const recent = (at >= 0 ? para.slice(Math.max(0, at - 220), at) : "") + sent.slice(0, m.index!);
      if (!PENIS_CTX.test(recent.slice(-220))) return;
      const lastNoun = [...recent.slice(-220).matchAll(/\b(cock|dick|prick|length|shaft|erection|member|knot|girth|horse|chair|bike|bicycle|saddle|couch|sofa|bed|stool|seat|camel|pony|mechanical bull|bull|swing|log|rock|bench|horses)\b/gi)].pop();
      if (lastNoun && !PENIS_CTX.test(lastNoun[1])) return;
    }
    // Cuddling, position, aftercare and pet-name cues need a real subject: "dragging him up to sit in his lap" has "him" as the
    // sitter, which the subject slot can't read, and "his head lolls onto his chest" is one person's own chest.
    if (/^(?:cuddle-|pos-|aftercare-|petname-)/.test(pat.id)) {
      const subjTk = pat.subj === "t" ? tTok : bTok;
      if (/^(?:him|her|them)$/i.test(subjTk ?? "")) return;
      if (pat.id.startsWith("cuddle-head-on-chest-poss") && !/['’]s?$/.test(bTok ?? "")) return;
      if (pat.id.startsWith("cuddle-head-on-chest") && /^(?:he|she|they)$/i.test(bTok ?? "") && /^(?:his|her|their)$/i.test(tTok ?? "") && !/\b(?:[A-Z][a-z]+)\b[^.]*\b(?:head|face|cheek)\b/.test(matchText)) return;
    }
    // "Cregan takes him deeper … bottoming out with each punch of his cock into the prince": with his own cock in the same
    // sentence, "takes him" is the one doing the fucking, which the penetration patterns already read.
    if (pat.id.startsWith("took-deep") && /\b(?:his|her|their)\s+(?:[\w-]+\s+){0,2}?(?:cock|dick|prick|length)\b|\bbottom(?:ing|ed)?\s+out\b/i.test(sent.slice(m.index!))) return;
    // "He took the shoes and parted his legs": nobody else is in the sentence, so they're his own.
    if (pat.id.startsWith("spread-their-legs") && (!tTok || /^(?:he|she|they)$/i.test(tTok)) && /^(?:his|her|their)$/i.test(bTok ?? "") && !/\b(?:him|her|them)\b/i.test(sent.slice(0, m.index)) && !new RegExp(`^\\s*(?:to|so)?\\s*(?:stand|settle|kneel|get)\\w*\\s+between`, "i").test(after)) return;
    // A manspread on a sofa is just sitting.
    if (/^spread-(?:their-)?legs/.test(pat.id) && /\b(?:sofa|couch|chair|armchair|seat|stool|bench|sprawl\w*|comfortabl\w*|slouch\w*|lounge\w*|recline\w*)\b/i.test(sent) && !ANAL_CTX.test(sent) && !PENIS_CTX.test(sent)) return;
    // An ass in an idiom ("your ass is grass", "kick your ass").
    if (cat === "anal" && IDIOM_ASS.test(sent)) return;
    // "He parted his legs for her": the "her" is someone outside a pair with no woman in it (a doctor, a bystander).
    {
      const afterMatch = sent.slice(m.index! + m[0].length);
      const noFemale = top.gender !== "f" && bottom.gender !== "f";
      const noMale = top.gender !== "m" && bottom.gender !== "m";
      if ((noFemale && /^\s*(?:,\s*)?(?:for|to|at|toward|towards)\s+(?:her|she)\b/i.test(afterMatch)) || (noMale && /^\s*(?:,\s*)?(?:for|to|at|toward|towards)\s+(?:him|he)\b/i.test(afterMatch))) return;
    }
    // "work his tongue over his lover" in the middle of a blowjob paragraph is the blowjob, not rimming.
    if (act === "rimming" && pat.id !== "tongue-probing" && basePid !== "review-tongue-summary" && !/\b(?:ass|arse|hole|rim|crack|cheeks|entrance|pucker)\b/i.test(sent) && /\b(?:sucking|gagg\w*|throat|cock|dick|prick|blowjob)\b/i.test(para)) return;
    // "when Anakin rides him so hard, in sixty years": a far-off future is no scene.
    if (cat === "anal" && /\bin (?:\w+ )?(?:years|decades|centuries|months)\b[^.!?]{0,40}$/i.test(sent.slice(Math.max(0, m.index! - 80), m.index!))) return;
    // "his tongue twists inside him … Eddie sinks into him": the same paragraph's tongue is the act, not a second, anal one.
    if (cat === "anal" && basePid !== "review-takes-second-time" && /\btongue\b/i.test(`${paras[pi - 1] ?? ""} ${para} ${paras[pi + 1] ?? ""}`) && !/\b(?:cock|dick|prick|knot|fingers?|length|shaft|toy|dildo|vibrator|plug|strap|head|tip)\b/i.test(`${paras[pi - 1] ?? ""} ${para} ${paras[pi + 1] ?? ""}`)) return;
    // "Dean pushed the dildo into his ass" with no one else in the sentence: his own ass, so he is bottoming, not topping.
    if (cat === "anal" && !pat.signal && /\b(?:dildo|vibrator|vibe|butt\s*plug|plug|beads|toy)\b/i.test(matchText) && /^(?:his|her|their)$/i.test(bTok ?? "") && !new RegExp(`\\b(?:${cast.chars.filter((c) => c !== top).flatMap((c) => c.aliases).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") || "$^"})\\b`).test(sent)) {
      desires.push({ via: pat.id, cat: "anal", act: "using a toy on himself", who: top, partner: bottom, role: "bottom", wants: true, kind: "solo", weight: 0.5, para: pi, sentence: original });
      return;
    }
    // "spreads his legs to wipe them": he is cleaning someone, not offering himself.
    if (/^spread-(?:their-)?legs/.test(pat.id) && /^\s*(?:and\s+)?to\s+(?:wipe|clean|dry|wash|towel|inspect|examine|check|look|see)\b/i.test(after)) return;
    if (pat.id.startsWith("spread-their-legs") && [pi - 1, pi, pi + 1].some((i) => !!paras[i] && /\b(?:kneel\w*|drops? to his knees|mouth|lick\w*|nuzzl\w*|suck\w*|tongue)\b/i.test(paras[i]) && !/\b(?:hole|lube[ds]?|ass\b|arse|fingers?|prostate)\b/i.test(paras[i]))) return;
    // "squeezed Dean's cheeks tighter, forcing him to open his mouth": cheeks with no ass word and a mouth or face in the sentence are a face.
    if ((pat.id.startsWith("grab-ass") || pat.id === "hands-on-ass") && /cheeks\b/.test(matchText) && !/\b(?:ass|arse|butt|bum|backside|behind)\b/i.test(matchText) &&
        /\b(?:mouth|lips?|jaws?|face|chin|tongue|teeth|open (?:his|her|their) mouth|tears?|eyes)\b/i.test(sent)) return;
    // "Eddie decided to be Eddie. He kept working the vibe (a pink one he'd chosen for Steve) inside him": a toy inside a "him" who is not the
    // subject, with the other person named alongside, is being used on that person, not on the subject.
    if ((pat.id.replace(/~elided$/, "") === "self-toy" || pat.id.replace(/~elided$/, "") === "wearing-plug") && /\b(?:inside|in|into)\s+(?:him|her|them)\b(?!self)/i.test(sent.slice(m.index!)) && !REFLEXIVE.test(sent)) {
      const at0 = para.indexOf(sent);
      const near = sent + " " + (at0 > 0 ? para.slice(Math.max(0, at0 - 240), at0) : "");
      const named = cast.chars.filter((c) => c !== cast.secondPerson && c.aliases.some((a) => new RegExp(`\\b${escapeRe(a)}\\b`).test(near)));
      if (named.length >= 2) return;
    }
    // "Eddie smacked his cheeks to wake himself up": "cheeks" with no ass word needs a sex scene around it.
    if ((pat.id.startsWith("grab-ass") || pat.id === "hands-on-ass") && /cheeks\b/.test(matchText) && !/\b(?:ass|arse|butt|bum|backside|behind)\b/i.test(matchText) &&
        ![pi - 2, pi - 1, pi, pi + 1].some((i) => !!paras[i] && (PENIS_CTX.test(paras[i]) || /\b(?:ass|arse|butt|hole|naked|undress\w*|moan\w*|lube\w*|condom|erection|aroused|thrust\w*|kiss\w*|bed)\b/i.test(paras[i])))) return;
    // "He smacked his cheeks to wake himself up": a pronoun subject and its own possessive (He … his), no ass word.
    if ((pat.id.startsWith("grab-ass") || pat.id === "hands-on-ass") && /cheeks\b/.test(matchText) && !/\b(?:ass|arse|butt|bum|backside|behind)\b/i.test(matchText) &&
        (/^\W*(?:He|he)\b.*\bhis\s+(?:\w+\s+){0,2}cheeks\b/.test(matchText) || /^\W*(?:She|she)\b.*\bher\s+(?:\w+\s+){0,2}cheeks\b/.test(matchText) ||
         /^\W*(?:They|they)\b.*\btheir\s+(?:\w+\s+){0,2}cheeks\b/.test(matchText) || /^\W*I\b.*\bmy\s+(?:\w+\s+){0,2}cheeks\b/.test(matchText))) return;
    if ((pat.id.startsWith("grab-ass") || pat.id === "hands-on-ass") && /cheeks\b/.test(matchText) && !/\b(?:ass|arse|butt|bum)\b/i.test(matchText) &&
        (/\b(?:cup|pinch|pat|tap|stroke)\w*\b/i.test(matchText) || /\b(?:kiss\w*|face|eyes?|tears?|lips|jaw|blush\w*|flush\w*|smil\w*|forehead|nose|head|cradl\w*|temples?|chin)\b/i.test(sent))) return;
    // "…until the ridges of Alex's knuckles … each time they slide past his rim": "they" are the fingers.
    // They're fingering, by whoever owns the fingers ("Alex's knuckles", "his fingers").
    if (/^they$/i.test(tTok ?? "") && /\b(?:fingers?|knuckles?|digits?|hands?|toys?|thumbs?)\b/i.test(sent.slice(0, m.index))) {
      if (cat !== "anal") return;
      const own = new RegExp(`\\b((?:${NAMES})|${EPITHET_TOKEN}|[Hh]is|[Hh]er|[Tt]heir|[Mm]y)(?:['’]s)?\\s+(?:[\\w-]+\\s+){0,2}?(?:fingers?|knuckles?|digits?|thumbs?)\\b`).exec(sent.slice(0, m.index));
      const tok = own ? stripPoss(own[1]) : "";
      const owner = cast.byAlias.get(tok) ?? (ctx.token(tok) || undefined) ?? (own && pronoun(tok) ? elidedSubject(sent.slice(0, own.index)) : undefined);
      const other = owner ? ctx.partnerOf(owner) : undefined;
      if (!owner || !other) return;
      [top, bottom] = [owner, other];
      act = "fingering";
    }
    // "he liked the drag of Cas inside him, slamming against his prostate": the one slamming is the one inside him, not the "he".
    if (pat.id.startsWith("prostate") && pat.elided && /\b(?:inside|in)\s+(?:him|her|them)\s*,\s*$/i.test(sent.slice(0, m.index!) + (/^\s*,\s*/.exec(m[0])?.[0] ?? ""))) return;
    // "the fingers he presses inside himself": his own hand in his own ass, which the solo card covers, not one partner fingering the other.
    if (pat.id.startsWith("pushed-in") && /\b(?:inside|into|in)$/i.test(matchText) && /^\s+(?:himself|herself|themselves)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "Alex shudders and presses in harder" while kissing: not penetration.
    if (pat.id.startsWith("pushed-in") && /\bkiss/i.test(sent) && !ANAL_CTX.test(sent)) return;
    // "the bright blue water was going to swallow them whole": something that isn't a person swallowing people up, not a blowjob.
    if (pat.id.startsWith("swallowed-down") && /\b(?:water|waves?|sea|ocean|lake|river|pool|darkness|dark|night|shadows?|fog|mist|smoke|earth|ground|crowd|city|abyss|void|flames?|fire|storm|monster|beast|whale|snake|dragon|forest|woods|cave|mouth of)\b[^.!?]{0,50}$/i.test(sent.slice(0, m.index! + matchText.length))) return;
    // "the tip of his digits grazing his prostate": his … his is most often the same person (a hand on himself), so it says nothing about a partner.
    if (pat.id === "fingers-find-prostate" && /^(?:his|her|their)$/i.test(tTok ?? "") && /^(?:his|her|their|the|that)$/i.test(bTok ?? "") && !/\binside\s+(?:of\s+)?\w+\s*$/i.test(matchText)) return;
    // "slipping in and out of his sleeves", "in and out of consciousness": moving through something that isn't a body.
    if (pat.id.startsWith("pushed-in") && /^\s*(?:and|or)\s+out\s+of\s+(?:(?:his|her|their|my|your|the|an?|[\w'’]+['’]s)\s+)?(?:sleeves?|clothes|clothing|pockets?|jacket|shirt|sweater|hoodie|coat|shoes?|boots?|room|bed|house|car|truck|shadows?|memories|mind|thoughts|consciousness|sleep|focus|view|sight|traffic|town|lane)\b/i.test(after)) return;
    // "He still presses his face down against Cas' shoulder": a face hidden in someone's neck or shoulder, not a head pushed toward a cock.
    if (pat.id === "pushed-head-down" && (/^\s*(?:against|into|on|in)\s+(?:[\w'’]+\s+)?(?:shoulder|chest|neck|pillow|mattress|hands?|arms?|sleeve|collar|hair|back|steering|table|desk|wall)\b/i.test(after) || (/^(?:press|tug)/i.test(matchText.replace(/^\S+\s+/, "")) && /^(?:his|her|their)$/i.test(bTok ?? "") && !/\b(?:crotch|cock|dick|groin|lap|erection|bulge|length|prick|shaft|between)\b/i.test(sent)))) return;
    // "How does he open himself up and expose Jack to something like this?": opening up emotionally, not fingering.
    if (pat.id === "self-finger" && /\bopen\w*\s+(?:himself|herself|themselves|myself|yourself)\s+up\b/i.test(matchText) && (/\b(?:expose|vulnerab\w*|emotion\w*|feelings?|let\s+\w+\s+in|to\s+(?:something|someone|anyone|anything|hurt|pain))\b/i.test(sent) || /^\W*(?:how|why|what|can|could|would|should)\b[^.!]*\?\s*$/i.test(sent) || !ANAL_CTX.test(sent) && !FINGER_CTX.test(sent) && !/\b(?:lube\w*|hole|rim|ass|fingers?|slick\w*|stretch\w*|prep\w*)\b/i.test(sent))) return;
    // "Carl watched him reach down to take himself out of his sweatpants": a man handling himself, not someone bending over.
    if (pat.id.startsWith("ogle-bend-over") && /\b(?:reach\w*|bend\w*|lean\w*|bent|stretch\w*)\s+down\s+(?:and\s+|to\s+)?(?:take|took|pull|pulled|slip|slipped|free|freed|fish|fished|get|got|palm|palmed|grab|grabbed|wrap|wrapped|undo|undid|unzip|unzipped|tug|tugged|shove|shoved|push|pushed)\w*\s+(?:himself|herself|his\s+(?:cock|dick|pants|sweatpants|jeans|boxers|underwear)|out\s+of)/i.test(sent.slice(m.index!))) return;
    // "He climbs the steps and unlocks the door. He pushes inside.": a short sentence right after a door is a door, not a body.
    if (pat.id.startsWith("pushed-in") && sent.trim().length <= 40 && !/\b(?:thrust|fuck|rut|snap|pound|slam)/i.test(matchText)) {
      const before = para.slice(0, Math.max(0, para.indexOf(sent.trim().slice(0, 20)))).trim();
      const prevText = before || (pi > 0 ? paras[pi - 1] : "");
      const prevSent = prevText.split(/(?<=[.!?])\s+/).filter(Boolean).pop() ?? "";
      if (/\b(?:door|doorway|steps|porch|stairs|threshold|keys?|unlock\w*|knock\w*|apartment|house|hallway|lobby|foyer)\b/i.test(prevSent) && !/\b(?:cock|dick|hole|ass|arse|thrust\w*|lube\w*|prostate|moan\w*|naked|erection|fucked?|stretch\w*)\b/i.test(para)) return;
    }
    // "Like he isn't fully in his body yet": a mind not in its body, not a cock inside one.
    if (pat.id.startsWith("inside") && /\bin\s+(?:his|her|their|my|your)\s+(?:own\s+)?body\b/i.test(matchText) && !/\binside\b/i.test(matchText)) return;
    // "exhaled, grounding himself": steadying oneself, not grinding.
    if (pat.id.startsWith("mast-himself") && /\bground(?:ing|ed|s)\s+(?:himself|herself|themself|themselves)\b(?!\s+(?:against|on|onto|into|down|in|back|up against|over))/i.test(matchText + sent.slice(m.index! + matchText.length, m.index! + matchText.length + 14))) return;
    // "He lubed himself up, … and worked two fingers in, stretching himself": getting himself ready to be fucked, not slicking up a cock.
    if (pat.id.startsWith("slicked-self") && !/\b(?:cock|dick|length|shaft|condom)\b/i.test(matchText) && /\b(?:fingers?\s+(?:in|inside)(?=\s*(?:[,.;]|$|and\b))|stretch\w*\s+(?:himself|herself|themself)|open\w*\s+(?:himself|herself|themself)|(?:his|her|their)\s+(?:hole|entrance|rim))\b/i.test(sent.slice(m.index! + matchText.length))) return;
    // "He bent over the table to slide in his earnings": bending over for an object, not presenting.
    if (pat.id.startsWith("bent-over") && /\bto\s+(?:slide|slip|pick|grab|collect|gather|read|write|sign|study|examine|look|peer|check|set|place|put|get|take|reach|retrieve|stack|count|fix|tie|lift|scoop|whisper|hear|listen)\b|\b(?:earnings|winnings|money|cash|bills|coins|chips|cards|map|papers?|plates?|dishes|menu|ledger)\b/i.test(sent.slice(m.index!))) return;
    // "Dean dropped down to his knees in the shallow water": a rescue, a river, a field, not kneeling for someone.
    if (pat.id.startsWith("sinks-to-floor") && /\b(?:in|into|on|beside|by)\s+(?:the\s+)?(?:shallow\s+|cold\s+|wet\s+|muddy\s+|frozen\s+)?(?:water|river|stream|creek|lake|mud|snow|sand|dirt|rubble|grass|ditch|puddle|rain|gravel|debris|ashes|bloody|blood)\b/i.test(sent.slice(m.index!))) return;
    // "His gaze landed on Cas' dick, and Dean … wondering if they had any petroleum jelly": wanting lube is anal prep, not an oral cue.
    if (pat.id.startsWith("eyes-on-crotch-oral") && /\b(?:jelly|lube|lubricant|vaseline|oil|slick|condom|prep\w*|stretch\w*|fill\w*|inside)\b/i.test(sent)) return;
    // A knot is the top's only when one of them has one: with two knots it says nothing about who tops.
    if (pat.id.startsWith("knot-owner") && bothKnot) return;
    // "Jason's right palm flexes, pressing in" / "can feel Eddie twitch, press in, pulse": a hand or a feeling, not a cock going in.
    if (pat.id.startsWith("pushed-in") && pat.elided) {
      const prior = sent.slice(0, m.index);
      if (/\b(?:palm|hand|hands|fingers?|thumb|arm|knee|elbow|shoulder|foot|leg|jaw|chest|fist|claws?|nails?)\s+\w+s?,?\s*$/i.test(prior)) return;
      if (/\b(?:can |could )?(?:feel|felt|feels)\b[^.!?]{0,50}\b(?:twitch|pulse|throb|shudder|swell|flex)\w*,?\s*$/i.test(prior)) return;
    }
    // "pulled his lips off of Steve just enough to say": a kiss, not a cock.
    if (pat.id.startsWith("mouth-off") && /^\s*,?\s*just enough\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "dropped a hand between Jack's legs and sucked at the junction of his neck": a hand and a neck, not a mouth on a cock.
    if (pat.id.startsWith("between-thighs-licked") && (/\b(?:hand|hands|fingers?|knee|arm)\s+between\b/i.test(matchText) || /\b(?:lick|lap|suck)\w*\s+(?:at\s+|on\s+)?(?:the\s+)?(?:\w+\s+)?(?:junction|neck|shoulder|collarbone|throat|jaw|nipples?)\b/i.test(matchText))) return;
    {
      const before = para.slice(Math.max(0, para.indexOf(sent) - 220), para.indexOf(sent) + (m.index ?? 0));
      const noCock = !/\b(?:cock|dick|prick|shaft|length|head|tip|crown|erection|balls)\b/i.test(matchText);
      // "shoved his fingers into Jack's mouth. Jack immediately began to suck": fingers, not a cock.
      if (pat.id.startsWith("began-to-suck") && noCock && /\bfingers?\b[^.!?]{0,50}\b(?:mouth|lips)\b/i.test(before)) return;
      // "sucking and gagging slightly when the count pushed in deeper", "around his finger and Dracula slipped in another": a mouth, not a hole.
      if (/^(?:pushed-in|push-into|slipped-in)/.test(pat.id) && /\b(?:suck\w*|gagg?\w*|swallow\w*|(?:down|in|into)\s+(?:his|the|\w+['’]s)\s+throat|around\s+(?:his|the|\w+['’]s)\s+fingers?)\b/i.test(sent.slice(0, (m.index ?? 0) + m[0].length)) && !/\b(?:hole|ass|entrance|rim|opening)\b/i.test(sent)) return;
      // "Eddie dropped to his knees, Jason now off balance from his unexpected miss": ducking a punch.
      if (pat.id.startsWith("sinks-to-floor") && /\b(?:punch\w*|swing|swung|dodg\w+|ducked?|miss(?:ed)?|knife|bullet|gun|tackl\w+|off balance)\b/i.test(sent + " " + (para.split(sent)[0] ?? "").slice(-160))) return;
      // "Steve shushed him with a finger across his lips": quieting, not sucking.
      if (pat.id.startsWith("fingers-in-out-mouth") && /\b(?:shush\w*|hush\w*|quiet\w*|silenc\w*|shh+)\b/i.test(sent)) return;
      // A hand wrapped round a cock is the handjob's, not an anal touch cue: "slid his hand inside Steve's boxers, wrapping around his dick".
      if (/^hand-in-pants/.test(pat.id) && /\b(?:wrapp?\w*|curl\w*|clos\w*|fist\w*)\s+(?:\w+\s+)?(?:around|round|over)\s+(?:his|the|\w+['’]s)\s+(?:\w+\s+)?(?:cock|dick|shaft|length|erection)|\b(?:pump\w*|strok\w*)\b/i.test(sent.slice((m.index ?? 0) + m[0].length))) return;
      // Spanking and its aftercare: "his whole ass felt like it was on fire", "cupped his red ass, soothing the skin", "wiping lube" are not sex.
      if (pat.id.startsWith("body-sore") && /\b(?:spank\w*|paddl\w*|smack\w*|flogg?\w*|punish\w*|whipp?\w*|caned?|caning|soothing|aftercare|lotion)\b/i.test(para)) return;
      if (pat.id.startsWith("grab-ass") && /\b(?:soothing|soothe|aftercare|lotion|balm|cool(?:ing)?\s+cream)\b/i.test(sent)) return;
      if (/^spread-(?:their-)?legs/.test(pat.id) && /\b(?:wip\w*|wash\w*|clean\w*|lotion|aftercare|towel|shower\w*)\b/i.test(para)) return;
      // "grinding himself down on Eddie's leg": rubbing on someone, not a solo act.
      if (/^mast-himself/.test(pat.id) && /\b(?:grind\w*|rutt?\w*|hump\w*|rubb?\w*|rock\w*)\s+himself\s+(?:down\s+)?(?:on|against|into|onto)\s+(?:\w+['’]s|him|her|his)\b/i.test(matchText + sent.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 40))) return;
    }
    // "if only Hank could find the courage, buried deep inside him": a feeling is what is buried, not a cock.
    if (pat.elided && /^(?:push-into|pushed-in|inside|buried|lodged)/.test(pat.id) && /\b(?:courage|feelings?|fears?|desires?|love|hope|truth|doubts?|secrets?|pain|grief|guilt|anger|shame|memories|memory|resentment|longing|worry|worries|panic|regret|loneliness|joy|rage|ache|nerve|bravery|confidence|strength|part of (?:him|himself|her|herself))\b[\s,—–-]*$/i.test(sent.slice(0, m.index))) return;
    // "He watches Anakin lean over and pluck the photograph": bending for an object, not presenting.
    if (pat.id.startsWith("ogle-bend-over") && /\b(?:lean\w*|bend\w*|bent|stoop\w*)\s+(?:over\s+)?and\s+(?:pluck|pick|grab|take|retrieve|snatch|fetch|scoop|lift)\w*\b|\b(?:pluck|pick)\w*\s+(?:up\s+)?(?:the|a|his|her)\s+(?:photograph|photo|picture|file|folder|paper|papers|map|book|pen|mug|cup|plate|phone|letter|envelope|document)\b/i.test(sent.slice(m.index!))) return;
    // "forcing him to arch back into Kenobi's chest": leaning into a chest or shoulder is closeness, not pushing back onto a cock.
    if (/^(?:thrust-back|arch-back|push-back)/.test(pat.id) && /\b(?:back|backs?)\s+(?:in|into|against|onto)\s+(?:[\w'’-]+['’]s|his|her|their|the)\s+(?:chest|shoulders?|arms?|embrace|touch|hold|neck)\b/i.test(sent.slice(m.index!))) return;
    // "clearing his throat of the residual soreness from deepthroating": a bodily sign afterwards, not the act.
    if (pat.cat === "oral" && /\b(?:sore|soreness|hoarse|raw|ache|aches|aching|tender|scratchy)\b[^.!?]{0,40}\b(?:from|after|of)\s+(?:the\s+)?(?:deep-?throat|suck|blow|swallow|gagg|choking|chok)\w*/i.test(sent.slice(Math.max(0, m.index! - 70), m.index! + m[0].length))) return;
    // "swept his tongue inside of him" with a bare pronoun or name, while mouths are kissing: a kiss, not rimming.
    if (pat.id === "tongue-inside-him" && !/\b(?:ass|arse|hole|rim|crack|cheeks|entrance|pucker|cavity|opening)\b/i.test(matchText) &&
      /\b(?:mouths?|lips|kiss\w*|tongues?\s+(?:to|with)|suck\w*\s+on\s+[\w'’]+\s+tongue|against\s+(?:the|his|her)\s+\w+)\b/i.test(para)) return;
    // "…parted his lips, allowing Dunk's tongue to slip inside": a tongue in a kiss.
    if (pat.id.startsWith("pushed-in") && /\btongues?\b/i.test(sent.slice(0, m.index! + m[0].length)) && /\b(?:lips|mouths?|kiss\w*)\b/i.test(sent) && !ANAL_CTX.test(sent) && !PENIS_CTX.test(sent) && !FINGER_CTX.test(sent)) return;
    // A bare "as he sank in" (into a hug, a bath) needs a cock, an ass or fingers somewhere in the paragraph.
    if (pat.id.startsWith("pushed-in") && !/\b(?:thrust|fuck|rut|snap|pound|slam)/i.test(matchText)) {
      if (![pi - 2, pi - 1, pi, pi + 1].some(bodyContext)) return;
    }
    // "opened the car door and slipped inside": a place, not a person.
    if (pat.id.startsWith("pushed-in") && /\b(?:door|car|truck|van|cab|taxi|room|house|building|shop|store|bar|elevator|lift|tent|cabin|Impala|apartment|office|kitchen|bathroom)\b/.test(sent.slice(0, m.index))) return;
    // "…slipped in just before the doors closed"
    if (pat.id.startsWith("pushed-in") && /\b(?:doors?|elevator|lift|train|bus|subway|tube|taxi|cab|car)\b/i.test(sent) && !ANAL_CTX.test(sent) && !PENIS_CTX.test(sent)) return;
    // "He hollowed his cheeks, creating a suction for Cas": the one named after "for" is getting sucked.
    // "They were so screwed", "He was fucked": the idiom, unless a person does it ("by Dean"), it says how, or the
    // sentence has anatomy or a sex word.
    // "…after having sex with other rich men, but Laurent wakes to clean himself before they bend him over again":
    // "they" are those other men, not a character, and the one done to is the sentence's subject. Past experience.
    if (pat.subj === "t" && /^they$/i.test(tTok ?? "") && cat !== "vaginal" &&
        /\b(?:other|older|rich|some|many|several|those|these|previous|different)\s+(?:[\w-]+\s+){0,2}(?:men|guys|people|clients|patrons|daddies|boys|women|girls|exes|lovers|strangers|partners|dates)\b/i.test(sent.slice(0, m.index!))) {
      const victim = firstEntity(sent.slice(0, m.index!)) ?? ctx.lastSubject;
      const other = victim && ctx.partnerOf(victim);
      if (victim && other) addHistory(cat, act, victim, "bottom", other, original, pi);
      return;
    }
    // "takes all of Laurent inside him" / "fits inside him" with a mouth earlier in the sentence: that's oral, not anal.
    if (cat === "anal" && /\binside (?:of )?(?:him|her|them|me)$/i.test(matchText) && !/\b(?:thrust\w*|fuck\w*|rut\w*|pound\w*|slam\w*|snap\w*|driv\w*)\b/i.test(matchText) &&
        ORAL_LINE_RE.test(sent.slice(0, m.index! + m[0].length)) && !ANAL_CTX.test(sent.slice(0, m.index! + m[0].length)) && !FINGER_CTX.test(sent.slice(0, m.index! + m[0].length))) return;
    // "fucked open by older men": the one doing it is named, and isn't a character.
    // It isn't an act between these two, but it says the one fucked has been fucked, which points at bottoming.
    if (pat.id.startsWith("passive-fucked") && !/\bby\b/.test(matchText) && /^\s+(?:\w+\s+){0,4}?by\s+(?!(?:him|her|them|me|you|it)\b)(?!this\s+(?:[\w-]+\s+){0,2}?(?:man|guy|lad|boy|one|beautiful|gorgeous)\b)(?!the same\b)/i.test(sent.slice(m.index! + m[0].length))) {
      addHistory(cat, act, bottom, "bottom", top, original, pi);
      return;
    }
    // "a really old guy he dated while going down on him": "him" is the guy in the relative clause, not a character.
    if (/^(?:him|her|them)$/i.test(tTok ?? "") || /^(?:him|her|them)$/i.test(bTok ?? "")) {
      const pre = sent.slice(0, m.index! + m[0].length);
      const np = [...pre.matchAll(/\b(?:a|an|some|this|that|one|another)\s+(?:[\w-]+\s+){0,3}(?:guy|man|men|dude|ex|boyfriend|girlfriend|lover|client|stranger|woman|girl|bloke|fellow|sugar daddy|daddy|patron|date|customer)\b/gi)].pop();
      // The relative clause follows the noun directly ("a guy he dated while…"); "this man and as he rides him" is the partner in front of him.
      // "mated to a man he laughs with, … who likes to fuck him": the man is the partner (mated to, married to), not an ex.
      const ofPartner = !!np && /\b(?:mated|married|bonded|engaged|committed|paired|together|living|dating|involved|partnered|wed|life|lives)\s+(?:to|with)\s+$/i.test(pre.slice(0, np.index!));
      if (ofPartner && /^\s*,?\s*(?:(?:that|whom|who)\s+)?(?:he|she|they|who|that|whom)\b/i.test(pre.slice(np!.index! + np![0].length))) return;
      if (np && !ofPartner && !/^this\b/i.test(np[0]) && !nameRe.test(pre.slice(np.index! + np[0].length)) && /^\s*,?\s*(?:(?:that|whom|who)\s+)?(?:he|she|they|who|that|whom)\b/i.test(pre.slice(np.index! + np[0].length))) {
        // "he let a man he'd only met two hours before fuck him": the man does it to the one who let him, so the sentence's subject is the bottom.
        if (/\b(?:let|lets|letting|allow|allows|allowed|had|made|make|watched|helped)\s+$/i.test(pre.slice(0, np.index!)) && /\b(?:fuck|fucks|fucked|screw|screwed|pound|pounded|take|took|bang|banged|blow|suck|sucked|top|topped|ravish|use|used)\b/i.test(pre.slice(np.index! + np[0].length)) && pat.subj === "t") {
          addHistory(cat, act, top, "bottom", bottom, original, pi);
          return;
        }
        // Past experience with someone else: the actor's own role is what it points at.
        if (pat.subj === "t") addHistory(cat, act, top, "top", bottom, original, pi);
        else addHistory(cat, act, bottom, "bottom", top, original, pi);
        return;
      }
    }
    // "from being blown out by a hurricane", "blown away", "blow up": blowing, not a blowjob.
    if (cat === "oral" && /\bblo(?:w|wn|wing|ws|n)\s*$/i.test(matchText.replace(/\s+(?:out|away|up|over|off course)\b.*$/i, "")) && /^\s*(?:out|away|up|over|off course)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "He bites Laurent's neck and sucks harder": a mark on the skin, not a blowjob.
    if (pat.id.startsWith("sucked-harder") && /\b(?:neck|skin|collarbone|jaw|lips?|nipples?|earlobe|ears?|shoulders?|bruise|hickey|mark|thumb|fingers?|chest|throat's|pulse)\b/i.test(sent)) return;
    // "they worshipped him": worship needs a penis in the match to be oral.
    if (cat === "oral" && /\bworship/i.test(matchText) && !PENIS_CTX.test(matchText)) return;
    // "the shadows are going to swallow him whole": only a cock (or a penis word nearby) makes it oral.
    if (pat.id.startsWith("swallowed-down") && /\bwhole\b/i.test(matchText) && !PENIS_CTX.test(sent)) return;
    // "he topped a lot like how he bottomed": a comparison, not an act.
    if ((pat.id.startsWith("topped") || pat.id.startsWith("bottomed-for")) && /\b(?:how|like|than|as)\s+$/i.test(sent.slice(0, m.index))) return;
    // "Shane slipped inside and sat on the edge of the bed": entering a room, not penetration.
    if (pat.id.startsWith("pushed-in") && /^\s*,?\s*(?:and\s+)?(?:then\s+)?(?:sat|stood|closed|shut|locked|walked|went|looked|waited|crossed|leaned|turned|stepped|paused|dropped|collapsed|hung|stopped|froze|glanced|checked|set|put|placed|kicked|tossed|threw|flicked)\b/i.test(sent.slice(m.index! + m[0].length))) return;
    // "…tried to find his prostate" right after he fingered himself: the same solo act, not the partner's.
    if (pat.id.startsWith("prostate") && (!tTok || /^(?:he|she|they)$/i.test(tTok)) && /^(?:his|her|their)$/i.test(bTok ?? "")) {
      const at = para.indexOf(sent);
      const before = (at > 0 ? para.slice(Math.max(0, at - 300), at) : paras[pi - 1] ?? "").slice(-300);
      if (/\b(?:inside|into|in|stretch\w*|prepp?\w*|finger\w*|open\w*)\s+(?:\w+\s+){0,3}?(?:himself|herself|themselves|myself)\b/i.test(before)) return;
    }
    // "the skin he had slipped in": a relative clause about a thing, not penetration.
    if (pat.id.startsWith("pushed-in") && /\b(?:the|a|that|this|those|these)\s+[\w-]+\s+(?:that\s+)?(?:he|she|they|I)\s+(?:had\s+|'d\s+)?$/i.test(sent.slice(0, m.index! + (matchText.search(/\b(?:slip|slid|sank|push|sunk)/i) > 0 ? matchText.search(/\b(?:slip|slid|sank|push|sunk)/i) : 0))) && !ANAL_CTX.test(sent) && !PENIS_CTX.test(sent)) return;
    // "his chained wrists … until they were stretched taut": things being stretched or filled, not a person.
    if (pat.id.startsWith("passive-fucked") && /\b(?:stretched|filled)\s*$/i.test(matchText) &&
        (/^(?:they|it|them)$/i.test(bTok ?? "") || /^\s*(?:taut|tight|thin|out|across|between|over|above|along|with (?:water|blood|light|dread|pride|joy))\b/i.test(sent.slice(m.index! + m[0].length)))) return;
    if (pat.id.startsWith("passive-fucked") && /\b(?:fucked|screwed)\b/i.test(matchText) && !/\bby\b/.test(matchText) && !IDIOM_SAFE.test(sent)) return;
    // "mimicking the way Steve had hollowed his cheeks" (smoking), "the straw", "a drag": cheeks hollowed for something else.
    if (pat.id.startsWith("hollowed-cheeks") && /\b(?:cigarettes?|smok\w*|vap\w*|drag|puff\w*|inhal\w*|exhal\w*|joint|blunt|pipe|straw|whistl\w*|fish face|kiss\w*|pout\w*|smoke)\b/i.test(para + " " + (paras[pi - 1] ?? "") + " " + (paras[pi + 1] ?? ""))) return;
    // "sucked him into the drain", "sucking Steve back into reality": not a mouth.
    if (/^sucked/.test(pat.id) && /^\s*(?:back\s+)?(?:into|out of|under|down the)\s+(?!(?:his|her|their|my|your)\s+(?:mouth|throat|lips)\b)/i.test(sent.slice(m.index! + m[0].length))) return;
    // "(the shower) was about to open up and suck him into the drain" (the match ends at "him"; the tail is a place)
    if (pat.id.startsWith("hollowed-cheeks")) {
      const forName = new RegExp(`^[^.;]{0,40}?\\bfor\\s+(${NAMES})\\b`).exec(sent.slice(m.index! + matchText.length));
      const named = forName ? cast.byAlias.get(forName[1]) : undefined;
      if (named && named !== top) {
        top = named;
        if (bottom === named) bottom = ctx.partnerOf(named) ?? bottom;
      }
    }
    // "…slipping inch by inch, until Alex finally bottoms": he bottomed out, so he's the top.
    if (pat.id.startsWith("bottomed-for") && !/\bfor\b/.test(matchText) && /\b(?:finally|fully|all the way)\s+bottom/.test(matchText + " " + sent) && /\b(?:inch|slid|slip|push|sank|sink|thrust|sheath|buri|bury|eas)/i.test(sent)) {
      [top, bottom] = [bottom, top];
    }
    // "Harry wraps a hand around Louis's cock and guides the tip into his mouth": the cock named earlier is
    // the one in the mouth, so its owner tops and the one guiding it bottoms.
    if (pat.id.startsWith("cock-to-lips") && !/['’]s\s+(?:[\w-]+\s+){0,2}(?:cock|dick|prick|length|shaft|erection)\b/.test(matchText)) {
      const owner = new RegExp(`\\b(${NAMES})['’]s\\s+(?:[\\w-]+\\s+){0,2}(?:cock|dick|prick|length|shaft|erection)\\b`).exec(sent.slice(0, m.index));
      const oc = owner ? cast.byAlias.get(owner[1]) : undefined;
      if (oc && oc !== top) [top, bottom] = [oc, top];
    }
    if(basePid==="review-takes-second-time" && !acts.some(a=>a.cat==="anal" && a.act==="anal sex" && a.top===top && a.bottom===bottom && a.para>=pi-12)) return;
    // Adult synthetic: Rowan uses a mouth, Morgan reacts, then the tongue action continues.
    // Speech/reactions do not take ownership of an explicitly established mouth action.
    if (!pat.signal && cat === "oral" && oralKindOf(act)==="blowjob" &&
        /^(?:dd-laps-at-cock|dd-takes-into-mouth|dd-tongue-laves-length|tongue-around-head)$/.test(basePid) &&
        (!bTok || PRONOUN_ONLY.test(bTok))) {
      const at=Math.max(0,para.indexOf(original));
      const before=para.slice(Math.max(0,at-500),at)+" "+sent.slice(0,m.index!);
      const mouthOwner=new RegExp(`\\b(${NAMES})\\s+(?:\\w+ly\\s+)?(?:wrap\\w*\\s+(?:his|her|their)\\s+lips|(?:dip|lower)\\w*\\s+(?:his|her|their)\\s+head|(?:take|takes|took|taking)\\b[^.!?]{0,70}\\b(?:mouth|lips))`,"g");
      const owner=[...before.matchAll(mouthOwner)].pop();
      const named=owner?.[1] ?? namedActionOwner(before,NAMES);
      const performer=named && cast.byAlias.get(named);
      const previous=acts.filter(a=>a.para===pi && a.cat==="oral" && oralKindOf(a.act)==="blowjob" && a.basis==="named").pop();
      const carried=performer ?? (previous && /\b(?:tongue|shaft|head|mouth)\b/i.test(matchText) ? previous.bottom : undefined);
      if(carried && (carried===top || carried===bottom)) {
        const recipient=carried===top?bottom:top;
        top=recipient;bottom=carried;
      }
    }
    // Adult synthetic: licking before pushing past a rim continues the tongue action, not a new penile act.
    if (cat === "anal" && act.startsWith("anal sex") && /^(?:push-into|pushed-in)$/.test(basePid) &&
        /\blick\w*\s+(?:[\w-]+\s+){0,2}before\s+push\w*/i.test(sent.slice(0,m.index!) + matchText) && !PENIS_CTX.test(matchText)) {cat="oral";act="rimming";}
    // Adult synthetic: Morgan eases in a finger while receiving oral stimulation, then pushes it deeper.
    // The cock in the mouth must not overwrite explicit finger evidence earlier in this paragraph.
    if (cat === "anal" && act.startsWith("anal sex") && basePid === "pushed-in" && !PENIS_CTX.test(matchText) &&
        /\b(?:push|pushing)\s+in\b/i.test(matchText) && /\b(?:eas|insert|slip|slid|push)\w*\s+(?:a|one|his|her|their)\s+finger\s+(?:into|in|inside)\b/i.test(para.slice(0,para.indexOf(original)))) act="fingering";
    // Adult synthetic: a prostate tap during finger preparation stays fingering until a new penetrative act is established.
    if (basePid === "prostate" && !PENIS_CTX.test(para)) {
      const previous = acts.filter(a=>a.top===top && a.bottom===bottom && a.para>=pi-3 && a.para<pi && (a.act==="fingering" || a.act.startsWith("anal sex"))).pop();
      if (previous?.act === "fingering") act="fingering";
    }
    // "…when a second finger began pushing into him": fingers named in the sentence (and no cock) mean fingering.
    // Fingers busy elsewhere ("his fingers tangling in Alex's curls") don't make it fingering.
    const fingerSent = sent.replace(/\bas\s+(?:he|she|they)\s+finger\w*\s+(?:himself|herself|themselves)\b[^.!?]*/gi, "").replace(/\b(?:fingers?|fingertips?|digits?|knuckles?)\b[^,.;]{0,40}?\b(?:hair|curls|locks|sheets?|pillows?|shoulders?|back|neck|jaw|cheeks?|face|scalp|nape|arms?|biceps?|hands?|chest|headboard|blankets?)\b/gi, "");
    // "opened him up with two fingers, then fucked him": the fingers belong to the clause before; the fucking is a new clause.
    const fingersBeforeOnly = FINGER_CTX.test(sent.slice(0, m.index!)) && !FINGER_CTX.test(matchText + " " + sent.slice(m.index! + matchText.length)) &&
      /[,;]|\b(?:then|and then)\b/.test(sent.slice(Math.max(0, m.index! - 14), m.index!) + matchText.slice(0, 12)) && /\b(?:fuck|pound|rail|bang|plow|plough|screw|breed|took|take)\w*/i.test(matchText);
    if (cat === "anal" && pat.id !== "worked-open-pushed-in" && act.startsWith("anal sex") && !PENIS_CTX.test(matchText) && FINGER_CTX.test(matchText + " " + fingerSent) && !PENIS_CTX.test(sent) && !fingersBeforeOnly) act = "fingering";
    if (pat.id === "prostate" && FINGER_CTX.test(sent) && !PENIS_CTX.test(sent)) act = "fingering";

    // Adult synthetic: a lubricated thumb or plug keeps its identity through a bare insertion clause.
    // Explicit instruments in the match win; this refinement never changes hints.
    if (!pat.signal && cat === "anal" && act.startsWith("anal sex") &&
        /^(?:push-into|pushed-in|bottomed-out|came-inside|prostate)$/.test(basePid) &&
        !(PENIS_CTX.test(para) && !/\b(?:mouth|lips|tongue|finger|thumb|dildo|toy|plug)\b/i.test(para))) {
      const at = Math.max(0,para.indexOf(original));
      const preceding=paras.slice(Math.max(0,pi-1),pi);
      const boundary=preceding.reduce((last,p,i)=>SCENE_BREAK.test(p)||CHAPTER_RE.test(p)?i:last,-1);
      const prior = [...preceding.slice(boundary+1),para.slice(0,at),sent.slice(0,m.index!)].join(" ");
      const trailing=sent.slice(m.index!+matchText.length);
      const instrument=continuationInstrument(matchText,"",trailing) ??
        (!PENIS_CTX.test(para) ? continuationInstrument(matchText,prior,trailing) : undefined);
      const following=paras.slice(pi+1,pi+3);
      const confirmedFinger=!instrument && !PENIS_CTX.test(para) && following.some(p=>/^\s*(?:one|two|three|\d+)\s+fingers?\s+(?:in|inside)\b/i.test(p));
      if(instrument==="finger" || confirmedFinger) act="fingering";
      else if(instrument==="toy") act="anal sex (strap-on/toy)";
      else if(instrument==="tongue" && ANAL_CTX.test(prior+matchText)) {cat="oral";act="rimming";}
    }

    // Adult synthetic: a named inserter keeps the action when a restrained receiver reacts.
    if (!pat.signal && act==="fingering" && basePid==="dd2-finger-shoved-into" && (!tTok || PRONOUN_ONLY.test(tTok))) {
      const at=Math.max(0,para.indexOf(original));
      const before=para.slice(Math.max(0,at-500),at)+" "+sent.slice(0,m.index!);
      const alias=namedActionOwner(before,NAMES);
      const performer=alias && cast.byAlias.get(alias);
      if(performer && performer===bottom && !/\b(?:himself|herself|themselves|own)\b/i.test(matchText)) [top,bottom]=[bottom,top];
    }

    // Adult synthetic: an anus grips inserted fingers; figurative sucking is not oral sex.
    if(!pat.signal && basePid==="sucked" && /\b(?:hole|anus|ass|arse)\b/i.test(sent.slice(Math.max(0,m.index!-45),m.index!+m[0].length)) &&
       /\bfingers?\b/i.test(sent.slice(m.index!,m.index!+m[0].length+90))) {
      const fingerOwner=new RegExp(`\\b(${NAMES})['’]s\\s+(?:\\w+\\s+){0,2}fingers?\\b`).exec(sent);
      const performer=fingerOwner && cast.byAlias.get(fingerOwner[1]);
      const receiver=performer===top?bottom:top;
      if(performer && performer!==receiver) {top=performer;bottom=receiver;cat="anal";act="fingering";}
      else return;
    }
    // Adult synthetic: two penises rubbing together is frottage, not a manually performed act.
    if(pat.signal?.kind==="handjob" && basePid==="hj-stroke" &&
       /\b(?:cock|dick)\s+against\b|\bcocks\s+aligning\b/i.test(sent)) act="frottage";
    // Adult synthetic: a self-grasp explicitly interrupted by the partner does not establish a handjob.
    if(pat.signal?.kind==="handjob" && /\bgrab\w*\b/i.test(matchText) &&
       /\b(?:smack|slap|bat|push)\w*\s+(?:his|her|their)\s+hand\s+away\b/i.test(after)) return;

    // Adult synthetic: a receiver's body is raised for the established penetrating person's movement.
    if(!pat.signal && basePid==="push-into" && cat==="anal" &&
       /\b(?:splayed open|raised)\b[^.!?]{0,120}\bfor\b/i.test(sent.slice(0,m.index!))) {
      const previous=acts.filter(a=>a.para===pi && a.cat==="anal" && a.act.startsWith("anal sex") &&
        a.top===bottom && a.bottom===top).pop();
      if(previous) [top,bottom]=[bottom,top];
    }
    // Hints, not acts: checking out an ass, grabbing it, staring at a bulge...
    if (pat.signal) {
      const prefix = sent.slice(0, m.index);
      // "…with the way his hole flutters": a body sign with a pronoun owner, in a scene where that person has just been the one doing it to the
      // other, belongs to the other one, whose hole it is.
      if (pat.signal.kind === "body" && cat === "anal" && basis !== "named") {
        const recentB = acts.filter((a) => a.cat === "anal" && a.para >= pi - 6 && a.para <= pi && a.weight >= 0.2);
        // Or in the words just before: the owner is the one who "sinks his finger in", "slides his cock into" the other.
        const doing = (c: Character) => new RegExp(`\\b(?:${c.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b[^.!?]{0,60}\\b(?:sinks?|slides?|slid|pushes?|pushed|presses?|pressed|works?|worked|slips?|slipped|thrusts?|fucks?|fucked|plunges?)\\b[^.!?]{0,25}\\b(?:finger|fingers|cock|prick|tongue|digits?)\\b`, "i");
        const before3 = paras.slice(Math.max(0, pi - 3), pi + 1).join(" ");
        const ownerDoes = doing(bottom).test(before3) && !doing(top).test(before3);
        if ((recentB.some((a) => a.top === bottom && a.bottom === top) && !recentB.some((a) => a.top === top && a.bottom === bottom)) || ownerDoes) [top, bottom] = [bottom, top];
      }
      if (NEG.test(m.groups?.aux ?? "") || NEG.test(prefix.slice(-40))) return;
      // Hands-free orgasm: "Rowan came untouched" says who receives only when something is happening to Rowan's ass. A wish ("wanted to
      // come untouched", "imagined making him come hands-free") is not an orgasm, and "came on Morgan's cock" needs "just" or "alone".
      if (act === "hands-free orgasm" || act === "prostate orgasm") {
        if (HYPO_AUX.test(m.groups?.aux ?? "") || /\b(?:want\w*|wanna|wish\w*|long\w*|need\w*|tri(?:ed|es)|try|can|must|able)\b/i.test(m.groups?.aux ?? "")) return;
        if (/\b(?:want\w*|wish\w*|imagin\w*|fantas\w*|dream\w*|pictur\w*|thought\s+(?:about|of)|think\w*\s+(?:about|of)|if|unless|whether|promis\w*|tried|try|trying|could|would|ever\s+been\s+able)\b[^.!?]*$/i.test(prefix.slice(-80))) return;
        if (basePid === "came-from-partner-alone" && !m.groups?.hfOnly && !m.groups?.hfAlone) return;
        if (act === "hands-free orgasm") {
          const near = `${paras[pi - 1] ?? ""} ${para}`;
          const penetration = /\b(?:fuck(?:ed|ing|s)?|inside\s+(?:him|her|them|me)|thrust\w*|knot\w*|pound\w*|buried|filled|fingered|fingering)\b/i;
          if (!ANAL_CTX.test(near) && !(penetration.test(near) && !VULVA_CTX.test(near))) return;
        }
      }
      if (pat.signal.kind === "fingers" && /\bown\b/i.test(matchText)) return;
      // "resisted the urge to shove a hand down his pants": an urge about his own body, not a touch of the partner.
      if ((pat.id.startsWith("hand-in-pants") || pat.id.startsWith("hj-hand-in-pants")) && /\b(?:urge|temptation|tempted|resist\w*|fought|fighting)\b[^.!?]*$/i.test(prefix)) return;
      // A wish, a plan or an attempt isn't a solo act: "wanted to touch himself", "if he jerked off", "tried not to masturbate".
      if ((pat.signal.kind === "masturbation" || pat.signal.kind === "handjob") && (HYPO_AUX.test(m.groups?.aux ?? "") || /\b(?:want\w*|wish\w*|imagin\w*|fantasi[sz]\w*|thought\s+about|think\w*\s+about|if|unless|would|could|might|should|gonna|going\s+to|tempted|temptation|urge|tried|trying|try|attempt\w*|needed|need|about\s+to|stop\w*|refus\w*|without|keep\s+from|kept\s+from|resist\w*|difficult|struggl\w*|held\s+back|hold\s+back|almost|nearly)\b[^.!?]{0,40}$/i.test(prefix.slice(-60) + " " + (m.groups?.aux ?? "") + " " + m[0].slice(0, 25)) || /\b(?:if|unless|whenever|in case)\b[^,;]*$/i.test(prefix + m[0].slice(0, 12)))) return;
      // Blushing and stammering say something about the pair only when the other one is right there.
      if (pat.id.startsWith("flustered")) {
        const at = para.indexOf(sent);
        const prevSent = (at > 0 ? para.slice(Math.max(0, at - 240), at) : "").trim().split(/(?<=[.!?”])\s+/).pop() ?? "";
        const partner = ctx.partnerOf(bottom);
        const re = partner ? new RegExp(`\\b${partner.name.split(" ")[0]}\\b|\\b(?:${partner.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i") : undefined;
        if (!re || !(re.test(sent) || re.test(prevSent))) return;
      }
      // “He stroked his cock” could be his own: a handjob needs the partner in the sentence or the one before, and the
      // one before mustn't be a thought about them.
      if (pat.signal.kind === "handjob" && /^(?:his|her|their)$/i.test(bTok ?? "") && !pat.id.includes("both") && pat.id !== "frottage") {
        const at = para.indexOf(sent);
        const prevSent = (at > 0 ? para.slice(Math.max(0, at - 240), at) : "").trim().split(/(?<=[.!?”])\s+/).pop() ?? "";
        const other = ctx.partnerOf(top);
        const mentions = (txt: string) => new RegExp(`\\b(?:${NAMES})\\b|\\b(?:him|her|them)\\b`, "i").test(txt);
        const inSentence = (other ? new RegExp(`\\b${other.name.split(" ")[0]}\\b`, "i").test(sent) : false) || /\b(?:him|her)\b/i.test(sent);
        const prevOk = mentions(prevSent) && !/\b(?:thought|thinking|imagin\w*|pictur\w*|fantasi[sz]\w*|remember\w*|dream\w*|wonder\w*|alone)\b/i.test(prevSent);
        if (!inSentence && !prevOk) return;
      }
      // “Cas touched himself” is solo, but “Cas touched Dean, who was jerking himself off” has two people in it: only the subject counts.

      // "licking a couple fingers and pushing them in together": wetting his own fingers to open someone up, not being sucked on.
      if (pat.id === "suck-fingers" && /^[^.!?]{0,60}?\b(?:push|press|slid|slip|work|insert|sink|guid|ease)\w*\s+(?:them|it)\s+(?:in|into|inside)\b/i.test(after)) return;
      if (pat.signal.kind === "fingers" && /\bwhistl\w*/i.test(sent)) return;
      if (cat === "oral" && oralKindOf(act) === "blowjob" && top.penis === false && bottom.penis === false && !/\b(?:cock|dick|penis)\b/i.test(para)) return;
      // Fights, torture and rescues: shoving, gripping, lifting and shielding aren't dominance when they come with danger
      // and no sexual words, and a plural "they" is a group, not the partner.
      if (cat === "vibe" && (pat.signal.kind === "behavior" || pat.signal.kind === "position")) {
        // Dancing and family hugs aren't dominance: "took the lead, guiding Cas in a box step", "tucked his head into his brother's chest".
        if (/\b(?:danc\w*|waltz\w*|box step|tango|foxtrot)\b|\b(?:brother|sister|father|mother|mom|son|daughter|uncle|aunt|grandma|grandpa)\b/i.test(original)) return;
        if (/^they$/i.test(tTok ?? "") || /^(?:the|a)\s+(?:man|guy|dude|stranger|bastard|cop|officer)$/i.test(tTok ?? "")) return;
        const recent = original + " " + (paras[pi] ?? "").slice(Math.max(0, (paras[pi] ?? "").indexOf(original) - 200), (paras[pi] ?? "").indexOf(original));
        if (DANGER.test(recent) && (recent.match(SEX_STRICT) ?? []).length === 0) return;
      }
      // Behaviour hints need two people: "pressing them into his chest" (knees) and "grabbed his opposite wrist" are not.
      if (cat === "vibe" && (/^(?:them|it)$/i.test(bTok ?? "") || /^(?:them|it)$/i.test(tTok ?? "") || /\b(?:own|opposite|other)\s+(?:wrist|hand|chin|hair|neck)/i.test(matchText))) return;
      // Adult synthetic: Morgan leaves while Rowan's sounds accompany Rowan rocking in a cage.
      if(pat.signal.kind==="masturbation" && (!subjTok || PRONOUN_ONLY.test(subjTok))) {
        const sounds=new RegExp(`\\b(?:sounds?|noises?)\\s+(${NAMES})(?:['’]s|\\s+is)\\s+making\\s+as\\s+(?:(?:he|she|they)\\s+)?$`,"i").exec(sent.slice(0,m.index!));
        const subject=sounds && cast.byAlias.get(sounds[1]);
        if(subject) {if((pat.signal.actor ?? pat.subj)==="t") top=subject;else bottom=subject;}
      }
      if(pat.signal.kind==="masturbation") {
        const command=new RegExp(`\\b(?:orders?|ordered|asks?|asked|tells?|told)\\s+(${NAMES})\\s+to\\s*$`,"i").exec(sent.slice(0,m.index!));
        const subject=command && cast.byAlias.get(command[1]);
        if(subject) {if((pat.signal.actor ?? pat.subj)==="t") top=subject;else bottom=subject;}
      }
      const actor = (pat.signal.actor ?? pat.subj) === "t" ? top : bottom;
      if(pat.signal.kind==="solo" && act==="fingering himself") {
        const target=holeType(matchText,sent,para,actor,actor);
        cat=target==="ambiguous"?"vibe":target;
      }
      const signalKind = penisButtockContact ? "touch" : pat.signal.kind;
      if(penisButtockContact){
        const priorContact=desires.findIndex(d=>d.sentence===original && d.act===PENIS_BUTTOCK_CONTACT &&
          (d.who===top && d.partner===bottom || d.who===bottom && d.partner===top));
        // Keep the existing action hint's actor and provenance when it replaces a broad penetration-rule fallback.
        if(priorContact>=0){if(/^(?:penis-against|press-cock-against|hole-around)(?:~|$)/.test(desires[priorContact].via ?? ""))desires.splice(priorContact,1);else return;}
      }
      if (desires.some((d) => d.sentence === original && d.cat === cat && d.kind === signalKind && d.who === actor)) return;
      const other = actor === top ? bottom : top;
      desires.push({
        via: pat.id,
        feat,
        attribution,
        cat,
        act,
        who: actor,
        partner: other,
        role: pat.signal.actorRole,
        wants: true,
        kind: occurrence==="history" || occurrence==="recording" ? "history" : occurrence==="habitual" ? "identity" : occurrence ?? (contactConditional ? "hypothetical" : signalKind),
        weight,
        para: pi,
        sentence: original,
        reflexive: pat.signal.kind === "solo" && REFLEXIVE.test(matchText) ? true : undefined,
        basis,
      });
      return;
    }

    // Adult synthetic: an imagined penis entering opened lips is oral, regardless of the generic insertion pattern.
    if(!pat.signal && cat==="anal" && act.startsWith("anal sex") && !ANAL_CTX.test(sent) &&
       /\b(?:idea|imagining|picture)\b/i.test(sent.slice(0,m.index!)) &&
       /\b(?:open\w*|part\w*)\b[^.!?]{0,50}\blips\b/i.test(sent.slice(Math.max(0,m.index!-180),m.index!)) && PENIS_CTX.test(matchText)) {cat="oral";act="blowjob (face-fucking)";}
    // "thrust forward into Eddie, who moaned as Steve hit the back of his throat": a mouth, not an ass.
    if (cat === "anal" && /\b(?:throat|mouth)\b/i.test(sent) && !ANAL_CTX.test(sent) && !FINGER_CTX.test(sent) && !/\b(?:could swear|swear|felt like|feels like|feeling like|as if|as though|kiss\w*|lips?|nips?|nibbl\w*|tongue)\b/i.test(sent) &&
        (/\b(?:back of (?:his|her|their) throat|down (?:his|her|their) throat|in(?:to)? (?:his|her|their|\w+['’]s) mouth)\b/i.test(sent) || /\b(?:cock|dick|length)\b[^.!?]{0,20}\bin(?:to)? (?:his|her|their) throat\b/i.test(sent))) {
      cat = "oral";
      act = "blowjob (face-fucking)";
    }
    // "Open up." Dean opened his mouth and Cas easily slid inside": into a mouth, so a blowjob, not an anal scene.
    if (cat === "anal" && /^(?:pushed-in|push-into|slid|penis-inside|bottomed-out)/.test(pat.id) && !ANAL_CTX.test(sent) && !FINGER_CTX.test(sent) &&
        (/\b(?:open(?:ed|s|ing)?|part(?:ed|s|ing)?)\s+(?:up\s+)?(?:his|her|their|wide|your)?\s*(?:mouth|lips|jaw)\b/i.test(sent.slice(0, m.index! + m[0].length)) || (/\bopen up\b/i.test(para) && /\b(?:mouth|lips|throat)\b/i.test(`${paras[pi - 1] ?? ""} ${para}`)))) {
      cat = "oral";
      act = "blowjob (face-fucking)";
    }
    // "made wet, filthy sounds around him … as he emptied into him": the sounds are a mouth around a cock, so a blowjob.
    if (cat === "anal" && /^(?:came-inside|bottomed-out|push-into|fuck)/.test(pat.id) && !ANAL_CTX.test(sent) && !FINGER_CTX.test(sent) &&
        /\b(?:sounds?|noises?|gagg\w*|chok\w*|slurp\w*|swallow\w*|suck\w*|sloppy|messy|wet)\b[^.!?]{0,30}\baround\s+(?:him|it|his|her|their)\b/i.test(sent)) {
      cat = "oral";
      act = "blowjob";
    }
    // Anal or vaginal? Decided by the words used (male omegas and trans men can have vaginas),
    // falling back to anatomy when the text doesn't say.
    // "Shannon rides him … Buck could fuck him like this": a woman riding is vaginal unless an ass or hole is named.
    if (cat === "anal" && /riding/.test(act) && bottom.vulva === true && bottom.penis !== true && top.penis !== false && !/\b(?:ass|arse|hole|anal|butt)\b/i.test(sent)) {
      cat = "vaginal";
      act = "vaginal sex (riding)";
    }
    let holeGuess: ActHit["holeGuess"];
    if (cat === "anal" || cat === "vaginal") {
      const hole = holeType(matchText, sent, para, top, bottom);
      const said = holeType(matchText, sent, "", top, bottom, true);
      // A man who may have a vagina, and the sentence doesn't say: decide from how his other scenes went.
      if (cat === "anal" && said === "ambiguous" && bottom.gender !== "f" && bottom.vulva !== false && cast.maleVulva) holeGuess = hole;
      else if (said !== "ambiguous") {
        const v = holeVotes.get(bottom) ?? { anal: 0, vaginal: 0 };
        v[said]++;
        holeVotes.set(bottom, v);
      }
      if (cat === "vaginal") {
        // "Had sex"/"made love": only vaginal if someone involved has a vagina and nothing says anal.
        const canVaginal = top.vulva !== false || bottom.vulva !== false;
        if (!canVaginal || hole === "anal" || ANAL_CTX.test(sent)) return;
        if (top.vulva !== true && bottom.vulva !== true && hole !== "vaginal") return;
      } else if (hole === "vaginal") {
        cat = "vaginal";
        act = act === "fingering" ? "fingering" : "vaginal sex";
      } else if (hole === "ambiguous" && !holeGuess) {
        ambiguousHoles++;
        return;
      } else if (top.penis === false && act !== "fingering" && !/\b(?:sodomi[sz]\w*|bugger\w*)\b/i.test(sent) && !/\b(?:strap\w*|dildo|toy|peg\w*|harness|butt ?plug|vibrator|anal beads)\b/i.test(para)) {
        // A woman "fucking" someone with no strap-on mentioned: not anal penetration by her.
        return;
      }
    }
    if (act === "rimming" && (VULVA_CTX.test(matchText) || (bottom.vulva === true && !ANAL_CTX.test(para)))) act = "cunnilingus";
    if (pat.femaleTarget && !PENIS_CTX.test(matchText)) {
      // "went down on her": the receiver has a vagina, so it's cunnilingus and the licker is the top.
      const receiverHasVulva =
        (top.vulva === true && top.penis !== true) || (top.vulva === "maybe" && VULVA_CTX.test(sent)) || ((top.gender === "f" || /^her$/i.test(tTok ?? "")) && top.penis !== true && !PENIS_CTX.test(sent));
      if (receiverHasVulva) {
        if (pat.femaleTarget === "drop") return;
        [top, bottom] = [bottom, top];
        act = "cunnilingus";
      }
    }
    // A cock-sucking hint between two people with no penis (and no strap-on or toy about) is something else: fingers in the mouth, a kiss.
    if (cat === "oral" && oralKindOf(act) === "blowjob" && top.penis === false && bottom.penis === false && !/\b(?:cock|dick|penis)\b/i.test(para)) return;
    // "them"/"it" may be a thing, not a person ("sucks them into his mouth" = fingers): require the
    // sentence to name the body part the act needs.
    const thing = (tok?: string) => /^(?:them|it)$/i.test(tok ?? "");
    if (thing(tTok) || thing(bTok)) {
      const needs = act === "rimming" ? ANAL_CTX : cat === "oral" ? PENIS_CTX : new RegExp(`${PENIS_CTX.source}|${ANAL_CTX.source}`, "i");
      if (!needs.test(sent)) return;
    }

    // Questions ("Did Harry fuck him?") don't say it happened.
    if (/\?\s*["”’)]*\s*$/.test(original)) return;

    // Act, or desire/fantasy/hypothetical?
    const prefix = sent.slice(0, m.index);
    // Negation and desire only reach as far as their own clause: "Steve doesn't complain as Sam enters him".
    const clause =
      prefix.split(/[;:]|,\s+(?:and|but|then|so)\s+|\b(?:and then|but then)\b|—|\b(?:as|while|when|whenever|because|until|after|since|though|although|whereas|but|and)(?:\s+|$)/).pop() ?? "";
    const window = clause.slice(-90);
    const aux = m.groups?.aux ?? "";
    // "just not yet, not before he bottomed out" delays an act and "it didn't take long for Dean to cum" is an idiom:
    // neither says the act doesn't happen.
    const negWindow = (/^\s*,/.test(m[0]) ? "" : window.slice(-40)).replace(/^.*,\s*/, "").replace(/\bwithout\s+(?:any\s+|much\s+|further\s+|more\s+|so much as\s+|a\s+)*(?:preamble|ado|hesitation|hesitating|warning|ceremony|delay|word|sound|protest|pause|question|complaint|fanfare|prelude|resistance|effort|being asked|asking|waiting|thought)\b|\b(?:just\s+)?not\s+(?:just\s+)?(?:yet|before|until|quite|now)\b|\b(?:did|does|do|would|will|won|could)(?:n['’]t| not)\s+take\s+(?:long|much|any time|a lot)\b/gi, " ");
    // "if Cas doesn't fuck him soon, he might die": a conditional, which says it is wanted, not refused.
    // "as though he hasn't just been fucked into a new realm": he looks untouched, and has been. The negation is the pretence.
    // "like he's never been fucked before, which is absurdly untrue": the author says the opposite of the simile.
    const pretence = /\bas\s+(?:if|though)\s+(?:he|she|they|\w+)\s+(?:hasn['’]t|hadn['’]t|has not|had not)\s+(?:just\s+|only\s+|even\s+)*(?:been\s+)?$/i.test(prefix.slice(-60)) ||
      // "Sweet and chaste. Like he wasn't finger fucking Steve into oblivion.": the simile pretends it isn't happening, so it is.
      /(?:^|[.!?,]\s*)(?:as\s+(?:if|though)|like)\s+(?:he|she|they|\w+)\s+(?:wasn['’]t|weren['’]t|isn['’]t|aren['’]t|hadn['’]t|hasn['’]t|haven['’]t|didn['’]t|wasn['’]t just)\s+(?:(?:just|actually|even|really|currently|only)\s+)*(?:been\s+)?$/i.test((aux.trim() && matchText.includes(aux.trim()) ? prefix + matchText.slice(0, matchText.indexOf(aux.trim()) + aux.trim().length) : prefix + " " + aux).trimEnd().slice(-70) + " ") ||
      /\bnever\s+been\b[^.!?]{0,40}\bwhich\s+(?:is|was)\s+(?:\w+ly\s+)?(?:untrue|false|a lie|not true|laughable|ridiculous|absurd)/i.test(sent);
    const ifNot = /\bif\s+(?:[\w'’-]+\s+){0,2}(?:doesn['’]t|don['’]t|didn['’]t|won['’]t|hadn['’]t|isn['’]t|wasn['’]t)\s*$/i.test(window) || (/\bif\s+(?:[\w'’-]+\s+){0,2}$/i.test(window) && NEG.test(aux));
    // "tried not to suppress the urge to pull out and snap back in": not resisting a wish means having it.
    // "Dean would be lying if he said he didn't get flashes of it": denying the denial means it's true.
    const lyingDenial = /\b(?:would|'d|will|'ll|be|am|are|is|was|were)\s+(?:be\s+)?lying\s+(?:if|when)\s+(?:he|she|they|i|we|you)\s+(?:said|say|claimed|claim|told|tell)\s+(?:he|she|they|i|we|you)\s+(?:didn['’]t|did not|wasn['’]t|was not|never|doesn['’]t|does not|don['’]t|do not)\b/i.test(window);
    const doubleNeg = lyingDenial || /\b(?:not|n['’]t|never|without)\s+(?:to\s+)?(?:\w+\s+){0,2}?(?:suppress|resist|fight|hold back|stifle|restrain|deny|ignore|squash|stop|hide|push down|swallow|fight off)\w*\s+(?:\w+\s+){0,2}(?:urge|desire|need|want|impulse|temptation|craving)/i.test(window);
    // "Not without taking Eddie's dick out of his mouth": not … without cancels out.
    const notWithout = /\bnot\s+without\s+(?:\w+\s+){0,2}$/i.test(window);
    // "Eddie's cock never slid between his lips": a never inside the match, between the subject and the verb.
    // "doesn't hesitate to slide down", "doesn't resist the temptation": a denial of holding back, so it happens.
    const noHold = (x: string) => x.replace(/\b(?:does|did|do|could|can|would)(?:n['’]t| not)\s+(?:even\s+)?(?:hesitate|resist|refuse|falter|waver|delay|hold back|think twice|stop|help)\b/gi, " ");
    // "The problem wasn't only that he wanted to fuck Bacon": "not only / not just" adds to a fact, it doesn't deny it.
    const notOnly = /\b(?:wasn['’]t|isn['’]t|weren['’]t|aren['’]t|not|n['’]t)\s+(?:only|just|merely|simply|solely|even)\b/i.test(`${negWindow} ${aux}`);
    // "if he doesn't come from the thought of Eddie fucking him": the "doesn't" belongs to "come"; "no one else will want to fuck you" says only he will.
    const negElsewhere = /\b(?:not|n['’]t)\s+\w+\s+(?:from|at|by)\s+(?:the\s+)?(?:thought|idea|sight|image|memory|feel|feeling|sound)\s+of\s*$/i.test(negWindow) || /\b(?:no one|nobody)\s+else\b/i.test(`${negWindow} ${aux}`);
    const negated = !ifNot && !doubleNeg && !notWithout && !pretence && !notOnly && !negElsewhere && (NEG.test(noHold(aux)) || NEG.test(noHold(negWindow)) || NEG.test(noHold(negWindow.slice(-14) + matchText.slice(0, 8))) || /\b(?:never|refus(?:ed|es|e|ing) to|declin(?:ed|es|e|ing) to)\b/i.test(pat.id === "cock-never-leaving" ? matchText.replace(/\bnever\s+(?=leav)/i, "") : matchText));
    let kind: Desire["kind"] | "act" = "act";
    if (occurrence==="fantasy" || fantasyPara || FANTASY.test(window) || STRONG_FANTASY.test(prefix)) kind = "fantasy";
    else if (remembered && !pat.signal) kind = "hypothetical";
    else if (occurrence==="history" || occurrence==="recording") kind="history";
    else if (occurrence==="wanted") kind="wanted";
    else if (DESIRE_LEAD.test(sent) || DESIRE.test(window.replace(/\b(?:that|which|what it|it)\s+(?:want|need)(?:ed|s)?\s+to\b/gi, " ").replace(/\b(?:giv\w*|gave|got|get\w*|deliver\w*|provid\w*)\s+(?:(?:him|her|them|you|me)\s+)?(?:exactly\s+|just\s+|only\s+)?(?:what|all)\s+(?:he|she|they|you|I)(?:['’]d)?\s+(?:want|need)(?:ed|s)?\b/gi, " ").replace(/\b(?:does|did|do)(?:n['’]t| not)\s+(?:even\s+)?resist\s+the\s+(?:temptation|urge|impulse)\b(?:\s+(?:he|she|they)\s+(?:has|have|had|feels?|felt))?/gi, " ")) || DESIRE_TAIL.test(window) || DESIRE.test(aux) || DESIRE.test(m.groups?.lead ?? "") || /^(?:want|need|crav)/i.test(m.groups?.lead ?? "")) kind = "wanted";
    else if (/\b(?:want|need|wish|hope|long|crave)\w*\b[^.!?]*\b(?:and|but)\s+(?:then\s+)?(?:have|let|make|get)\s*$/i.test(prefix)) kind = "wanted";
    else if (/\b(?:want|need|wish|hope|long|crave)\w*\s+(?:\w+\s+){0,3}?to\b[^.!?]*\band\s+\w*(?:\s+\w*){0,2}$/i.test(prefix + matchText.slice(0, 14))) kind = "wanted";
    else if (HABIT_AUX.test(aux) && (pat.id === "bottomed-for" || pat.id === "topped")) kind = "identity";
    // "A routine was established, Dean would take Cas every morning": a would in a described routine is something that happened, not a maybe.
    else if (/^\s*would\b/i.test(aux) && /\b(?:routine|every (?:day|night|morning|evening|afternoon|time)|each (?:day|night|morning|evening|afternoon|time)|daily|nightly|usually|always|often|whenever|during those (?:\w+ )?(?:days|nights|weeks)|those (?:\w+ )?(?:days|nights|weeks)|most (?:days|nights|mornings))\b/i.test(para.slice(Math.max(0, para.indexOf(sent) - 220), para.indexOf(sent) + sent.length)) && !DESIRE.test(window) && !negated) kind = "act";
    else if (
      !pretence &&
      !/\bas (?:if|though)\s+(?:he|she|they)\s+(?:wasn['’]t|weren['’]t|was not|were not|hadn['’]t been|had not been)\s+(?:the\s+(?:man|guy|one|person|boy|woman|girl)|Epithet\d+)\s+(?:who|that)\b/i.test(prefix) &&
      !(/\bas (?:if|though)\s*$/i.test(prefix) && /\b(?:isn['’]t|wasn['’]t|aren['’]t|weren['’]t|is not|was not|were not|not)\b[^.!?]*\benough\b/i.test(sent.slice(m.index!))) &&
      ((HYPO_AUX.test(aux) && !/\bcould\s+(?:\w+\s+)?(?:taste|feel|smell|hear|see)\b/i.test(prefix.slice(-25) + matchText.slice(0, 30))) || (pat.cat === "anal" && /\bcan\s*$/i.test(aux) && /^(?:fuck|take|pound|ride|have|bend|breed|ravish)/i.test(matchText.replace(/^.*?\bcan\s+/i, ""))) || HYPO_MATCH.test(prefix.slice(-25) + matchText) || /\b(?:can|could|would|should)\s+(?:just\s+)?\w+\b[^.!?]*\band\s*\w*$/i.test(prefix + matchText.slice(0, 6)) || HYPO_WINDOW.test(window.replace(/\b(?:not|never|un)\s*able to (?:wait|resist|hold|stop|help|stand|take|bear|keep|contain|control|stay)\w*/gi, " ")) || HYPO_SENT.test(prefix) || /\b(?:will|['’]ll)\s+(?:just\s+|then\s+|probably\s+|gently\s+|slowly\s+)?\w+\s*$/i.test(prefix.slice(-40)) || /\b(?:no|any|little|without)\s+(?:[\w-]+\s+){0,2}?(?:need|urge|desire|temptation|reason)(?:\s+to)?\s*$/i.test(prefix) || /\bwhat\s+it\s+(?:means|meant)(?:\s+to)?\s*$/i.test(prefix) || /\b(?:being|be)\s+able(?:\s+to)?\s*$/i.test(prefix) || /\b(?:liked|loved|enjoyed|likes|loves|enjoys|hated|hates|missed|misses)\s+(?:\w+ing|being|having|getting|when|how|it when)\b[^.!?,;]*$/i.test(prefix) || /\bthe\s+(?:thought|idea|realization|realisation|suspicion|notion|fear|knowledge)\s+that\b/i.test(prefix) || /\bwhat\s+it\s+(?:was|is|would be|will be|felt|feels|'s|’s)\s+like\s+(?:to\s*)?$/i.test(prefix) || /\bas (?:if|though)\b[^.!?,;]*$/i.test(prefix) || /\b(?:memory|memories|thought|image|images|recollection)\s+of\s+(?:\w+['’]s\s+)?(?:\w+\s+){0,2}$/i.test(prefix.slice(-50)) || /\b(?:loves?|likes?|enjoys?|adores?|craves?)\s+(?:the\s+)?(?:way|feel(?:ing)?|taste|weight|sight|sound|idea|thought|texture)\b/i.test(prefix) || /\b(?:thinking|dreaming|remembering|reminiscing|imagining|picturing|fantasi[sz]ing|daydreaming|replaying)\s+(?:about|of|on)\b/i.test(prefix) || /^\W*(?:[\w'’]+[,!]\s+)?[\w'’]+(?:['’]d|\s+would)\s+(?:let|allow)\b/i.test(sent) || (/\bthan\s+(?:it\s+was\s+|it's\s+)?$/i.test(prefix) && /^to\b/i.test(matchText)) || /\bthan\s+(?:it\s+was\s+|it's\s+)?to\s*$/i.test(prefix) || /\b(?:like|as if|as though)\s+(?:he|she|they|I)(?:['’]s|['’]d|\s+(?:is|was|were|are|had|has|would))?\s*$/i.test(prefix) || (/\b(?:like|as if|as though)\s*$/i.test(prefix) && /^(?:he|she|they|I)\b/.test(matchText)) ||
      (/\bso\s*$/i.test(window) && /\b(?:can|could|might|may|will|would)\b/i.test(aux)) ||
      /\b(?:would|could|might)\s+(?:want|like|love|wish|prefer|enjoy|rather|fit)\b[^.!?;]{0,70}?\b(?:as|while|when|if|so)\s+(?:[\w'’]+\s+)?$/i.test(prefix))
    ) kind = "hypothetical";

    if (kind === "act") {
      if (negated) return;
      // The newer oral patterns overlap each other and the older ones ("wraps his lips around Alex, a tap of his tongue
      // around the head"): they add to a sentence's evidence only once.
      // Scene role locking: in a scene with a third person, a pronoun-only line that has someone penetrating the very person who
      // is penetrating them (a few paragraphs back, named outright) is the third person's line: "Once I was back from the brink,
      // Derek held his hips … His dick barely moved in me" is Derek, not the one Scott was inside.
      if (basis !== "named" && cat === "anal") {
        const recent = acts.filter((a) => a.cat === cat && a.para >= pi - 6 && a.para <= pi);
        const reversed = recent.some((a) => a.top === bottom && a.bottom === top && a.basis === "named" && a.weight >= 0.7);
        const same = recent.some((a) => a.top === top && a.bottom === bottom);
        if (reversed && !same) {
          const earlier = paras.slice(Math.max(0, pi - 2), pi).join(" ") + " " + para.slice(0, Math.max(0, para.indexOf(original)));
          const third = cast.chars
            .filter((c) => c !== top && c !== bottom && c !== cast.secondPerson)
            .map((c) => ({ c, at: Math.max(...c.aliases.map((a) => earlier.lastIndexOf(a))) }))
            .filter((x) => x.at >= 0)
            .sort((x, y) => y.at - x.at)[0]?.c;
          if (third && cast.pairings.some((pr) => pr.includes(third) && pr.includes(bottom))) top = third;
        }
      }
      // "He laves his tongue over it while he forces the head of his cock deeper, holding his palm over the boy's belly": a he in a sentence that
      // also names the person it was resolved to ("the boy's belly" is Jace's) is not that person, so it is the other one.
      if (basis !== "named" && cat === "anal" && /^(?:he|she)$/i.test(tTok ?? "")) {
        const objRe = new RegExp(`\\b(?:over|on|onto|against|into|at|to|upon|across|along|around|beside|toward|towards|under|beneath|from|of)\\s+(?:the\\s+)?(${NAMES}|Epithet\\d+)(?:['’]s?)?(?![\\w])`, "g");
        for (const om of sent.slice(m.index!).matchAll(objRe)) {
          const c = /^Epithet/.test(om[1]) ? ctx.token(om[1]) : cast.byAlias.get(stripPoss(om[1]));
          if (c && c === top) { [top, bottom] = [bottom, top]; break; }
        }
      }
      const dup = pat.dedupe ? acts.find((a) => a.para === pi && a.sentence === original && a.cat === cat && a.top === top && a.bottom === bottom) : undefined;
      if (dup) {
        if (weight > dup.weight) { dup.weight = weight; dup.basis = basis; }
        ctx.setPartners(cat, top, bottom);
        ctx.lastSubject = pat.subj === "t" ? top : bottom;
        return;
      }
      // "Dracula rode him": with no cock, lap or "on" in the sentence it says nothing about who is inside whom.
      const shaky = /^riding/.test(pat.id) && /^(?:him|her|them|it)$/i.test(tTok ?? "") && !/\b(?:cock|dick|prick|length|shaft|lap|dildo|strap|on|onto|astride|straddl\w*)\b/i.test(sent.slice(m.index!).replace(/^\S+\s+\S+\s+/, ""))
        ? "“rode him” can describe either partner" : holeGuess === "ambiguous" ? "the sentence doesn't say which hole" : undefined;
      // "Now he knew what it was like to fuck Ilya Rozanov": a look back that, after being the bottom, means "have sex with".
      const retro = /\bwhat it (?:was|is|felt|had been|'d been)\s+like\s+to\b/i.test(sent);
      // "took them both at once": everyone else named just before is inside him too.
      if (pat.id.startsWith("dp-took-both")) {
        const earlier = paras.slice(Math.max(0, pi - 1), pi).join(" ") + " " + para.slice(0, para.indexOf(original) + original.length);
        for (const c of cast.chars) {
          if (c === top || c === bottom || c === cast.secondPerson || !c.aliases.some((a) => earlier.includes(a))) continue;
          acts.push({ via: pat.id, cat, act, top: c, bottom, weight: weight * 0.9, basis: "named", para: pi, sentence: original, context: contextAround(paras[pi] ?? "", original) });
        }
      }
      // Adult synthetic: oral contact with a scrotum is body play, not enclosed-mouth penile stimulation.
      if(cat==="oral" && oralKindOf(act)==="blowjob" && /\b(?:balls|scrotum)\b/i.test(matchText) &&
         !/\b(?:cock|dick|penis|prick|shaft|length|erection|head)\b/i.test(matchText)) {
        desires.push({via:pat.id,feat,attribution,cat:"vibe",act:"genital licking",who:bottom,partner:top,role:"top",wants:true,kind:"handjob",weight,para:pi,sentence:original,basis});
        return;
      }
      acts.push({ via: pat.id, feat, attribution, cat, act, top, bottom, weight: retro ? weight * 0.4 : weight, basis, para: pi, sentence: original, holeGuess, pronouns: !pat.elided && PRONOUN_ONLY.test(tTok ?? "") && PRONOUN_ONLY.test(bTok ?? "") ? true : undefined, shaky: retro ? "“what it was like to…” looks back on an earlier time and can describe either partner" : shaky ?? (subjFromObject ? "who is doing it was worked out from the person named in the sentence" : undefined), context: contextAround(paras[pi] ?? "", original) });
      ctx.setPartners(cat, top, bottom);
      ctx.lastSubject = pat.subj === "t" ? top : bottom;
      return;
    }

    // Whose desire is it? The first person mentioned before the desire word, else the subject.
    const wantAnd = /\b(?:want|need|wish|hope|long|crave)\w*\b[^.!?]*\b(?:and|but)\s+(?:then\s+)?(?:have|let|make|get)\s*$/i.test(prefix);
    // "…, if only Hank could find the courage, buried deep inside him": the one wishing is the one named after "if only".
    const ifOnly = new RegExp(`\\bif\\s+only\\s+(${NAMES})\\b`, "i").exec(window);
    // "Maybe Obi-Wan can just fuck him here", "it would be hot if Obi-Wan fucked him hard": in one person's point of view, with
    // no one else named as wanting it, the one imagining it is the point-of-view character, who is the one it would be done to.
    const povWisher = kind === "hypothetical" && ctx.povNow && (ctx.povNow === top || ctx.povNow === bottom) &&
      !/\b(?:want|need|wish|hope|long|crave|desire|yearn|beg|plead|ache|itch|hungry|dying)\w*/i.test(window) ? ctx.povNow : undefined;
    // "All he wants and needs right now is to get to a room where Castiel can fuck him": a pronoun doing the wanting, in one person's point of
    // view, is that person, whoever else is named in the wish.
    const pronounWisher = (kind === "hypothetical" || kind === "wanted") && ctx.povNow && (ctx.povNow === top || ctx.povNow === bottom) &&
      /(?:^|[\s,])(?:all |what |everything )?(?:he|she|they|i)\s+(?:(?:still|really|just|only|simply|so|desperately|badly|also|always)\s+)*(?:want|need|wish|hope|long|crave|desire|yearn|ache)\w*/i.test(prefix) &&
      !new RegExp(`\\b(?:${NAMES})\\s+(?:\\w+\\s+){0,2}(?:want|need|wish|hope|long|crave|desire|yearn|ache)\\w*`, "i").test(prefix) ? ctx.povNow : undefined;
    // "Dean’s whole body thrums with arousal just imagining himself cuffed … while Castiel plows him": a body or mind that imagines belongs to its owner.
    const ownerImagines = (kind === "fantasy" || kind === "hypothetical" || kind === "wanted") && /imagin\w*\s+(?:himself|herself|themselves|being|how|what)\b|fantasi[sz]\w*\s+(?:about|of)|picturing\s+(?:himself|herself|themselves)/i.test(prefix)
      ? (() => { const bm = new RegExp(`^\\W*(${NAMES})['’]s\\s+(?:whole\\s+|entire\\s+)?(?:body|mind|brain|head|heart|skin|stomach|cock|dick)\\b`).exec(sent); return bm ? cast.byAlias.get(bm[1]) : undefined; })()
      : undefined;
    const exp = desiredReceiver ?? ownerImagines ?? pronounWisher ?? (ifOnly ? cast.byAlias.get(ifOnly[1]) : undefined) ?? povWisher ?? (wantAnd ? firstEntity(sent) : undefined) ?? firstEntity(window) ?? (pat.subj === "t" ? top : bottom);
    // "Dean … flashes of him getting fucked against the glass": a wish about being taken, in the words of the one wishing, is about themselves.
    const passiveSelf = (kind === "fantasy" || kind === "hypothetical" || kind === "wanted") && /^(?:passive-|be-|get-)/.test(pat.id) && /^(?:him|he|her|she)$/i.test(bTok ?? "") && !!exp && (exp === top || exp === bottom);
    const role: Role | undefined = passiveSelf ? "bottom" : exp === top ? "top" : exp === bottom ? "bottom" : undefined;
    if (!role) return;
    // "There was no way Steve was asking him to fuck him": disbelief about a claim, not a dislike of the act.
    if (negated && /\bno\s+(?:fucking\s+|damn\s+)?(?:way|chance)\b|\bnot\s+a\s+chance\b|\bas\s+if\b|\bthere\s+(?:was|is)\s+no\s+(?:possible\s+)?(?:way|chance)\b/i.test(prefix.slice(-90))) return;
    desires.push({
      via: pat.id,
      feat,
      attribution,
      cat,
      act,
      who: exp,
      partner: role === "top" ? (exp === bottom ? top : bottom) : (exp === top ? bottom : top),
      role,
      wants: !negated,
      kind,
      weight: kind === "hypothetical" ? 0.6 : 1,
      para: pi,
      sentence: original,
      basis,
    });
  }

  /** Which hole a penetration sentence is about: the nearest explicit word wins, then anatomy. */
  function holeType(
    matchText: string,
    sent: string,
    para: string,
    top: Character,
    bottom: Character,
    /** Only what the words in the sentence say ("ambiguous" if they don't). */
    wordsOnly = false,
  ): "anal" | "vaginal" | "ambiguous" {
    for (const scope of [matchText, sent]) {
      const v = VULVA_CTX.test(scope);
      const a = ANAL_CTX.test(scope);
      if (v && !a) return "vaginal";
      if (a && !v) return "anal";
    }
    if (wordsOnly) return "ambiguous";
    // A woman with no penis "fucking" someone without a strap-on: it's her vagina involved.
    if (top.penis === false && top.vulva === true && !/\b(?:strap\w*|dildo|toy|peg\w*|harness|butt ?plug|vibrator|anal beads)\b/i.test(para)) return "vaginal";
    const v = VULVA_CTX.test(para);
    const a = ANAL_CTX.test(para);
    if (bottom.vulva === false) return "anal";
    if (bottom.vulva === true && bottom.gender === "f") return a && !v ? "anal" : "vaginal";
    // A man who may have a vagina (omegaverse, trans): go by the paragraph, otherwise we can't tell.
    if (v && !a) return "vaginal";
    if (a && !v) return "anal";
    return bottom.vulva === "maybe" && cast.maleVulva ? "ambiguous" : "anal";
  }

  // ───────────── aggregate ─────────────

  // Settle the scenes that didn't say which hole by the bottom's clearly worded ones.
  acts = acts.filter((a) => {
    if (!a.holeGuess) return true;
    const v = holeVotes.get(a.bottom) ?? { anal: 0, vaginal: 0 };
    const hole = v.vaginal > v.anal ? "vaginal" : v.anal > v.vaginal ? "anal" : a.holeGuess;
    if (hole === "ambiguous") {
      // Two men and nothing says which: anal is the safe default.
      if (a.top.gender === "m" && a.bottom.gender === "m") {
        defaultedAnal++;
        return true;
      }
      ambiguousHoles++;
      return false;
    }
    if (hole === "vaginal") {
      a.cat = "vaginal";
      a.act = a.act === "fingering" ? "fingering" : "vaginal sex";
    }
    return true;
  });

  // The same hint read by two patterns ("wanted to be full of Cas, wanted Cas spilling down his throat") counts once.
  {
    const seen = new Set<string>();
    desires = desires.filter((d) => {
      const key = [d.para, d.sentence, d.cat, d.who.name, d.role, d.wants, d.kind].join("\u0000");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // The work's categories set a presumption: tagged only M/M, men have sex with each other; tagged only F/F, women do.
  // Any other category in the mix (F/M, Multi, Other) removes it. It is context, not a ban: a scene with someone of the
  // other gender stays when it is clearly real (both people named, or the pair is seen more than once), and is dropped
  // when it rests on a single pronoun-only or inferred reading, which is where false flags come from.
  {
    const cats = meta.categories.map((c) => c.trim().toUpperCase());
    const onlyOf = (c: string) => cats.includes(c) && cats.every((x) => x === c || x === "GEN");
    const excluded: Gender | undefined = onlyOf("M/M") ? "f" : onlyOf("F/F") ? "m" : undefined;
    if (excluded) {
      const out = (c: Character) => c.gender === excluded && c.name !== "Reader";
      const key = (a: Character, b: Character) => [a.name, b.name].sort().join("\u0000");
      const seen = new Map<string, Set<string>>();
      for (const a of acts) {
        if (!(out(a.top) || out(a.bottom))) continue;
        const k = key(a.top, a.bottom);
        seen.set(k, (seen.get(k) ?? new Set()).add(`${a.para}\u0000${a.sentence}`));
      }
      const keepAct = (a: ActHit) => !(out(a.top) || out(a.bottom)) || a.basis === "named" || (seen.get(key(a.top, a.bottom))?.size ?? 0) >= 2;
      acts = acts.filter(keepAct);
      const kept = new Set(acts.map((a) => `${key(a.top, a.bottom)}\u0000${a.cat}`));
      desires = desires.filter((d) => !(out(d.who) || (d.partner && out(d.partner))) || (!!d.partner && kept.has(`${key(d.who, d.partner)}\u0000${d.cat}`)));
    }
  }

  const narratedTexts = detectTexts(paras, cast).messages.filter((m) => m.how === "narrated" && !texting.rewritten.has(m.para));
  // A one-sided hint is only for sentences that couldn't be placed between two people.
  for (let k = desires.length - 1; k >= 0; k--) if (desires[k].via?.endsWith("~one-sided") && acts.some((x) => x.sentence === desires[k].sentence)) desires.splice(k, 1);
  for (const d of desires) if (!d.context) d.context = contextFor(paras, d.para, d.sentence);
  const where = (pi: number) => chapters[pi] || `~${Math.round((pi / Math.max(1, paras.length)) * 100)}% through`;
  const pairKey = (a: Character, b: Character) => [a.name, b.name].sort().join("\u0000");
  const pairOrder = new Map<string, [Character, Character]>();
  for (const p of cast.pairings) if (!pairOrder.has(pairKey(p[0], p[1]))) pairOrder.set(pairKey(p[0], p[1]), p);

  const keys = new Set<string>();
  for (const a of acts) keys.add(pairKey(a.top, a.bottom));
  for (const d of desires) if (d.partner && d.cat !== "vibe") keys.add(pairKey(d.who, d.partner));
  const mainPair = cast.pairings[0];
  if (mainPair) keys.add(pairKey(mainPair[0], mainPair[1]));

  const results: (PairingResult & { weight: number; key: string })[] = [];
  for (const key of keys) {
    const pActs = acts.filter((a) => pairKey(a.top, a.bottom) === key);
    const allPairDes = desires.filter((d) => d.partner && pairKey(d.who, d.partner) === key);
    // Solo acts get their own card. Self-fingering and toys on oneself still count toward anal bottom evidence, but only for
    // someone with an ass in play: a woman fingering herself is vaginal unless the sentence says ass.
    const soloDes = allPairDes.filter((d) => d.kind === "solo" || d.kind === "masturbation");
    const manualDes = allPairDes.filter((d) => d.kind === "handjob" || d.kind === "touch" && d.act === PENIS_BUTTOCK_CONTACT);
    const pDes = allPairDes.filter((d) => d.kind !== "masturbation" && d.kind !== "handjob" && !(d.kind === "solo" && !soloIsAnal(d)));
    const tagged = pairOrder.get(key);
    const members = tagged ?? (pActs[0] ? [pActs[0].top, pActs[0].bottom] : pDes[0] ? [pDes[0].who, pDes[0].partner!] : undefined);
    if (!members) continue;
    const isMain = !!mainPair && key === pairKey(mainPair[0], mainPair[1]);
    const pairTags = tagsFor(tags, members as [Character, Character], isMain);
    const pair = members as [Character, Character];
    // Two women with no anal in the text: "Top X / Bottom Y" tags are about strap-on or other play, not anal sex.
    const analWords = /\b(?:ass|arse|butt|anal|asshole|arsehole|hole|plug|rim\w*|backdoor)\b/i;
    const noAnalHere = pair[0].penis === false && pair[1].penis === false && !pActs.some((a) => a.cat === "anal") && pDes.filter((d) => d.cat === "anal" && analWords.test(d.sentence ?? "")).length < 3;
    const analTags: PairTags = noAnalHere ? { roles: [], dynamics: [], dynamicTags: [], switching: [], actTags: { ...pairTags.actTags, anal: [] } } : pairTags;
    const anal = buildAct("anal", pActs.filter((a) => a.cat === "anal"), noAnalHere ? [] : pDes.filter((d) => d.cat === "anal"), analTags, pair, meta, where);
    const oralActs = pActs.filter((a) => a.cat === "oral");
    const oralDes = pDes.filter((d) => d.cat === "oral");
    const oral = buildAct("oral", oralActs, oralDes, pairTags, pair, meta, where);
    const [blowjob, rimming, cunnilingus] = ORAL_KINDS.map((kind) =>
      buildAct("oral", oralActs.filter((a) => oralKindOf(a.act) === kind), oralDes.filter((d) => oralKindOf(d.act) === kind), pairTags, pair, meta, where, kind),
    );
    const vaginal = buildVaginal(pActs.filter((a) => a.cat === "vaginal"), pair, meta, where);
    const weight = pActs.reduce((n, a) => n + a.weight, 0) + pDes.filter((d) => d.cat !== "vibe").length * 0.2 + (isMain ? 0.01 : 0);
    // Skip incidental pairs with almost nothing (likely misresolved pronouns); a tagged pair needs less.
    if (!isMain && weight < (tagged ? 0.5 : 1.2)) continue;
    // A work with relationship tags and a pair nobody tagged: a couple of pronoun-only or inferred readings are far more
    // likely a misread "he" in the main couple's scene than a second couple, so it needs named scenes or more of them.
    if (!tagged && cast.pairings.length && pActs.every((a) => a.cat !== "vaginal") && pActs.filter((a) => a.basis === "named").length < 2 && pActs.length < 4) continue;
    // Two people who share a family name (Sam and Dean Winchester) and aren't tagged as a pair are far more likely a misread
    // "he" in someone else's scene than a couple.
    {
      const last = (n: string) => n.trim().split(/\s+/).slice(-1)[0].toLowerCase();
      if (!tagged && members[0].name.includes(" ") && members[1].name.includes(" ") && last(members[0].name) === last(members[1].name) && pActs.filter((a) => a.basis === "named").length < 4) continue;
    }
    const vibe = buildVibes(pair, pActs, pDes, pairTags, meta, where);
    const dynamic = buildDynamic(pair, pDes, pairTags, where);
    const vibeCombined = buildVibes(pair, pActs, pDes, pairTags, meta, where, true);
    const solo = buildSolo(pair, soloDes, where);
    const manual = buildManual(pair, manualDes, where);
    const others = buildOthers(pair, allPairDes, where);
    results.push({ pairing: `${members[0].name}/${members[1].name}`, anal, oral, blowjob, rimming, cunnilingus, vaginal, solo, manual, others, vibe, vibeCombined, dynamic, weight, key });
  }
  results.sort((a, b) => b.weight - a.weight);

  const notes: string[] = [];
  // Rated Explicit / Not Rated and tagged only M/M (or only F/F), yet no act was recognised: the sex is probably there but
  // written non-graphically or in phrasing the patterns miss, so point at the passages that read like sex scenes.
  {
    const cats = meta.categories.map((c) => c.trim().toUpperCase());
    const kind = cats.includes("M/M") && cats.every((x) => x === "M/M" || x === "GEN") ? "M/M" : cats.includes("F/F") && cats.every((x) => x === "F/F" || x === "GEN") ? "F/F" : "";
    const rated = /explicit|not rated/i.test(meta.rating ?? "");
    const actCount = results.reduce((n, r) => n + [r.anal, r.blowjob, r.rimming, r.cunnilingus].reduce((m, a) => m + a.instances.length, 0) + (r.vaginal?.instances?.length ?? 0), 0);
    if (kind && rated && actCount <= 1) {
      const AROUSAL = /\b(?:moan\w*|gasp\w*|orgasm\w*|climax\w*|came|cum|thrust\w*|grind\w*|arch\w*|naked|nipples?|pleasure|unbutton\w*|undress\w*|writh\w*|shudder\w*|sheets|hips|between (?:her|his|their) (?:legs|thighs)|panting|breathless|sweat\w*|trembl\w*|clothes)\b/gi;
      const scored = paras
        .map((para, i) => ({ para, i, n: new Set((para.match(AROUSAL) ?? []).map((w) => w.toLowerCase())).size }))
        .filter((x) => x.n >= 2 && x.para.length < 2500)
        .sort((a, b) => b.n - a.n || a.i - b.i)
        .slice(0, 3)
        .sort((a, b) => a.i - b.i);
      if (scored.length) {
        const quote = (t: string) => `“${t.replace(/\s+/g, " ").trim().slice(0, 170)}${t.length > 170 ? "…" : ""}”`;
        notes.push(
          `This work is rated ${meta.rating} and tagged only ${kind}, but ${actCount ? "only one" : "no"} ${kind} sex act was recognized. The sex may be written without explicit detail, or in phrasing these patterns don't cover. Passages that read like sex scenes: ${scored.map((x) => quote(x.para)).join(" · ")}`,
        );
      }
    }
  }

  {
    const named = results.flatMap((r) => r.pairing.split("/")).map((n) => n.trim());
    const priors = tagPriors(meta, cast.chars.filter((c) => named.includes(c.name)));
    if (priors.size)
      notes.push(`As a very faint tie-breaker, how often AO3 tags ${[...priors.keys()].join(", ")} as a top or bottom was used; anything in the text outweighs it.`);
  }

  if (hasUncertainNotes) notes.push("Some AO3 chapter-note text had an unclear boundary and was excluded from pattern analysis.");
  if (!meta.relationships.length && !meta.characters.length && cast.chars.length) {
    notes.push(`No AO3 tags in this file, so characters were guessed from the text: ${cast.chars.map((c) => c.name).join(", ")}.`);
  } else if (!meta.relationships.length && cast.pairings.length) {
    notes.push("No relationship tags, so pairings were worked out from who has sex with whom in the text.");
  }
  const originals = cast.chars.filter((c) => c.original);
  if (originals.length) {
    notes.push(`Original characters, named from the text: ${originals.map((c) => c.name).join(", ")}.`);
  }
  if (cast.narrator) notes.push(`First-person narration: “I” is read as ${cast.narrator.name}.`);
  if (cast.secondPerson) notes.push(`Second-person narration: “you” is read as ${cast.secondPerson.name}.`);
  if (cast.maleVulva || cast.chars.some((c) => c.gender !== "f" && c.vulva === true)) {
    notes.push(
      `At least one male character has a vagina here (e.g. omegaverse or trans), so each scene was sorted into anal or vaginal by the words used${defaultedAnal ? `; ${plural(defaultedAnal, "sentence")} between two men didn't say which and ${defaultedAnal === 1 ? "was" : "were"} counted as anal` : ""}${ambiguousHoles ? `; ${plural(ambiguousHoles, "sentence")} didn't say which and ${ambiguousHoles === 1 ? "was" : "were"} left out` : ""}.`,
    );
  }
  if (!opts.quiet) {
    notes.push(
      "Pattern matching reads sentences like “X sucked Y off” or “his tongue in X’s hole”. It can miss unusual phrasing and sometimes guesses wrong when both people are “he” or “she”, so check the quoted lines. Ask Claude for a second opinion on anything marked Low.",
    );
  }

  const romantic = romanticPairings(meta);
  const pairings: PairingResult[] = results.map(({ weight: _w, key: _k, ...p }) => p);
  opts.debug?.({
    paras,
    pov: pov.at.map((c) => c?.name),
    texts: [...texting.messages, ...narratedTexts].map((m) => ({ para: m.para, from: m.sender?.name, to: m.receiver?.name })),
  });
  const outcomeOf=(feat:number[]|undefined,act:string,top:string,bottom:string):DecisionOutcome|undefined=>{
    const initial=feat && decisionOutcomes.get(feat);if(!initial)return;
    const instrument:DecisionOutcome["instrument"]=/finger|fist/.test(act)?"finger":/toy|strap/.test(act)?"toy":/rimming|cunnilingus/.test(act)?"tongue":/anal sex|vaginal sex|blowjob/.test(act)?"penis":"unknown";
    return {...initial,topChanged:initial.initialTop!==top,bottomChanged:initial.initialBottom!==bottom,actChanged:initial.initialAct!==act,instrument};
  };
  if (opts.audit) {
    for (const h of acts) opts.audit({ via: h.via ?? "?", f: h.feat, attribution: h.attribution, decisionOutcome:outcomeOf(h.feat,h.act,h.top.name,h.bottom.name), kind: "act", cat: h.cat, act: h.act, para: h.para, sentence: h.sentence, a: h.top.name, b: h.bottom.name });
    for (const h of desires) opts.audit({ via: h.via ?? "?", f: h.feat, attribution: h.attribution, decisionOutcome:outcomeOf(h.feat,h.act,h.role==="top"?h.who.name:h.partner?.name ?? "",h.role==="bottom"?h.who.name:h.partner?.name ?? ""), kind: h.kind, role: h.role, cat: h.cat, act: h.act, para: h.para, sentence: h.sentence, a: h.who.name, b: h.partner?.name });
  }
  const textingResult = summarizeTexts([...texting.messages, ...narratedTexts], where);
  return {
    source: "patterns",
    fandom: meta.fandoms.join(", "),
    main_pairing: romantic[0] ?? results[0]?.pairing ?? "",
    pairings: pairings,
    tagCheck: checkTags(meta.freeforms, tags, pairings, paras, where, textingResult),
    texting: textingResult,
    notes: notes.join(" "),
  };
}
