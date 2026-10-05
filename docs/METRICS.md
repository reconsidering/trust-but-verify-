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

## Reading the Oct 5 row

The drop from Oct 4 comes from the label mix, not from the model getting worse. The audit labels alone, on fics the model has not seen: log loss 0.212 → 0.189, AUC 0.569 → 0.719. The 318 weighted deep-dive labels are mostly the hard cases (61 wrong, 19%): the pattern record does worse than chance on them (AUC 0.40) and the context model does not help (log loss 0.585 → 0.599). Of the wrong hits, 19% fall among the 10% least-trusted by the pattern record and 23% with context (chance is 10%): the model nudges mistakes toward the front of the queue, but only a little.

## Tried and dropped: surface features for wrong-person and hint mistakes (Oct 5)

Seven extra features were recorded on every hit and scored on unseen fics: pronoun count in the sentence, a spoken line, distinct cast members nearby, the actor not named earlier in the paragraph, a same-gender pair, first-person words, and hint-vs-act. They did not help: log loss 0.2523 → 0.2519, AUC 0.612 → 0.618, wrong hits among the 10% least-trusted 23% → 22%, and nothing on the deep-dive labels (AUC 0.49 → 0.51). Surface wording around a hit does not tell the model that the *person* was resolved wrongly. The next thing to try is features from how the engine chose the person (elided subject, last subject, point of view, learned epithet, address book), which needs hooks inside the engine.

## Spot-check of Claude-made labels (Oct 5, 100 readings judged blind by the owner)

Claude's labels are not equally good in both directions. Of the readings Claude called **right**, the owner agreed with 48 of 57 (84%). Of the readings Claude called **wrong**, the owner agreed with only 10 of 37 (27%); the other 27 were judged fine. The disagreements are spread over many patterns and fics, mostly narrated acts, so Claude was too ready to call a reading wrong. (Six readings were marked not sure.) So Claude-made labels are now stored at weight 0.85 when right and 0.3 when wrong (`npm run dive -- import --weight 0.85 --weight-wrong 0.3`), and the 662 existing ones were migrated.

The context model and the pattern record learn from the weights, but they were *scored* with every label counting 1, so the noisy "wrong" labels still counted in full as ground truth. The unseen-fics rows are now scored with each label counted by its trust. With the new weights, on fics the model has not seen: log loss 0.2091 → 0.1889 and AUC 0.555 → 0.681 (record alone → with context), against 0.2686 → 0.2523 and 0.536 → 0.612 before; wrong hits among the 10% least-trusted 16% → 25%.
