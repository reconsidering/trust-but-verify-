// The readings the owner marked "looks right" in mistake reports (tests/right-set/*.json), replayed against the engine.
//   AO3_DIR=ao3-samples npx vitest run tests/right-set.test.ts
// People get things wrong, so this does not treat every old "right" as law: a "strong" reading (marked right in two reports, or a scene the
// engine itself put at 70%+) fails the test when it changes; a "single" one is only listed in RIGHT_SET_REPORT.md; a disputed one (the same
// sentence is also listed as wrong) or a retired one is skipped. RIGHT_SET_STRICT=1 fails on any change. Retire a reading you now disagree with:
//   node scripts/import-right-set.mjs --retire <fic> <hash> why
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MISREAD_LABELS, type RightEntry, type RightSet, allowedWeightedChanges, baseVia, hashKey, mergeReport, parseReport, slugOf, strengthOf, weightOf } from "../scripts/right-set.mjs";
import { extractFromHtml } from "../src/extract";
import { hashKey as pageHash, rightSetFile, slugOf as pageSlug } from "../src/rightset";
import { FLAG_REASONS, type FlaggedScene, WRONG_REASONS } from "../src/report";
import { analyzeWithPatterns } from "../src/heuristic";
import type { PairingResult } from "../src/types";

const dir = process.env.AO3_DIR;
const strict = !!process.env.RIGHT_SET_STRICT;
const setDir = join(__dirname, "right-set");
const first = (n: string | undefined) => (n ?? "").split(/\s+/)[0].toLowerCase();

const REPORT = `# Trust (Tags) But Verify — mistake report

## The work
- Title: Made Up Story
- Relationships: Alex Smith/Sam Jones

## Things I think are wrong (1)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Alex Smith** points toward top (wanted) · anal sex
- confidence 40% · Chapter 1
- Pattern: push-into
- Sentence: “Alex began to press forward, slowly.”
- What is wrong: Not a sex act, or not that kind of cue, at all

## Things I checked that look right (3)

### 1. Alex Smith/Sam Jones · anal
- Shown as: **Alex Smith** tops (top), **Sam Jones** bottoms (bottom) · anal sex
- people found by name · scene confidence 90% · Chapter 2
- Pattern: push-into~elided
- Sentence: “Alex pushed into Sam, groaning.”

### 2. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward bottom (touch) · pushing back
- confidence 29% · Chapter 2
- Pattern: thrust-back
- Sentence: “Sam pushed back against him.”

### 3. Alex Smith/Sam Jones · anal hint
- Shown as: **Alex Smith** points toward top (wanted) · anal sex
- confidence 40% · Chapter 1
- Pattern: push-into
- Sentence: “Alex began to press forward, slowly.”

## How well the confidence has matched so far
- 1 items.
`;

describe("right-set: reading a report and weighing it", () => {
  const parsed = parseReport(REPORT);
  it("reads right and wrong items, by name and pattern, without storing the sentence", () => {
    expect(parsed.slug).toBe("made-up-story");
    expect(parsed.right.map((r) => [r.kind, r.card, r.via])).toEqual([["scene", "anal", "push-into"], ["hint", "anal", "thrust-back"], ["hint", "anal", "push-into"]]);
    expect(parsed.right[0]).toMatchObject({ top: "Alex Smith", bottom: "Sam Jones", conf: 90 });
    expect(parsed.right[1]).toMatchObject({ who: "Sam Jones", role: "bottom", wants: true });
    expect(JSON.stringify(parsed)).not.toContain("pushed into Sam");
    expect(parsed.right[0].h).toBe(hashKey("Alex pushed into Sam, groaning."));
  });
  it("weighs how much each reading can be trusted", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parsed, "2026-10-05");
    const by = Object.fromEntries(set.entries!.map((e) => [e.via + e.kind, strengthOf(e as RightEntry)]));
    expect(by["push-intoscene"]).toBe("strong"); // a scene the engine put at 90%
    expect(by["thrust-backhint"]).toBe("single"); // marked right once, never confirmed
    expect(by["push-intohint"]).toBe("disputed"); // the same sentence is also listed as wrong
  });
  it("a second report confirming a reading makes it strong; a repeat of the same day does not count twice", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parsed, "2026-10-05");
    mergeReport(set, parsed, "2026-10-05");
    expect(set.entries!.find((e) => e.via === "thrust-back")!.marks.right).toBe(1);
    mergeReport(set, parsed, "2026-10-09");
    const e = set.entries!.find((e) => e.via === "thrust-back")! as RightEntry;
    expect(e.marks.right).toBe(2);
    expect(strengthOf(e)).toBe("strong");
    expect(strengthOf({ ...e, retired: "my mistake" })).toBe("retired");
  });
  it("normalises pattern names and fic titles", () => {
    expect(baseVia("push-into~elided")).toBe("push-into");
    expect(slugOf("Prince, Prisoner, Puppy, Parent")).toBe("prince-prisoner-puppy-parent");
  });
});

