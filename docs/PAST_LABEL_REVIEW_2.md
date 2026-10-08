# Second review of fifty past labels

After merge and deployment, open [past labels, batch 2](https://reconsidering.github.io/trust-but-verify-/review/next-batch.html?review=past2), upload the matching original HTMLs or ZIP, answer, and export `past-label-review-2-answers.json`.

Each item shows the saved historical judgment and its source, today’s full-name engine claim and individual confidence, and my reading, verdict and subjective confidence. Agree/Disagree refers to **my assessment of today’s engine claim**. Agree fills context, applicable errors and the historical-review decision; those can be overridden. No answer is accepted automatically just because it was selected or because the model is confident.

## What was scanned

The scan inventories all seven confidence-label files (1,769 assignments), all 300 owner spot-check answers, and all 22 right-set files (950 positive/negative records). Combining confidence and blind-spot-check audit keys gives 2,069 distinct keys, with 1,471 recoverable in the available current adult-source audits. This is an inventory count, not independent judgments. Unavailable keys do not become negative labels. The ten gold files have 87 scene ranges; all three scene-review inventories have 76 windows. Those ranges/events are contextual evidence, not per-hit judgments or evidence of absence.

The newest uploaded past-label answers were identity-validated in the preceding work. They contain 39 correct, seven wrong, one uncertain, and three disagreements without engine verdicts (L9, L10, L42). Their returned passages are excluded from this new set, including the unresolved three; no disagreement is converted into a correct/wrong label. Their distinctions informed this manual review: correct attribution, act/instrument selection, self versus partnered contact, occurrence frames, and indirect desires that should not be dismissed solely because later activity is different. Earlier owner-confirmed act inventories are shown where they overlap an item, using citations and names rather than private notes or story text. Omissions never imply that an act or hint is wrong.

The engine and committed confidence model are main `227c463`. Fresh audit snapshots from `4c1e362` were reused after checking that the intervening main change only adds the previous review page: detector, feature extraction, parser and model code are unchanged. Each score comes from the current committed probability function and pattern precision. Scores are not held-out measurements or scene-level confidence. The current source hashes and paragraph counts remain attached to every item for local upload matching.

Previously excluded sources involving sexual content with minors remain excluded; `pact-of-ice-and-fire.html` remains excluded because adult status could not be confirmed. Nonsexual family-care passages can expose a wrong person chosen by the detector; they do not establish sexual activity involving that person.

## Selection and history limits

There are 1,644 recoverable candidate reading records after the history/source exclusions. Rank combines surviving label/model disagreement (55%), indirect attribution (15%), occurrence-frame cues near performed matches (15%), contact/instrument warning families (10%), and known changed/quarantined claim identity (40% bonus). Those are prioritization weights, not probabilities. The recently answered first past-label set and the new suspect batch 3 cited windows are excluded. Targets are at least 12 paragraphs apart and capped at six per source. Ties use stable key order; no model settings were tuned. The final 50 targets span 22 fics and have 76 historical records. For speed, the ten supported current readings that conflict with earlier rejections/uncertainty appear first, followed by four uncertain cases, then 36 fresh-identity checks whose negative verdicts still look supported. All fifty cited windows were read in context and verified not to overlap the two excluded sets.

Retired-only records are not candidates: a record already explicitly retired following an owner correction must not be promoted back into an unresolved training judgment. If a candidate also has a surviving record, its retired history may still be shown. Conflicting positive/negative marks are displayed as uncertain, rather than collapsed into a definitive wrong label. Historical right-set summaries retain their saved people, role and category; they do not invent the full original engine description or instrument.

**The original full claim is unavailable for these historical records.** Hash-only labels therefore say that explicitly. A saved report summary is labeled as a summary, not a recovered verbatim original claim. The old verdict judged the old claim; it does not automatically judge the substituted current description. There is no fabricated pre-change reference. Agree requests a fresh claim-specific label when the original identity is unverified, even when my proposed verdict agrees with the surviving older verdict.

## What the inspection found

| My assessment of today’s engine claim | Items |
|---|---:|
| Correct | 10 |
| Wrong | 36 |
| Not sure | 4 |

This is a risk-ranked audit of uncertain or conflicting historical labels, **not fifty demonstrated bad labels**. Many high-confidence disagreements with old negative labels turn out to be continuing engine errors. Those judgments are reported honestly rather than flipped to agree with the model. The ten supported current readings and four uncertain readings are the clearest candidates for replacing or resolving an older rejection/uncertainty; missing original identities prevent a blanket assertion that the old owner judgment was wrong.

Paraphrased findings include a plug’s tip interpreted as a penis; mouth penetration counted as anal; fingers under clothing counted as genital fingering; onstage performers assigned to watching characters; a comparison with earlier self-touch reported as present masturbation by the wrong person; and oral, handjob and anal readings whose direction is reversed. Supported readings include explicit penetration after finger preparation, oral completion, a correctly attributed fantasy, and a receiving person pressing back into touch. Body, posture and ordinary-care cues remain cues; no missing inventory entry is used to reject them.

## After the owner answers

Save or share the new answer file and return it. The first review’s saved answers remain untouched. A later explicit import can use:

```sh
node scripts/import-review-batch.mjs public/review/past-labels-2.json /path/to/past-label-review-2-answers.json tests/labels/review-2026-10-08-past-labels-two.json
```

Only explicit judgments on today’s claim become confidence labels. Historical Keep/Needs fresh label choices and assistant confidence never imply labels. Importing also does not automatically clear quarantines or restore retired right-set records. Detection-rule fixes and retraining remain separate work.

No engine rules, labels, models, reliability tables, metrics, source fics or raw feedback are committed. Validation checks the fifty history/claim/citation records, source bounds, exclusions, unanswered feedback handling and Agree behavior. Validation passed: `npm test` (1,571 passed; 13 skipped) and `npm run build`. All 22 source checksums and the final built review manifest match.
