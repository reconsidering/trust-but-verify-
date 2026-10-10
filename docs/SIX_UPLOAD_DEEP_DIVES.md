# Six-upload deep dives: four completed, two excluded

This batch was reviewed against main `d7024b0` (2026-10-10), including the updated anal-entrance tagging conventions. The engine, its generated confidence files and earlier labels are unchanged. The completed reviews add 307 source-bound ChatGPT judgments at weight **0.9**, each with reviewer confidence **95% or higher**. The three resumed reviews require agreement between independent reviewers and use the lower of their confidence estimates. The owner confirmed the pending adult-age questions on 2026-10-10; this is eligibility confirmation, not an owner judgment of an engine claim.

## Upload status

| Work | Status | Reason / remaining step |
| --- | --- | --- |
| Apogee | Full-text review completed, independently checked | Adult participants established; all 1,307 normalized paragraphs and the complete 105-page source reviewed. |
| There Are No Gays in Football | Excluded | The text explicitly includes sexual encounters involving minors, including recollections. No labels imported. |
| frequently secretly fond | Excluded | The text explicitly includes sexual encounters involving minors, including recollections. No labels imported. |
| Wolfbird | Full-text review completed | Owner confirmed all participants were adults during the recalled school/junior-hockey sexual encounters. Both source halves and all 205 raw readings reviewed. |
| Dog Roses, Marigolds, and Other Ways to Say I Love You | Full-text review completed | Owner confirmed Corbin was an adult during the watch-captain memories. Full source and all 90 raw readings reviewed. Teenage history can refer to ages 18–19; the text itself does not independently establish every remembered age. |
| the full spectrum of human emotion | Full-text review completed | Owner confirmed the school joke refers to sexual experience and all participants were adults. Complete source and all 13 raw readings reviewed. |

The two exclusions were established during eligibility screening and remain excluded. No labels were made for those works. The three cleared works were fully screened after the owner replied; no explicit contradictory sexual-minor encounter was found. Wolfbird’s age-sixteen orientation reference names no sexual act, and its present adult arousal comparison with adolescence does not narrate a minor encounter. Dog Roses’ explicit age-sixteen/seventeen injury and job-loss memory is nonsexual. The audit records these distinctions and the owner confirmation.

## Accepted labels across the batch

| Work | Raw readings reviewed | Accepted correct | Accepted wrong | Withheld | Context-feature rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| Apogee | 25 | 17 | 7 | 1 | 21 |
| the full spectrum of human emotion | 13 | 6 | 4 | 3 | 9 |
| Dog Roses, Marigolds, and Other Ways to Say I Love You | 90 | 48 | 30 | 12 | 73 |
| Wolfbird | 205 | 124 | 71 | 10 | 157 |
| **Total** | **333** | **195** | **112** | **26** | **260** |

The resumed reviews add **283** accepted labels (178 correct, 105 wrong). Twenty readings across the batch remain uncertain or have reviewer disagreement. Four additional Wolfbird readings have colliding keys, and two would overlap a protected existing judgment; these six are withheld as well. Earlier labels and owner judgments are unchanged. Forty-seven accepted labels lack context-model features and support reliability replay only.

The saved 238 inventory records include activity, history, desires, nonsexual exclusions, corrections and some overlapping evidence. They are not 238 unique encounters or false negatives. Inventories are separate evidence, never synthetic detected-hit learning rows. Inventory notes below 95% are marked ineligible and do not become labels.

## Findings in the resumed works

All examples are paraphrases with invented adult names. Locations are zero-based paragraphs in the privately normalized HTML; fingerprints identify the exact upload and normalization.