describe("right-set: wrong marks as negative examples for the context model", () => {
  const WRONG_REPORT = `## The work
- Title: Made Up Story

## Things I think are wrong (3)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Alex Smith** points toward top (wanted) · anal sex
- Pattern: push-into
- Sentence: “Alex reached for the lamp.”
- What is wrong: Not a sex act, or not that kind of cue, at all

### 2. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward bottom (touch) · pushing back
- Pattern: thrust-back
- Sentence: “Sam shoved the door.”
- What is wrong: Counted more than once

### 3. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward bottom (touch) · pushing back
- Pattern: thrust-back
- Sentence: “Sam leaned on the wall.”
- What is wrong: Something else (explain below)

## Things I checked that look right (0)

## How well the confidence has matched so far
`;
  it("the misread reasons here match the ones the page uses", () => {
    expect(MISREAD_LABELS.slice().sort()).toEqual(FLAG_REASONS.filter((r) => WRONG_REASONS.has(r.key)).map((r) => r.label).sort());
  });
  it("only a reading reported wrong because it was misread teaches the model", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(WRONG_REPORT), "2026-10-05");
    expect(set.negatives).toHaveLength(3); // all kept, so a later right mark on one is caught
    expect(set.negatives!.filter((n) => n.misread).map((n) => n.via)).toEqual(["push-into"]);
  });
  it("a different reading of a sentence reported wrong is not put in doubt", () => {
    const rep = `## The work
- Title: Made Up Story

## Things I think are wrong (1)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Alex Smith** points toward bottom (solo) · using a toy on himself
- Pattern: self-toy
- Sentence: “He kept working the toy inside him slowly.”
- What is wrong: Credited to the wrong character

## Things I checked that look right (1)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward bottom (prep) · wearing a plug
- Pattern: plug-worn
- Sentence: “He kept working the toy inside him slowly.”

## How well the confidence has matched so far
`;
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(rep), "2026-10-05");
    expect(strengthOf(set.entries![0] as RightEntry)).toBe("single");
  });
  it("a reading reported wrong only for being counted twice is not put in doubt", () => {
    const rep = `## The work
- Title: Made Up Story

## Things I think are wrong (1)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward bottom (stated) · anal sex
- Pattern: dialogue:anal sex
- Sentence: “I want it so much, Alex, please do it.”
- What is wrong: Counted more than once

## Things I checked that look right (1)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward bottom (said) · anal sex
- Pattern: dialogue:anal sex
- Sentence: “I want it so much, Alex, please do it.”

## How well the confidence has matched so far
`;
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(rep), "2026-10-05");
    expect(strengthOf(set.entries![0] as RightEntry)).toBe("single");
  });
  it("the page’s file marks misreads from the ticked reasons", () => {
    const f = (reasons: FlaggedScene["reasons"]): FlaggedScene => ({ id: "x", kind: "hint", pairing: "A/B", card: "anal", top: "Alex Smith", bottom: "top (wanted)", act: "x", pattern: "push-into", evidence: "Alex reached for the lamp.", reasons, note: "" });
    expect(rightSetFile("T", [], [f(["not_sex"])]).wrong[0].misread).toBe(true);
    expect(rightSetFile("T", [], [f(["duplicate"])]).wrong[0].misread).toBe(false);
    expect(rightSetFile("T", [], [f([])]).wrong[0].misread).toBe(false);
  });
});

