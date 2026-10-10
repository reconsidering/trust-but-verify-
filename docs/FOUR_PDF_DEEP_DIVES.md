# Four eligible PDF deep dives

Five uploads were requested. Four were eligible under AGENTS.md and were read from beginning to end: 402,111 words and 12,403 normalized paragraphs. **A Lake in Nebraska was declined** because a recollection includes sexual content involving a child. No labels or act inventory were made for that work. For *lover, you can’t be wrong*, the owner explicitly confirmed all current and remembered sexual participants are 18 or older; the full read found no contradictory numerical age.

Reviewed against main commit `ca48e3a`, dated 2026-10-10. No detection rules, confidence features or generated models are changed here.

## Labels added

Only definite reviewer judgments with confidence **at least 95%** enter training. Both correct and incorrect judgments have **weight 0.9**. This cutoff applies to this conversation and future additions; older labels and owner judgments are preserved.

| Work | Paragraphs read | Engine readings reviewed | Correct labels added | Wrong labels added | Withheld | Candidate omission records |
|---|---:|---:|---:|---:|---:|---:|
| lover, you can’t be wrong | 1603 | 104 | 63 | 31 | 10 | 5 |
| the lathe | 2453 | 25 | 9 | 12 | 4 | 2 |
| Heavyweight | 7058 | 101 | 62 | 30 | 9 | 7 |
| wretched rhetoric | 1289 | 31 | 15 | 11 | 5 | 6 |
| Total | 12,403 | 261 | 149 | 84 | 28 | 20 |

The 233 accepted labels include 210 raw readings with context features available to the learner. The other 23 can contribute to pattern reliability but have no context feature vector. The assessments of all 261 readings are retained, including withheld judgments.

Withheld: 16 uncertain judgments, 10 readings whose legacy pattern/short-hash keys collide, one reading protected by an existing claim judgment, and one literal nonsexual parent-child carrying behavior excluded from adult sexual-role training. No older automated entries needed replacement.

These are AI judgments, not owner-approved gold. Confidence expresses the reviewer's certainty, not measured calibration. Every claim includes its source fingerprint, paragraph, pattern, act, occurrence and participants. The identity-only provenance file intentionally has an empty `labels` map: it does not promote 0.9-weight right-set entries into full-weight audit labels.

## Findings

Examples below paraphrase the evidence with invented adult names. Paragraph references are **zero-based** in the privately normalized HTML, not PDF page numbers.

### lover, you can’t be wrong

The full read supports oral sex in paragraphs 542–571 and one continuous penile anal sequence around 1445–1550. Some apparent extra scenes are instrument or participant mistakes within that sequence.

- Solo finger-to-mouth contact becomes partnered oral sex, and self-directed anal fingering is assigned to an absent partner. Example: adult Mason touches his own mouth while alone; the engine invents Julian's involvement. See 185–208 and the corresponding raw-claim assessments.
- Digital penetration has reversed participants, while another final-scene reading chooses an absent third person. A withdrawn thumb also contaminates subsequent penile penetration.
- Memories, fantasies and present performance need separate treatment. A fantasy finger hint was withheld rather than confidently rejected because the hint's occurrence semantics are unclear. A valid desire for more penetration during ongoing sex was corrected to **right** after independent QA.
- Candidate omissions include solo activity at 265, 296–298 and 882–883, external anal stimulation at 1382–1384, and manual stimulation at 1480–1483. These are additional evidence/activity records; they are not five proven distinct missed scenes.
- The final climax includes manual stimulation. Do not convert it into a hands-free orgasm claim.

### the lathe

All four performed partnered-act raw detections are wrong: a telephone exchange, clothing movement, couch kissing and a fight. Example: adult Mason moves clothing while Julian watches; moving inside clothing does not establish anal penetration. The narrative does not establish penile anal sex with a reliable direction.

- The adult oral encounter at 920–925 is represented only by preparation/hints, not a performed act reading. Manual stimulation at 923 is also missing.
- Figurative hand language produces false solo sexual activity. A fight credits the wrong participant as well as the wrong activity.
- Comfort after distress and literal bodily relaxation were withheld where the broad behavior category could legitimately apply. Nonsexual context alone does not make a broad comfort/behavior reading false.
- Later loop encounters have nonspecific sexual summaries. Do not manufacture a specific act or direction from them. The final 2410 implication was downgraded below the confidence cutoff.

### Heavyweight

The full adult boxing narrative has genuine reciprocal oral/manual activity and penile anal sex, alongside substantial nonsexual action that confuses weak patterns.

