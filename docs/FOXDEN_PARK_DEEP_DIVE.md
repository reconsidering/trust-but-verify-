# Foxden Park: full-text deep dive

Reviewed all **1,429 normalized paragraphs / 50,913 words** of the uploaded PDF against main commit `ca48e3a`, on 2026-10-10. All **37 raw engine readings** were assessed. Independent QA checked every reading and all 19 proposed inventory omissions against surrounding context.

**dog teeth** was excluded from explicit sexual-scene annotation because it is real-person sexual fiction. It contributes no labels or inventory.

## Eligibility and withheld context

Alex is explicitly 21 (paragraphs 56 and 516). Henry's completed boarding school, Oxford university study, independent adult social life and consideration of marriage establish adult context; no numeric age is stated. The full read found no depicted minor sexual encounter. Children appear in nonsexual family play; during the concealed-study adult encounter, a child is outside the locked private room and unaware of it.

An ambiguous retrospective self-question at 518 is withheld entirely from training and act inventory. It does not establish a specific, safely dated individual event. Literal adult leadership in a mixed-age family game is also excluded from sexual-role training. Neither exclusion is recorded as a negative label.

## Training labels

| Result | Count |
|---|---:|
| Engine readings reviewed | 37 |
| Reviewer: correct / wrong / uncertain | 25 / 11 / 1 |
| Correct labels added | 22 |
| Wrong labels added | 10 |
| Withheld readings | 5 |
| Accepted labels with context features | 32 |
| Hashed activity inventory records | 43 |
| Candidate omitted-act records | 4 |
| Separately checked missing orgasm marker | 1 |

All **32 accepted labels** have reviewer confidence **at least 95%** and **weight 0.9**, for both correct and incorrect readings. The cutoff applies to this conversation and future additions; older labels and owner judgments are preserved. These are AI judgments, not owner-approved gold.

Five readings are withheld: three collide on the legacy pattern/short-hash key in the cottage oral passage (one wrong and two correct readings), one family-game behavior, and the ambiguous retrospective cue. Keeping all three colliding readings out avoids attaching a wrong judgment to the correct alternative participants.

The identity-only provenance file has an empty audit `labels` map: accepted judgments retain fractional right-set weight rather than silently becoming full-weight labels. Each judgment is bound to its source fingerprint, paragraph, act, pattern, occurrence and participants. No older automated entries were replaced, and accepted keys do not overlap the previous open four-PDF label PR.

## Findings

Examples are paraphrased with invented adult names. Paragraph references below are **zero-based** in privately normalized HTML, not PDF page numbers.

- **Oral roles reverse in the cottage sequence, 1117.** Two raw readings reverse performer and recipient, although other readings in the same passage have the correct direction. Example: adult Julian performs oral sex on adult Marcus; two patterns incorrectly say Marcus performs it on Julian. One reversed reading qualifies for import; the other shares its legacy key with correct alternatives and is withheld.
- **External rubbing becomes premature anal penetration, 1129.** The text establishes insertion later, at 1146–1148. Example: Julian moves against Marcus externally, then later guides him inside. The earlier contact must not count as penetration.
- **Absent and reversed participants contaminate anal evidence, 1155–1161.** One reading picks an absent parent instead of the current adult partner; two others swap penetration roles. Correct readings elsewhere in the continuous sequence remain intact.
- **A later fingering scene chooses an absent friend and also becomes solo activity, 1331–1334.** The passage describes one adult preparing the other; it is neither the absent friend's action nor self-directed insertion. Example: Marcus uses his fingers on Julian while Rowan is elsewhere; the engine assigns Rowan and calls it self-touch.
- **Ownership errors affect weaker cues.** A yielding behavior at 174 belongs to an adult friend rather than the main partner. The buttock-touch reading at 701 credits the receiver as performer.
- **Finger licking is flirtatious but self-directed, 786.** Independent QA changed the initial assessment after checking the exact claim wording: it says the adult is sucking the selected partner's fingers, while the source describes his own fingers. Preserve the self-display in the inventory; reject the fabricated partner ownership. A broad guard deleting every food-related flirtation would overcorrect this case.

