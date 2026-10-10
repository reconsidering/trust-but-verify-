# AI-corroborated October 4–5 labels

The owner authorized a provisional 0.9 weight for the 178 remaining original Claude judgments that ChatGPT agreed with at subjective confidence of at least 97%. This is AI corroboration, not a human spot check or a measured 97% accuracy rate. The one confident disagreement and three uncertain judgments are excluded, as are lower-confidence judgments.

Selection began with all 662 original Claude records. The owner's 195 October review answers were excluded, together with 187 additional previously checked records found across right-set owner entries, the three old blind spot-check rounds (including uncertain answers), owner audit rechecks and uploaded review answers. That left 280; 179 had assistant confidence of at least 97%, of which 178 agreed with Claude. Neither assistant agreement nor a new claim is recorded as an owner judgment.

All 178 original records now have weight 0.9 and corroboration provenance. Their original judgment is also preserved in `tests/labels/zz-corroborated-claude-oct4-5.json`, separately from any current label. The fics were replayed on main `9ad2225b8e15807e5d7e03095489eb596153c797`; source checksums were checked. No fic text is included.

| Result | Original records |
|---|---:|
| Exact original and current claim agree | 53 |
| Separately assessed current claim has a different full identity | 92 |
| Current reading absent | 18 |
| Multiple current readings: individual verdict withheld | 10 |
| Claim changed since the assistant assessment: withheld | 5 |
| Total | 178 |

The first two groups produce 145 replay-confirmed, independently assessed current readings, all judged correct. Two saved solo/hint records refer to the same exact current claim, so there are **144 unique current training labels**, each at 0.9. All current labels use the assistant's current verdict, not Claude's old verdict. A different full identity does not by itself prove an improvement: people, role, act, occurrence or other identity fields may differ.

The other 33 historical records remain available as history but do not create current training labels. Original records whose exact claim differs or is unavailable are retired. The metadata delegates training to the full claim-bound record; it is not an extra vote. Fourteen historical audit keys are superseded. An absent detection is never a negative label.

The context-model loader honors audit weights and binds these labels to fic checksum, paragraph, pattern, act, occurrence kind, people and role through the existing reviewed-claims mechanism. Pattern-table accounting replaces older audit assignments only for the weighted/superseded keys, and skips the delegated original right-set records, avoiding duplicate votes. Unrelated legacy accounting is retained. Later owner decisions retain full-weight precedence. Existing human-reviewed records are unchanged.

Detection rules and generated `learned.ts`, `reliability.ts` and `METRICS.md` are unchanged. Per AGENTS.md, generated models are retrained separately after label changes merge. A report-only learning trial can measure the new labels without publishing a model; changing the evaluation label mix also limits comparison with previous metrics.

## Validation

- Replay of all 12 review fics completed; exact claim matches and source checksums verified.
- Compared every old/new right-set record: only the 178 provisional Claude records changed; all 322 owner-attributed records were preserved exactly. Existing owner audit files are unchanged.
- `npm test`: 157 files passed, 11 skipped; 1,828 tests passed, 16 skipped. The additional final targeted checks passed all 15 tests across three files.
- `npm run build`: passed, with the existing large-chunk warning.
- Full `npm run check`: passed. Gold verdicts 15/15; scenes right 80 (flipped 0, missed 0); false positives 5; point of view 74.3%; text senders 27/27. Gold is no worse than the accepted baseline. All corpus shards passed after automatic larger-heap retries.
- Generated model files, detector code, metrics history and fic files are not included in this change.

## Report-only confidence-model fit

The full learn test ran without `WRITE_LEARNED`; no generated model was published. It found 1,799 labelled feature-bearing hits, 160 wrong, and excluded 56 changed or unverifiable claims. Of the 144 corroborated current keys, 91 entered the context fit at exactly 0.9 weight; none was rejected for a changed claim.

| Measurement | Main's last published row | This label trial |
|---|---:|---:|
| Labelled feature-bearing hits (wrong) | 1,924 (162) | 1,799 (160) |
| Unseen-fic AUC, pattern record + context | 0.679 | 0.655 |
| Unseen-fic log loss, pattern record + context | 0.2766 | 0.2919 |
| Wrong hits in least-trusted 10%, with context | Not recorded in METRICS.md | 19% |

The baseline is the published 2026-10-10 row, commit `5672f46`, not a fresh baseline run in this task. These results do not demonstrate better confidence-model accuracy. AUC fell 0.024 (within the previously observed approximately 0.03 noise), and log loss is higher. Labels, weights and the usable claim pool changed, so this is not a comparison on an identical held-out evaluation set. The smaller hit count is reported explicitly; no undocumented explanation is assumed. This PR implements the authorized label provenance/weighting change, not a claim that model accuracy improved. Retraining for publication remains a separate PR after merge.
