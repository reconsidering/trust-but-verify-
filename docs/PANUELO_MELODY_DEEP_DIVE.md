# pañuelo melody: full-text deep dive

Reviewed the uploaded AO3 HTML from beginning to end: **2,709 paragraphs / 56,470 words**, against main commit `ca48e3a`, on 2026-10-10. All **82 raw engine readings** were assessed. Independent QA checked every reading and all **31 activity inventory records**.

## Eligibility and label scope

The story progresses from childhood to adulthood. Henry is explicitly **26** at paragraph 638, and Alex **25** at 656, before the first explicit adult sexual encounter around 1333. The early timeline contains family affection and non-explicit romantic kissing; the full read found no sexual content involving minors. One adolescent endearment is excluded from adult sexual-role training, even though the literal affection is correctly identified.

Only definite reviewer judgments with **at least 95% confidence** enter training, each at **0.9 weight**, for both correct and incorrect readings. This cutoff applies to this conversation and future additions; older labels and owner judgments are preserved. These are AI judgments, not owner-approved gold.

| Result | Count |
|---|---:|
| Engine readings reviewed | 82 |
| Reviewer: correct / wrong / uncertain | 55 / 20 / 7 |
| Correct labels added | 51 |
| Wrong labels added | 19 |
| Withheld readings | 12 |
| Accepted readings with context features | 65 |
| Hashed activity inventory records | 31 |
| Candidate core activity omissions | 2 |
| Additional uncovered body-contact ranges | 2 |

The **70 accepted labels** are stored as fractional right-set entries. Identity-only provenance binds each to its exact source, paragraph, pattern, act, occurrence and participants. Its audit `labels` map intentionally remains empty, so it cannot silently promote fractional labels to full weight. Five accepted readings have no context feature vector and can contribute to pattern reliability only.

Twelve readings are withheld: seven uncertain judgments, four readings with colliding legacy pattern/short-hash keys, and one adolescent endearment. The colliding readings include three correct and one incorrect judgment; withholding all alternatives prevents a wrong label from attaching to a correct claim. No older automated entries were replaced. Accepted claim keys do not overlap either of the preceding open label PRs.

## Incorrect detections

Examples below are paraphrased with invented adult names. Locations are **zero-based paragraph indices** in the application's review paragraph extraction, not page numbers.

- **Wrong participants and reversed oral roles.** A distant sister is selected as an oral participant, and multiple patterns reverse the adult performing oral sex and the adult receiving it. Prefer the explicit local performer and penis owner. Example: adult Julian uses his mouth on adult Marcus while Marcus watches; Marcus's viewpoint does not make him the mouth performer.
- **Oral riding becomes anal penetration.** Downward movement within an established oral encounter is misclassified as anal sex. Example: Marcus moves while Julian is using his mouth; the surrounding passage establishes oral contact rather than a new anal act.
- **An empty-air thrust becomes a performed act.** At 1365/1391, adult movement is not proof of a second act or an inserted body part. Require actual contact and the correct receiving site.
- **A metal key is mistaken for a penis.** The object and local action are clear; a vague tip or mouth phrase should not override that object. Example: Marcus holds a key near his lips before opening a door; no oral sex occurs there.
- **Fingers contaminate penile penetration and reverse roles.** External self-gripping or a hand in nearby narration can replace the established penetration instrument. Use actual insertion evidence rather than any nearby mention of fingers.
- **Ordinary gestures become manual sex.** A clenched fist at dinner is read as a handjob, and hip movement during penetration is also interpreted as manual stimulation. Example: adult Julian rests a fist on a table; no hand touches genitals.
- **A present withdrawal is wrongly demoted to fantasy.** The adult act at 1786 is actual, despite figurative dream language nearby. Limit the frame to what is genuinely imagined.
- **Weaker cues have ownership, timing or specificity errors.** An absent sister receives invented hypothetical anal evidence, a receptive wish receives the opposite role, partnered digital activity becomes solo self-touch, and an embrace during ongoing sex is called aftercare. Another bodily response is mistyped as an aching cue.

Independent QA supports all 20 proposed incorrect-reading judgments. Nineteen enter training; one is withheld because its legacy key also describes a correct alternative.