## Omission evidence

Four supported candidate activity records are separate from confidence-training labels:

| Paragraph range | Proposed activity | Reviewer confidence | Qualification |
|---|---|---:|---|
| 893–897 | Frottage | 99% | Uncovered activity before oral evidence |
| 1110–1116 | External anal stimulation | 99% | Pre-insertion stimulation; distinct from penile penetration |
| 1117–1118 | Fingering | 99% | Additional activity alongside detected oral evidence |
| 1133–1144 | Fingering | 99% | Continued preparation in the same extended scene |

**These are four activity/evidence records, not four distinct missed scenes.** Other inventory gaps include visual/touch hints, body rubbing and manual preparation; these are kept separate from core performed-act omissions. At 909–910, gripping and preparation do not establish a definite handjob, so QA reclassified that entry as manual genital contact. Lubricating/positioning contact at 1144–1145 is also inventory-only preparation.

### Hands-free orgasm marker

The receiving adult's climax at **1151–1153** is supported at **97% reviewer confidence**. The passage explicitly establishes lack of penile touch. Passive penis-to-belly contact is recorded as a caveat; no active penile friction is established.

This was checked beyond absence from raw audit hits: the current analyzed pairing contains **zero hands-free orgasm desires**, and the app's actual `handsFreeOrgasmEvidence` function returns **zero eligible readings**. Consequently, the high-confidence indicator would not render for this work. This is a **separate marker omission**, not an extra performed-sex-act claim or a fabricated confidence-training row.

## Proposed fixes for separate PRs

1. **Resolve action ownership locally.** Prefer the adult explicitly doing the action, and do not select an absent friend or relative because of earlier narration. Test: adult Marcus fingers Julian while remembering Rowan; Rowan is not a participant.
2. **Track self-owned body parts.** Self-finger display can remain a weak cue without inventing partner ownership. Test: adult Julian deliberately licks his own fingers while flirting; no claim that they belong to Marcus.
3. **Respect insertion phase.** External contact followed later by explicit insertion should produce separate contact and penetration readings. Test: Julian rubs against Marcus, then guides him inside; only the second phase is penile anal sex.
4. **Preserve reciprocal roles consistently across a continuous passage.** Add oral/fingering fixtures where the narrative subject is the receiving adult, but the other adult performs the action. Test: Julian receives while Marcus uses his mouth; receiving narration must not reverse the performer.
5. **Add recall fixtures from the hashed ranges.** Develop fingering/frottage/external-contact fixtures separately from hints and nonspecific preparation; do not promote simple gripping to a handjob.
6. **Cover explicit untouched climax phrasing.** A paraphrased adult fixture should confirm a receiving climax with an explicit no-touch qualification; contrast it with active penile rubbing or manual stimulation. Run the hands-free checks separately before any detector fix.

No engine patterns, guards, confidence features or generated model files are changed here. Retrain separately after merging the labels.

## Reproduction and validation

The PDF was normalized privately with `scripts/prepare-pdf-sample.mjs`, title `Foxden Park`, chapters `9/9`. Original PDF: 116 pages. PDF/HTML SHA-256 fingerprints and paragraph hashes are recorded. Source text is never committed.

Inventory `a` means performer and `b` recipient for specified activities. Raw claims/right-set entries retain engine conventions: for a blowjob, top is the adult receiving oral sex. Engine context probabilities, aggregated engine verdict scores and reviewer confidence are recorded separately.

Validation passed: all four focused tests, including replay of every accepted raw claim; the full unit suite, build, gold and right-set checks. The focused source replay checks all accepted claim identities; full `npm run check` uses the private corpus with 59 eligible samples available and the previously accepted gold baseline.


```text
ok   unit suite (46s)
ok   gold + right-set 1/2 (72s)
ok   gold + right-set 2/2 (190s)
ok   build (2s)

gold: verdicts 15/15, scenes right 80 (flipped 0, missed 0), false positives 5, point of view 74.3%, text senders 27/27
gold is no worse than the accepted baseline

check passed in 192s
```