describe("right-set: labels from an unverified pass carry a weight", () => {
  const rep = `## The work
- Title: Made Up Story

## Things I checked that look right (1)

### 1. Alex Smith/Sam Jones · anal
- Shown as: **Alex Smith** tops (top), **Sam Jones** bottoms (bottom) · anal sex
- scene confidence 85%
- Pattern: push-into
- Sentence: “Alex pushed into Sam, groaning.”

## Things I think are wrong (1)

### 1. Alex Smith/Sam Jones · anal hint
- Shown as: **Sam Jones** points toward top (touch) · anal sex
- Pattern: thrust-back
- Sentence: “Sam pushed back against the wall.”
- What is wrong: Not a sex act, or not that kind of cue, at all

## How well the confidence has matched so far
`;
  it("stores the weight and source, never calls such an entry strong (even at 85% confidence), and weights the negatives too", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(rep), "2026-10-05", { weight: 0.9, source: "claude" });
    expect(set.entries![0]).toMatchObject({ weight: 0.9, source: "claude" });
    expect(set.negatives![0]).toMatchObject({ weight: 0.9, misread: true });
    expect(weightOf(set.entries![0] as RightEntry)).toBe(0.9);
    expect(strengthOf(set.entries![0] as RightEntry)).toBe("weighted");
    expect(strengthOf({ ...(set.entries![0] as RightEntry), weight: undefined })).toBe("strong");
  });
  it("trusts what an unverified pass calls wrong less than what it calls right, when told to", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(rep), "2026-10-05", { weight: 0.85, weightWrong: 0.3, source: "claude" });
    expect(set.entries![0]).toMatchObject({ weight: 0.85, source: "claude" });
    expect(set.negatives![0]).toMatchObject({ weight: 0.3, source: "claude", misread: true });
  });
  it("a second unverified pass adds nothing; the owner confirming makes the entry theirs, at full weight", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(rep), "2026-10-05", { weight: 0.9, source: "claude" });
    mergeReport(set, parseReport(rep), "2026-10-06", { weight: 0.9, source: "claude" });
    expect(set.entries![0].marks.right).toBe(1);
    mergeReport(set, parseReport(rep), "2026-10-07");
    expect(set.entries![0].weight).toBeUndefined();
    expect(set.entries![0].source).toBe("owner");
    expect(strengthOf(set.entries![0] as RightEntry)).toBe("strong");
  });
  it("an unverified wrong mark cannot overturn something the owner marked right", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, parseReport(rep), "2026-10-05");
    const flip = rep
      .replace(/## Things I checked that look right \(1\)[\s\S]*?## Things I think are wrong \(1\)/, "## Things I think are wrong (1)")
      .replace("Sam pushed back against the wall.", "Alex pushed into Sam, groaning.")
      .replace("**Sam Jones** points toward top (touch) · anal sex", "**Alex Smith** tops (top), **Sam Jones** bottoms (bottom) · anal sex")
      .replace("anal hint", "anal")
      .replace("thrust-back", "push-into");
    mergeReport(set, parseReport(flip), "2026-10-06", { weight: 0.9, source: "claude" });
    expect(strengthOf(set.entries![0] as RightEntry)).not.toBe("disputed");
  });
  it("label noise sets how many unverified readings may change before a set fails", () => {
    expect(allowedWeightedChanges(40, 0.9)).toBe(6);
    expect(allowedWeightedChanges(40, 0.95)).toBe(4);
    expect(allowedWeightedChanges(4, 0.9)).toBe(2);
  });
});

