# Hands-free orgasm detector check

Checked latest main `e7d1650` on 2026-10-09. All source hashes and referenced orgasm-paragraph hashes matched. Ran the complete stories for the 12 referenced works plus Lightning. Paragraph indices below are zero-based and ranges inclusive.

The detector recovered **3 of 14 reviewed positive passages (21%)**, missed 11, and did not detect the one additional qualified rimming example. The positive denominator includes one narrative summary. This small, deliberately selected set does not estimate overall corpus recall or false-positive rate. All three emitted target readings credited the right receiving character.

| File | Chapter | Paragraph range | Orgasm paragraph | Result | Engine score |
|---|---|---|---:|---|---:|
| `lock-it.html` | One-shot | 185–196 | 196 | false negative | — |
| `belonging.html` | 20 | 5408–5420 | 5414 | false negative | — |
| `tricks-of-the-trade.html` | 4 | 839–847 | 847 | detected correctly | 35% |
| `tricks-of-the-trade.html` | 12 | 2576–2581 | 2581 | false negative | — |
| `were-compeer.html` | 6 | 428–432 | 432 | false negative | — |
| `were-compeer.html` | 8 | 600–605 | 605 | false negative | — |
| `knock-me-up.html` | One-shot | 129–136 | 136 | false negative | — |
| `autocorrect.html` | One-shot | 179–190 | 190 | false negative | — |
| `quantum-leap.html` | One-shot | 60–74 | 73 | false negative | — |
| `innocent-until.html` | 8 | 4889–4895 | 4894 | detected correctly | 35% |
| `pact-of-ice-and-fire.html` | 22 | 4630–4637 | 4636 | false negative | — |
| `prince-prisoner-puppy.html` | 8 | 375–378 | 376 | false negative | — |
| `prince-prisoner-puppy.html` | 9 | 405–407 | 407 | false negative | — |
| `more-views.html` | 10 | 890–904 | 904 | detected correctly | 39% |
| `sugar-alpha.html` | 8 | 575–582 | 582 | qualified match not detected | — |

A missing reading has no engine confidence score; the dash is not 0% certainty. The detector emits `body` bottom-role hints, not new anal-sex scenes. Scores above are the app’s hint confidence, not calibrated probabilities of orgasm occurrence.

[Agent-readable results](../public/review/hands-free-detector-check.json) · [Source locations and checksums](../public/review/hands-free-orgasm-locations.json)

## Findings

- `lock-it.html` ¶196: The climax and the cage/no-penile-stimulation evidence are spread across sentences. Releasing a cage is outside the current without-touch grammar.
- `belonging.html` ¶5414: An intervening phrase about being on a penis separates the climax verb from the without-touch clause; the current pattern expects them adjacent.
- `tricks-of-the-trade.html` ¶2581: The pattern matches and resolves Dean/Castiel correctly, but generic NEG treats inability to hold back as negation. Independently, anal context falls outside the current-plus-previous-paragraph guard. Invented-adult controls reproduce each blocker.
- `were-compeer.html` ¶432: The intercourse passage uses direct-stimulation wording not covered by HF_WITHOUT. The fisting passage distributes orgasm and no-penile-attention evidence across sentences.
- `were-compeer.html` ¶605: The intercourse passage uses direct-stimulation wording not covered by HF_WITHOUT. The fisting passage distributes orgasm and no-penile-attention evidence across sentences.
- `knock-me-up.html` ¶136: The untouched penis and ejaculation are described with intervening movement/position clauses rather than the compact possessive-untouched-penis-spills construction.
- `autocorrect.html` ¶190: Prevented self-touch and the later orgasm are in separate paragraphs. The climax does not repeat a compact hands-free cue.
- `quantum-leap.html` ¶73: The explicit cue is a question about ability. The later performed orgasm is described separately, so the engine does not link the confirmation back to the question.
- `pact-of-ice-and-fire.html` ¶4636: The climax clause includes intervening positional wording, and the without-touch clause includes an own modifier. The supported grammar does not cover this combination.
- `prince-prisoner-puppy.html` ¶376: The summary uses starting-to-climax and on-his-own wording; the later passage describes an idea-driven climax during penetration. Neither matches the current inventory. One reference is a narrative summary, not a separately timed scene.
- `prince-prisoner-puppy.html` ¶407: The summary uses starting-to-climax and on-his-own wording; the later passage describes an idea-driven climax during penetration. Neither matches the current inventory. One reference is a narrative summary, not a separately timed scene.
- `sugar-alpha.html` ¶582: Rimming and no penile stimulation are established before the orgasm, which does not repeat a supported hands-free phrase. Testicular contact makes the expected hands-free label qualified.

## Negative controls and limits

Lightning ¶5449–5480 was correctly excluded: the anticipated hands-free orgasm is ultimately achieved with manual stimulation. Sugar Alpha’s thought-driven orgasm also produced no anal hands-free hint. No incorrect hands-free emissions were found in the checked windows; no broader false-positive estimate is implied.

## Validation and next work

All 24 existing detector unit tests passed. The full-story source-reference check passed, as did the Lightning negative control and invented-adult diagnostics for the context and negation blockers. No detector, label or model file was changed. Full unit/build/regression runs were not necessary for this read-only check.

The first follow-up should preserve the existing negative controls while narrowing the unrelated-negation guard and retaining an established encounter across intervening paragraphs. Then extend wording for explicit no-direct-penile-stimulation and cage-retained orgasms. Finally address evidence split between a prevented touch and a later performed orgasm. Each needs guarded invented-adult tests and a full before/after regression; simply widening the context window could create false positives.
