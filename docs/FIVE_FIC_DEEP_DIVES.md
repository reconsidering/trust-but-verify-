# Five uploaded fics: full-text label pass

Reviewed against main at `9ad2225b8e15807e5d7e03095489eb596153c797` on 2026-10-10. Each eligible work was read from beginning to end, with act inventories made independently of detections, followed by review of every engine audit reading in context. AI judgments have weight **0.9**, separately from the reviewer’s confidence. They are not human gold labels. The JSON also records the engine’s current per-hit model probability where features are available; that is distinct from a displayed, aggregated scene score.

| Fic | Paragraphs read | Right | Wrong | Uncertain | Imported at 0.9 (right / wrong) | Act inventory | Candidate missed performed acts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bluebells and Daylillies and Wild Roses Running Rampant | 1747 | 58 | 8 | 0 | 33 (27 / 6) | 29 | 7 |
| A WereCompeer | 1220 | 165 | 27 | 18 | 154 (136 / 18) | 53 | 11 |
| like a dog with a bird at your door | 1474 | 52 | 16 | 4 | 40 (31 / 9) | 36 | 6 |

Across the three eligible works: **348 readings assessed; 227 accepted training judgments (194 right, 33 wrong); 121 withheld; 118 inventory records.** The inventory includes retrospective summaries, requests and broader contact. Its size is not a false-negative count. No wholly missed scene is inferred merely from an uncovered sentence within an already-detected scene.

Negotiation and Strawberry Mama are declined under AGENTS.md (“Decline fics where minors appear in sexual content”). The former includes a minor witnessing adult sexual contact; the latter includes an erotic recollection explicitly set at age 14. No new labels or inventories were added for those works; their older repository records remain untouched.

## What was found

- Bluebells: a clear tree-side penile-anal scene is absent from the audit; reciprocal hand stimulation and intercrural sex also have coverage gaps. Several soothing cues credit the observer instead of the person touching, and self-stroking is assigned to the partner. A current penetration clause is incorrectly demoted by a preceding dream clause.
- A WereCompeer: fingers are mistaken for penile penetration; external rubbing is counted as anal intercourse; an absent attendant is selected for a sexual action; actual oral and anal riding clauses are demoted by surrounding intentions. Confirmed fisting, toy use and some manual stimulation lack correct matching act detections. Initial oral warming and later explicit anal warming are distinct events; both are supported.
- Dogbird: stopped attempts to resume oral contact are counted as performed; a guided handjob and partnered postcoital fingers have ownership errors. Figurative collars and a shirt collar become kink cues. The main anal direction is correct. An initial oral passage is uncovered, but its later continuation is detected, so this is not an entirely missed oral scene. The receiving partner’s climax is manually assisted, not hands-free.

The broad anal-touch pattern intentionally includes spanking: four apparent wording errors were retained as correct cues. Intended preparations, clothing-mediated oral contact, hand-as-collar imagery and resisted blushing were left uncertain where the label’s scope was not clear. Dynamic cues were assessed as cues, not automatically rejected because they were not sex acts.

## How the labels enter training

- `tests/right-set`: definite, unambiguous new judgments, with `source: chatgpt` and `weight: 0.9` on both positives and negatives. Existing unit-weight/human, disputed and retired judgments are preserved. Earlier automated entries replaced by this pass are archived in the inventory file, without adding a second vote.
- `tests/labels/chatgpt-five-fic-deep-dives-claims.json`: **identity metadata only, with an empty `labels` map**. This binds the right-set judgment to the reviewed source hash, paragraph, pattern, act, occurrence class, participants and role. It deliberately does not create a unit-weight audit label. A future changed claim is quarantined by existing learning code. Raw readings that are not the displayed representative scene use an `audit-` card; manual and dynamic records use separate cards. The existing grouped-scene checker cannot replay those individually, so the new corpus test replays all 227 exact raw claims. Training already ignores the card field; no loader or engine change is needed.
- `tests/scene-review/chatgpt-five-fic-deep-dives.json`: all assessments, confidence, corrected paraphrase, rationale, withheld reason, precise act ranges, paragraph hashes and prior automated history. Undetected acts are retained as candidate recall evidence; no synthetic detected-hit training row is fabricated.

**171 of the 227 accepted judgments have feature vectors and can enter the current context-model retrain. The other 56 remain weighted pattern-reliability evidence, but the current learner skips them because the engine did not record a feature vector.** Their engine model confidence is null; no score was invented.

All three upload bodies, metadata, paragraph arrays and source hashes matched the existing private sample files exactly. Source paragraph indices below are **zero-based**, using `reviewParagraphs` from `review/review-batch-data.ts`. Open the named private HTML and extract paragraphs with that helper to find the same evidence. No fic text is committed.

