# Deep-dive label pass: HTML and PDF uploads

Reviewed against main at `9ad2225b8e15807e5d7e03095489eb596153c797` on 2026-10-10. Each eligible work was read from beginning to end, followed by contextual review of every engine audit reading. **Only definite judgments with reviewer confidence ≥95% enter training, at weight 0.9.** The confidence cutoff applies to this conversation and future additions; older AI and owner judgments are not retroactively filtered. Weight is distinct from reviewer confidence and engine confidence. These are AI judgments, not human gold labels.

| Fic | Paragraphs read | Right | Wrong | Uncertain | Imported at 0.9 (right / wrong) | Act inventory | Candidate missed performed acts ≥95% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bluebells and Daylillies and Wild Roses Running Rampant | 1747 | 58 | 8 | 0 | 33 (27 / 6) | 29 | 7 |
| A WereCompeer | 1220 | 165 | 27 | 18 | 146 (128 / 18) | 53 | 11 |
| like a dog with a bird at your door | 1474 | 52 | 16 | 4 | 39 (30 / 9) | 36 | 6 |
| Needing the Knot | 1858 | 53 | 18 | 11 | 67 (53 / 14) | 56 | 23 |
| wicked thing | 4321 | 27 | 12 | 4 | 34 (22 / 12) | 29 | 6 |

Across the five eligible works: **473 readings assessed; 319 accepted training judgments (260 right, 59 wrong); 154 withheld; 203 inventory records.** Inventory size is not a false-negative count: it includes retrospective summaries, requests, broader contact and uncovered passages within already-detected scenes. Lower-confidence assessments remain report-only.

The cutoff removes nine judgments from the previous version of this PR (eight WereCompeer and one Dogbird). Two had replaced older Claude records, which were restored unchanged. Older records are archived when replaced by qualifying judgments, not counted twice. All 47 protected human/retired/disputed WereCompeer right-set records remain identical as JSON objects.

## Exclusions

AGENTS.md says “Decline fics where minors appear in sexual content.” Negotiation includes a minor witnessing adult sexual contact; Strawberry Mama includes an erotic recollection explicitly set at age 14; (best/str8/room)mate explicitly recalls sexual activity at ages 12 and 14. Those works receive no new labels or inventories. Existing repository records are unchanged.

## Findings

- Bluebells: missed tree-side penile-anal intercourse, reciprocal hand stimulation and intercrural contact; caring cues credited to observers; self-stroking assigned to the partner; a current penetration clause demoted by a preceding dream clause.
- A WereCompeer: fingers mistaken for penile penetration; external rubbing counted as anal intercourse; an absent attendant selected for sexual actions; actual oral and anal riding demoted by nearby intentions; missed fisting, toy and manual stimulation. Initial oral warming and later explicit anal warming are distinct supported events.
- Dogbird: stopped oral attempts counted as performed; guided handjob and partnered postcoital fingers have ownership errors; figurative and clothing collars become kink cues. Initial oral contact is uncovered but its continuation is detected. The receiving partner’s climax is manually assisted.
- Needing the Knot: self-fingering assigned to a partner; fingers mistaken for penile penetration; oral stimulation credited to an absent brother; hand-carried semen mistaken for a blowjob; requests and mental resistance have attribution/type errors. A supported anal reversal has Dean penetrating Castiel at paragraphs1232–1238. Multiple real toy, oral, anal and manual acts appear only as weaker hints or lack matching detections.
- Wicked thing: two supported anal encounters are missing at249–251 and3113–3123; actual oral contact is demoted to wanted; Force/mind metaphors become physical penetration; an outsider is selected in the first adult encounter; clothing and figurative leashes become collar cues. Custodial following, genuine comforting after trauma and an actual punitive collar remain uncertain, because their physical descriptions may be accurate broad dynamic hints.

The broad anal-touch pattern intentionally includes spanking, so those accurate cues are not false sex acts. Other accurate everyday hints are not rejected merely for being nonsexual. Weak/categorical ambiguity is withheld rather than forced to 95% confidence.

## Training and provenance

