# Claude labels from October 4–5: owner review

The page at [review/claude-oct4-5.html](../review/claude-oct4-5.html) includes all **662 original records marked `source: claude` with October 4 or 5 in `seen`**, recovered from archived commit `0549771`. It includes the original records even when a later owner review changed the label. It does not turn assistant proposals into accepted labels.

Each item keeps three questions separate: whether the original reading was correct, whether Claude’s judgment of that reading should remain, and whether the current engine’s readings are correct. For example, an originally reversed reading can correctly retain Claude’s “wrong” label while today’s corrected reading receives “correct.” The stored identities retain participants, role, polarity, category, pattern, hash, original label file, and label side. A historical rejection must never automatically transfer to a corrected claim.

## What to do

1. Open the page after merging this PR. It is also linked from the review index.
2. Select your sample ZIP or the matching individual HTML files. Renaming a file is fine: contents and paragraph checksums identify it. The cited paragraphs appear only on your device.
3. Click **Agree with my assessment**, **Disagree with my assessment**, or **Not sure** for each item. Agree fills both claim verdicts, the keep/replace decision for Claude’s label, the correction, and applicable error boxes. Existing notes and error selections are preserved. Disagree leaves the verdicts open for your correction.
4. Use **Save my answers**, or **Share / save to Files** when your browser supports file sharing. Send back `claude-oct4-5-review-answers.json`. You may save and submit partial progress.

Answers autosave when browser storage is available. Export before switching browsers or devices; restore the JSON on the other device. Story files must be selected again after reopening. No reading-completeness checkbox gates your answers.

A later import must use this page’s `claude-label-review/v1` schema and separate historical/current judgments. Existing generic review importers should not receive this file without an adapter. The original verdict can revise the original Claude label; the current verdict needs fresh claim-identity checks before it becomes a confidence label. Uncertain and unanswered decisions stay out of training. Retraining remains a separate task. This PR changes no accepted labels, detector code or generated model files.

## Coverage and provenance

Current engine and confidence model: `9043679`. The archived engine reproduces matching descriptions for **611** records. The other **51** show saved fields with an explicit warning that exact historical wording, instrument, or occurrence was not preserved. Even reproduced descriptions are reconstructions, not archived UI screenshots.

All records have independently checked surrounding passages and an assistant proposal with subjective confidence. Existing full-text Belonging assessments were reused where applicable, with their cited surroundings rechecked; mismatched historical participants were judged separately. No story text is committed. The adult-content screen checked archive warnings, tags and age references in these samples; unrelated nonsexual childhood references do not establish underage participation in their adult encounters.

There are **591 distinct primary paragraphs**. Three pairs of records describe the same source action separately as a hint and a solo reading; both records remain. Three short saved hashes reproduce matching engine claims at more than one location; those items show all matching engine citations. Broad substring matches inside other sentences were excluded when exact audit matches were available.

| Fic file | Original Claude labels |
| --- | ---: |
| belonging.html | 207 |
| jacks.html | 123 |
| tricks-of-the-trade.html | 90 |
| were-compeer.html | 78 |
| hate.html | 62 |
| prince-prisoner-puppy.html | 25 |
| knock-me-up.html | 20 |
| shawnee.html | 16 |
| rwrb-balls.html | 12 |
| rental-agreement.html | 12 |
| whisper.html | 10 |
| steady-eddie.html | 7 |
| **Total** | **662** |

The independent proposals recommend replacing **141** original Claude judgments, keeping **514**, and leaving **7** uncertain. These are review proposals, not accepted corrections or a random-sample accuracy estimate. **218** records have later owner-labelled entries for the same pattern and passage in their current right-set file; the page shows whether the saved claim fields actually match. Those items appear later by default and can be filtered separately. This history is limited to the corresponding right-set file, not a claim that every later review ledger was imported.

**28** records have no current match for the same pattern and saved hash. That absence does not prove a false negative: another pattern may detect the act. The page labels confidence unavailable for absence, and keeps removal judgments separate from present-reading judgments. A current group judged wrong means at least one displayed reading is wrong; the owner can distinguish individual differences in the correction box.

Current scores are individual model probabilities where feature vectors exist, otherwise the displayed engine hint/item confidence. Model probabilities use the checked-in model and pattern precision table; they are not the app’s aggregate pairing verdict confidence. Both scores are shown when a displayed item score also exists. Historical scores are the engine confidence saved with the label, not Claude’s certainty and not the training weight. Missing scores are unavailable rather than zero. Assistant confidence is an uncalibrated subjective estimate.

## Verification

The review-specific tests cover complete coverage, unchanged historical identity, separate old/current judgments, missing confidence, autofill preserving edits, duplicate prevention, safe partial-answer import/export, local paragraph rendering and storage failure. A Chromium check at a 390-pixel mobile viewport verified layout, autofill, local HTML checksum matching, cited-paragraph display, JSON download and autosave restoration with no browser errors. The whole unit suite and production build are also run; no corpus regression is required because detector behavior is unchanged.

## Importing the owner's answers

`node scripts/import-claude-label-review.mjs <answers.json> [--dry]` validates the whole file against this batch, then applies only the verdict on the **original** reading to the Claude label it was made about, at full weight (the same four cases as `scripts/spotcheck-apply.mjs`). Uncertain, unanswered and "disagree" answers change nothing. A reading an earlier owner answer already settled the same way is counted, not touched. An answer that **differs from an earlier owner label** is listed and left alone, unless the owner says the new answer replaces it: `--overwrite-conflicts` then makes the labels say exactly the new answer (the earlier one is retired, and a label is created if only the opposite one existed). The verdict on today's engine readings is not imported: it still needs a fresh claim-identity check. Notes are never copied into tracked files. First import (195 answers, 2026-10-09): 16 Claude "wrong" labels and 49 retired Claude "right" entries replaced by the owner's, 7 Claude "wrong" labels retired, 84 already settled, and 27 that differed from an earlier owner label, overwritten at the owner's request.
