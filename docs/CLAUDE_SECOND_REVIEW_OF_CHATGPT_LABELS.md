# Claude's second review of the ChatGPT labels from 2026-10-09 and 2026-10-10

The rule the owner set: where Claude and ChatGPT agree, the label keeps its weight (0.9); where they disagree, the label is reweighted to **0.3**. Nothing was relabelled, retired or deleted; only `weight` changed in `tests/right-set/`.

How it was done: every ChatGPT label (source `chatgpt`, seen 2026-10-10, weight 0.9) was turned back into the passage it points at by re-reading the fic with the current engine, then judged **blind** (Claude saw the claim, the sentence and its neighbours, never ChatGPT's verdict) under the tagging conventions in `AGENTS.md`. Verdicts were compared afterwards. No fic text is stored here.

## What was in scope

| | Labels |
| --- | ---: |
| ChatGPT labels added 10-09/10-10 (all at 0.9) | 1,037 |
| of which ChatGPT called the reading right (`entries`) | 728 |
| of which ChatGPT called it wrong (`negatives`) | 309 |
| **Reviewed by Claude (all of them)** | **1,037** |

The review ran in two passes because the fics arrived in two zips: 730 labels on the 12 fics in the first zip, then the 307 labels on Wolfbird, Dog Roses, Apogee and the full spectrum of human emotion once they were supplied.

Not touched: the owner's own labels (full weight, 5 of them dated 10-09/10-10) and Claude's earlier labels (0.85 / 0.3, dated 10-05).

## Result

| | Count | Share |
| --- | ---: | ---: |
| Agree (weight kept at 0.9) | 930 | 89.7% |
| Disagree (reweighted to 0.3) | 107 | 10.3% |

| ChatGPT said | Claude said | Count |
| --- | --- | ---: |
| right | right | 657 |
| wrong | wrong | 273 |
| right | **wrong** | **71** |
| wrong | **right** | **36** |

Of the 1,037, 1,006 were found again by the current engine; 49 labelled-wrong readings the engine no longer produces were found by searching the fic text for their sentence and were judged too (all 49 agreed).

## By fic

| Fic | Reviewed | Agree | Reweighted | ChatGPT right → Claude wrong | ChatGPT wrong → Claude right |
| --- | ---: | ---: | ---: | ---: | ---: |
| A WereCompeer | 146 | 140 | 6 | 3 | 3 |
| Wolfbird | 195 | 181 | 14 | 2 | 12 |
| lover, you can’t be wrong | 94 | 88 | 6 | 0 | 6 |
| Heavyweight | 92 | 81 | 11 | 11 | 0 |
| Dog Roses, Marigolds… | 78 | 53 | 25 | 20 | 5 |
| Icarus, Burning | 76 | 66 | 10 | 8 | 2 |
| pañuelo melody | 70 | 67 | 3 | 1 | 2 |
| Needing the Knot | 67 | 61 | 6 | 6 | 0 |
| like a dog with a bird at your door | 39 | 35 | 4 | 3 | 1 |
| wicked thing | 34 | 29 | 5 | 4 | 1 |
| Bluebells and Daylillies… | 33 | 31 | 2 | 1 | 1 |
| Foxden Park | 32 | 31 | 1 | 1 | 0 |
| wretched rhetoric | 26 | 24 | 2 | 1 | 1 |
| Apogee | 24 | 22 | 2 | 0 | 2 |
| the lathe | 21 | 16 | 5 | 5 | 0 |
| the full spectrum of human emotion | 10 | 5 | 5 | 5 | 0 |
| **Total** | **1,037** | **930** | **107** | **71** | **36** |

## By kind of label

| Kind | Reviewed | Agree | Disagree | Agreement |
| --- | ---: | ---: | ---: | ---: |
| Scene (a performed act) | 455 | 442 | 13 | 97.1% |
| Hint (a cue that points at top or bottom) | 555 | 462 | 93 | 83.2% |
| Solo | 27 | 26 | 1 | 96.3% |

Scenes are almost all in agreement. Nearly all the disagreement is in hints.

## Where they disagree

**ChatGPT right, Claude wrong (71).** Almost all are behaviour or position hints taken as sexual role evidence when the passage is not sexual, or when the engine credited the wrong person: comforting someone (20 across both passes), gripping firmly (11), leading by the hand (10), looking after someone (6), carrying or protecting (5), letting someone lead (3), plus pinning, face tilting, head on a chest, kneeling, blushing and similar. Typical situations: a pat or arm squeeze in a market or a fight, gripping a chin to check an injury, tea and cake, a rescue carry, being led to a stall or a settee for a cuddle. Under "an everyday action, not in a sexual scene" these are wrong readings. A few are readings credited to the wrong act or person.

**ChatGPT wrong, Claude right (36).** Most are readings where the act really happens (or is clearly wanted) and the person is right, but the engine called it a hypothetical, a fantasy or "wanted". ChatGPT marked the reading wrong because of that mislabel; Claude counted the role evidence as right. These are a judgement call on strictness, and the owner may want to settle the convention (a correctly credited act labelled as "wanted" or "fantasy": right, or wrong?).

**Where both said wrong (273)** the dominant causes were: roles reversed (for example the person sucking credited as the one sucked), a solo act credited to a partner, two spellings of one person treated as two people, metaphors (collars, leashes) taken literally, and acts in the wrong category (fingers or tongue read as a penis).

## Two things for the owner

1. The 0.3 weight is a "Claude disagreed" marker, not a verdict: some of the 107 are probably right. The 36 mislabel cases in particular could go back to 0.9 if the owner rules that way.
2. The unit tests that pinned every ChatGPT label at 0.9 (`five-fic-deep-dives`, `four-pdf-deep-dives`, `foxden-park-deep-dive`, `icarus-burning-deep-dive`, `panuelo-melody-deep-dive`, `six-upload-deep-dives`) now accept 0.9 or 0.3.

The generated files (`reliability.ts`, `learned.ts`) are not regenerated here; the reliability workflow and a later `npm run regen` pick up the new weights.

## Owner rulings on the 107 disagreements (2026-10-10)

The owner ruled on 62 of the 107 on a review page. The outcome:

| Ruling | Count | What was done |
| --- | ---: | --- |
| ChatGPT was right | 36 (28 where Claude had said wrong, 8 where Claude had said right) | Weight put back to 0.9 |
| Claude was right | 20 (18 where ChatGPT had said wrong, 2 where it had said right) | The ChatGPT label is retired and the owner's verdict stored as a full-weight owner label on the other side |
| Unsure | 6 | Left at 0.3 |
| Not ruled | 45 | Left at 0.3 |

So 51 labels remain at 0.3. The owner sided with ChatGPT on most of the everyday-behaviour hints that Claude had marked wrong.

The unit tests for the deep dives now allow a retired ChatGPT entry and an owner entry on the opposite side of the same reading. The generated files are still not regenerated.
