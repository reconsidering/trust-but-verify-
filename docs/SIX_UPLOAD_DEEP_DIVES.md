# Six-upload deep dives: Apogee completed

This batch was reviewed against main `d7024b0` (2026-10-10), including the updated anal-entrance tagging conventions. The engine, its generated confidence files and earlier labels are unchanged. The completed review adds 24 source-bound ChatGPT judgments at weight **0.9**, each with reviewer confidence **95% or higher**.

## Upload status

| Work | Status | Reason / remaining step |
| --- | --- | --- |
| Apogee | Full-text review completed, independently checked | Adult participants established; all 1,307 normalized paragraphs and the complete 105-page source reviewed. |
| There Are No Gays in Football | Excluded | The text explicitly includes sexual encounters involving minors, including recollections. No labels imported. |
| frequently secretly fond | Excluded | The text explicitly includes sexual encounters involving minors, including recollections. No labels imported. |
| Wolfbird | Awaiting age clarification | The current adult timeline does not establish adulthood during recalled school/junior-hockey sexual encounters. |
| Dog Roses, Marigolds, and Other Ways to Say I Love You | Awaiting age clarification | The early recalled encounters with the watch captain have an unresolved age and chronology. |
| the full spectrum of human emotion | Awaiting clarification | A boarding-school joke needs clarification about whether it refers to sexual experience and, if so, whether everyone was an adult. |

The last five rows are not completed engine reviews. The exclusions were established during eligibility screening. No training labels were made for excluded or pending works. The pending questions have been sent to the owner; no answer is assumed.

## Apogee results

| Measure | Count |
| --- | ---: |
| Raw engine readings reviewed | 25 |
| Correct | 17 |
| Wrong | 7 |
| Uncertain, excluded from training | 1 |
| Accepted labels at weight 0.9 | 24 |
| Accepted labels with context-model features | 21 |
| Accepted labels without context features, usable by reliability replay | 3 |
| Independently inventoried activity / history / desire records | 28 |
| Clear additional current sex act missed by the engine | 1 |

The inventory includes ongoing acts, earlier adult experiences, future desires and non-core contact. Its 28 records are **not** 28 independent sex scenes or false negatives. Multiple raw readings can also describe the same encounter.

The engine's aggregate direction is correct: one-way anal sex (74.0% confidence) and one-way blowjob (71.2%). Individual evidence still contains errors, including two wrong readings with confidence above 92%. The scene-review data records each available raw reading's context-model confidence separately; `null` means the reading has no context features, not zero confidence. Reviewer confidence is an assessment, not measured accuracy.

### Seven wrong readings

All examples below are paraphrases using invented adult names: Alex is the receiving anal partner and penis owner in the oral encounter; Blake is the other participant. Paragraph numbers are **zero-based** in the privately normalized `apogee.html`. The original PDF and normalized source fingerprints are recorded in the review data.

| Location / reading IDs | Error | Engine confidence | Proposed interpretation and reviewer confidence |
| --- | --- | --- | --- |
| 816; apogee-4 and apogee-5 | Oral performer and penis owner reversed in two completion patterns | 92.8%, 94.1% | Alex climaxes during Blake's oral stimulation. Alex is the blowjob recipient; Blake performs it. 99%. |
| 863; apogee-6 | Fingers inside attributed as penile anal sex | 90.1% | Blake's fingers are inside Alex. Penile entrance contact starts at 874, with insertion at 875. 99%. |
| 291; apogee-11 | Adult solo history assigned to a nearby crewmate | 33.9% | Alex describes his own recent adult masturbation; the other person is only a privacy obstacle. 99%. |
| 777; apogee-14 | Flushed anatomy mistaken for another person's embarrassment | 78.3% | Alex's erect penis is flushed; Blake's looking does not establish that Blake blushes. 99%. |
| 873; apogee-19 | Current fingering demoted to hypothetical | 69.2% | Fingers are actually inside Alex during the paragraph; nearby desire wording does not cancel the current act. 99%. |
| 874; apogee-21 | Object-holding instruction mistaken for an aftercare request | No context score | Blake tells Alex to hold a structural support bar during intercourse. He is not asking Alex to hold him. 99%. |

These judgments label the **existing claim** wrong, while the saved review states the corrected interpretation. They do not change a detection rule. The fingering and penile-contact judgments use the new entrance-contact convention; no negative label is based merely on a lack of insertion.

### Missed act and limits

At paragraphs **823–831**, Alex manually stimulates Blake's penis through orgasm. This is a clear handjob in the opposite direction from the engine's detected handjobs. The independently recorded act has reviewer confidence 99% and weight 0.9. It is saved as an omission inventory record with paragraph hashes and participants, **not** fabricated as a detected-hit training row. A future detection fix can use this range to check recall.

Earlier oral contact at 787–799 belongs to the blowjob the engine detects later in the same encounter; it is not counted as a separate completely missed blowjob. The wrist-contact behavior hint at 841 remains uncertain (82%) and contributes no training label. Future dialogue stays a hint. No rimming, toys, vaginal sex, self-anal acts or anal role switching were found. The receiving partner's climax follows explicit manual stimulation without a narrated release, so it does not establish a hands-free orgasm.

## Data and provenance

- `tests/scene-review/chatgpt-six-upload-deep-dives.json`: full coverage, eligibility status, 25 reading judgments, available engine scores, independent-review agreement and 28 inventory records. Corrections use paraphrases; source locations use hashes and paragraph indices.
- `tests/labels/chatgpt-six-upload-deep-dives-claims.json`: identities of the 24 accepted claims, bound to source SHA, pattern, paragraph, participants, act and occurrence. Its legacy `labels` map is intentionally empty so fractional labels are not silently promoted to full weight.
- `tests/right-set/apogee.json`: 17 positive and seven negative judgments, each explicitly ChatGPT-authored with weight 0.9 and reviewer confidence.
- `tests/six-upload-deep-dives.test.ts`: checks the cutoff, fractional weight, source identity and separation of omissions from detected-hit labels. With the private fic available it replays every accepted claim and verifies all inventory paragraph hashes.

Aggregate scene/hint replay is used where the app exposes the exact reading. Audit-prefixed entries retain additional raw readings that are merged away or belong to behavior collections; the private-source test replays their full identities directly. All 24 accepted labels remain usable by the appropriate learning/reliability loaders.

No owner judgments or previous labels were replaced. No fic prose, PDFs or normalized sample files are committed. No gold labels or generated confidence files are changed. Training happens separately after merging; this review does not itself change the application's confidence scores.

## Validation

- Focused test with the private Apogee source: **2 tests passed**, including replay of all 24 accepted claims and all inventory hashes.
- Full unit suite passed (204 seconds); build passed after correcting a test null check.
- Focused source and Apogee right-set replay after correcting the behavior-hint collection mapping: **20 tests passed**.
- The first full check stopped in one right-set shard at that mapping error. The remaining replay group subsequently passed (19 tests, 268 seconds); the other two shards passed on the original run. The combined reports were checked to cover all 34 right-set files. All required unit, build, gold and right-set checks therefore pass after the corrections. The original full-check invocation exited unsuccessfully and was not represented as passing.
- Gold on the available screened corpus: **15/15 verdicts; 80 scenes right, zero flipped, zero missed; five false positives; point of view 74.3%; text senders 27/27**. No worse than the local accepted baseline.
