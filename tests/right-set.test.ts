// The readings the owner marked "looks right" in mistake reports (tests/right-set/*.json), replayed against the engine.
//   AO3_DIR=ao3-samples npx vitest run tests/right-set.test.ts
// People get things wrong, so this does not treat every old "right" as law: a "strong" reading (marked right in two reports, or a scene the
// engine itself put at 70%+) fails the test when it changes; a "single" one is only listed in RIGHT_SET_REPORT.md; a disputed one (the same
// sentence is also listed as wrong) or a retired one is skipped. RIGHT_SET_STRICT=1 fails on any change. Retire a reading you now disagree with:
//   node scripts/import-right-set.mjs --retire <fic> <hash> why
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type RightEntry, type RightSet, baseVia, hashKey, mergeReport, parseReport, slugOf, strengthOf } from "../scripts/right-set.mjs";
import { extractFromHtml } from "../src/extract";
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
- What is wrong: Something else (explain below)

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

describe.skipIf(!dir)("right-set: replay against the sample fics", () => {
  it("keeps the readings you checked", () => {
    const files = existsSync(setDir) ? readdirSync(setDir).filter((f) => f.endsWith(".json")) : [];
    const bySlug = new Map<string, string>();
    for (const f of readdirSync(dir!).filter((x) => x.endsWith(".html"))) {
      try { bySlug.set(slugOf(extractFromHtml(readFileSync(join(dir!, f), "utf8")).meta.title ?? ""), join(dir!, f)); } catch { /* not a fic */ }
    }
    const report: string[] = ["# Right-set report", ""];
    let failures: string[] = [];
    for (const f of files) {
      const set = JSON.parse(readFileSync(join(setDir, f), "utf8")) as RightSet;
      const path = bySlug.get(set.fic);
      if (!path) { report.push(`## ${set.title}: skipped (no sample with this title in AO3_DIR)`, ""); continue; }
      const work = extractFromHtml(readFileSync(path, "utf8"));
      const a = analyzeWithPatterns(work.text, work.meta, { quiet: true });
      const pairingOf = (name: string): PairingResult | undefined => { const [x, y] = name.split("/"); return a.pairings.find((p) => p.pairing.toLowerCase().includes(first(x)) && p.pairing.toLowerCase().includes(first(y))); };
      const tally = { ok: 0, changed: 0, stale: 0, skipped: 0 };
      const lines: string[] = [];
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
        if (!seen) tally.stale++;
        else if (ok) tally.ok++;
        else {
          tally.changed++;
          lines.push(`- [${strength}] ${e.kind} ${e.card} · ${e.who ?? `${e.top} / ${e.bottom}`} ${e.role ?? ""} · ${e.via} · hash ${e.h}`);
          if (strength === "strong" || strict) failures.push(`${set.fic}: ${e.kind} ${e.card} ${e.via} (hash ${e.h})`);
        }
      }
      report.push(`## ${set.title}`, `${tally.ok} unchanged, ${tally.changed} changed, ${tally.stale} not found again, ${tally.skipped} ignored (disputed or retired)`, "", ...lines, "");
    }
    writeFileSync(join(dir!, "RIGHT_SET_REPORT.md"), report.join("\n"));
    expect(failures, "A reading you marked right (strong) has changed. If the change is deliberate or you now disagree, retire it with scripts/import-right-set.mjs --retire.").toEqual([]);
  });
});
