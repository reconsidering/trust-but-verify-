# Checking the engine against real fics

Developer tools that take a folder of AO3 `.html` downloads (the folder is never committed). The day-to-day loop (`check`, `regress`,
`dive`, `trace`, `regen`) is in [TESTING.md](TESTING.md); this page describes what each kind of evidence is.

Developer tools that take a folder of AO3 `.html` downloads (the folder is never committed):

```sh
npm run eval -- ao3-samples                    # every fic, in parallel and cached; writes REPORT.md and eval.json
node scripts/eval-compare.mjs old-folder new-folder [--all]   # structured diff of two runs; exits 1 if a verdict changed
AO3_DIR=ao3-samples npx vitest run tests/pattern-audit.test.ts --testTimeout=1500000   # writes PATTERN_AUDIT.md
AO3_DIR=ao3-samples npx vitest run tests/gold-eval.test.ts                             # writes GOLD_REPORT.md
```

- **Sample eval.** `npm run eval` splits the fics across one vitest process per core (longest first, by how long each took last
  time), runs each fic blind and with its tags, and writes one result file per fic in `<folder>/.eval/`. A fic whose result was
  made by the same engine source and the same file is skipped, so a rerun with nothing changed takes a fraction of a second and
  adding one fic costs only that fic (`--force` redoes everything, `--jobs N` and `--only a,b` limit it). `REPORT.md` has the same text
  as before; `eval.json` has the verdicts, scene and hint counts and confidence per pairing for `eval-compare`, which prints verdict
  changes and, with `--all`, every change in counts and confidence. On four cores the 54 samples take about six minutes cold (about ten in one process); `npm run regress` and `npm run check`
  ([TESTING.md](TESTING.md)) are what you normally run. Running `tests/ao3-eval.test.ts` by hand still works (one process, no cache).
