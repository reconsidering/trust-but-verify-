# Independent missed-scene review

After this change is merged and GitHub Pages deploys, open:

https://reconsidering.github.io/trust-but-verify-/review/missed-scenes.html

The existing readings/gold page also links here. On iPhone, open in Safari and choose the original samples ZIP from Files. Files are read locally; no story text is published or uploaded. Reloading preserves answers in this browser, but the story files must be selected again. Export a backup when stopping; browser storage can be cleared. Use Share / save answers where supported, or Export my answers.

## How to answer

Read the entire highlighted window. Use More context or browse elsewhere to resolve participants. Choose Acts present, No sexual act, or Not sure. For acts, add a separate entry for each act or change of participants. Record the performer and receiver, and whether it happens now, actually happened earlier, is wanted/proposed, is imagined/conditional, or is unclear. Names can be selected or typed, including an unlisted character or `Unclear`.

For oral acts, the performer uses their mouth. For penile penetration, the performer penetrates; for fingers/toys/manual stimulation, the performer uses those fingers/toys/hands. Solo masturbation needs only the performer. This avoids the engine's blowjob top/bottom terminology. Refine evidence start/end paragraph numbers within the highlighted window. Record only the part supported there; flag continuations outside it. Several entries may occupy the same paragraphs when acts happen together.

Check the completion box only after recording every act in the window, or confirming none. Not sure cannot be completed. Changes to the disposition or events reopen completion. Drafts are saved and exported, but incomplete and uncertain windows must not count as negative examples or completed inventories. Notes and common-context checkboxes are optional. Return `missed-scene-review-answers.json` for adjudication and engine comparison; this is a new schema, not the reading-label import format.

## What was sampled

Forty non-overlapping windows across ten previously reviewed adult-character sources: two random and two vocabulary-selected windows per fic, shuffled with a recorded seed. The eligible source pool ranges from 9,993 to 136,866 words: three short works (under 25,000), two medium (25,000–74,999), and five long (75,000+). Dialogue fractions vary from about 24% to 56%; mean paragraph lengths also vary. This covers a mix of prose structures, not a representative sample of every fandom or writing style.

Paragraph text and source metadata come from checksum-verified local snapshots. Selection never accesses detector hits, gold ranges, accepted labels, confidence, or roles. Random windows are selected by seeded SHA-256 rank from all eligible fixed 16-paragraph blocks in each source. Discovery windows are sampled from remaining blocks with at least two broad lexical cues; these cues are a separate vocabulary list, not detector patterns. Both lanes can contain no sex. Underage-tagged sources and windows/context mentioning children or minor ages are excluded conservatively. Source suitability still relies on the reviewed adult-source allowlist.

Only source titles/names, source and paragraph hashes, lengths/style summaries, sampling counts, seed, reference commit, and window coordinates/hashes are public. Story paragraphs, sentences, and private browser validation exports are excluded. This batch does not modify the detector, existing gold/reading answers, or generated models.

## Using the results

Compare the human inventory with a frozen detector replay at `referenceCommit`. Inspect both its audit readings and reported scenes: a cue suppressed by a guard differs from an act detected but filtered from the final result. Normalize the human oral performer/receiver convention before comparing engine directions (for a blowjob, the engine's top is the human receiver).

Score completed, sufficiently resolved actual-event annotations separately from wanted/imagined/unclear annotations. Keep act detection, participant direction, and act typing distinct. Actual memories are real evidence but should not be treated as present-time acts. Negative completed windows test hallucinated acts. Boundary continuations and uncertain identities require adjudication before scoring; do not automatically equate a lack of a hit inside a window with a completely missed scene elsewhere.

Use the 20 random windows for an initial recall check within this eligible ten-source pool. For a pooled estimate over eligible windows, each random window has inclusion probability `2 / eligibleWindows` for its source, so weight it by `eligibleWindows / 2`. Report reviewed coverage and uncertainty; incomplete/nonrandom response can bias the estimate. Discovery windows are for finding fixable omissions and should be reported separately, not mixed into a corpus-wide recall number. This small batch is not an exhaustive scene census and does not estimate AUC or log loss. Deduplicate continuations before reporting scene-level counts.

Only after adjudication should confirmed misses become new gold evidence and narrow detector fixes. These scene inventories must not be imported directly as old detector-hit training labels.

## Reproduce and validate

```sh
node scripts/build-missed-scene-batch.mjs /absolute/private/snapshots ao3-samples public/review/missed-scenes.json --fics a-la-carte,belonging,dogbird,innocent-until,lightning,negotiation,on-my-mind,rwrb-balls,sweeter,tricks-of-the-trade --commit DETECTOR_REFERENCE_COMMIT
```

Keep snapshots local. Changing the seed, source versions, reference commit, or selected windows creates a different batch identity; exports cannot silently mix batches. Feedback import validates all identities and ranges before modifying saved answers, and preserves newer local answers.

Validation: six new sampling/annotation/import tests, 17 combined new and existing review tests, 1,483 unit tests passed (13 optional/fic-dependent cases skipped in the unit-only run), and production type-check/build passed. Chromium tested the built page under the repository URL prefix at 390px and desktop widths: all ten sources loaded from the original ZIP; multi-act annotation, occurrence type, completion, flags, persistence, JSON export/import all worked; no uploads, external requests, runtime errors, or horizontal overflow. This is mobile emulation, not a physical iPhone/Safari test. The existing reliability-behind-labels warning remains; generated files were not regenerated. Gold/corpus detector replay was not repeated because detector source is unchanged.