- Definite qualifying judgments live in `tests/right-set`, with `source: chatgpt`, `weight: 0.9`, and `reviewerConfidence` stored separately from the engine’s `conf` field. Both positives and negatives use the same 0.9 weight.
- `tests/labels/chatgpt-five-fic-deep-dives-claims.json` contains **identity metadata only and an empty labels map**. This avoids unit-weight audit votes while binding each judgment to its reviewed source hash, paragraph, pattern, act, occurrence class, participants and role. A later changed claim is quarantined by the existing learner.
- Raw readings not represented by a grouped scene use an `audit-` card; manual and dynamic readings use separate cards. The existing grouped-scene checker cannot replay those individually, so the new corpus test replays every accepted raw claim. The existing learner ignores the card field; no loader change is required.
- `tests/scene-review/chatgpt-five-fic-deep-dives.json` retains all assessments, original reviewer confidence, current per-hit model probability where available, rationale, withheld reasons, act ranges, paragraph hashes and prior automated history. Undetected acts are candidate recall evidence; no synthetic hit-training row or human gold label is fabricated. Structured act actor means performer (for oral acts this differs from legacy oral top).

**246 of 319 accepted judgments have feature vectors for the current context-model retrain. The remaining 73 contribute weighted pattern-reliability evidence but are skipped by the current context learner because features were not recorded.** Engine model confidence is null for those records. These per-hit probabilities are distinct from aggregated displayed scene scores.

## Reproducing private PDF samples

The original three HTML upload hashes, paragraph arrays, body and metadata exactly match the existing private samples. The two PDFs use the application’s PDF line/page joining and story extraction. The resulting story text is identical when serialized into private HTML for the HTML-only learning/check tools. Both original PDF hash and normalized HTML hash are retained. Different AO3 downloads or reassemblies intentionally require re-review instead of silently reusing a label.

After installing dependencies, keep the PDFs and outputs private and run:

```sh
node scripts/prepare-pdf-sample.mjs Needing_the_Knot.pdf ao3-samples/needing-the-knot.html --title 'Needing the Knot' --chapters 32/32
node scripts/prepare-pdf-sample.mjs wicked_thing.pdf ao3-samples/wicked-thing.html --title 'wicked thing' --chapters 20/20
```

The helper prints hashes and refuses to overwrite different output content. Re-running the same PDF is safe. Paragraph indices below are zero-based, using `reviewParagraphs` from `review/review-batch-data.ts` on the private HTML. The normalized files and fic text are not committed.

## Wrong readings

These explanations use invented adult aliases. Machine-readable identity fields retain the actual names needed for matching. A wrong hint is not necessarily a false-positive performed scene; its exact kind is listed.

