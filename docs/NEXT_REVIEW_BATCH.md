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
