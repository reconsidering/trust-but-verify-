# Context-model metrics over time

Held-out (5-fold) log loss and AUC of the per-pattern record alone versus the record plus context (`src/heuristic/learned.ts`), from `tests/learn.test.ts`.
Lower log loss and higher AUC are better. Rows are added automatically by `npm run regen` (the local, nine-minute run that retrains the model);
earlier rows were copied from commit messages. The label mix changes between rows (more labels, and since Oct 5 a share of weighted Claude-made
labels), so compare the *gap* between the two columns more than the absolute values.

| Date | Labelled hits (wrong) | Log loss: record → +context | AUC: record → +context | Commit |
|---|---|---|---|---|
| 2026-10-03 | not recorded | 0.161 → 0.141 | 0.66 → 0.77 | 10edb44 |
| 2026-10-04 | 1,486 (78) | 0.196 → 0.164 | 0.706 → 0.824 | 055197b |
| 2026-10-05 | 1,856 (133) | 0.2654 → 0.2473 | 0.555 → 0.645 | ac0f469 |
