# Negotiation: full-text owner review

The review is pinned to main commit `d497fd3`. All 1,637 story paragraphs (86,793 words) were read independently of the detections, then compared with the current tagged engine run. This is a review proposal, not a change to the detector or a new set of accepted labels.

Open [the review page](https://reconsidering.github.io/trust-but-verify-/review/negotiation.html) after this change is merged and Pages has deployed. Load the original Negotiation HTML or sample ZIP. Story text is read locally and is never published, sent to a server, stored in browser answer storage, or included in the exported answers. A renamed file works; a different version of the download does not pass the source check.

## Coverage and findings

The page groups all 67 current engine readings into 40 passages, with 36 additional act/context proposals. My assessments are 38 supported readings, 28 incorrect readings and one uncertain reading. Those counts include hints, aftercare and everyday behavior; they are **not** 28 incorrect sex acts. Three incorrect readings are scored anal/oral acts, and one further rubbing reading names the wrong partner.

| Finding | Citation | Proposed correction |
| --- | --- | --- |
| Clear missed handjob | ¶461–462 | Obi-Wan manually stimulates Anakin; interruption before orgasm does not negate the act. |
| Clear missed simultaneous handjob | ¶854–858 | Anakin manually stimulates Obi-Wan during oral sex. |
| Clear missed anal encounter | ¶1219–1221 | A distinct outdoor encounter has just finished. Retrospective narration still describes an actual event. |
| Possible additional handjob | ¶1136 | Obi-Wan grips Anakin at climax; manual contact is clear, but sustained stroking is less explicit. |
| Reversed oral roles | ¶855 | Anakin performs oral sex on Obi-Wan, rather than the reverse. |
| Contact counted as penetration | ¶1130 | External penile contact precedes actual insertion at ¶1133. |
| Habit counted as a new encounter | ¶1609 | A routine is summarized, rather than a distinct new encounter being shown. |
| Wrong participant in rubbing | ¶670 | Obi-Wan is present with Anakin; Bail is absent. |

The other incorrect cues concern pet equipment mistaken for human collars, historical collar ownership assigned to the present partner, self-touch assigned to a partner, reversed caring/protective roles, an absent bystander being selected, and nonsexual care classified as sexual aftercare. Four additional rubbing proposals are outside the currently scored act inventory. Wishes, imagined encounters, memories, habits, interrupted attempts and explicit non-events have separate occurrence choices. They must not all become performed scenes.

The whole-story anal direction and bidirectional oral verdict remain supported, despite these individual errors. The anal count hides an offsetting error: a habitual passage adds a counted encounter while an actual outdoor encounter is missed. Correct totals alone cannot establish correct detection.

## Fast review

1. Load the fic. The page initially prioritizes likely errors and missing acts; choose **All passages in story order** to check the entire review.
2. Read the cited passage. Every act card also shows its own cited paragraphs.
3. **Agree with all my assessments in this passage** fills each individual decision, corrections, participants, occurrence and applicable error boxes. Alternatively, agree with individual cards. These buttons agree with **my assessment**, not with the engine. An assessment that the engine is wrong automatically records **Engine wrong**.
4. **Disagree** leaves the engine/act verdict open. Mark the engine correct/wrong or edit and confirm the act. Disagreement never guesses the opposite correction. Switching from agreement removes that assessment's automatic notes/error boxes while preserving additional owner notes and other selected errors.
5. Add any act I missed. The coverage checkbox records that you checked the passage; it never creates negative labels for unlisted acts or hints.
6. Export the answers JSON and send it back. On supported iPhone browsers, **Share / save answers** uses the device share sheet. Exported answers can be restored on another device; source text must be loaded again. If browser storage is unavailable, export before leaving.

Engine scores are the current model's probability for the individual reading, or an existing displayed item score where applicable. Nineteen everyday cues have no individual engine score and explicitly say **unavailable**. A missed act also has no engine confidence; absence of a detection is not a zero-confidence prediction. My confidence scores are subjective estimates, not calibrated accuracy measurements. Several pattern hits can describe one encounter.

## Import after owner review

This dedicated page has a dedicated importer; the older generic importer does not accept its schema. For example, with the returned answers stored privately:

```sh
node scripts/import-deep-review.mjs \
  public/review/negotiation.json \
  /tmp/negotiation-deep-review-answers.json \
  tests/labels/batch-negotiation-deep-review.json \
  tests/scene-review/negotiation-deep-review.json
```

Use fresh output paths. Import validates the entire feedback identity and citations before writing either file. Explicit per-engine-reading judgments become claim-bound confidence labels; uncertain decisions are stored as `unclear` and excluded from training. Confirmed performed acts become a separate positive-only scene inventory. Rejected, uncertain and contextual act decisions remain available as reviews but never become positive performed events. Free-text notes and assistant confidence are excluded from tracked imports. No judgment is inferred from an omission or from agreeing with an act proposal alone.

Review the imported files and address confirmed detection errors separately. Retrain the confidence model separately after accepted labels are merged. This PR changes no engine rules, labels, reliability table, learned model or metrics.
