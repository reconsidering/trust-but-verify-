# Checking the review-driven engine changes

Compared `6e878a4` with latest main `3ebbfdf` on 2026-10-08. This is a report and owner-review batch, not a detector or label update. Production weights, reliability, metrics, patterns, guards and labels are unchanged.

## What was compared

Installed dependencies and unpacked the supplied archive using setup-fics with `--no-eval`, then removed the four previously excluded sources before any evaluation. The archive has 54 HTML entries; setup retains the existing owner-uploaded `found-in-the-upside-down.html`, making 55 local sources before exclusions. Under AGENTS.md, `play-the-game`, `self-mythology`, `slipfast` and `strawberry-mama` were excluded because of sexual content involving minors. The comparison covers the same remaining 51 sources on both sides, not all 55.

Ran `npm run regress -- --hits --all --base 6e878a4 --jobs 2`. Both tagged and tag-free modes were evaluated. The standard comparison reported eight verdict changes and 22 works with moved tagged readings: 46 removed, 36 added, 11 changing only the person. Its exit status 1 means verdicts changed, not that evaluation crashed. Four absent excluded works in the cached baseline are scope exclusions, not detector removals.

That tool's individual-hit signature omits the act category and collects individual hits only in tagged mode. A supplementary full audit therefore ran both engines in both modes on every eligible source, with source checksums checked against the context snapshots. It found **178 changed pattern/sentence-hash locations across 26 works: 92 tagged and 86 tag-free**. Each record retains all distinct claims at that location, including act, participants, role and occurrence. Identical duplicate emissions are collapsed. These are reading records, not independent scenes. Act retyping accounts for changes the standard comparison cannot list.

[Every moved reading](REVIEW_DRIVEN_MOVED_READINGS.md) is listed by cause with before/after paraphrases and matching review IDs. The public review manifest also contains the complete list. Cause groups are primary explanations; a correction can involve more than one rule.

## Counts and review coverage

The existing `build-review-batch.mjs` was checked against the screened tagged snapshots; its standard 40-reading manifest, claim helper and `engine-review-batch/v1` layout were used as the compatibility reference. Its fixed 20/10/10 lanes cannot include every movement or both audit modes, so this comparison retains the full changed set instead. The restoration set uses the same source/claim identities and existing `import-review-batch.mjs`; the comparison set is intentionally a different schema to prevent accidental label imports. No changed reading was sampled out. The fixed ordering seed is `review-driven-error-check-2026-10-08`.

| Cause | Moved records | Removed claim sides | Added claim sides | Review records |
|---|---:|---:|---:|---:|
| A. Instrument carryover | 32 | 32 | 32 | 32 |
| B. Performer / ownership | 26 | 25 | 24 | 26 |
| C. Memory, fantasy and other occurrence frames | 24 | 24 | 22 | 24 |
| D. Contact categories / restraint guards | 69 | 69 | 33 | 69 |
| E. New inventory patterns | 24 | 0 | 24 | 24 |
| F. Other | 3 | 3 | 0 | 8, including five stable controls |

There are only three moved records in group F; inventing two additional changes would be misleading. All three are included, supplemented by five seeded stable readings from the changed-verdict works. Groups C and D include every moved reading, including every frame-related removal found in this audit; they were not limited to five.

All audit readings in **Fling, Rwrb Balls and Tuica**, before or after and in both modes, are included: 264 records, covering every reading behind the eight verdict changes as well as ancillary cues. Fourteen of those overlap the 178 moved records. The comparative set therefore contains **428 records**, plus a separate **36-claim restoration set**. When both modes have identical paraphrased meaning, the page displays them together (395 comparative cards with the actual recorded names) and preserves both original record identities in the saved answers. Different meanings stay separate. Filtering to one mode lets the owner judge them independently.

The full learn test ran with `REVIEW_QUEUE_OUT` and without `WRITE_LEARNED`, exporting the 36 changed or unverifiable claims. Their original keys, source checksums, current claim identities and paragraph references are retained in `public/review/review-driven-claims.json`. A missing earlier identity is explicitly shown as unavailable. No earlier label is automatically transferred.

## Findings

### 1. A new incorrect finger reading in Tricks of the Trade

**Confirmed in the source and audit, paragraph 3604, both modes.** Finger preparation is followed by the performer lubricating their own penis and beginning penetration; the next paragraph continues hip thrusting. The `bottomed-out~elided` reading changes from anal sex to fingering. In an invented-adult paraphrase: Morgan prepares Rowan with fingers, lubricates himself, then enters and settles fully inside; the engine incorrectly treats the final depth as fingers.

This is an incorrect new instrument claim and loss of penile evidence at that reading. A separate `pushed-in~elided` penile reading survives, so the whole scene is not missed. This is narrower than claiming a new scene-level false negative.

### 2. Memory wording can swallow simultaneous real activity

