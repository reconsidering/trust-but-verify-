# Detection fixes from the 40-reading owner review

The returned batch is `oct6-4be55d1e796d`, produced by detector commit `7b58f70ce1ea06d1f6c01e745da9be410e9c8da3`. It contains 23 correct, 15 wrong, and two uncertain answers. Original feedback and labels are retained separately; this change does not regenerate the learned model or reliability table.

## Confirmed errors

| Reading IDs | Cause | Corrected behavior |
| --- | --- | --- |
| B9 | A receiver pushing onto the named partner's fingers was selected as the thrusting actor. | The explicitly named finger owner performs the fingering. |
| B12 | A sentence begins with the receiver but its reacting partner performs the subsequent insertion. | The named partner before the linked expectation/because clause remains the actor. |
| B15, B29 | Two variants of a broad third-finger pattern assign self-preparation to the nearby partner. | Reflexive preparation does not create partnered fingering. |
| B18 | The optional anal target on a finger-insertion pattern permits an airway-clearing action. | Explicit finger insertion into a mouth/throat is excluded from anal fingering. |
| B19 | An unnamed opening is the nearby fleshlight, not a character's body. | Fingers put into that toy cavity do not create partnered fingering. |
| B21 | A cock involved in concurrent oral activity overwrites an established finger insertion. | The later insertion remains fingering. |
| B22 | Licking immediately before pushing past a rim was classified as penile insertion. | This continuation is rimming. |
| B28 | A long match captures an earlier receiver before an intervening named actor adds another finger. | The intervening actor supplies the additional finger. |
| B32 | A prostate tap during established finger preparation defaults to penile penetration. | The cue remains fingering unless current penile evidence intervenes. |
| B34 | A reinserted plug is represented by an object pronoun. | Reinserting the toy is not counted as penile penetration. |
| B37 | A wish anchors one named partner, but stale participant/POV state selects another; subsequent self-fingering also changes the act type. | The named partner is desired as penetrator, the prior named receiver owns the wish, and the separate self-action does not retype it. |

These are twelve flagged readings across eleven distinct error situations (B15 and B29 duplicate the same self-preparation).

## Reports supported by their surrounding text

B5, B23, and B25 should retain their detections. B5 correctly represents a hypothetical future act, not an actual scene. B23 and B25 show manual stimulation alongside penile penetration; simultaneous penetration does not invalidate a handjob. These disagreements are documented rather than silently rewriting the owner's accepted feedback.

B3 and B39 remain uncertain. This selected review batch does not estimate corpus-wide accuracy or missed-scene recall.

## Boundaries

The changes are confined to detection guards and participant rules. Tests use invented adult characters. Source passages, private snapshots, and debug traces are not committed. The earlier two rimming experiments remain separate and are not included here.

Seventeen focused synthetic tests cover the reported errors and controls for actual penetration, simultaneous handjobs, and isolated/finger-only thrust cues. The full check (unit suite, build, gold and right-set replay) passes: 17/17 verdicts, 87 scenes correct, zero flipped or missed scenes, eight existing false positives, and unchanged POV/text totals. The old local baseline still represented an earlier gold set (81 correct scenes and seven misses); a direct replay of the unchanged main engine against the current gold files established the fair comparison: 87 correct scenes and eight false positives. That control also has 22 existing stale references, unchanged by these fixes. The full comparison ran all 55 fics with and without tags. All 23 owner-confirmed correct readings and both uncertain readings are unchanged. Comparing complete audit records, including act types, finds changes in 13 fics; every changed passage was inspected. The regression driver reports two verdict changes (and exits 1): these are RWRB in tagged and blind mode, both still `switch`, with the displayed leading direction reordered after correcting preparation and detecting the actual insertion. There are no categorical verdict changes. The driver also reports 22 count/confidence changes; the corrections remove 10 unsupported readings, change four participant assignments, and add two supported insertion/continuation cues. Additional act retyping is visible in the full audit comparison, not in the driver’s hit-string summary. Training labels from the original detector revision describe its original readings; corrected readings must be adjudicated for the new revision before using those same keys for retraining.

A real switching scene exposed a separate detection gap when its preparation cue was correctly retyped as fingering. The insertion pattern now preserves a named actor across bounded comma-separated adverbs. A new hip-adjustment/thrust/prostate cue identifies explicitly named participants only when the same directed pair established penile insertion within the prior four paragraphs; finger-only preparation and standalone hip movements are rejected. This restores the supported switching result without changing verdict thresholds or generated calibration.
