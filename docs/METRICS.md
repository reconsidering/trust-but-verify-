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

## Reading the Oct 5 row

The drop from Oct 4 comes from the label mix, not from the model getting worse. The audit labels alone, on fics the model has not seen: log loss 0.212 → 0.189, AUC 0.569 → 0.719. The 318 weighted deep-dive labels are mostly the hard cases (61 wrong, 19%): the pattern record does worse than chance on them (AUC 0.40) and the context model does not help (log loss 0.585 → 0.599). Of the wrong hits, 19% fall among the 10% least-trusted by the pattern record and 23% with context (chance is 10%): the model nudges mistakes toward the front of the queue, but only a little.
