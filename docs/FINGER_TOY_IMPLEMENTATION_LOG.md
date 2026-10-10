# Fingering/toy implementation decision log

This log records implementation reasoning for independent AI verification. All examples are adult paraphrases. No source prose, owner labels or generated confidence files are changed.

## Baseline and evidence

- Started from latest main `97d8341`, after Claude PR #196. Inspected that PR and the six-family handoff in PR #197; carried the handoff onto this branch for reproducible review.
- Reused the existing private sample directory, installed dependencies and source-bound helper. A sample-directory symlink is ignored and is not committed.
- Replayed the original 20 cases. Nineteen source/paragraph-verified cases still scored missed; F09 failed the saved full extraction checksum. Its file SHA matches, but its citation cannot yet be interpreted as verified. No label was changed or counted as recovered.
- Changed the trace helper to retain an explicit unverifiable record rather than abort all verified cases. The output does not expose candidates for the failed citation. This is a measurement correction, not a detector fix.

## Iteration 1: reproduce before changing

Added 22 clinical paraphrased unit cases covering direct finger wording, reinsertion, self-use, local toy references, aliases, ongoing toy activity and preparation/residue. On unchanged main: 13 failed and 9 passed. Assertions require the right act, participant direction and performed/solo status; they do not require a particular regex ID.

## Iteration 2: narrow lexical additions

- Added explicit finger gerund, retained finger-state, prostate-contact, rim-contact and fingertip-entry forms. Reason: the instrument and contact are stated but existing word-order patterns miss them. Preserve concurrent penile/oral acts and reject nonbody targets.
- Added toy-as-subject entry, locally identified next-size/pronoun entry, anal prostate-massager self-use and moving-stimulator wording. Reason: a physical device remains a toy despite an omitted human subject or insertion verb. Guards require local device/anatomical evidence, reject storage/mouth targets and stop at scene boundaries.
- Added narrowly explicit opening-with-fingers and residue entry forms. Reason: they support contact without treating oiling or generic wetness as an act. These synthetic tests do not establish recovery of the more inferential F06 source passage.
- Added fake-penis self-use only with an explicit anatomical target and a locally introduced dildo. A toy cannot become a partner’s penis simply because it is described anatomically.

## Iteration 3: ownership and reinsertion

- A toy acting as grammatical subject uses the named human manipulation before it when both actor and recipient can be resolved. Do not make a toy or a reacting recipient the performer.
- Exempted deliberate finger withdrawal/reinsertion from the body-part reaction guard. The exemption requires a withdrawal clause immediately before renewed entry and `again`; an intervening condom/replacement does not qualify. The same evidence refines act typing to fingers.
- An explicit attempt interrupted before contact remains a wanted reading, not a performed act. This preserves correctly attributed desire while protecting recall from attempted actions.
- First complete targeted run after these changes: 22/22 passed. Real-source replay and full regression remain prerequisites; passing a paraphrase is not a private-source recovery claim.

## Deliberately unresolved at this point

F10 achieved contact is uncertain despite the existing owner inventory; F06 preparation-to-contact inference needs stronger source evidence. F04 omitted ownership cannot be fixed by indiscriminately taking the nearest name. F08 Jay/Jason Lane needs source-bound alias validation. F02 remembered fingering and T07 urethral sounding remain scope cases, not targets to convert into performed anal activity.

Further iteration decisions and final verification appear below and in the final report.

## Iteration 4: source replay boundaries

The first real-source run exposed a crash in the new toy-subject rule when both human slots were absent. Added an explicit decline for unowned toy entry and a named request/fulfilment binding for the requested-partner case. This avoids changing generic resolver behavior. Added self-contact wording requiring a reaching/own-body cue and physical inflatable-toy completion requiring named activation by the recipient. Targeted checks including rounds 95/96: 39/39 passed. These additions keep physical device action separate from imagined partner action.

## Citation reconciliation