Prior audit labels and existing identity guards were not overwritten. All 47 protected human/retired/disputed A WereCompeer right-set entries were preserved exactly as JSON objects. No engine rules, gold labels, production confidence model, reliability table or METRICS row changed. Retraining is a separate step after merging.

## Wrong readings

The names in these explanations are invented adult aliases. The machine-readable identity fields retain the actual names needed to match engine claims. A wrong hint is not necessarily a false-positive performed scene: the exact kind is listed.

| Fic / item | Paragraph | Pattern / kind | Why wrong | Training |
| --- | ---: | --- | --- | --- |
| bluebells-33 | 12 | dom-grip / behavior | The grip recipient is the surgeon, not Rowan; this is a confrontational medical memory, not behavior between the pairing. | 0.9 |
| bluebells-42 | 798 | care-soothe / behavior | The actual touching is Rowan toward Morgan, while the reported comforting direction is Morgan toward Rowan. The tone is erotic exploration rather than reassurance. | 0.9 |
| bluebells-45 | 825 | pressure-at-hole~elided / touch | This is self-directed anal preparation. The partner-directed teasing reading credits Rowan with giving anal stimulation to Morgan, which does not occur. | Withheld: Existing audit label or claim identity takes precedence |
| bluebells-49 | 841 | push-into~elided / fantasy | The specific pumping-into-a-hole match describes current performed penetration. An earlier dream in the same sentence has incorrectly demoted that performed match to fantasy. | 0.9 |
| bluebells-53 | 922 | care-soothe / behavior | The neighbor is explicitly being comforted and addressed. Morgan merely observes or narrates the exchange. | 0.9 |
| bluebells-54 | 979 | care-soothe / behavior | The neighbor is explicitly being comforted and addressed. Morgan merely observes or narrates the exchange. | 0.9 |
| bluebells-60 | 1509 | aftercare-held~elided / aftercare | The reported bottom-role person is Morgan, but Rowan is the one being held. This is comfort after discussing harassment, not post-sex aftercare. | 0.9 |
| bluebells-61 | 1650 | hj-stroke~elided / handjob | The subsequent ejaculation-fluid location and insertion context identify the stroked penis as Morgan's. The reading incorrectly reports a handjob given to Rowan. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-11 | 212 | prostate~elided / act | The internal stimulation is by fingers, alongside a handjob; no penis is inserted in this bedroom action. | 0.9 |
| were-compeer-21 | 248 | came-inside~elided / act | Nolan surrounds Adrian’s penis, then Adrian withdraws and ejaculates externally; the attendant is absent and the requested internal ejaculation does not happen. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-41 | 694 | fuck~elided / act | The kitchen action is external rubbing between Adrian and Nolan; the wording expressly contrasts it with penetration. The attendant is not a sexual participant. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-42 | 696 | thrusts-falter / act | Adrian’s thrusts are external frottage through his pants, with no anal entry. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-58 | 1010 | fill / act | Nolan imagines a desired future ejaculation and continued warming; this sentence is a wish rather than a new performed filling act. | 0.9 |
| were-compeer-70 | 66 | ogle-crotch~elided / ogling | Nolan looks down at his own hairless genitals, not Adrian’s. | 0.9 |
| were-compeer-71 | 66 | ogle-crotch-oral~elided / ogling | Nolan looks at his own genitals; no partner crotch-ogling or oral act occurs. | 0.9 |
| were-compeer-74 | 87 | penis-into / fantasy | Nolan imagines his genitals constrained inside cages. There is no penile anal penetration fantasy with the attendant. | 0.9 |
| were-compeer-81 | 133 | chastity-lock-on / behavior | The attendant previously fitted Nolan’s cage, not Adrian’s. | 0.9 |
| were-compeer-84 | 139 | dd2-finger-shoved-into / solo | Nolan considers inserting his own fingers but expressly refrains because of the Alpha’s rules. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-85 | 139 | body-leaking-from / body | The fluid is naturally produced slick, not semen leaking after intercourse; the pair have not yet had sex. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-97 | 211 | abo-bare-neck~elided / behavior | Nolan, not Adrian, arches and bares his neck to the Alpha while receiving stimulation. | 0.9 |
| were-compeer-102 | 213 | suck-fingers~elided / fingers | Adrian sucks his own fingers to taste Nolan’s fluids; he is not sucking Nolan’s fingers. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-118 | 286 | fucked-mouth / hypothetical | Although the mouth-opening clause expresses its purpose, Adrian immediately and repeatedly thrusts into Nolan’s mouth in the same paragraph. The scene actually happens. | 0.9 |
| were-compeer-121 | 292 | pos-climb-lap / position | Adrian places Nolan in Adrian’s lap; Adrian does not climb into Nolan’s lap. | 0.9 |
| were-compeer-135 | 406 | dd2-hj-rubbed-over~elided / handjob | Nolan longs for Adrian’s hand or other stimulation on his own penis. There is no performed handjob, and Nolan is not stroking Adrian. | 0.9 |
| were-compeer-170 | 915 | flustered-verb~elided / behavior | Nolan sputters because he swallowed pool water while laughing. This is roughhousing, not blushing or sexual embarrassment. | 0.9 |
| were-compeer-173 | 966 | dd-frot-rut-against / handjob | Nolan grinds while Adrian’s penis remains inside his anus. It is penetrative riding, not external frottage. | 0.9 |
| were-compeer-175 | 975 | self-finger~elided / solo | Generic preparation after urinating does not identify finger insertion; routine cleansing is at least as plausible. | 0.9 |
| were-compeer-182 | 1008 | flustered-verb / behavior | Nolan flushes at the sight of the penetration, not Adrian. | 0.9 |
| were-compeer-184 | 1009 | riding~elided / wanted | Nolan is actually riding Adrian at his chosen pace; the sentence compares this performed act to prior experiences, rather than merely wishing for it. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-185 | 1009 | care-soothe / behavior | Nolan manipulates both participants’ nipples. Adrian is keeping his hands still and is not the person providing comforting touch. | 0.9 |
| were-compeer-189 | 1030 | hj-stroke / handjob | Adrian grips his own painful knot. He neither stimulates Nolan nor receives a partnered handjob, and the purpose is containment rather than sexual stimulation. | 0.9 |
| were-compeer-191 | 1096 | sinks-to-floor~elided / prep | Nolan collapses in heat distress before an empty office chair. He is not sexually kneeling before the absent Alpha. | Withheld: Existing audit label or claim identity takes precedence |
| were-compeer-192 | 1097 | dom-carry / behavior | The attendant lifts Nolan; Adrian is absent. | 0.9 |
| were-compeer-193 | 1097 | dom-carry / behavior | The attendant carries Nolan up the stairs, not Adrian. | 0.9 |
| were-compeer-201 | 1162 | history / history | Nolan has been waiting for Adrian and using toys during heat. The sentence does not describe past experience with other partners. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-2 | 1290 | finger-noun-to-hole / act | This sentence reports contact to the hole, not inserted fingers. External anal teasing is true but performed penetrative fingering is premature. | 0.9 |
| dogbird-13 | 1302 | sucked~elided / act | Approach wording plus the immediate refusal marks stopped intention, not a newly performed blowjob. Earlier oral activity does not make this stopped continuation an actual act. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-14 | 1302 | licked-cock~elided / act | Approach wording plus the immediate refusal marks stopped intention, not a newly performed blowjob. Earlier oral activity does not make this stopped continuation an actual act. | 0.9 |
| dogbird-28 | 293 | abo-bare-neck / behavior | This is an ordinary nonsexual parent-child interaction, not submissive neck exposure or a sexual-role cue. The minor is not a sexual participant in the fiction. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-29 | 314 | collar-holder / behavior | No actual collared partner or leash control occurs; this is a sustained emotional dog/tether metaphor. | 0.9 |
| dogbird-32 | 394 | collar-wearer / behavior | A simile of separation, without a literal worn leash or collar. | 0.9 |
| dogbird-34 | 601 | thrust-back~elided / touch | Reciprocal side-by-side knee/thigh contact after an intimate conversation; no receptive pressing-back posture or penetrative stimulation. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-36 | 964 | collar-wearer / behavior | Rhetorical insult echoed in internal narration; no actual leash wearing or consensual control. | 0.9 |
| dogbird-38 | 1102 | collar-wearer / behavior | Collar belongs to ordinary clothing; no worn kink collar or leash. | 0.9 |
| dogbird-42 | 1130 | abo-bare-neck~elided / behavior | Tilting the neck for access to genitals is not exposing it to Blake as a submissive neck-baring signal. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-46 | 1256 | abo-bare-neck~elided / behavior | The receiver of neck exposure is Blake, but the person baring his neck is Arden. Engine assigns the bottom behavior to Blake instead. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-52 | 1293 | abo-lower-gaze / behavior | Task-directed visual inspection while actively preparing his partner; not a submissive lowering of gaze or deference. | Withheld: Existing audit label or claim identity takes precedence |
| dogbird-55 | 1302 | flustered-verb~elided / behavior | Red/flushed describes Arden penis, not Blake face or emotional blushing. | 0.9 |
| dogbird-56 | 1302 | dialogue:anal sex / said | Speaker is Blake, not Arden. The engine credits receptive desire to the wrong adult and reverses the counterpart. | 0.9 |
| dogbird-61 | 1324 | dd2-hj-hand-to-dick / handjob | The hand belongs to Arden and the stimulated penis belongs to Blake. Engine reverses handjob giver/receiver by making the directing recipient the manual actor. | 0.9 |
| dogbird-66 | 1344 | self-own-fingers / solo | Fingers are Arden own, but the anus is Blake. This is partnered anal finger contact, not Arden self-fingering. | Withheld: Existing audit label or claim identity takes precedence |