| Item | Paragraph | Pattern / kind | Why wrong | Training |
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
| needing-the-knot-0 | 168 | fingers-into / act | Self-fingering; Adrian has already left. | Withheld: More than one detected claim shares the legacy pattern/short-hash key |
| needing-the-knot-1 | 168 | fingers-into~elided / act | Self-fingering, with no partner performing it. | Withheld: More than one detected claim shares the legacy pattern/short-hash key |
| needing-the-knot-2 | 168 | dd-finger-slips-into / act | Duplicate pattern repeats the incorrect partner recipient. | Withheld: More than one detected claim shares the legacy pattern/short-hash key |
| needing-the-knot-3 | 168 | dd-finger-slips-into~elided / act | Duplicate elision invents an absent actor. | Withheld: More than one detected claim shares the legacy pattern/short-hash key |
| needing-the-knot-5 | 606 | rock-into / act | Withdrawal of fingers in the next paragraph resolves the instrument; intercourse begins later. | 0.9 |
| needing-the-knot-6 | 607 | mouth-off~elided / act | The adult brother is absent; continuous subject is Adrian. | 0.9 |
| needing-the-knot-20 | 1111 | cum-in-throat / act | Previous sentence establishes transfer by hand; no mouth-to-penis act here. | 0.9 |
| needing-the-knot-24 | 1133 | fuck / act | Fingers transport semen to his mouth; they are not entering the recipient. | 0.9 |
| needing-the-knot-29 | 1225 | hole-around-name / act | Penile penetration does not begin until seven paragraphs later. | 0.9 |
| needing-the-knot-32 | 19 | fuck~elided / wanted | Wanted-role top reverses the requesting recipient; desired actor is Adrian. | 0.9 |
| needing-the-knot-34 | 86 | hj-stroke / handjob | Self-touch; Adrian is absent. | 0.9 |
| needing-the-knot-38 | 169 | suck-fingers~elided / fingers | Finger owner is Rowan, not Adrian; fantasy does not change ownership. | 0.9 |
| needing-the-knot-40 | 202 | hj-stroke / handjob | Handjob to a partner is invented; the sheet bears only the partner’s scent. | 0.9 |
| needing-the-knot-43 | 293 | plug-worn / prep | The word for atmosphere is unrelated to any vibrator or plug. | 0.9 |
| needing-the-knot-47 | 439 | thrust-back / touch | Pushing back is psychological resistance, not bodily motion toward penetration. | 0.9 |
| needing-the-knot-59 | 1048 | abo-bare-neck~elided / behavior | The credited neck-offering person is reversed; the desire belongs to Rowan. | 0.9 |
| needing-the-knot-63 | 1106 | hole-around / touch | This is insertion and riding, not merely penis against buttocks; next paragraph confirms intercourse. | 0.9 |
| needing-the-knot-68 | 1133 | suck-fingers~elided / fingers | Self finger licking must not make Rowan the finger owner; licking also differs from sucking. | 0.9 |
| wicked-thing-11 | 3121 | push-into~elided / act | The fingers are figurative elements of a presence entering a mind. No physical anal fingers are described in the matched sentence. Separate surrounding intercourse is penile, established at paragraph 3113. | 0.9 |
| wicked-thing-12 | 3673 | pushed-in~elided / act | No sexual action or partner is present; figurative effort is converted into penile anal penetration. | 0.9 |
| wicked-thing-13 | 237 | dom-pin~elided / behavior | The continuous nightclub-to-bedroom scene identifies the older participant as Morgan, whose identity is confirmed by the following morning. Ellis is absent. The physical pinning is real, but its reported actor is an outsider. | 0.9 |
| wicked-thing-14 | 244 | knelt-between~elided / prep | Morgan is the kneeling performer, and Rowan is the seated recipient. Ellis is absent. This specific match is preparation, with oral activity subsequently established at248; it must not independently count as a completed oral act. | 0.9 |
| wicked-thing-18 | 1407 | collar-wearer / behavior | No collar, leash or gag is worn. The imagined restraints concern the Council rather than Morgan. | 0.9 |
| wicked-thing-22 | 1796 | sub-melt~elided / behavior | The person going limp is the unrelated pirate during a violent escape. Neither member of the romantic pair goes pliant here. | 0.9 |
| wicked-thing-27 | 2531 | collar-wearer / behavior | The collar is part of clothing, not a sexual collar or leash. The observer notices adult neck marks, not an ongoing sex act. | 0.9 |
| wicked-thing-28 | 2863 | collar-wearer / behavior | The collar is the ordinary robe neckline. No separate collar or leash is worn. | 0.9 |
| wicked-thing-32 | 3100 | mouth-around-him~elided / wanted | The sentence expresses desire while describing present, actual mouth contact begun in the preceding paragraph. The wanted classification wrongly demotes an ongoing act; hint a is the mouth performer because its role is bottom. | 0.9 |
| wicked-thing-36 | 3660 | sinks-to-floor / prep | Full surrounding context is a solitary escape attempt, not oral preparation; no sexual partner is present. | 0.9 |
| wicked-thing-40 | 4194 | collar-wearer / behavior | A figurative leash describes combat domination of Morgan and a third fighter, not a collar worn by Rowan in sexual submission. | 0.9 |
| wicked-thing-41 | 4244 | collar-wearer / behavior | The target is the adversary, not Rowan; no sexual leash or sexual partner relation is described. | 0.9 |

## Candidate missed performed acts at ≥95% confidence