**Confirmed in a diagnostic using invented adults; not established as a new error in this corpus.** Morgan remembers yesterday's kiss while manually stimulating Rowan in the present. Before: a current handjob. After: history. The frame check sees the memory prefix without isolating the current action's clause. A second diagnostic describing a real observed action forming a mental image is demoted to fantasy despite an explicit statement that it is happening.

This is a potential source of false negatives for current manual scenes. Ordinary past tense alone is not the problem; an unrelated memory or mental-image clause is.

### 3. A restraint guard can remove real hand motion

**Confirmed in an invented-adult diagnostic; not established as a new error in this corpus.** Morgan holds Rowan's penis, Rowan holds Morgan steady, and Morgan moves the hand up and down Rowan's penis. Before: handjob. After: no reading. Nearby stabilization belongs to the other person, and the guard's movement exceptions do not recognize the explicit up-and-down wording. This is a current-act false negative in the diagnostic.

The real corpus's restraint-only holds mostly look appropriately removed. That does not validate the broader guard for moving hands or different stabilization subjects.

### 4. Earlier anal context can contaminate a tongue summary

**Confirmed in an invented-adult diagnostic; not established as a new error in this corpus.** Morgan first touches Rowan's anus, then kisses Rowan's lips, and a following sentence summarizes pleasure caused by the tongue. Before: no rimming reading. After: a new `review-tongue-summary` rimming act. The mouth target established in the preceding sentence should prevent an anal inference. This is a new false positive in the diagnostic.

### 5. Tuica's changed summary exposes existing errors

**Confirmed surviving reading errors; these individual errors predate PR #133.** At paragraph 248, kissing after skin contact is still interpreted as a blowjob. In an invented-adult paraphrase, Morgan tastes residue on Rowan's tongue while they kiss; that does not establish penile oral penetration. At paragraph 283, an explicitly named oral performer is still attributed to the third adult. In a paraphrase, Avery takes Morgan's penis into their mouth, then Rowan joins; the engine credits Rowan for the earlier action as well.

Demoting the earlier near-climax at paragraph 336 is appropriate: a recalled pending orgasm is not a completed one. But after removing those old claims, the declared-pair oral summary flips to the direction supported by the unchanged false-positive kiss reading and loses the actual direction hidden by the unchanged attribution error. The new whole-work conclusion is therefore suspect and should be prioritized for owner review. Correctly changing one claim does not validate the resulting unlabelled summary.

### 6. An unsuccessful rub is still reported as contact

**Confirmed surviving occurrence problem at Hate paragraph 806; the failed-attempt problem predates the category change.** An adult attempts to rub against a partner who is already out of reach. The old handjob reading becomes frottage, but its performed occurrence remains. The category correction does not make the unsuccessful contact happen. This is not evidence that PR #133 newly introduced the occurrence error.

## Risks by cause group

- **A:** Confirmed new instrument error in finding 1. Also possible: a finger used by Rowan on Morgan can be inherited by Morgan's later vague continuation into Rowan, despite opposite participants. Instrument continuity needs target and performer continuity, not just nearby instrument words.
- **B:** Possible: carrying the established oral performer over a genuine handover when the new performer is expressed with a pronoun. The inspected ownership corrections generally agree with surrounding actions, but do not prove every omitted-subject continuation is right.
- **C:** Confirmed diagnostic in finding 2. An explicit memory clause can coexist with current self-touch or manual contact; removing the whole scene would lose a real act. The Lightning passages are particularly important because imagined partner commands accompany real solo stimulation elsewhere in the same passage.
- **D:** Confirmed diagnostic in finding 3. Also possible: category corrections suppress simultaneous penile oral contact or a handjob when scrotal contact occurs nearby. The mixed Innocent Until passage contains a moving hand and scrotal oral contact and needs both categories retained. External anal contact should never manufacture penetration.
- **E:** Confirmed diagnostic in finding 4. Earlier anal anatomy does not prove that later summarized tongue activity remains anal after an explicit change to kissing. Actual rimming additions in Rwrb Balls and Jacks remain owner review items.
- **F:** Possible: removing a body-position hint during a mixed recollection/future-imagery passage can accidentally discard a valid hint belonging to another adult. The Lightning paragraph 2550 removal involves precisely this attribution boundary. The two Mars paragraph 1582 removals are paired with a new toy-pattern claim; the remaining hypothetical-versus-history classification still needs adjudication. No new error is established merely because an old pattern disappears.

These are not prevalence estimates: the set deliberately covers changes and changed summaries, not a representative unseen-fic accuracy sample.

## The eight changed verdicts

| Work | Mode(s) | Before → after | Assessment |
|---|---|---|---|
| Fling | Tagged and tag-free | Oral switch remains a switch; leading recipient changes | Both directions are explicit. Scrotal-contact duplicate removal looks appropriate. Leading-direction change remains unlabelled. |
| Rwrb Balls | Tagged and tag-free | Anal switch remains a switch; leading penetrator changes | Both anal directions are explicit. The new resumed-penetration summary has surrounding support; confirm aggregation with the owner. |
| Rwrb Balls | Tagged and tag-free | No / unclear rimming → one-way rimming | Prior anal attention supports the tongue summary, but it is a less direct statement than explicit tongue-to-anus contact. Owner confirmation required. |
| Tuica | Tagged and tag-free | Oral one-way direction reverses | The near-climax demotion is sound; surviving kiss and participant errors make the resulting summary suspect. See finding 5. |