describe("right-set: the page’s Save looks-right set button", () => {
  const f = (over: Partial<FlaggedScene>): FlaggedScene => ({ id: "x", kind: "scene", pairing: "Alex Smith/Sam Jones", card: "anal", top: "Alex Smith", bottom: "Sam Jones", act: "anal sex", pattern: "push-into~elided", evidence: "Alex pushed into Sam, groaning.", confidence: 0.9, reasons: [], note: "", ...over });
  it("keys sentences exactly as the importer does", () => {
    expect(pageHash("Alex pushed into Sam, groaning.")).toBe(hashKey("Alex pushed into Sam, groaning."));
    expect(pageSlug("Prince, Prisoner, Puppy, Parent")).toBe(slugOf("Prince, Prisoner, Puppy, Parent"));
  });
  it("saves scenes, hints and solo lines by hash and name, and leaves out lines it cannot find again", () => {
    const file = rightSetFile("Made Up Story", [
      f({}),
      f({ id: "h", kind: "hint", top: "Sam Jones", bottom: "bottom (touch)", pattern: "thrust-back", evidence: "Sam pushed back against him.", confidence: 0.29 }),
      f({ id: "n", kind: "hint", top: "Alex Smith", bottom: "NOT top (hypothetical)", pattern: "fuck", evidence: "Alex never would." }),
      f({ id: "s", kind: "hint", card: "solo", top: "Sam Jones", bottom: "", pattern: "self-toy", evidence: "Sam worked a toy in alone." }),
      f({ id: "t", kind: "hint", card: "tagcheck", evidence: "A tag line." }),
      f({ id: "v", kind: "vibe", card: "anal", evidence: "" }),
    ], [f({ id: "w", evidence: "Alex began to press forward, slowly." })]);
    expect(file.slug).toBe("made-up-story");
    expect(file.right.map((e) => [e.kind, e.card, e.via])).toEqual([["scene", "anal", "push-into"], ["hint", "anal", "thrust-back"], ["hint", "anal", "fuck"], ["solo", "solo", "self-toy"]]);
    expect(file.right[2]).toMatchObject({ who: "Alex Smith", role: "top", wants: false });
    expect(file.right[0]).toMatchObject({ conf: 90, h: hashKey("Alex pushed into Sam, groaning.") });
    expect(JSON.stringify(file)).not.toContain("pushed into Sam");
    expect(file.wrong).toHaveLength(1);
  });
  it("the saved file merges like a report: a wrong mark on the same sentence disputes the reading", () => {
    const set: Partial<RightSet> = {};
    mergeReport(set, rightSetFile("Made Up Story", [f({})], []) as never, "2026-10-05");
    expect(strengthOf(set.entries![0] as RightEntry)).toBe("strong");
    mergeReport(set, rightSetFile("Made Up Story", [], [f({ reasons: ["not_sex"] })]) as never, "2026-10-09");
    expect(strengthOf(set.entries![0] as RightEntry)).toBe("disputed");
  });
});

// Sharding for scripts/check.mjs: RIGHTSET_ONLY=slug,slug limits the replay to those sets; RIGHTSET_REPORT_FILE says where to write.
const onlySets = process.env.RIGHTSET_ONLY?.split(",").filter(Boolean);

