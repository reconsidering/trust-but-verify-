# Engine map — where things live

One page, so a deep dive doesn't start by re-reading 12,000 lines. Line numbers drift; search for the function name.

## The flow, in order
1. `analyzeWithPatterns` (`src/heuristic/index.ts`) — entry. Reads tags (`tags.ts`, `tagcheck.ts`), the cast (`characters.ts`, `canon*.ts`), notes (`notes.ts`), quotes (`quotes.ts`).
2. Learns epithets ("the blond", "the smaller man") from the cast and tags: `epithets.ts` `learnEpithets` → `ctx.epithets`. When any are learned, **`scan()` runs twice**: the first pass learns which character an epithet usually is, the second uses it. A fix that changes pass 1 can change pass 2.
3. Point of view: `pov.ts` `detectPov` (first/third, who the "I" is, `autoSole` for one-character fics). Texting/chat formats: `texting.ts`.
4. `scan()` walks the paragraphs. Each sentence is matched against `patterns.ts` (the list of act patterns; each has an id, groups for top/bottom and a category). Epithets are swapped for short tokens once per sentence before matching.
5. `handleMatch` (the big one, about 1,000 lines) turns a pattern match into a reading — or throws it away. It is a **long run of guards, each with a quoted example in its comment**: not-an-act (curses, figures of speech, habits, wishes, rules), wrong body part (mouth vs ass, slit of a cock), whose act it is (the one *doing* vs the one *feeling*), left-out subjects, outsiders not in the cast, babies/children, fights. Add a new guard next to the one that resembles it; run `npm run trace` to see which survive.
6. Who is the top and who the bottom: `resolve.ts` `resolvePair` / `partnerOf` (uses `Ctx`), then `elidedSubject`, `firstEntity`, `notNamedLater`, `resolveToken` in `index.ts`.
7. Dialogue: `attributeSpeaker` → `attributeSpeakerFrom`, `addresseeOf`, `nameAddressee`, `scanDialogue` (`index.ts`); terms of address that one character keeps using for another: `address.ts` (`AddressBook`).
8. Fix-ups after the scan: `settlePronounPairs` (a he/she pair that only fits one way), `settleAboRoles` (alpha/omega from `ctx.epithets` `noun:alpha`/`noun:omega` and `tags.roles`).
9. Output: scenes `groupScenes`, hints and verdicts `buildOthers/Solo/Manual/Vaginal`, vibes `buildVibes`, dynamic `buildDynamic`, per-reading confidence `buildAct` + `scoreDesires` (`builders.ts`).
10. Confidence: `reliability.ts` (per-pattern precision, from labels — **generated**), `learned.ts` (context model — **generated**), `ao3-prior*.ts` (tag priors).

## Where to look for a symptom
| Symptom | Start at |
|---|---|
| Right act, wrong person on top | `elidedSubject`, `resolvePair`, `partnerOf`, `settlePronounPairs`; then POV (`pov.ts`) |
| Act that isn't one (idiom, wish, habit, other body part) | the guard list in `handleMatch` |
| Someone outside the cast credited | `outsiderNames` and the "outsider" guards in `handleMatch`; `notNamedLater` |
| Wrong speaker / who is addressed | `attributeSpeakerFrom`, `addresseeOf`, `address.ts` |
| Alpha/omega flips a tagged pair | `settleAboRoles` (skipped when `tags.roles` disagrees) |
| Verdict switch/versatile wrong | `builders.ts` `buildAct`, `tagsFor`, `scoreDesires` |
| Fic got slow | a new regex in `patterns.ts` or `handleMatch` (see below) |
| Confidence off for a whole pattern | `reliability.ts` is regenerated from labels, don't hand-edit |

## Traps found the hard way
- **Catastrophic regexes.** `\s{3,}[”"’]?[,\s]*(NAMES)…` made fics ~10× slower. Anchor with a lookbehind (`(?<=\s)`), avoid nested optional whitespace. `tests/smoke.test.ts` has a speed test, but it only catches the problem by hanging.
- **`partnerOf` bystanders.** Dropping a "bystander" partner broke multi-partner fics; keep a partner that is the last one in any pairing.
- **"He … inside her"** self-fingering rule fires on "her" unless a hole/ass noun is present.
- **Alpha/omega** settle must not override tags that give alpha non-top or omega non-bottom.
- **Pass 1 / pass 2.** Epithet learning means a change to subject resolution is tested twice over; check fics with epithets (e.g. prince-prisoner-puppy).
- **Oral guards** ("pushed in" with a mouth nearby) are easy to make too broad; rounds 18/22/65/75 caught that. Narrow, then regress.
- **Generated files** (`reliability.ts`, `learned.ts`) don't go in label or fix PRs.
- **Memory.** The longest fic needs ~4 GB; `check` caps jobs per 6 GB. SIGKILL = out of memory.
- **Never quote fics** in tests; paraphrase (`tests/round*.test.ts` show the style).

## Where tests live
`tests/round*.test.ts` (one per fix round, paraphrased sentences), `tests/smoke.test.ts` (speed and known-mistake classes), `tests/trace.test.ts`, `tests/dive.test.ts`; labels in `tests/gold/` and `tests/right-set/`. How they're run: `docs/TESTING.md`.