There are eight mode-specific verdict changes, not eight independent works or scenes. Every audit reading from these works is available in the page, including unchanged cues and third-person actions.

## The rewritten older tests

The three removed expectations were all scrotal-contact cases, in two files; they were not three separate changes to the overall suite's meaning.

| Older coverage, paraphrased with invented adults | Old expectation | Replacement expectation | Could it hide a regression? |
|---|---|---|---|
| round13: Morgan orally mouths Rowan's scrotum | Blowjob present | Genital licking with Morgan as giver and Rowan as receiver; no blowjob instances | The new category is anatomically appropriate. Replacing a legacy cast/context loses that exact attribution coverage. |
| round13: Morgan draws Rowan's scrotum into their mouth | Blowjob present | Same body-play category and direction; no blowjob instances | Appropriate for this isolated contact. It does not test simultaneous penile oral contact. |
| phrasings: Morgan takes Rowan's scrotum into their mouth | Oral reading with the penile recipient credited as top | Body-play giver/receiver asserted; no blowjob instances | Appropriate category change. It does not prove surrounding mixed-contact phrasings stay detected. |

All three replacement cases are in `tests/review-driven-rules.test.ts` and assert both the body-play result and the absence of blowjob instances. They also assert numeric confidence. They are stronger than simply deleting the old assertions, but the new isolated cases do not cover hand movement during restraint, mixed scrotal/penile oral contact, or a different nearby mouth owner. No test expectations were altered in this report PR.

## What the owner does

1. Open **[the review page](../review/review-driven-error-check.html)**. After merge and Pages deployment, use `/trust-but-verify-/review/review-driven-error-check.html`. The page shows actual recorded character names and assistant recommendations. Load the samples ZIP or fic HTML files to read cited paragraphs locally; files are checked against the recorded source and paragraph checksums. Story text stays on the device and is not included in answer exports.
2. Read Before, After and the assessment. Consult the original fic at the cited paragraph range when needed. Select **better / worse / same / not sure**, optionally check common errors and add context. Filter by cause or mode to work in short batches.
3. Use **Save answers** for the comparative set. Then choose **36 claims to restore**, explicitly mark current claims **correct / wrong / not sure**, and save that set separately. Progress persists in the current browser; use the saved JSON to move devices or restore it later.

What happens afterward:

- Comparative answers identify follow-up detector findings; they are **not confidence labels**. In particular, “better” does not prove the current claim correct, and “worse” does not prove every associated act wrong.
- Import explicit current-claim judgments using the existing tool:

  ```sh
  node scripts/import-review-batch.mjs public/review/review-driven-claims.json review-driven-claim-answers.json tests/labels/zz-owner-review-driven-2026-10-08.json
  ```

  The importer preserves current claim identity and source checksum; it leaves free-text context out of tracked labels. The page exports only explicit correct/wrong judgments as `verdict`; a not-sure mark remains in `reviewVerdict` and the importer skips it. This avoids overwriting a claim identity while falling back to an older training label. Import and label changes belong in a later PR, after reviewing the owner’s answers. Use the explicit output filename because both the label and reviewed-identity loaders apply files in lexical order; the default batch filename can be overwritten by older files. In that label PR, reconcile previous judgments and remove only those explicit quarantine entries the owner has now adjudicated. Seven legacy keys and two disputed reading IDs are explicitly forced to remain quarantined by `reviewedClaims`; importing a new answer alone will not release them. If a formerly confirmed answer changes to not sure, remove its older training label in that reconciliation rather than relying on the importer to retract it. No such labels or quarantine metadata are changed here.
- Then check that label PR and retrain the confidence model separately. No labels or model files are changed here. Re-importing an uncertain answer cannot restore a trusted training label.

## Validation

The full dual-mode audit completed for 51 sources and both engines. Source hashes agree. The learn replay exported exactly 36 claims without writing model files. Every moved reading is in both the metadata manifest and the paraphrased appendix. Browser checks passed for rendering, mode filtering, comparison answers without implicit labels, explicit current-claim export, answer reload, mismatched-source rejection and not-sure round trips. A not-sure export produced zero imported labels. The existing importer accepted an exported correctness answer into a temporary file and preserved the current claim identity; no repository label was written. `npm test`: 1,558 passed, 13 skipped. `npm run build`: passed; the built output contains the self-contained review page. Source checksums, all movement counts and the absence of long verbatim audit sentences in the artifacts were verified. No gold run was repeated because engine code and labels are unchanged.

GitHub API access remains blocked by this environment's proxy. The branch can be pushed via Git, but opening the PR automatically is unavailable; a prepared PR link is supplied instead.
