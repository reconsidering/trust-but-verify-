# Changes from the accumulated owner reviews

Branch base: main `6e878a4`. These changes follow the proposal order: label protection, instrument continuity, action ownership, occurrence context, contact categories, then inventory replay and confidence trials.

## What changed

1. **Labels belong to the reviewed claim.** New imports save source checksum, paragraph, pattern, act, occurrence kind, people and direction. Older batch identities are recovered from their manifests. Changed, superseded or unverifiable claims are excluded from confidence training and can be exported for re-review. Owner answers remain unchanged. Seven affected unversioned legacy keys and two conflicting older readings are quarantined in `tests/scene-review-adjudication.json` rather than silently replaced.
2. **Instrument continuity is bounded.** Generic insertion and depth matches can inherit an explicitly supported finger, toy or tongue. Explicit matched or trailing instruments win. Removed instruments, nonsexual targets, scene boundaries and intervening actions limit carryover. A verb such as “plug the opening” is not evidence of a plug. A current penile action must survive earlier finger preparation.
3. **Actions retain their performer.** Targeted oral and finger continuations use established action/body ownership instead of an intervening reaction. Explicit self-fingering and supported remote self-touch stay solo when performed; recalled remote activity remains historical. Explicit vaginal self-touch does not become anal-reception evidence. Passive body positioning does not reverse an established penetration direction. Genuine direction changes remain supported.
4. **Manual and solo activity gets occurrence context.** Explicit memory, fantasy, desire, habitual and recording frames no longer create a new current manual/solo scene. Historical evidence remains available as history. Ordinary past-tense narration remains performed; explicit resumption of current action clears the frame. Nonsexual behavior hints do not receive these new sex-act rules.
5. **Contact categories stay distinct.** Static restraint holds, interrupted grasps and furniture grips no longer manufacture handjobs or masturbation. Genital rubbing is separated from handjobs. Scrotal oral contact is retained as genital body play rather than a penile blowjob; three legacy expectations moved to equivalent invented-adult body-play tests. External anal stimulation has its own manual activity name and confidence, and can support the existing anal-stimulation indicator without adding penetration.
6. **Positive inventories produce a checked backlog.** Replay reports exact matches, detections elsewhere in the window, citation boundaries, wrong people, wrong acts, context-only evidence and missing entries. Existing-toy removal needs adjudication rather than counting as a new insertion. Completed empty windows check actual acts only; positive-only/unfinished windows never make omitted hints negative. Guarded patterns cover explicit tongue penetration, toy-tip insertion, toy replacement, named oral completion and anatomically supported summaries of established activity.

All new regression examples use invented adults. No fic passages, downloaded samples, regenerated weights or reliability tables are committed.

## Confidence trials

The engine records final decisions alongside initial attribution, pronoun-compatible alternatives and sentence distance. Three optional training trials test these independently with `CONFIDENCE_TRIAL=final-decision`, `pronoun-alternatives` or `sentence-distance`. They cannot write production weights. The production feature vector and committed weights remain unchanged.

Extraction caches now include the engine/parser source, ordered feature definitions, input checksums, labels, weights and review metadata. A same-length feature change or label change invalidates the cache; tuning regularization can reuse valid rows.

## How to reproduce

After setting up the owner's sample zip:

- Run `npm test` and `npm run build`.
- Run gold/right-set checks and the full regression comparison over the age-screened source list. The validation scope below matters: it is not a full 55-source check.
- With private audit snapshots, run `node scripts/replay-scene-reviews.mjs <snapshot-directory> <private-report.json>`.
- Run `AO3_DIR=<screened-directory> ROWS_CACHE=ao3-samples/review-driven-rows.json REVIEW_QUEUE_OUT=<private-queue.json> npx vitest run tests/learn.test.ts`, without `WRITE_LEARNED`.
- Repeat the preceding command with one `CONFIDENCE_TRIAL` value at a time. Only whole-fic held-out metrics count. The acceptance bar is at least +0.03 AUC without worse log loss.

## Limits