## Candidate missed performed acts

These are independently supported performed events or act components without a correctly matched detection in the cited range. They require human confirmation before becoming gold recall tests. Historic summaries, broader inventory-only contact, and corrected already-detected claims are separately identified in the JSON.

| Item | Paragraphs | Act | Note |
| --- | --- | --- | --- |
| bluebells-act-2 | 812–813 | manual |  |
| bluebells-act-14 | 1162–1162 | manual |  |
| bluebells-act-16 | 1165–1165 | masturbation | Self genital palming through pants during partner oral stimulation. |
| bluebells-act-17 | 1168–1171 | intercrural | Penis between thighs; explicitly not anal penetration in this passage. |
| bluebells-act-18 | 1168–1170 | manual | Recipient also stimulates penetrator with fingers and cupped hand during intercrural sex. |
| bluebells-act-19 | 1263–1263 | manual | Palming partner penis through pants. |
| bluebells-act-20 | 1271–1278 | anal | Standing intercourse against tree. Rowan climaxes without any stated hand-to-penis stimulation; narration alone does not explicitly assert untouched climax. |
| were-compeer-act-4 | 166–168 | anal toy insertion | Adrian inserts a tail plug and moves its base against Nolan’s prostate. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-15 | 305–306 | manual penis stimulation | Adrian removes the cage and strokes Nolan to orgasm while maintaining internal finger stimulation. |
| were-compeer-act-19 | 403–428 | anal toy insertion / stimulation | Adrian inserts graduated anal beads, activates vibration twice, then removes them. Nolan does not orgasm from the beads. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-23 | 462–462 | anal toy insertion | Adrian inserts the smallest metal plug. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-25 | 473–473 | self anal toy insertion | Nolan replaces the initial plug with the medium plug after exercising and showering. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-26 | 532–533 | self anal toy insertion | Nolan removes the medium plug and inserts the largest plug himself. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-30 | 576–578 | anal toy stimulation / removal | Adrian presses the plug base against Nolan internally and later removes it. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-34 | 602–606 | anal fisting / prostate massage | Adrian’s entire hand enters; internal knuckle stimulation gives Nolan a caged orgasm; Adrian removes the hand. |
| were-compeer-act-35 | 689–696 | frottage | Adrian rubs his clothed penis against Nolan’s penis and hip on the kitchen floor; both climax without penetration. |
| were-compeer-act-46 | 1121–1122 | self anal toy stimulation | Nolan replaces his own fingers with a dildo and masturbates to orgasm. Adrian remains a nonparticipating observer. Wearing/presence hints, if any, do not by themselves detect this specific performed insertion or stimulation. |
| were-compeer-act-49 | 1168–1168 | manual penis stimulation | Adrian grips Nolan’s penis and triggers his climax during intercourse. |
| dogbird-act-2 | 1106–1108 | grinding | Clothed friction and grinding; no penetration. Inventory item outside the central penile-anal/oral detector scope; absence of an act hit does not establish a regression. |
| dogbird-act-7 | 1159–1160 | grinding | Buck humps Eddie thigh during mutual kissing; no genital penetration or climax. Inventory item outside the central penile-anal/oral detector scope; absence of an act hit does not establish a regression. |
| dogbird-act-12 | 1239–1239 | grinding | Eddie grinds down onto Buck; clothed friction. Inventory item outside the central penile-anal/oral detector scope; absence of an act hit does not establish a regression. |
| dogbird-act-14 | 1260–1262 | grinding | Inventory item outside the central penile-anal/oral detector scope; absence of an act hit does not establish a regression. |
| dogbird-act-19 | 1280–1282 | manual-self-contact | Palm pressure against own erection; brief non-orgasmic touch. Inventory item outside the central penile-anal/oral detector scope; absence of an act hit does not establish a regression. |
| dogbird-act-27 | 1308–1308 | masturbation | Buck strokes own penis twice to spread lube; no self-orgasm. |

## Validation

Validation results are recorded in the pull request. The focused corpus check covers the three eligible uploaded works. A full-corpus sexual-content review was not performed, because two requested works are excluded. The new dataset tests verify full paragraph coverage, fractional-weight routing, exact claim identity, uncertainty exclusion, and preservation of earlier audit judgments.
