# Claude's second review of the ChatGPT labels from 2026-10-09 and 2026-10-10

The rule the owner set: where Claude and ChatGPT agree, the label keeps its weight (0.9); where they disagree, the label is reweighted to **0.3**. Nothing was relabelled, retired or deleted; only `weight` changed in `tests/right-set/`.

How it was done: every ChatGPT label (source `chatgpt`, seen 2026-10-10, weight 0.9) was turned back into the passage it points at by re-reading the fic with the current engine, then judged **blind** (Claude saw the claim, the sentence and its neighbours, never ChatGPT's verdict) under the tagging conventions in `AGENTS.md`. Verdicts were compared afterwards. No fic text is stored here.

## What was in scope

| | Labels |
| --- | ---: |
| ChatGPT labels added 10-09/10-10 (all at 0.9) | 1,037 |
| of which ChatGPT called the reading right (`entries`) | 728 |
| of which ChatGPT called it wrong (`negatives`) | 309 |
| **Reviewed by Claude** | **730** |
| Not reviewable here (four fics are not in the uploaded zip) | 307 |

Not reviewed, still at 0.9: Wolfbird (195), Dog Roses, Marigolds… (78), Apogee (24), the full spectrum of human emotion (10). Upload those four fics and the same pass can be run on them.

Not touched: the owner's own labels (full weight, 5 of them dated 10-09/10-10) and Claude's earlier labels (0.85 / 0.3, dated 10-05).

## Result

| | Count | Share |
| --- | ---: | ---: |
| Agree (weight kept at 0.9) | 669 | 91.6% |
| Disagree (reweighted to 0.3) | 61 | 8.4% |

| ChatGPT said | Claude said | Count |
| --- | --- | ---: |
| right | right | 489 |
| wrong | wrong | 180 |
| right | **wrong** | **44** |
| wrong | **right** | **17** |

Match rate of the 730: 681 readings were found again by the current engine, and 49 labelled-wrong readings the engine no longer produces were found by searching the fic text for their sentence. Those 49 were judged too (48 wrong, 1 right; all agreed).

## By fic

| Fic | Reviewed | Agree | Reweighted | ChatGPT right → Claude wrong | ChatGPT wrong → Claude right |
| --- | ---: | ---: | ---: | ---: | ---: |
| A WereCompeer | 146 | 140 | 6 | 3 | 3 |
| lover, you can’t be wrong | 94 | 88 | 6 | 0 | 6 |
| Heavyweight | 92 | 81 | 11 | 11 | 0 |
| Icarus, Burning | 76 | 66 | 10 | 8 | 2 |
| pañuelo melody | 70 | 67 | 3 | 1 | 2 |
| Needing the Knot | 67 | 61 | 6 | 6 | 0 |
| like a dog with a bird at your door | 39 | 35 | 4 | 3 | 1 |
| wicked thing | 34 | 29 | 5 | 4 | 1 |
| Bluebells and Daylillies… | 33 | 31 | 2 | 1 | 1 |
| Foxden Park | 32 | 31 | 1 | 1 | 0 |
| wretched rhetoric | 26 | 24 | 2 | 1 | 1 |
| the lathe | 21 | 16 | 5 | 5 | 0 |
| **Total** | **730** | **669** | **61** | **44** | **17** |

## By kind of label

| Kind | Reviewed | Agree | Disagree | Agreement |
| --- | ---: | ---: | ---: | ---: |
| Scene (a performed act) | 323 | 315 | 8 | 97.5% |
| Hint (a cue that points at top or bottom) | 387 | 335 | 52 | 86.6% |
| Solo | 20 | 19 | 1 | 95.0% |

Scenes are almost all in agreement. Nearly all the disagreement is in hints.

## Where they disagree

**ChatGPT right, Claude wrong (44).** 42 are behaviour or position cues taken as sexual role evidence when the passage is not sexual, or when the engine credited the wrong person: comforting (11), gripping firmly (11), leading by the hand (4), lifting or carrying (3), protecting (2), and 11 others (pinning, tilting a face up, head on a chest, kneeling, pushing back, blushing, checking in). Examples of the situations: a pat on the arm in a fight scene, gripping a chin to check an injury, a rescue carry, a hand squeeze during an argument, a blush at an embarrassing question. Under "an everyday action, not in a sexual scene" these are wrong readings. The remaining 2 are anal-sex readings credited to the wrong act or person.

**ChatGPT wrong, Claude right (17).** Most are readings where the act really happens (or is clearly wanted) and the person is right, but the engine called it a hypothetical, a fantasy or "wanted". ChatGPT marked the reading wrong because of that mislabel; Claude counted the role evidence as right. These are a judgement call on strictness, and the owner may want to settle the convention (a correctly credited act labelled as "wanted" or "fantasy": right, or wrong?).

**Where both said wrong (180)** the dominant causes were: roles reversed (for example the person sucking credited as the one sucked), a solo act credited to a partner, two spellings of one person treated as two people, metaphors (collars, leashes) taken literally, and acts in the wrong category (fingers or tongue read as a penis).

## Two things for the owner

1. The 0.3 weight is a "Claude disagreed" marker, not a verdict: some of the 61 are probably right. The 17 mislabel cases in particular could go back to 0.9 if the owner rules that way.
2. The unit tests that pinned every ChatGPT label at 0.9 (`five-fic-deep-dives`, `four-pdf-deep-dives`, `foxden-park-deep-dive`, `icarus-burning-deep-dive`, `panuelo-melody-deep-dive`) now accept 0.9 or 0.3.

The generated files (`reliability.ts`, `learned.ts`) are not regenerated here; the reliability workflow and a later `npm run regen` pick up the new weights.