describe.skipIf(!dir)("right-set: replay against the sample fics", () => {
  it("keeps the readings you checked", () => {
    const files = existsSync(setDir) ? readdirSync(setDir).filter((f) => f.endsWith(".json")) : [];
    const bySlug = new Map<string, string>();
    // Reading every fic's title through the DOM took a minute and gigabytes in each shard, so titles are cached by file size and date.
    const titleFile = join(dir!, ".eval", "titles.json");
    let titles: Record<string, string> = {};
    try { titles = JSON.parse(readFileSync(titleFile, "utf8")); } catch { /* no cache yet */ }
    let fresh = false;
    for (const f of readdirSync(dir!).filter((x) => x.endsWith(".html"))) {
      try {
        // A fic is found by its title, or by its file name when the download has no title ("ethan.html" for a book saved from a PDF).
        const st = statSync(join(dir!, f));
        const key = `${f}:${st.size}:${Math.round(st.mtimeMs)}`;
        if (!(key in titles)) { titles[key] = extractFromHtml(readFileSync(join(dir!, f), "utf8")).meta.title ?? ""; fresh = true; }
        const title = titles[key];
        if (title) bySlug.set(slugOf(title), join(dir!, f));
        bySlug.set(slugOf(f.replace(/\.html$/, "")), join(dir!, f));
      } catch { /* not a fic */ }
    }
    if (fresh) {
      try { mkdirSync(join(dir!, ".eval"), { recursive: true }); const tmp = `${titleFile}.${process.pid}`; writeFileSync(tmp, JSON.stringify(titles)); renameSync(tmp, titleFile); } catch { /* cache is optional */ }
    }
    const report: string[] = ["# Right-set report", ""];
    let failures: string[] = [];
    for (const f of files) {
      if (onlySets && !onlySets.includes(f.replace(/\.json$/, ""))) continue;
      const set = JSON.parse(readFileSync(join(setDir, f), "utf8")) as RightSet;
      const path = bySlug.get(set.fic);
      if (!path) { report.push(`## ${set.title}: skipped (no sample with this title in AO3_DIR)`, ""); continue; }
      const work = extractFromHtml(readFileSync(path, "utf8"));
      const a = analyzeWithPatterns(work.text, work.meta, { quiet: true });
      const pairingOf = (name: string): PairingResult | undefined => { const [x, y] = name.split("/"); return a.pairings.find((p) => p.pairing.toLowerCase().includes(first(x)) && p.pairing.toLowerCase().includes(first(y))); };
      const tally = { ok: 0, changed: 0, stale: 0, skipped: 0 };
      const lines: string[] = [];
      // Readings from an unverified pass (weight below 1) are reported one by one but only fail the set in bulk, when more of them have changed than label noise explains.
      const weighted = { seen: 0, changed: 0, trust: 0 };
      for (const e of set.entries) {
        const strength = strengthOf(e);
        if (strength === "disputed" || strength === "retired") { tally.skipped++; continue; }
        const p = pairingOf(e.pairing);
        if (!p) { tally.stale++; continue; }
        let seen = false, ok = false;
        if (e.kind === "scene" && e.card in p) {
          for (const i of (p as unknown as Record<string, { instances: { evidence: string; top: string; bottom: string; via?: string }[] }>)[e.card].instances) {
            if (hashKey(i.evidence) !== e.h) continue;
            seen = true;
            if (first(i.top) === first(e.top) && first(i.bottom) === first(e.bottom) && (!e.via || baseVia(i.via ?? "") === e.via)) ok = true;
          }
        } else if (e.kind === "hint" && e.card in p) {
          for (const d of (p as unknown as Record<string, { desires: { evidence: string; who: string; role: string; wants: boolean; via: string }[] }>)[e.card].desires) {
            if (hashKey(d.evidence) !== e.h) continue;
            seen = true;
            if (first(d.who) === first(e.who) && d.role === e.role && d.wants === (e.wants !== false) && (!e.via || baseVia(d.via) === e.via)) ok = true;
          }
        } else if (e.kind === "solo") {
          for (const i of p.solo?.instances ?? []) { if (hashKey(i.evidence) !== e.h) continue; seen = true; if (first(i.who) === first(e.who)) ok = true; }
        }
        if (!seen) { tally.stale++; lines.push(`- [not found again] ${e.kind} ${e.card} · ${e.who ?? `${e.top} / ${e.bottom}`} ${e.role ?? ""} · ${e.via} · hash ${e.h}`); }
        else if (ok) { tally.ok++; if (strength === "weighted") { weighted.seen++; weighted.trust += weightOf(e); } }
        else {
          tally.changed++;
          if (strength === "weighted") { weighted.seen++; weighted.changed++; weighted.trust += weightOf(e); }
          lines.push(`- [${strength}${strength === "weighted" ? ` ${weightOf(e)}` : ""}] ${e.kind} ${e.card} · ${e.who ?? `${e.top} / ${e.bottom}`} ${e.role ?? ""} · ${e.via} · hash ${e.h}`);
          if (strength === "strong" || strict) failures.push(`${set.fic}: ${e.kind} ${e.card} ${e.via} (hash ${e.h})`);
        }
      }
      if (weighted.seen) {
        const allowed = allowedWeightedChanges(weighted.seen, weighted.trust / weighted.seen);
        if (weighted.changed > allowed) failures.push(`${set.fic}: ${weighted.changed} of ${weighted.seen} unverified readings changed (label noise explains up to ${allowed})`);
        lines.push(`- unverified readings (weight ${(weighted.trust / weighted.seen).toFixed(2)}): ${weighted.changed} of ${weighted.seen} changed; up to ${allowed} allowed`);
      }
      report.push(`## ${set.title}`, `${tally.ok} unchanged, ${tally.changed} changed, ${tally.stale} not found again, ${tally.skipped} ignored (disputed or retired)`, "", ...lines, "");
    }
    writeFileSync(process.env.RIGHTSET_REPORT_FILE ?? join(dir!, "RIGHT_SET_REPORT.md"), report.join("\n"));
    expect(failures, "A reading you marked right (strong) has changed. If the change is deliberate or you now disagree, retire it with scripts/import-right-set.mjs --retire.").toEqual([]);
  }, 900_000);
});
