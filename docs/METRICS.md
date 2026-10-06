# Context-model metrics over time

Held-out (5-fold) log loss and AUC of the per-pattern record alone versus the record plus context (`src/heuristic/learned.ts`), from `tests/learn.test.ts`.
Lower log loss and higher AUC are better. "Unseen fics" holds every hit of a fic out together, so the model is scored on fics it was not trained on (the random split lets hits from the same fic sit on both sides and flatters it). Rows are added automatically by `npm run regen` (the local, nine-minute run that retrains the model);
earlier rows were copied from commit messages. The label mix changes between rows (more labels, and since Oct 5 a share of weighted Claude-made
labels), so compare the *gap* between the two columns more than the absolute values.

| Date | Labelled hits (wrong) | Log loss: record → +context | AUC: record → +context | Unseen fics: log loss | Unseen fics: AUC | Commit |
|---|---|---|---|---|---|---|
| 2026-10-03 | not recorded | 0.161 → 0.141 | 0.66 → 0.77 | not recorded | not recorded | 10edb44 |
| 2026-10-04 | 1,486 (78) | 0.196 → 0.164 | 0.706 → 0.824 | not recorded | not recorded | 055197b |
| 2026-10-05 | 1,856 (133) | 0.2654 → 0.2473 | 0.555 → 0.645 | 0.2686 → 0.2523 | 0.536 → 0.612 | ac0f469 |
| 2026-10-05 | 1,857 (123) | 0.2478 → 0.2361 | 0.568 → 0.646 | 0.2096 → 0.1914 | 0.563 → 0.676 | c144b6b |
| 2026-10-06 | 1,848 (101) | 0.2143 → 0.1941 | 0.606 → 0.715 | 0.2103 → 0.1921 | 0.598 → 0.703 | dee23e0 |
| 2026-10-06 | 1,841 (96) | 0.2068 → 0.1863 | 0.612 → 0.724 | 0.2039 → 0.1846 | 0.604 → 0.716 | 309407d |
| 2026-10-06 | 1,838 (99) | 0.2124 → 0.1890 | 0.596 → 0.734 | 0.2128 → 0.1945 | 0.573 → 0.700 | based on 3d11c32 |

## Attribution and act-selection features (Oct 6)

After the feature and owner-label corrections merged, both models were trained and evaluated on the same 1,838 labelled readings with the same five held-out fic folds and ridge penalty 8. This comparison isolates the extra features; comparing against earlier rows would also include changes to the labels and engine.

| Feature set | Unseen-fic log loss | Unseen-fic Brier | Unseen-fic AUC |
|---|---|---|---|
| Original 15 context features | 0.2029 | 0.0496 | 0.623 |
| Expanded 49 context features | 0.1945 | 0.0485 | 0.700 |

The expanded set lowers log loss by 0.0084 (about 4%) and raises AUC by 0.077. These are trust-weighted cross-validation estimates for the correctness of detected readings, not missed-scene recall or a test on a separate new corpus. There are 99 wrong readings; the labels are selected reviews, not a random sample of every detection. No confidence interval was calculated. Fourteen audit/report disagreements were excluded by the existing trainer.

The expanded model is not equally good across label sources. On the 223 full-weight mistake-report readings (28 wrong), unseen-fic log loss is 0.436 versus 0.401 for the pattern record alone, although AUC improves from 0.547 to 0.601. On the 1,460 audit readings (67 wrong), log loss is 0.169 and AUC 0.758. Aggregate improvement should not be read as proof that every reported error is fixed.

To reproduce the comparison without changing model weights, run `AO3_DIR=ao3-samples COMPARE_FEATURES=1 npx vitest run tests/learn.test.ts --testTimeout=1500000`. An optional fresh `ROWS_CACHE` path saves the extracted 49-feature rows for subsequent comparisons; use a new path after changing labels or feature extraction. The feature comparison always retrains both sets on identical rows and splits.

The 55-fic regression against `3d11c32` found no changed audit readings and no verdict changes for existing pairings; 13 existing act confidence scores changed. One additional tagged-mode pairing, Cliff/Tanner in `lucky-find`, crossed the existing incidental-pair visibility threshold and appears as unclear anal at 19% confidence. Inspection found existing finger act/attribution errors in its evidence; the new model does not fix those errors. This visibility change is a limitation of the model update, separate from the aggregate metric improvement. Gold totals remain 17/17 verdicts, 81 scenes right, 0 flipped, 7 missed, and 7 false positives; accepted-reading replay and the build passed. After adjusting a test to allow equal capped trust while still requiring a strictly higher underlying pair probability, the full unit suite passed (1,428 tests).

## Reading the Oct 5 row

The drop from Oct 4 comes from the label mix, not from the model getting worse. The audit labels alone, on fics the model has not seen: log loss 0.212 → 0.189, AUC 0.569 → 0.719. The 318 weighted deep-dive labels are mostly the hard cases (61 wrong, 19%): the pattern record does worse than chance on them (AUC 0.40) and the context model does not help (log loss 0.585 → 0.599). Of the wrong hits, 19% fall among the 10% least-trusted by the pattern record and 23% with context (chance is 10%): the model nudges mistakes toward the front of the queue, but only a little.

## Tried and dropped: surface features for wrong-person and hint mistakes (Oct 5)

Seven extra features were recorded on every hit and scored on unseen fics: pronoun count in the sentence, a spoken line, distinct cast members nearby, the actor not named earlier in the paragraph, a same-gender pair, first-person words, and hint-vs-act. They did not help: log loss 0.2523 → 0.2519, AUC 0.612 → 0.618, wrong hits among the 10% least-trusted 23% → 22%, and nothing on the deep-dive labels (AUC 0.49 → 0.51). Surface wording around a hit does not tell the model that the *person* was resolved wrongly. The next thing to try is features from how the engine chose the person (elided subject, last subject, point of view, learned epithet, address book), which needs hooks inside the engine.

## Spot-check of Claude-made labels (Oct 5, 100 readings judged blind by the owner)

Claude's labels are not equally good in both directions. Of the readings Claude called **right**, the owner agreed with 48 of 57 (84%). Of the readings Claude called **wrong**, the owner agreed with only 10 of 37 (27%); the other 27 were judged fine. The disagreements are spread over many patterns and fics, mostly narrated acts, so Claude was too ready to call a reading wrong. (Six readings were marked not sure.) So Claude-made labels are now stored at weight 0.85 when right and 0.3 when wrong (`npm run dive -- import --weight 0.85 --weight-wrong 0.3`), and the 662 existing ones were migrated.

The context model and the pattern record learn from the weights, but they were *scored* with every label counting 1, so the noisy "wrong" labels still counted in full as ground truth. The unseen-fics rows are now scored with each label counted by its trust. With the new weights, on fics the model has not seen: log loss 0.2091 → 0.1889 and AUC 0.555 → 0.681 (record alone → with context), against 0.2686 → 0.2523 and 0.536 → 0.612 before; wrong hits among the 10% least-trusted 16% → 25%.
