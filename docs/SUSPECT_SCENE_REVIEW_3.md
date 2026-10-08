# Fifty new likely-error passages

Review page after merge and deployment: [batch 3](https://reconsidering.github.io/trust-but-verify-/review/next-batch.html?review=suspect3).

The new set has **50 passages across 20 fics, with 87 individually proposed acts**. Each target shows the current engine claim and confidence, my assessment and subjective confidence, and separate act cards with their own citations and scores. Upload the original HTML files or ZIP on the page to read the paragraphs locally. No fic text is published.

## Feedback and selection

The supplied `past-label-review-answers.json` matches published batch `past-labels-28061110392e`; all 50 answer identities and revisions were validated against that batch. It contains 39 correct, seven wrong, one uncertain, and three Disagree answers with no engine verdict (L9, L10, L42). Only the 46 definitive correct/wrong verdicts contribute to ranking. The uncertain answer and three unresolved disagreements never become inferred correct/wrong judgments. The public manifest records the feedback checksum and totals, rather than the private notes.

Earlier owner review batches and the new definitive answers inform a smoothed act-family error rate; the newest answers receive twice the weight. These reviewed examples were deliberately selected for suspicion and overlap other evidence, so their rates are **ranking signals, not calibrated error estimates**. The new review also respects the owner's distinctions between desired anal activity and later oral activity, between self-touch and partnered stimulation, and between fluid/body cues and performed acts. No broad rule or confidence change was made from these distinctions.

The detector was run afresh on the 51 locally available sources using main `4c1e362`. A single tagged evaluation pass produced the current audit snapshots and feature vectors. Current individual probabilities were calculated with the committed model and reliability table, without retraining. These are not whole-story confidence scores or held-out measurements.

Candidates are unlabelled detections marked as performed acts, handjobs or solo stimulation. Existing confidence-label keys and normalized right-set records are excluded. Every earlier published review interval and accepted scene-review window is excluded, with a 20-paragraph buffer around each. Selected targets are at least 40 paragraphs apart, with at most five targets per source and pattern. Cited windows were checked separately for overlap; no prior cited passage is repeated. This prevents nearby repeats, but does not prove that widely separated passages belong to different narrative encounters.

After source and local-context exclusions, 716 candidate readings remained. Rank is 65% model doubt, 20% smoothed reviewed-family error rate, 10% attribution ambiguity and 5% occurrence-frame cues. Tags are not ranking features. Tie seed: `suspect3-2026-10-08:<fic>:<key>`. The previous exclusions for sexual content involving minors remain in force. `pact-of-ice-and-fire.html` was additionally excluded because adult status could not be confirmed; its selected target was replaced with the next eligible candidate under the same limits. Item IDs remain stable for this published batch.

## Proposed judgments

| My judgment of the target engine claim | Items |
|---|---:|
| Wrong | 27 |
| Correct | 23 |
| Not sure | 0 |

These are proposals for the owner, not accepted labels. My confidence is subjective and may be wrong. This is a deliberately suspicious sample, not an estimate of the engine's overall accuracy.

The suspected errors include ordinary washing/drying interpreted as masturbation, hand-holding and hair contact interpreted as handjobs, self-stimulation assigned as partnered contact, bystanders assigned an act, remembered or planned activity counted as performed, and fingers or a strap-on confused with a penis. Several low-ranked readings are nevertheless clearly supported by their surrounding context. Correct readings remain in the set rather than being replaced after my review.

Additional act cards distinguish oral finger contact, external anal stimulation, fisting, rubbing and other contact from the standard scored acts. Memories, fantasies, habits, wanted activity and explicitly not-performed acts remain separate. A missing matching engine detection has **no engine score**, rather than a fabricated zero; a scored additional act displays the maximum probability of the matching readings listed in the metadata. Confirming a not-performed card does not create a performed event. Contextual hints may be displayed for orientation, but omissions never create negative hint labels.

## Owner steps and later import

1. Open batch 3 and upload the original fics or ZIP. Files remain on your device.
2. Agree or Disagree with **my assessment**, then check each proposed act separately. Agree fills the main context and applicable error boxes. It does not silently approve the other act cards. Add missing acts or corrections and mark coverage complete only after checking the cited window.
3. Export or share `suspect-scene-review-3-answers.json` and send it back.

Future import uses the existing tool, with a separate output for the act inventory:

```sh
node scripts/import-review-batch.mjs public/review/suspect-scenes-3.json /path/to/suspect-scene-review-3-answers.json tests/labels/batch-suspect-three.json tests/scene-review/suspect-three.json
```

Only explicit owner verdicts on the main engine claim become per-reading confidence labels. The act inventory retains separately confirmed performed acts and leaves unmarked acts and hints unjudged. Assistant scores never train the model. The newly uploaded past-label answers were used for this selection; they have **not** been imported into training labels in this change. Any later label import, detection-rule fixes and retraining are separate work.

## Validation

Batch checks validate all 50 identities, source/citation bounds, 87 act proposals, model probabilities and earlier-review exclusions. Interaction checks cover Agree autofill, independent act answers and the new export filename. Validation passed: `npm test` (1,568 passed; 13 skipped) and `npm run build`. No engine code, generated model/reliability files, labels, metric rows or sample fics are included.

## Owner answers imported (2026-10-08)

The returned `suspect-scene-review-3-answers.json` was validated against batch `suspect-three-4dd3a27d25b0`, including source hashes, reading identities, evidence windows and proposal revisions. Its 38 saved windows produce:

- **35 explicit engine judgments:** 16 correct, 17 wrong and two uncertain. Only the 33 definitive judgments are eligible for confidence training; uncertainty is retained without becoming a binary label.
- **Three unresolved disagreements:** U5, U17 and U45 have no engine verdict or correction. They create no labels.
- **59 individually marked act proposals:** 51 correct, six rejected and two uncertain. Of the 51 confirmations, 43 are performed events, three habitual, two wanted, two not performed and one imagined.
- The 43 performed events include 35 in the standard scored categories and eight other confirmed contact or completion events. Non-performed confirmations, rejections and uncertainty remain review records rather than performed events. No hint or omitted act receives an inferred negative label.

The accepted outputs are `tests/labels/batch-suspect-three-4dd3a27d25b0.json` and `tests/scene-review/suspect-three-4dd3a27d25b0.json`. Both record the checksum of the original uploaded feedback. Private correction text and assistant confidence are excluded from both files.

U14/A1 explicitly rejects the proposed act and clears its act field. The importer now accepts a blank act only on an explicit **wrong** answer, preserving the owner's rejection exactly. A blank act on a correct or uncertain answer remains invalid, and this rejected record cannot create a performed event.

Twelve windows have no saved answers: U4, U13, U26, U31, U32, U34, U37, U39, U40, U42, U46 and U48. Including the three unresolved disagreements, 15 main engine claims still need a verdict. Of the 87 act proposals, 28 remain unmarked. These remain open for later exports; no decisions were guessed.

This import adds review data only. Detection rules and generated confidence files are unchanged. Retrain separately after merging if these accepted judgments should affect the model's confidence scores.