Investigated the F09 checksum failure rather than relaxing verification. Wolfbird's owner citations hash the pre-rewrite extraction; the engine rewrites some chat/terminology text elsewhere in the file. The declared raw extraction SHA matches exactly, both paragraph lists have 5,640 entries, and all 30 Wolfbird event ranges are locally identical to the stored engine paragraphs. Added verification that requires BOTH the declared raw SHA and identical cited-range hashes/counts when the full engine hash differs. This is not a label/citation edit. Unmatched ranges still remain unverifiable. The earlier unverifiable status was diagnostic, not a lasting exclusion or an engine failure.

## Iteration 5: prevent new ownership/instrument errors

A focused Sugar Alpha replay showed the new self-contact wording still credited the sleeping partner. Added a narrow contrastive-subject rule: the named person being turned toward is not the actor reaching into his own body. This applies only to the new self-contact pattern and a uniquely paired facing character. Added a clinical pronoun-only test reproducing that context.

Added negative controls for implicit toy self-placement when the local target explicitly belongs to another character, and for a vague entry after a newer finger replaces an older toy referent. These close predictable false-positive routes before accepting recall gains. Combined handoff and rounds 95/96 tests: 42/42 passed. Restarted the full inventory replay after the source changes; stale partial replay results are not final measurements.

## Measurement reproducibility

Added `scripts/replay-fixed-inventory.mjs` to replay the frozen 349-event history inventory with the existing scorer. It validates source SHA and each citation, stores safe per-fic snapshots and records source-code/inventory/scoring fingerprints. It supports an archived baseline engine while keeping extraction/scoring at the current checkout. It never imports labels or outputs source prose. A mid-run engine edit invalidates the completed report rather than attaching the edited tree's fingerprint to earlier loaded code.

Full evaluation compares the same 349 reference entries, including scope cases; it does not lower a denominator to manufacture recall improvement. The 41 covered finger/toy controls are checked individually, and other act types are checked for unintended effects. Broad all-fic regression is run in both tagged and tag-free modes against `97d8341`.

## Iteration 6: recall gain can conceal an extra error

The safe hit-difference audit found a NEW reversed duplicate in Foxden p1334: the receiver guiding the partner's hand was read as a second fingering act with reversed people. The recall scorer had still returned matched because the correct explicit residue-entry reading was present. Added a failing clinical test, then suppressed that vague guidance candidate only when the same sentence already emitted the explicitly owned residue-entry act. This intentionally preserves other hand-guidance cases. The guard depends on the explicit pattern preceding the vague one; preserve that order when refactoring.

The reproduction failed before the correction and the combined target/round95/96 suite passed 43/43 afterward. A fresh Foxden replay recovered F05/F07, left F06 unresolved, and removed the reversed duplicate. A separate additional Lover reading at p1403 has clear named-performer finger motion within an established adult scene; surrounding p1402/1404 confirm physical contact and withdrawal, so it is a supported addition.

## Iteration 7: occurrence and final validation freeze

Added an explicit remembered-finger control (historical, not performed) and a future toy-size control with an explicit anal target so the pattern actually fires. The planning test reproduced a false performed self-use reading. New `review-self-*` patterns now retain conditional/future/attempt auxiliaries as wanted readings, while actual placement remains performed. This is scoped to the new wording, not a rewrite of all legacy self-use behavior. Combined targeted suite: 45/45 passed.

Started a fresh full frozen-inventory replay on the final source. Stopped the stale first `check` after two default-heap failures/code changes and restarted the full check with `--jobs 2 --heap 8000`; stale output is not a final pass. Full tagged/tag-free regression against `97d8341` continues, reusing its completed baseline cache where available. No model regeneration, label import or accepted-baseline update was run.

## Iteration 8: explicit replacement instrument wins

Final code review found the reinsertion fallback could override an explicitly named penis later in the entry clause. Reproduced it with a failing adult clinical withdrawal/entry test. Reordered instrument selection so direct match/explicit trailing evidence wins, then the reinsertion fallback, then earlier context. Combined tests: 46/46 passed. This is the last source change before final validation; restarted stale full checks/replay so their fingerprints and results correspond to the final source.