## Historical and broad behavior claims

The adult digital recollection at **2130** and past staircase encounters at **2395–2396** establish real acts and the correct participants. Their current-versus-history claim semantics remain uncertain, so all three are withheld rather than labelled as invented acts. The inventory keeps them as historical summaries.

Four other broad behavior/anatomy cues are also withheld where category specificity is unclear. Nonsexual discomfort, a bodily reaction or vague anatomical praise is not automatically a high-confidence negative. These remain documented for possible owner review.

## Uncovered activity evidence

| Range | Proposed activity | Confidence | Scope |
|---|---|---:|---|
| 1331–1333 | Body rubbing | 99% | Additional body-contact inventory |
| 1446 | External anal finger contact | 99% | Candidate core activity omission |
| 1714 | Body rubbing | 99% | Additional body-contact inventory |
| 1715–1717 | Brief manual stimulation | 99% | Candidate core activity omission |

**These are four activity/evidence ranges, not four wholly missed scenes.** Three are additional activities or evidence within an already detected continuous encounter. The inventory is separate from confidence-training labels: absent detections have no existing raw hit to label. No synthetic confidence row or gold scene is created for them.

### No-hand climax and the indicator

The adult recipient's climax in **1717–1742** follows removal of a stimulating hand and is supported as a **literal no-hand climax at 96% confidence**. Earlier genital friction between bodies is explicitly narrated at 1714, however. The stronger interpretation that there is no external penile friction is withheld below the 95% threshold.

The current analyzed pairing has no hands-free orgasm reading, and the indicator's evidence helper returns no eligible reading. **This is not recorded as a definite detector false negative:** the no-hand and strict untouched interpretations differ here. The inventory retains the factual hand-removal evidence and friction caveat for later human review, without a qualifying missed-marker training label.

## Proposed fixes for separate PRs

1. **Resolve performer and ownership before choosing the partner.** Adult test: Julian performs an oral act on Marcus while a sister is recalled elsewhere; the sister is not a participant and Marcus remains the recipient.
2. **Carry the established contact site across adjacent paragraphs.** Adult test: an oral encounter continues with downward movement; movement alone must not invent anal penetration.
3. **Require actual contact.** Adult test: Marcus thrusts into empty air; no performed partnered act.
4. **Respect a named nonsexual object.** Adult test: Julian puts a key tip near his mouth; no penile oral reading.
5. **Keep an established penetration instrument unless insertion evidence changes it.** Adult test: fingers grip externally during penile penetration; they do not become the inserted instrument.
6. **Require genital manual action for a handjob.** Adult test: Julian clenches a fist at dinner or moves his hips during penetration; neither alone establishes manual stimulation.
7. **Apply fantasy/history frames locally.** Adult test: actual withdrawal during a figuratively dreamlike encounter remains actual; a separate remembered act stays historical.
8. **Use the hashed omitted-activity ranges for recall fixtures.** Keep external contact distinct from insertion and a brief real stroke distinct from ordinary hip movement. Resolve the owner's no-hand versus untouched meaning before changing the orgasm marker for this example.

No patterns, guards, confidence features or generated model files are changed in this PR. Retrain separately after merging the labels.

## Source identity and validation

The original HTML bytes are copied unchanged to the private canonical filename `panuelo-melody.html`. The source SHA-256 fingerprint and paragraph hashes are retained; no source text is committed. Inventory `a` means performer and `b` recipient; raw claims/right-set retain the engine convention that blowjob top receives oral sex. Engine context probabilities and aggregated verdict scores are separate from reviewer confidence.

Validation passed: all four focused tests, including exact-source replay of all 70 accepted claims; the full unit suite, build, gold and right-set checks. The focused test replays each accepted claim against the exact uploaded source. Full `npm run check` uses the private corpus with 60 eligible samples available and the previously accepted gold baseline.


```text
ok   unit suite (46s)
ok   gold + right-set 1/2 (74s)
ok   gold + right-set 2/2 (186s)
ok   build (2s)

gold: verdicts 15/15, scenes right 80 (flipped 0, missed 0), false positives 5, point of view 74.3%, text senders 27/27
gold is no worse than the accepted baseline

check passed in 188s
```