- Victory embraces, glove insertion, boxing movements and ordinary bodily contact create false sex readings. Example: adult boxer Mason pushes Julian during sparring; backward movement is not a receptive anal cue. See 1665, 4024, 4305 and 5595.
- Several caring or behavioral actions attach to the main partner instead of a nearby coach, journalist or relative. Self-directed shoulder rubbing is also assigned to a partner.
- Fingers in a mouth become penile oral sex; external anal finger contact becomes penetration before insertion occurs. The following paragraph explicitly distinguishes the phases at 4101–4104.
- Candidate omissions: manual stimulation 2209–2213 and 3585; oral sex 2344–2349; preparation involving self-directed strokes 3226; external anal stimulation 4101–4104; rimming 4247–4251; and frottage 6343. These seven records include additional directions and evidence within already detected scenes.
- Manual genital pressure without clear stroking is preserved as inventory, not over-specified as a handjob. An unspecified climax at 3588–3595, hypothetical oral specificity at 5140, and a vague future bedroom visit at 6525 were withheld as confident act claims.
- Mattress friction at 4248–4250 and manual stimulation in the final scene exclude an untouched/hands-free interpretation.
- A literal parent carrying a child is correct narrative ownership, but is excluded from sexual-role training. The child appears only in nonsexual contexts.

### wretched rhetoric

The adults' rimming and car penetration have reversed participants. The office sequence involves fingers and tongue rather than penile anal penetration. Example: adult Julian receives digital stimulation while Mason performs it; the next vague movement should retain the established instrument without inventing a penis.

- Rimming performer/receiver reversals occur in the initial sequence; the car reading also reverses the penetration roles.
- Office digital penetration evidence is split into 605 and 644–657, excluding intervening retrospective material. Further digital penetration appears at 899–900.
- The lecture-hall penile anal encounter at 909–920 has only dialogue/hypothetical hints rather than a performed scene reading. Independent QA confirmed this omission.
- A telephone participant's own stimulation becomes a partnered handjob or is credited to the wrong adult. An inferred remote participant's activity at 971–974 was downgraded below 95%; a separate solo claim already exists with the wrong evidence.
- Nonsexual cigarette-related mouth language and an academic percentage generate false oral/anal readings. Past self-stimulation at 498 is classified as historical summary, not current performance.
- Candidate current omissions also include self-stimulation at 171–181 and manual stimulation at 1034–1035. Other body contact remains separately inventoried.

## Recall evidence and follow-up fixes

The 199 inventory records include current activity, history, fantasies, wishes, nonspecific summaries and activities outside dedicated detector categories. **The 20 candidate omission records are not 20 independently established missed scenes.** Some split evidence within a continuous scene, add a missing direction, or have a related hint already detected. Inventories are not synthetic confidence-training rows and are not imported as gold: an absent detection has no existing hit to label.

Suggested separate fixes, with short paraphrased adult tests:

1. **Ownership and self-touch:** an explicitly self-directed action should not create a partner. Test: Mason alone touches his own mouth; no Julian oral act. Preserve real partner-directed contact.
2. **Instrument and contact phase:** require anatomical evidence for penile insertion; distinguish fingers in a mouth, external anal contact, inserted fingers and resumed penile penetration. Test: Julian removes a finger, then resumes a previously established penile act; the old finger must not overwrite that act.
3. **Action semantics:** constrain speech, clothing insertion, sparring and figurative bodily language. Test: Mason inserts a hand into a glove during boxing practice; no anal reading.
4. **Attribution through continuous scenes:** prefer an explicit local performer and exclude an absent remembered bystander. Test: Mason performs an adult act on Julian while recalling Rowan; Rowan must not become a participant.
5. **Occurrence and completed summaries:** preserve an actual past event as past; do not promote fantasy to current performance. Test: Mason remembers an adult encounter, then speaks a current desire; keep the two frames distinct.
6. **Recall:** use the cited, hashed inventory ranges to develop performed-oral, rimming, manual and lecture-hall anal fixtures. Test: an adult mouth-act setup followed by an explicit completion confirms performance, rather than leaving only a kneeling hint.

These proposals are findings only. A later engine-fix PR should add paraphrased tests and examine every changed reading. Retrain separately after labels merge; these additions alone do not update the app's confidence model.

## Reproduction and validation

Private normalized HTML was prepared with `scripts/prepare-pdf-sample.mjs`, using each PDF's original title and chapter total (7/7 for lover, 13/13 for the other three). The helper uses the application's PDF joining/extraction and checks that normalization preserves the content. HTML/PDF SHA-256 fingerprints and paragraph hashes are recorded; source text remains outside Git.

Independent QA checked all proposed high-confidence negative labels across the four works, plus candidate omissions. The recorded changes include a valid desire hint changed to correct, three broad/ambiguous hints withheld, several over-specific inventory claims downgraded, and parent-child behavior excluded from training.

Validation passed: the focused source replay ran all 16 tests successfully; the full unit suite, build, gold and right-set shards passed. The focused corpus test replays accepted claims against their exact source and the current engine. Full `npm run check` uses 58 age-eligible private samples and the previously accepted gold baseline. No model regeneration is run.


```text
ok   unit suite (52s)
ok   gold + right-set 1/2 (87s)
ok   gold + right-set 2/2 (205s)
ok   build (2s)

gold: verdicts 15/15, scenes right 80 (flipped 0, missed 0), false positives 5, point of view 74.3%, text senders 27/27
gold is no worse than the accepted baseline

check passed in 207s
```

Inventory `a` denotes performer and `b` recipient for specified activities; nonspecific sex records make no directional claim. Raw claims/right-set entries retain the engine convention: for a blowjob, top is the adult receiving oral sex. Raw context probabilities and aggregated engine verdict scores are stored separately from reviewer confidence.