These performed acts or components lack a correctly matched act detection in the cited range. They need human confirmation before becoming gold recall tests. Historic summaries, broader inventory-only contact, incorrect existing claims and lower-confidence proposals are separately identified in the JSON.

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
| needing-the-knot-act-0 | 86–88 | masturbation | Solo penile stroking; raw partner-handjob hit is wrong. |
| needing-the-knot-act-8 | 168–169 | fingering | Self-fingering while partner absent; all raw act hits misattribute partner. |
| needing-the-knot-act-10 | 202–203 | masturbation | Solo stroking and friction against a scented sheet. |
| needing-the-knot-act-11 | 213–213 | masturbation | Solo shower orgasm, summarized in narration. |
| needing-the-knot-act-16 | 603–603 | rimming | Tongue across and into anal opening. |
| needing-the-knot-act-17 | 606–607 | fingering | Inferred instrument confirmed by finger withdrawal; raw penis reading wrong. |
| needing-the-knot-act-18 | 615–615 | handjob | Rowan manually strokes Adrian’s penis; performer ownership retained. |
| needing-the-knot-act-21 | 668–671 | handjob | Simultaneous stroking of Rowan by Adrian. |
| needing-the-knot-act-22 | 776–778 | blowjob | Adrian penis owner/oral top; Rowan performer; detected only as grip hint. |
| needing-the-knot-act-23 | 781–781 | rimming | Mouth replaces torn underwear at rear. |
| needing-the-knot-act-24 | 783–783 | fingering | Three fingers explicitly penetrate. |
| needing-the-knot-act-27 | 1029–1038 | anal sex | Seated riding encounter, onset compressed; next chapter confirms knot and multiple climaxes. |
| needing-the-knot-act-28 | 1091–1091 | blowjob | Rowan receives oral penile contact, including swallowing. |
| needing-the-knot-act-29 | 1091–1091 | rimming | Tongue at and through entrance before fingers. |
| needing-the-knot-act-33 | 1102–1104 | blowjob | Rowan wakes Adrian with oral stimulation; Adrian penis owner. |
| needing-the-knot-act-35 | 1109–1111 | masturbation | Rowan grasps and strokes his own penis while riding partner. |
| needing-the-knot-act-40 | 1132–1140 | anal sex | Table penetration and knot followed by carry to sofa; raw fingering hit is wrong. |
| needing-the-knot-act-41 | 1132–1132 | handjob | Adrian touches Rowan’s penis beneath lace at climax. |
| needing-the-knot-act-44 | 1173–1173 | anal sex | Actual insertion, thrusts and knot; detected only as hints, not a correct strong act. |
| needing-the-knot-act-45 | 1173–1173 | handjob | Adrian strokes Rowan during intercourse. |
| needing-the-knot-act-49 | 1219–1219 | rimming | Rowan performs first receptive oral-anal stimulation on Adrian. |
| needing-the-knot-act-51 | 1232–1238 | anal sex | Rowan penetrates Adrian and ejaculates internally. Matched nudging onset uncertain; later insertion and completion certain. |
| needing-the-knot-act-53 | 1415–1423 | anal sex | Later penetrative intercourse, knot and sustained bite; dialogue hit only. |
| wicked-thing-act-4 | 249–249 | fingering | One, then multiple fingers enter before a distinct penile insertion. |
| wicked-thing-act-5 | 249–251 | anal sex | The adult partner's insertion follows explicit finger preparation, and sustained intercourse follows. The younger adult's mistaken belief that he is dreaming is disproved the next morning at264–268. |
| wicked-thing-act-18 | 2152–2152 | masturbation | One hand initially encloses both adults’ penises, including the performer’s own. |
| wicked-thing-act-19 | 2152–2164 | manual | Manual genital stimulation continues through mutual climax. Praise hit does not itself detect this act. Only praise is detected, not the manual act. |
| wicked-thing-act-20 | 2156–2164 | manual | Reciprocal hand stimulation begins after partner guides his hand; both climax. |
| wicked-thing-act-27 | 3113–3123 | anal sex | The younger adult lowers onto the older adult’s penis, then rides him to mutual climax. Anatomical site is established by the adult male pairing and continuous insertion/hip motion context. The metaphorical mind fingers at 3121 are not physical fingering; lap position hit 33 is only a hint. |

## Validation

Results are recorded in the pull request. Dataset checks verify whole-text coverage, exact identities, uncertainty and confidence-cutoff exclusion, fractional-weight routing, restored earlier automated records and prior audit protections. A separate corpus test replays every accepted raw claim against the five private samples. The focused gold/right-set check covers the eligible works; excluded works were not analyzed. No engine detection rules, gold labels, production model, reliability table or METRICS row changed. Retraining remains separate after merging.