A changed or removed owner-rejected claim is not automatically a fully corrected event. Instrument/ownership evidence remains ambiguous in some passages, and tag-free character guessing can still misidentify a participant; the inventory report is a triage tool, not population recall. Assistant confidence is not a training label.

Older right-set entries do not contain complete source/act identities. Their saved people, direction and occurrence class are checked before reuse, but an unrecorded instrument change cannot be retrospectively proved identical. A comparison with pre-update main identified seven changed labelled claims with no recoverable original identity; these are explicitly quarantined, rather than assuming the old judgment applies. Other unversioned audit labels still require their original review to prove identity across earlier engine versions. New batch imports carry stronger identities.

Validation excludes `play-the-game.html`, `slipfast.html`, `strawberry-mama.html`, and `self-mythology.html`, identified by the earlier age screen. This excludes two gold verdicts and seven gold scenes. Comparisons must use the same remaining 51 sources; a lower absolute total than a 55-source report is not itself a regression.

Model retraining and generated-file commits remain separate work after the detector changes are accepted. No improvement in the production model's AUC is implied by a diagnostic trial or by changes to which labels remain valid.

## Confidence experiment results

These are paired comparisons on the same screened, claim-checked cohort after the detector changes, not a comparison with an earlier model trained on different claims. The baseline has 1,747 recovered labelled hits, including 75 wrong hits. Nine conflicting report/audit labels and 36 changed or unverifiable reviewed claims were excluded.

| Trial | Unseen-fic AUC | Unseen-fic log loss | Wrong hits in least-trusted 10% |
|---|---:|---:|---:|
| Existing production features | 0.705 | 0.1644 | 35% |
| Initial versus final decision | 0.704 | 0.1645 | 36% |
| Pronoun-compatible alternatives | 0.706 | 0.1646 | 33% |
| Attribution sentence distance | 0.704 | 0.1647 | 36% |

None clears the +0.03 AUC/no-worse-loss rule. The trial machinery is retained for future measurement, but none of these features is enabled in production scoring. No generated model file was written.

## Validation

- `npm test`: 1,558 passed, 13 skipped; 131 test files passed. This includes 40 focused review-driven cases and the claim/cache, inventory and diagnostic feature tests.
- `npm run build`: passed.
- `npm run check -- --only <all 51 eligible source names> --heap 8192 --jobs 2`: passed. Gold verdicts 15/15; scenes right 80, flipped 0, missed 0; false positives 6. These equal main's totals after removing the same excluded sources. The check script calls this a scoped/quick run and does not compare it with its stored full-corpus baseline automatically.
- `npm run regress -- --hits --all --base origin/main --only <all 51 eligible names> --jobs 2`: completed in tagged and tag-free modes. It reports 22 works with moved readings, eight verdict changes and 29 count/confidence changes; its exit code is 1 because verdict changes are reported, not because an evaluation crashed. The moved passages were inspected privately.
- All 50 owner-confirmed correct claims in the two suspect batches remained identical in act, people and occurrence kind. The 25 rejected claims changed or disappeared; this establishes that the rejected claims are no longer reused unchanged, not that every underlying event is now fully resolved.

The accepted strict inventories contain 124 entries, including three held out for adjudication. Before the fixes, 74 matched their cited ranges; after the guarded detector fixes, 81 did. Counts are overlapping review entries, not independent scenes or a population recall estimate. Remaining entries still include narrow citations, unresolved attribution and genuine misses.

Two reviewed memory/fantasy masturbation passages still have ambiguous actor attribution. Tag-free character guessing also remains imperfect; a correct detection for a declared pairing does not prove the blind cast was identified correctly. Original reviews and generated models remain unchanged.

The eight aggregate verdict changes cover three works in both modes. The switch labels remain switches in *Fling* and for anal activity in *Rwrb Balls*, with a different leading direction after the corrected evidence. *Rwrb Balls* also gains the verified rimming direction. *Tuica* changes its oral direction after a pending climax is demoted from a performed event. That unlabelled work-level conclusion still warrants owner spot-checking; stable gold totals do not adjudicate every changed summary.
