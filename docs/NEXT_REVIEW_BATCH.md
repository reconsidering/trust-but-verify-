# Next owner review

After this page change is merged and GitHub Pages finishes deploying, open:

https://reconsidering.github.io/trust-but-verify-/review/next-batch.html

On iPhone, open the link in Safari. Choose the original `ao3-samples.zip` from Files, or choose the listed story HTML files. Text is read on the device and is not uploaded. The page checks file and paragraph hashes before enabling answers. Reopening the page keeps your answers, but you must choose the story files again.

For each claim, choose Correct, Wrong, or Not sure. You can select common errors, add context, and read more surrounding paragraphs. Export or share the answers JSON when finished, and send it back for label import. Browser storage can be cleared by the browser, so export a backup when you stop.

The batch has 40 readings from several adult-character sources: 20 selected for attribution or act-selection risk, 10 sampled with diversity limits, and 10 high-confidence controls. Confidence and selection group are hidden during review. The mixed selection is for finding errors and improving training coverage; its error fraction does not estimate the error rate across all stories. It also cannot measure missed scenes by itself. Use the “Another act is missing” checkbox and context box to identify nearby omissions for a separate scene inventory.

The public manifest contains claims, character names, file identities and hashes, and paragraph numbers. Story sentences and paragraphs stay in private snapshots. The batch records the detector commit that produced the readings, even when the page is built from another branch.

To reproduce a batch from private samples, check out the desired detector version and force an evaluation so cached runs do not skip snapshot collection:

```sh
REVIEW_SNAPSHOT_DIR=/absolute/private/snapshots npm run eval -- --force
node scripts/build-review-batch.mjs /absolute/private/snapshots ao3-samples public/review/next-batch.json --fics comma-separated-reviewed-adult-sources --commit detector-commit
```

The builder requires an explicit adult-source list and additionally excludes underage warnings, age-related tags, sexual context involving minor ages, and child-containing review windows. Review source suitability before adding to the list. Do not commit private snapshots or story files.

To import returned feedback:

```sh
node scripts/import-review-batch.mjs public/review/next-batch.json /absolute/path/answers.json
```

The importer validates batch, detector commit, source and reading identity, then maps Correct to `ok`, Wrong to `wrong`, and Not sure to `unclear`. It preserves newer answers. Tracked provenance excludes free-text context. Review any requested detector corrections separately with invented-adult tests; merge labels and fixes before retraining. Compare held-out log loss and AUC on the same split, and measure recall against independently inventoried scenes.

Validation for this page: 1,433 unit tests passed, including five review/import/integrity tests; production type-check/build passed. A 390px browser test under the repository URL prefix loaded all ten sources from the original ZIP, saved and restored answers, exported the JSON with the detector identity intact, and observed no uploads or external requests. This is browser validation with mobile emulation, not a test on physical iPhone hardware.

## Recheck each gold range

Select **Gold ranges**. The page now has 50 separate recorded ranges across seven stories, with the complete range highlighted and its own correct/wrong/not-sure answer, common errors, and notes. Claims describe the act and direction in that range, including both directions of switch verdicts. Browse surrounding passages for context. These are stored gold expectations, not new engine predictions.

Belonging is excluded from this batch and its returned answer was discarded; its existing engine gold labels are unchanged. Five other owner answers are recorded without free-text passages in `tests/gold-review/owner-2026-10-06.json`: three confirmed verdicts, an unresolved possible reverse-direction blowjob reference in A La Carte, and the Angel fingering correction. The Angel 4270–4287 range was removed from the anal scenes; its later anal scene and whole-story verdict remain.

Range answers use a new batch identity and export as `gold-range-review-answers.json`. Old whole-story answers cannot be imported as range answers and are not copied onto ranges. The original 40-reading batch and its answers are unchanged. Loading the ZIP still works across both views. Export feedback when stopping, since browser storage can be cleared.

Rebuild metadata with `node scripts/build-gold-review.mjs`, optionally supplying the private snapshot directory to revalidate source identities. `gold-sources.json` records source and paragraph checksums from the original verified manifest. No story text is published. Range feedback must be adjudicated as scene evidence; it is not reading-level model training data.

Validation: ten review/import/integrity tests and the production build passed. A targeted real-story Angel gold replay confirmed 2/2 verdicts and 3/3 remaining scenes, with no stale labels or flipped scenes. The corrected labels expose one existing anal false positive in the fingering window; detector changes are separate from this review update.


Owner update, October 7: Prince 55–75 is now a fingering scene, not penile anal penetration. WereCompeer is split into oral activity at 976–981 and anal penetration/cockwarming at 982–986; both labels remain. The uncertain Rushing 1148–1150 item is excluded from the review batch only; its existing evaluation scene is unchanged. Slipfast's simultaneous blowjob/fingering scene remains labelled blowjob. The returned 51 answers and approved decisions are preserved without free-text passages in `tests/gold-review/owner-2026-10-07.json`.

This metadata rebuild changes the gold batch identity. Keep the previous exported answers as a backup; they are retained in the repository feedback record, but are not copied automatically onto changed scene ranges. The original 40-reading batch is unchanged. Anal claims now explicitly say “anally” to distinguish them from oral activity.

## Independent missed-scene inventory

For passages selected without detector hits, use [the missed-scene review](MISSED_SCENE_REVIEW.md). After its page update is merged, it is linked from the readings page and hosted at `review/missed-scenes.html`. Its answers record acts, participants, occurrence type and evidence ranges rather than correct/wrong engine claims.

## Second likely-error set: act-by-act review

After merging, open `review/next-batch.html?review=suspect2`. The selector retains the previous likely-error batch, sampled readings and gold ranges. Each batch has separate saved answers.

The new set contains 40 unused encounter windows from 16 adult-screened sources, refreshed against main at `569919f`. Selection ranks individual readings by learned confidence, with story and pattern caps. Manual continuity checks exclude continuations of earlier review scenes and combine candidates from the same encounter. No story paragraphs are published.

There are 156 proposed act entries, including separate occurrence types for performed acts, memories, imagined acts, a recording, habitual activity and an unsupported act. Each entry shows my subjective confidence, its evidence range, and matching engine readings with their individual confidence and original act/hint kind. No matching reading means no score; it does not mean zero confidence. Related incorrect readings remain visible in the full engine list. A correct main reading can coexist with an incorrect secondary reading.

Mark each proposed act Correct, Wrong or Not sure. Open its correction section to edit act, giver, receiver, occurrence, errors and context. These controls are independent of the main engine claim. The coverage checkbox records that you checked the shown window; it never converts unlisted acts or hints into negative labels. Add any unlisted act and its participants/range in the main context box.

Export as `suspect-scene-review-2-answers.json`. Export/import preserves per-act corrections, proposal revisions, window identity and coverage. Matching source hashes and proposal identities are checked before import. The manifest also retains per-reading attribution and confidence feature inputs for later training analysis. Assistant proposals are not accepted labels. The existing command-line label importer handles the main claim only; returned act inventory must be adjudicated separately so those additional answers are not lost or mistaken for hint negatives.

This targeted sample is for finding errors and improving training coverage, not estimating overall accuracy, recall or held-out AUC. The model and engine rules are unchanged.

Validation: 1,506 unit tests passed (13 optional tests skipped), followed by 16 targeted review tests after the final UI update. Production type-check/build passed. A 390px Chromium check loaded all 16 original sources, saved/exported/imported/restored independent act corrections and coverage, switched to the previous batch, and found no JavaScript errors, uploads or horizontal overflow. This is mobile-width browser validation, not a physical iPhone test.
