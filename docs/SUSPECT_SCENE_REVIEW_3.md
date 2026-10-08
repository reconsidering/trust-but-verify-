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