- **Pattern audit.** For every pattern, how many acts and hints it produced, in how many fics, and a fixed-hash sample of the
  sentences it matched. A pattern that is matching the wrong thing (a room "slipped inside", a wave of nausea "swallowed
  down") shows up here without waiting for a bug report. Patterns with no hits at all are listed too.
- **Pattern reliability.** `tests/labels/*.json` hold hand-checked labels (ok / wrong / unclear) for the audit's samples, keyed by
  pattern and a hash of the sentence, never the sentence itself. `tests/reliability.test.ts` turns them into
  `src/heuristic/reliability.ts`: for each pattern, the share of its labelled hits that were read correctly (smoothed toward
  90% so a handful of samples can't condemn a pattern, floored at 0.4). The engine multiplies each hit's weight by that
  number, so a pattern that is often wrong counts for less without anyone hand-tightening it. The test fails when the table
  and the labels disagree; after relabelling run `WRITE_RELIABILITY=1 npx vitest run tests/reliability.test.ts`. Fixing a
  pattern makes its old labels stale, so relabel its samples from a fresh audit (`AUDIT_SAMPLES=8`, which also writes
  `PATTERN_AUDIT.json` with a key per row). Mistake reports name the pattern behind each flagged line.
- **Context model.** `src/heuristic/learned.ts` turns each hit's surroundings (how sexual the stretch is, whether both people are
  a declared pair, whether the actor is named, sentence length, fights, babies, "what if" words, left-out subjects) and the
  pattern's own record into a trust multiplier for that hit, replacing the flat per-pattern number. It is trained from
  `tests/labels/*.json` by `AO3_DIR=ao3-samples npx vitest run tests/learn.test.ts` (add `WRITE_LEARNED=1` to write the model);
  the report in `LEARN_REPORT.md` gives held-out log loss and AUC against the pattern record alone, and the model is switched on only if
  it wins. On the first training: log loss 0.161 to 0.141, AUC 0.66 to 0.77.
- **Scenes with others.** When a plain narrated act can't be placed between two people but one of them is a cast member, that
  person's role is kept as a weak hint (`~one-sided`). If the text points at someone outside the pair (a minor named character the
  cast list doesn't include, or a stranger label like "the twink", or a past partner), the moment also appears on a "Scenes with
  others" card with a report/looks-right button. Named partners are the same person throughout; strangers and unnamed ones are told
  apart by where in the story they appear. An unresolved "he" with no sign of an outsider stays a hint and is not listed.
- **Review queue.** `AO3_DIR=ao3-samples npx vitest run tests/review-queue.test.ts` picks the unlabelled hits where a wrong
  reading would move a result most (chance it is wrong × its share of the evidence behind its verdict × how close that verdict is
  to flipping; `QUEUE_RANK=unsure` ranks by the model's doubt alone), at most three per pattern, plus a few it trusts most, with the paragraph around each, into `REVIEW_QUEUE.json`.
  `node scripts/build-review-page.mjs REVIEW_QUEUE.json page.html` makes the page (Wrong / Fine / Not sure per row, saved as you
  click) and `node scripts/import-review-answers.mjs none <saved answers dir> tests/labels/review-DATE.json` turns the answers
  into labels. Then rerun `WRITE_RELIABILITY=1 npx vitest run tests/reliability.test.ts` and the training test.
- **Metamorphic tests.** `tests/metamorphic.test.ts` runs a table of act sentences as written, with the names swapped (roles
  must flip), in present tense, with a pronoun for the subject, negated, and as a dream or a wish (no scene may come out). A
  sentence that fails goes in its KNOWN list, so a new break fails the test and so does an unnoticed fix.
- **Gold labels.** `tests/gold/*.json` hold hand-checked readings of real fics (nine now, from hockey and rugby fics to a werewolf AU, Star Wars, 9-1-1, an omegaverse Stranger Things AU and the deep-dive fics): verdicts per pairing and act, which scenes are
  real and who tops (as paragraph ranges), acts whose scene list is complete (any extra scene is a false positive), known
  false positives, who the point of view is by section, and who sent which text. They store paragraph numbers and a hash of
  each paragraph, never the fic's own text; if the engine's paragraph splitting changes, the hash lets a file shift itself.
  The report gives verdict accuracy, scene recall and precision, POV and text-sender accuracy. `GOLD_STRICT=1` fails on any miss.

## The "looks right" set

Readings you mark "Looks right" in a mistake report can be kept (the report panel's **Save looks-right set** button downloads them as a small file with no story text; hand that file to Claude, or run the import below on it) as a locked set so a later change can't quietly undo them:

```
node scripts/import-right-set.mjs report.md           # fold a pasted report in (tests/right-set/<fic>.json: hashes and names, never fic text)
AO3_DIR=ao3-samples npx vitest run tests/right-set.test.ts   # replay them; writes RIGHT_SET_REPORT.md
node scripts/import-right-set.mjs --retire <fic> <hash> why  # stop enforcing one reading
node scripts/import-right-set.mjs --fixed <fic> why           # the mistakes in that fic were fixed: stop counting them against their patterns
```

The set also feeds the context model (`tests/learn.test.ts`): a "looks right" reading is a positive example and a reading reported wrong because it was *misread* (wrong person, not a sex act, a wish, and so on, but not "counted twice" or "too strong") is a negative one. Where a report and the audit review disagree about the same hit, neither is used. The per-pattern reliability table (`tests/reliability.test.ts`) counts the same readings, by pattern, so it needs no fic files. The model and the table are only regenerated (`WRITE_LEARNED=1`, `WRITE_RELIABILITY=1`) when the set has grown enough to matter. A hit that was both reviewed in the audit and marked in a report is counted twice; smoothing keeps that small.

People get things wrong, so a mark is weighed, not trusted outright. **Strong** (marked right in two reports, or a scene the engine itself put at 70%+) fails the test when it changes. **Single** (marked right once) is only listed in the report. **Disputed** (the same sentence is also listed as wrong in any report) and **retired** (a deliberate fix, or a mark you now disagree with) are skipped. `RIGHT_SET_STRICT=1` fails on any change. When a strong reading changes on purpose, retire it with the hash from the failure.

Labels made by a Claude pass over a fic (`npm run dive -- import <fic>`, see [TESTING.md](TESTING.md)) go into the same right-set files with `source: "claude"` and a weight of 0.9. They are never "strong": a set fails only when more of them change than label noise explains, and they count fractionally in the reliability table and the context model. A reading you later mark right yourself becomes full weight.
