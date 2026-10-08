# Belonging: full-text owner review

The review is pinned to main commit `68a63ac`. All 5,783 story paragraphs (104,483 words) were read independently of the detections and compared with a fresh tagged engine run. Dean is explicitly 26 at ¶2913; the adult pair is Dean Winchester and Castiel. Family interactions are kept separate from sexual acts.

Open [the review page](https://reconsidering.github.io/trust-but-verify-/review/belonging.html) after merging and the Pages deployment. Load the original Belonging HTML or the sample ZIP. Renaming the file is fine; the source and paragraph hashes must match. The story stays on your device and appears only after loading. No fic text is published, sent to a server, stored in answer storage, or included in exported answers.

## What is included

| Coverage | Count |
| --- | ---: |
| Paragraphs independently read | 5,783 |
| Current engine readings, all included | 518 |
| Review passages | 98 |
| Act/context proposals | 156 |
| My supported engine readings | 410 |
| My incorrect engine readings | 97 |
| My uncertain engine readings | 11 |
| Incorrect readings of performed acts, including manual/solo | 46 |
| Missing scored-act proposals | 45 |
| Possible missing scored-act proposals | 2 |

These are **proposals for the owner to check**, not accepted labels or measured accuracy. The 97 includes hints and everyday cues, not 97 false-positive sex scenes. The 45 missing records include simultaneous acts, brief acts, retained-toy stimulation and later phases of encounters the engine partly detects. They are not 45 wholly missed encounters and are not a recall rate. There is no sampling: all current tagged audit readings are represented once by ID. Repeated sentence hashes can occur in different paragraphs or represent different claims.

Act intervals come from the independent reading, then all engine readings are assigned to passages. Contiguous phases are combined where the narrative establishes continuity. The remote-machine encounter stays one toy record; a late montage preserves its stated multiplicity in the proposal notes instead of guessing individual times. External anal contact, external genital devices, oral contact with fingers/objects, nipple stimulation and fabric-assisted activity are retained as **Other** or rubbing proposals where there is no matching scored category. Their absence is not automatically a detector failure.

## Main findings

| Finding | Citation | Proposed reading |
| --- | --- | --- |
| Self-fingering assigned to the partner | ¶251–253 | Dean fingers himself, under Castiel's direction. |
| Thigh stimulation mistaken for penile anal sex | ¶1053–1066 | Castiel's penis remains between Dean's thighs. |
| Plug thrusting mistaken for a penis | ¶1457–1464 | Castiel moves the retained plug. |
| Missed oral act | ¶2107–2110 | Castiel performs oral sex on Dean's caged penis. |
| Oral roles reversed | ¶2826–2834 | Castiel sucks Dean, rather than Dean sucking Castiel. |
| Mouth entry mistaken for anal entry | ¶2858–2869 | Dean receives Castiel's penis orally. |
| Improvised object mistaken for penile penetration | ¶3489–3507 | Castiel inserts an object's handle anally. |
| Real action demoted because fantasy is nearby | ¶3534; ¶4017 | Current thrusting is real; proposed alternative activities are imagined. |
| Missed shower rimming | ¶3878–3879 | Castiel stimulates Dean's anus with his tongue. |
| Entire suspended oral act missed | ¶4142–4154 | Dean gives Castiel oral sex. |
| Remote dildo mistaken for a penis | ¶5041–5284 | Castiel operates the toy remotely; actual penile entry begins at ¶5288. |
| Blocked attempt counted as performed | ¶5522–5525 | Castiel prevents entry; actual sex occurs later. |
| Metal plug mistaken for a penis | ¶5602–5637 | Castiel inserts a rigid anal plug. |
| Anal hook missed | ¶5741–5769 | Castiel inserts/removes the hook; Dean moves on the retained toy. |

The whole-story one-way penile anal direction is supported: Castiel penetrates Dean. But the engine's 35-scene count includes incorrectly typed readings. The first actual penile anal entry is at ¶3066. The independent inventory contains 24 performed penile act records, including condensed summaries with multiple completions; **24 is not an exact replacement scene count**. Scene deduplication and montage boundaries need separate checking.

The bidirectional oral verdict is supported, despite missed oral acts and several reversed individual readings. The apparent opposite-direction rimming exception is oral finger contact at ¶830, not Dean rimming Castiel. Castiel does rim Dean, including the missed shower act. Spanking repeatedly becomes an ass-gripping cue, smelling repeatedly becomes scent-marking, saliva-swallowing instructions become oral-sex hints, and some self-actions are credited to the partner.

Surrounding context matters: initial external plug contact at ¶254 is followed by insertion at ¶255, so the wearing cue is supported. The initial finger touch at ¶2800 leads directly to insertion at ¶2801. A grip at ¶4946 becomes explicit stroking at ¶4947 and is a supported handjob. These are retained rather than rejected by inspecting only one sentence. Eleven ambiguous readings remain Not sure, including premature equipment/care cues and broad fullness/aching claims.

## Fast review

1. Load the fic HTML or ZIP. The initial view prioritizes likely errors and missing acts. Choose **All passages in story order** to check every item.
2. Read the passage; every act card also includes its cited paragraphs. Engine and reviewer confidence appear separately. Missing acts have no engine score; 45 engine cues have no separate score and say unavailable. Scores beside incorrect claims belong to those engine claims, not to my corrected acts. My confidence is subjective, not calibrated accuracy.
3. **Agree with all my assessments in this passage** fills each individual engine verdict, correction, act, participants, occurrence and applicable common-error boxes. Or agree with individual cards. Agree means agreement with **my assessment**, not with the engine. My incorrect-engine call automatically records Engine wrong; uncertain calls remain uncertain.
4. **Disagree** leaves the relevant verdict open for your correction. Mark the engine correct/wrong, or edit the act and confirm it. Disagreement never invents the opposite act or participants. You can add acts I missed.
5. Export the answers and send the JSON back. Supported iPhone browsers also offer Share / save answers. To continue on another device, restore your answers and reload the fic there. Export before leaving if browser saving is unavailable.

Coverage checkboxes never create negative labels for unlisted acts or hints. Agreeing with an act alone never labels a nearby engine reading. No engine code, labels, generated model, reliability table or metrics were changed here.

## Import after owner review

Use the dedicated deep-review importer, with fresh output paths:

```sh
node scripts/import-deep-review.mjs \
  public/review/belonging.json \
  /tmp/belonging-deep-review-answers.json \
  tests/labels/batch-belonging-deep-review.json \
  tests/scene-review/belonging-deep-review.json
```

Explicit engine decisions become claim-bound confidence labels. Confirmed performed acts become a separate positive-only inventory. Uncertain answers stay out of training. Corrections, free text and reviewer confidence are not copied into tracked labels. They remain in the owner's exported feedback.

Legacy sentence hashes collide for several readings here. The importer preserves every explicit answer but quarantines a key as `unclear` if its answered claims differ or its answers conflict, reporting the keys in `ambiguousReadingKeys`. It never silently chooses the last answer. All uncertain/quarantined keys also use the existing supersession metadata to block older accepted labels from being reused. Identical claims with matching decisions can share a label. Further work to train every colliding claim separately needs an identity change outside this review PR.

Use confirmed findings to make narrow, separately tested detector fixes: instrument carryover, self-action attribution, pronoun ownership, occurrence scope and coverage of missed acts. Import accepted reviews and retrain the confidence model separately after merging. Confidence retraining alone cannot recover acts the patterns never detect.
