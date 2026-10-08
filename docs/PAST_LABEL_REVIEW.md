# Recheck 50 past labels

Review URL after merge/deployment: [/review/next-batch.html?review=past](https://reconsidering.github.io/trust-but-verify-/review/next-batch.html?review=past).

This is a review set, not a label correction or engine fix. The current engine/model is main `a1a7a39`. The proposed calls are based on reading the cited paragraphs and their surrounding context; they are not accepted training labels.

## What was compared

The scan inventoried all seven confidence-label files (1,769 distinct audit keys), 22 right-set files (950 entries including retired/disputed records), 300 blind spot-check answers, ten gold files with 87 recorded scene ranges, both gold-feedback files, and all three scene-review inventories (76 windows). These sources overlap and must not be added together as independent judgments.

The replay scope is the 51 previously age-screened HTML sources available locally. Sources excluded for sexual content involving minors remain excluded. An unavailable source or unmatched key is not treated as a false negative. Of the audit keys, 1,564 could be recovered in current or pre-change snapshots; 205 could not. No missing original claim is reconstructed from a sentence hash.

Detection audits from `3ebbfdf` were reused only after verifying that the current `src/` differs solely in the generated model coefficients; the detection and feature extraction code is unchanged. Every source checksum was verified and paragraphs re-extracted with the current parser. Every displayed engine confidence was recalculated using the current committed `probability` function and `precisionOf`, without retraining or writing model files. These are scores from a model trained on existing labels, **not independent held-out evidence**.

The scan produced 2,141 recoverable per-reading candidates, including 36 quarantined keys, 40 changed claim identities/reference readings, and 15 removed readings. The review prioritizes surviving claims with current individual confidence scores: quarantined or changed identities, conflicts with earlier mistake-report people/occurrences, overlapping recent owner reviews, and disagreement between old labels and current model trust. A high score alone never overrides an owner label. Ties use stable key order; no random sampling. Identical current claims at the same citation are consolidated, with at most eight selected readings per fic.

The final selection contains **50 readings across 17 fics and 49 cited paragraphs**. Thirty-seven selected claims changed relative to their saved identity or the pre-PR-133 engine reference; 32 are already quarantined. Two distinct labels at one WereCompeer paragraph concern different claims (conditional self-fingering and bodily fluid), so both remain review items. Uncertain-only candidates were excluded. Some already-reviewed passages reappear deliberately because this task revisits historical labels, rather than sampling new unlabelled scenes.

## What my review found

| Proposed judgment of today's engine claim | Items |
|---|---:|
| Correct | 39 |
| Wrong | 9 |
| Not sure | 2 |

Most selected older rejections now point to corrected finger, toy, oral, or historical readings. They need fresh claim-specific judgments; this does **not** mean the old rejection of the old claim was incorrect. Earlier unversioned audit judgments often lack their full original claim metadata. The page says so, and labels the `6e878a4` engine reading as a comparison reference, never as a recovered original owner reading.

Examples of current problems, paraphrased:

- An adult imagines self-touch while a partner watches; the engine recognizes fantasy but assigns the action to the watching partner. Another remembered solo act is still assigned to the person in the video rather than the viewer.
- Finger preparation transitions explicitly to penile penetration, yet a depth match inherits the earlier fingers.
- Two adults mirror self-fingering, but a hit reports one fingering the other.
- Conditional self-fingering that is never undertaken is still reported as a performed solo act.
- An oral receiver wants to keep the partner deep in their mouth, but the hint is categorized as anal sex.
- A memory of oral activity is classified as hypothetical, and anal slick is described as come leakage.

The recent owner-confirmed handjob in the Rwrb passage also conflicts with an older wrong label on the same current claim. That item identifies both records for adjudication. My confidence figures are subjective confidence in the proposed judgment, not measured calibration or a new model.

Body/position hints remain hints. Positive-only or incomplete inventories never make omitted hints or other acts negative. An existing plug's removal does not establish a new insertion. Recent review evidence is shown as the recorded act, participants, occurrence and citations, with its original batch/item ID; rejected proposals are not promoted to performed events.

## How to answer

1. Open the linked review set and load the matching samples ZIP or HTML files. The source and paragraph checksums must match. Story text stays on the device, is rendered as text, and is never included in exports.
2. Compare **Past labels**, **Current engine reading + confidence**, and **My proposed reading + confidence**. If helpful, separately choose Keep verdict / Needs fresh label / Not sure. That historical decision alone never creates a training label.
3. Agree/disagree with my assessment, or mark the current engine claim correct/wrong/not sure directly. Add common-error checkboxes and additional context. A disagreement alone does not mean that the engine is right; explicitly mark its verdict.
4. Export **past-label-review-answers.json** and return it for import. Saved answers from older batches remain separate and unchanged.

On a later explicit import, use `scripts/import-review-batch.mjs` with `public/review/past-labels.json` and an explicitly dated output such as `tests/labels/review-2026-10-08-past-labels.json`. Label files are replayed in filename order; the new file must sort after older judgments so an earlier batch cannot overwrite the fresh claim identity. Only explicit current-claim verdicts become confidence labels, with source/paragraph/act/occurrence/participant identity. Assistant scores, old labels and historical-review decisions never infer an accepted verdict. Claim-only decisions remain in the private exported feedback; historical decisions are also retained alongside accepted current answers when present. Existing forced quarantines and disputed/retired right-set entries require separate owner adjudication; importing this batch does not automatically remove them. Retrain the model separately after reviewed labels are incorporated.

No engine rules, past labels, learned weights, reliability table, metrics or sample files changed in this update.