| Work / location | Finding |
| --- | --- |
| Spectrum, 1025 | Owen strikes Miles’s chest with a pillow. The engine’s sole anal scene is an ordinary nonsexual action, so the aggregate anal verdict is false. |
| Spectrum, 523 and 1178 | Self-rubbing is mistaken for comforting a partner. At 1574 a grip is assigned to the wrong actor. |
| Spectrum, 849–865 | Performed clothed lap grinding and buttock spanking/squeezing are absent from act output. They establish body play, with no anal-opening contact. No performed genital act was found. |
| Dog Roses, early encounter and memories | Some manual stimulation and brief solo stimulation are missing or under-recorded. Historical manual/oral activity and an earlier encounter must stay distinct from the current pair. Some anatomical specificity remains below the cutoff. |
| Dog Roses, across the work | Bath entry, fingers in hair, washing, garment or animal collars, and attacks are mistaken for sexual acts or role hints. A riding fantasy is assigned as performed with reversed roles. Ordinary care creates disputed aftercare readings; these disagreements are withheld. |
| Wolfbird, across the work | Encounters with other clients are assigned to the main pair. Remote self-fingering, solo toy use and masturbation are assigned to the distant partner. Oral and adult female vaginal acts are sometimes classified as male anal sex. Shoulder massage, doors, clothing and metaphorical collars also trigger false readings. |
| Wolfbird, 3175–3183 | A second orgasm occurs after manual penis stimulation explicitly stops, while anal stimulation continues. Both reviewers confirmed this separate **missed hands-free anal orgasm**. |
| Wolfbird, 4131–4133 | A later hands-free instance is already detected; it is not counted as a miss. |
| Wolfbird, 3779–3789 | External vibrating-saddle stimulation involves two adult women. No opening or insertion is established; inventing anal or vaginal penetration would be an error. |
| Wolfbird, 4152–4153, 4291, 4296 and 4484–4485 | Additional inventory evidence covers solo masturbation, a clothed handjob, vaginal intercourse with external clitoral stimulation, and fingering before penile insertion. Earlier contact within an already detected encounter is separated from an entirely missed act. |

These are labels and findings, not detection fixes. The scene-review data carries every raw claim, available engine confidence, reviewer interpretation/confidence, disagreement and exact source location. The confidence model must be retrained separately to measure the effect of the additional labels.

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

- `tests/scene-review/chatgpt-six-upload-deep-dives.json`: full coverage, resolved eligibility status, 333 reading judgments, available engine scores, independent-review agreement and 238 inventory records. Corrections use paraphrases; source locations use hashes and paragraph indices.
- `tests/labels/chatgpt-six-upload-deep-dives-claims.json`: identities of the 307 accepted claims, bound to source SHA, pattern, paragraph, participants, act and occurrence. Its legacy `labels` map is intentionally empty so fractional labels are not silently promoted to full weight.
- `tests/right-set/apogee.json`, `full-spectrum.json`, `dog-roses.json` and `wolfbird.json`: accepted positive and negative judgments, explicitly ChatGPT-authored with weight 0.9 and reviewer confidence.
- `tests/six-upload-deep-dives.test.ts`: checks the cutoff, fractional weight, source identity and separation of omissions from detected-hit labels. With the private fic available it replays every accepted claim and verifies all inventory paragraph hashes.

Aggregate scene/hint replay is used where the app exposes the exact reading. Audit-prefixed entries retain additional raw readings that are merged away or belong to behavior collections; the private-source test replays their full identities directly. All 307 accepted labels remain usable by the appropriate learning/reliability loaders.

No owner judgments or previous labels were replaced. No fic prose, PDFs or normalized sample files are committed. No gold labels or generated confidence files are changed. Training happens separately after merging; this review does not itself change the application's confidence scores.

## Earlier Apogee validation

- Focused test with the private Apogee source: **2 tests passed**, including replay of all 24 accepted claims and all inventory hashes.
- Full unit suite passed (204 seconds); build passed after correcting a test null check.
- Focused source and Apogee right-set replay after correcting the behavior-hint collection mapping: **20 tests passed**.
- The first full check stopped in one right-set shard at that mapping error. The remaining replay group subsequently passed (19 tests, 268 seconds); the other two shards passed on the original run. The combined reports were checked to cover all 34 right-set files. All required unit, build, gold and right-set checks therefore pass after the corrections. The original full-check invocation exited unsuccessfully and was not represented as passing.
- Gold on the available screened corpus: **15/15 verdicts; 80 scenes right, zero flipped, zero missed; five false positives; point of view 74.3%; text senders 27/27**. No worse than the local accepted baseline.

## Validation after the three resumed reviews

- Private-source suite: **5 tests passed** (272 seconds), including exact replay of all 307 accepted claims and hashes for all 238 inventory records.
- Full `npm run check -- /tmp/label-conventions/ao3-samples --jobs 3 --heap 8000`: **passed**, including unit suite, build, all gold/right-set shards (635 seconds).
- Gold: **15/15 verdicts; 80 scenes right, zero flipped, zero missed; five false positives; point of view 74.3%; text senders 27/27**. No worse than the local accepted baseline.
- Saved paraphrases checked for long verbatim overlap with the private sources: none found.
- The engine source is unchanged from the measured main; generated confidence files are untouched.
