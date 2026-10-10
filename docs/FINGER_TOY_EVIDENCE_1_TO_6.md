# Fingering/toy evidence handoff: fix families 1–6

This supplements [the original missing-entry trace](FINGER_TOY_MISSING_TRACE.md) with populated evidence for another AI to implement and verify narrow fixes. It changes no engine, labels, confidence settings or generated model files. Source descriptions are paraphrases; synthetic tests use invented adult names.

## Reproduction contract

- Branch base: `e780d91`; inspected engine: `68338708cd8d600ace41dea533892d3af564b043`; frozen selection: `7f77a765cea99589cb8d75c4d5da67ba3da3e787`. The branch base adds the earlier report without changing that engine.
- Machine-readable companion: [evidence, identities and 41 controls](data/finger-toy-evidence-1-to-6.json). Preserve source SHA, paragraph hashes, event IDs and reviewer provenance. Paragraph indices are zero-based engine debug indices, not PDF pages or HTML paragraph numbers.
- Read AGENTS.md, README.md, ENGINE_MAP.md and TESTING.md. Use privately supplied, adult-screened source files; never put source prose in commits or PRs. If source SHA or hashes disagree, stop interpreting that location and resolve the version first.
- Start with the existing `scripts/trace-reviewed-misses.mjs` and original report reproduction instructions. Confirm baseline candidates, final readings and occurrence kind before changing a guard. Exact commands and code pointers are in that report; do not substitute a homemade scoring rule.
- The original replay still missed all 20 selected entries: 12 fingering and 8 toys. Families 1–6 cover 16 primary entries; F09 is a secondary guard crosscheck whose main failure is attribution. This supplement introduces no new model measurements.

## Interpret evidence correctly

“Explicit” concerns the stated facet, not certainty about every participant or anatomical detail. “Local-context” uses nearby chronology; “inferred” and “unresolved” preserve limits. Fine-grained facts here are ChatGPT analysis, not newly approved owner labels. Original Owner judgments remain intact. No new reviewer-confidence percentages are invented.

Entrance contact counts under current AGENTS.md even without insertion. Failed attempts before contact do not. Physical ongoing toy use need not contain a new insertion verb. Memory/wanted readings can be correctly credited hints while remaining outside performed-act recall. Do not trade an instrument, occurrence or participant error for a higher match count.

## Populated case evidence

### 1. Direct anatomical finger wording

#### F01: needing-the-knot.html · paragraphs 783–783

Reference: **Fingering**, Castiel → Dean Winchester; reviewer **ChatGPT**; inventory `chatgpt-five-fic-deep-dives.json`, event `needing-the-knot-act-24`. Source identity and hashes are in the companion JSON.

- **explicit**, p783: Three fingers enter the receiver’s anal opening; pumping is a participial action attached to the named performer.
- **local-context**, p781, 783, 784: The same performer also provides oral contact. Paragraph 784 changes to penile entry; preserve both act types and stop inheriting fingers into that new instrument.

Proposed narrow change: Add a narrow finger-object gerund pattern for pumping into an explicit target, resolving the omitted performer from the preceding named clause. Preserve concurrent oral activity.

Synthetic positive: Morgan moves behind Rowan. Pumping two fingers into Rowan’s anus, he continues oral stimulation. → fingering, Morgan → Rowan.

Boundary control: Morgan pumps lotion into his hand. → no fingering.

#### F03: wretched-rhetoric.html · paragraphs 644–657

Reference: **Fingering**, Obi-Wan Kenobi → Anakin Skywalker; reviewer **ChatGPT**; inventory `chatgpt-four-pdf-deep-dives.json`, event `wretched-rhetoric-act-10`. Source identity and hashes are in the companion JSON.

- **explicit**, p644, 646, 650, 654, 657: Two lubricated fingers are retained inside the receiver, curled and moved, then withdrawn before oral anal contact.
- **local-context**, p644, 657: Anal location and performer identity require the surrounding adult encounter. Ordinary past tense describes a scene, not an explicit memory frame. Several movements belong to one ongoing finger episode.
- **observed-engine**, p657: The surviving rimming reading reverses participants. Do not treat it as a successful fingering recovery or a control.

Proposed narrow change: Add owned/held finger-state forms, including has/had fingers inside, inside of, intervening depth modifiers and retained motion. Use ownership and local receiver references. Do not count every continuation as another scene.

Synthetic positive: Morgan has two fingers deep inside Rowan’s anus. They remain inside as Morgan curls them. → one ongoing fingering scene.

Boundary control: Morgan has two fingers inside his glove. → no sexual act.

#### F04: wretched-rhetoric.html · paragraphs 605–605

Reference: **Fingering**, Obi-Wan Kenobi → Anakin Skywalker; reviewer **ChatGPT**; inventory `chatgpt-four-pdf-deep-dives.json`, event `wretched-rhetoric-act-34`. Source identity and hashes are in the companion JSON.

- **explicit**, p605: Finger contact with the receiver’s prostate is stated; the instrument is not owned by a named person in that clause.
- **inferred**, p605, 606: The active partner is inferred from the local two-person encounter. Nearby fingers gripping furniture belong to the receiver and must not supply ownership of the inserted fingers.

Proposed narrow change: Add a prostate-contact finger-noun pattern that resolves an omitted owner only from an established local actor. Preserve ambiguity if several actors remain possible; do not invent penile penetration from prostate contact.

Synthetic positive: Morgan positions himself behind Rowan. Two fingers brush Rowan’s prostate. → fingering, Morgan → Rowan.

Boundary control: Several adults surround Rowan; an unidentified hand reaches for him. → do not assign a confident named performer.

#### F08: icarus-burning.html · paragraphs 3311–3311

Reference: **Fingering**, Samiel Tremark → Jason Lane; reviewer **ChatGPT**; inventory `chatgpt-icarus-burning-deep-dive.json`, event `icarus-burning-act-23`. Source identity and hashes are in the companion JSON.

- **explicit**, p3311: A named performer places finger pads at the receiver’s anal opening and adds a fingertip alongside an already inserted penis. Both acts occur concurrently.
- **identity-check**, p3311: Inventory receiver Jason Lane appears as Jay in engine output. Verify the source-bound alias before diagnosing an attribution failure; do not silently change the scorer or labels.

Proposed narrow change: Add supported tip-of-finger entry and pads-of-fingers entrance contact, resolving the action separately. Do not retype the valid penile reading or let a deduplication rule collapse different acts in one sentence.

Synthetic positive: Morgan’s penis remains inside Rowan. Morgan presses a fingertip against Rowan’s anal opening beside it. → both penile anal sex and fingering.

Boundary control: Morgan’s penis remains inside Rowan while his fingers touch Rowan’s shoulder. → penile act only.

#### F12: innocent-until.html · paragraphs 4889–4889

Reference: **Fingering**, James "Bucky" Barnes → Steve Rogers; reviewer **Owner**; inventory `suspect-two-569919fdfb5e.json`, event `T16`. Source identity and hashes are in the companion JSON.

- **explicit**, p4889: The named performer strokes the receiver’s anal rim with fingers. Entrance contact is sufficient under AGENTS.md; insertion depth is unnecessary.
- **local-context**, p4889: Coordinated oral contact and later penile activity must remain separately typed. Do not turn contact on buttocks or kissing a face into fingering.

Proposed narrow change: Add verb-over-receiver-rim-with-fingers order and a tightly bounded anatomical anaphor for coordinated actions. First recover the explicit rim contact; do not let kissing suppress simultaneous finger stimulation or reinterpret cheek contact as entrance contact.

Synthetic positive: Morgan strokes Rowan’s anal rim with his fingers while kissing the same opening. → fingering plus any independently supported oral contact.

Boundary control: Morgan strokes Rowan’s buttock with his fingers while kissing Rowan’s cheek. → no anal fingering.

### 2. Reaction versus reinsertion guard

#### F05: foxden-park.html · paragraphs 1133–1144

Reference: **Fingering**, Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; reviewer **ChatGPT**; inventory `chatgpt-foxden-park-deep-dive.json`, event `foxden-park-act-32`. Source identity and hashes are in the companion JSON.

- **explicit**, p1134, 1135, 1137, 1139: Finger entry, withdrawal and reinsertion precede a second finger entering at the anal opening. Withdrawal depth is unspecified.
- **local-context**, p1131, 1144, 1145, 1148: Preparation establishes the target; later removal and preparation for penile sex end finger carryover.
- **observed-engine**, p1135: The elided insertion candidate has the correct participants but is dropped by a body-part/reaction guard. The guard also accepts a body part followed by an ordinary word ending in s, so a withdrawal description can be mistaken for a reaction.
- **reproduced-synthetic**, p1135: On unchanged main, a synthetic withdrawal/reinsertion sentence loses a correctly attributed candidate; changing only the withdrawal wording restores the finger act. A fingers-flexing-on-cushion control stays negative. No fix has been tested.
- **observed-engine**, p1139: A separate stretching candidate reverses people; its object refers to fingers. Recovering that candidate without resolving its referent would create a new error.

Proposed narrow change: Narrow the pushed-in elided body-part-reaction guard to an actual body-part subject/reaction; do not reject a person withdrawing a finger and inserting it again. Preserve the finger instrument through reinsertion. Add a bounded fingertip-entry form with a locally established receiver. The open-them-up match at 1139 refers to fingers; do not salvage it as a person being opened.

Synthetic positive: Morgan’s finger is inside Rowan’s anus. Morgan draws his finger out and presses in again. → fingering, same pair.

Boundary control: Morgan’s palm flexes, pressing into a cushion. → no penetration.

### 3. Self-fingering attribution

#### F10: sugar-alpha.html · paragraphs 850–850

Reference: **Fingering**, Stiles Stilinski → Stiles Stilinski; reviewer **Owner**; inventory `sugar-alpha-errors-b91edd7-v1.json`, event `W19`. Source identity and hashes are in the companion JSON.

- **local-context**, p850: An isolated adult reaches to put his own fingers inside while manually stimulating himself. A desired partner is absent, so partner attribution is unsupported.
- **unresolved**, p850: The wording emphasizes effort. Owner inventory calls this performed fingering, but achieved contact versus attempt and the exact anatomical target are less direct than in F11. Preserve that owner judgment; a general pattern must still require contact evidence.

Proposed narrow change: Recognize get-own-fingers-inside-of-self only with local physical/contact evidence. Resolve self-use from the actor and body ownership, not the later imagined partner. Distinguish achieved contact from failed reach or a mere plan.

Synthetic positive: Rowan’s fingers are inside his own anus; reaching around strains his back. → self-fingering.

Boundary control: Rowan tries to reach his anus but cannot touch it. → no performed self-fingering.

#### F11: sugar-alpha.html · paragraphs 1760–1761

Reference: **Fingering**, Stiles Stilinski → Stiles Stilinski; reviewer **Owner**; inventory `sugar-alpha-errors-b91edd7-v1.json`, event `W29`. Source identity and hashes are in the companion JSON.

- **explicit**, p1760, 1761: The adult uses fingers on his own opening and achieves entry. The partner is asleep initially; waking does not make that partner the performer. Fingers slip out afterward.
- **local-context**, p1759, 1764: Sleeping context precedes the cited range; the partner takes the adult’s hands away later. These anchors limit self-use and its endpoint.

Proposed narrow change: Cover use-fingers-to-poke an explicit opening and a bare fingers-slide-in continuation with verified self target. Contact already counts; do not require deeper insertion. Preserve self-use until an explicit new actor intervenes.

Synthetic positive: Rowan uses two fingers to touch his own anal opening. They slide in while Morgan sleeps. → self-fingering, Rowan → Rowan.

Boundary control: Rowan pokes Morgan’s shoulder to wake him. → no fingering.

### 4. Toy subject, replacement and pronoun references

#### T01: were-compeer.html · paragraphs 462–462

Reference: **Toy insertion**, Derek Hale → Stiles Stilinski; reviewer **ChatGPT**; inventory `chatgpt-five-fic-deep-dives.json`, event `were-compeer-act-23`. Source identity and hashes are in the companion JSON.

- **explicit**, p462: A partner lubricates an established plug and the receiver; the toy slides into the receiver and settles beyond the rim.
- **local-context**, p458, 461, 462: The receiver requested that partner’s insertion. The toy is the grammatical subject of entry, while the preceding manipulation identifies the human performer.

Proposed narrow change: Add a bounded toy-subject entry pattern. Resolve the receiver from explicit body ownership and the performer from the preceding named manipulation, rather than treating the toy as a person.

Synthetic positive: Morgan lubricates a plug for Rowan. The plug slides into Rowan’s anus. → partnered toy act, Morgan → Rowan.

Boundary control: Morgan lubricates a plug and puts it in its storage case. → no toy act.

#### T02: were-compeer.html · paragraphs 473–473

Reference: **Toy insertion**, Stiles Stilinski → Stiles Stilinski; reviewer **ChatGPT**; inventory `chatgpt-five-fic-deep-dives.json`, event `were-compeer-act-25`. Source identity and hashes are in the companion JSON.

- **explicit**, p473: The solo adult inserts the next larger size after a shower; a retained metal base confirms completed placement.
- **local-context**, p471, 472, 473, 474, 475: The size reference refers to a previously introduced plug. The partner has left; remote observation does not make that partner the performer. Prior removal is not explicitly narrated, so do not invent it.
- **observed-engine**, p473: A wearing-a-plug hint survives. Do not promote all wearing hints to insertion; this paragraph additionally describes a new placement.

Proposed narrow change: Recognize a new insertion with a size/reference phrase only when the same local passage explicitly establishes a plug and the wearer. Do not promote every wearing-plug hint to an insertion.

Synthetic positive: Rowan removes his small plug and inserts the larger one into himself. → self toy act.

Boundary control: Rowan leaves his plug in and selects a larger one for tomorrow. → no new insertion.

#### T03: were-compeer.html · paragraphs 532–533

Reference: **Toy insertion**, Stiles Stilinski → Stiles Stilinski; reviewer **ChatGPT**; inventory `chatgpt-five-fic-deep-dives.json`, event `were-compeer-act-26`. Source identity and hashes are in the companion JSON.

- **explicit**, p532, 533: A medium plug is removed; the adult selects and lubricates a larger plug, then succeeds in placing it after several attempts.
- **local-context**, p531, 532, 533: Earlier intent is not completion. Removal clears the old device state; new selection establishes the referent of the later pronoun. Cleaning actions intervene but no scene break separates selection and insertion.

Proposed narrow change: Support a bare pronoun-object insertion continuation across a short paragraph boundary, with verified toy referent and self receiver. Reset old instrument state after removal, then establish the newly selected toy.

Synthetic positive: Rowan removes a plug and lubricates a larger anal plug. Next paragraph: He finally pushes it in. → self toy act.

Boundary control: Rowan removes a plug, picks up a charging cable and pushes it in. → no insertion continuation.

### 5. Device aliases and ongoing toy use

#### T04: needing-the-knot.html · paragraphs 86–88

Reference: **Toy insertion**, Dean Winchester → Dean Winchester; reviewer **ChatGPT**; inventory `chatgpt-five-fic-deep-dives.json`, event `needing-the-knot-act-1`. Source identity and hashes are in the companion JSON.

- **explicit**, p86, 87, 88: A solo adult installs and activates a prostate device, moves against it, and experiences anal contraction around the retained device.
- **local-context**, p84, 86, 88: The partner has left. Prostate massager, dual-head device and plug refer locally to the device, not to a partner’s penis. Setup and continued stimulation form one activity, not three insertion scenes.
- **observed-engine**, p86, 88: A misattributed handjob candidate and a wearing hint do not cover this physical toy activity.

Proposed narrow change: Add prostate-massager and dual-headed-massager aliases when the physical target is supported. Cover putting an established massager in place and moving against it. Keep ongoing use separate from a newly counted insertion.

Synthetic positive: Rowan settles an anal prostate massager inside himself, switches it on and rocks against it. → self toy use.

Boundary control: Rowan switches on a massage device resting against his shoulder. → no anal toy act.

#### T05: needing-the-knot.html · paragraphs 118–123

Reference: **Toy insertion**, Dean Winchester → Dean Winchester; reviewer **ChatGPT**; inventory `chatgpt-five-fic-deep-dives.json`, event `needing-the-knot-act-2`. Source identity and hashes are in the companion JSON.

- **explicit**, p118, 120, 122, 123: A dildo is introduced, used orally, then used anally by the solo adult. Later expansion inside the anus confirms physical anal use; withdrawal ends it.
- **local-context**, p119, 120, 121, 124: Oral toy use is not a penile blowjob. Imagined partner activity between physical toy actions does not give the absent partner ownership of those actions. Preserve toy identity through fake-penis wording and handle the change of body site.

Proposed narrow change: Retain the established artificial instrument across cock/knot references, track the mouth-to-anus target change, and classify physical self-use separately from imagined partner actions. Do not treat the imagined partner as the performer.

Synthetic positive: Rowan holds a silicone dildo, briefly mouths it, then lowers his anus onto it while imagining Morgan. → performed self anal toy use; imagined Morgan remains contextual.

Boundary control: Rowan only imagines sitting on the dildo while holding it. → contextual reading, no performed act.

#### T06: innocent-until.html · paragraphs 1234–1234

Reference: **Toy insertion**, James "Bucky" Barnes → Steve Rogers; reviewer **Owner**; inventory `missed-2051db5b4e06.json`, event `M10`. Source identity and hashes are in the companion JSON.

- **explicit**, p1234: Movement drives an already placed stimulator within the receiver. This is ongoing toy stimulation, not a newly described insertion.
- **local-context**, p1230, 1234: Earlier placement inside the anal recipient establishes location and partnered control. The device name alone must not imply anal use; a surface stimulator is a negative control.

Proposed narrow change: Recognize stimulator as a toy only when physical anal placement is established locally. Add ongoing movement of an inserted toy, distinct from a new insertion event.

Synthetic positive: Morgan has placed an anal stimulator inside Rowan and moves it back and forth. → ongoing partnered toy act.

Boundary control: Morgan adjusts a muscle stimulator attached to Rowan’s arm. → no anal toy act.

### 6. Preparation summaries and residue references

#### F06: foxden-park.html · paragraphs 1331–1332

Reference: **Fingering**, Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; reviewer **ChatGPT**; inventory `chatgpt-foxden-park-deep-dive.json`, event `foxden-park-act-39`. Source identity and hashes are in the companion JSON.

- **explicit**, p1331, 1332: The performer oils his fingers and opens the receiver in the same action sequence.
- **inferred**, p1331, 1332, 1333: Finger contact and anal target are inferred from preparation plus the local sexual sequence, rather than a literal finger-entry clause. Oiling alone or opening a nonbody object is insufficient. If private replay cannot establish contact, queue for owner adjudication instead of forcing a match.
- **observed-engine**, p1331, 1332: The existing unrelated bystander/self candidate does not survive and must not be resurrected to satisfy recall.

Proposed narrow change: Recognize coax/coaxes/coaxed someone open only with same-action finger preparation and sexual target context. Resolve the explicit main-clause actor/receiver, without reusing the rejected self-touch candidate.

Synthetic positive: Morgan lubricates his fingers, then gently coaxes Rowan’s anus open with them. → partnered fingering.

Boundary control: Morgan oils his fingers before coaxing a stuck jar open. → no fingering.

#### F07: foxden-park.html · paragraphs 1334–1338

Reference: **Fingering**, Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; reviewer **ChatGPT**; inventory `chatgpt-foxden-park-deep-dive.json`, event `foxden-park-act-41`. Source identity and hashes are in the companion JSON.

- **explicit**, p1334, 1335, 1338: After penile withdrawal, the receiver guides the performer’s hand back; the performer inserts two fingers, holds them still, and the receiver later withdraws from them.
- **local-context**, p1333, 1334, 1336, 1338: Residual lubricant and ejaculate refer to the previously established bodily site. Generic wetness is insufficient. Receiver dialogue does not transfer action ownership. Change instrument from penis to fingers and end it at removal.

Proposed narrow change: Support finger insertion into a locally established anatomical target described by residue/wetness. Prefer the named finger inserter and established receiver over stale recent-character fallback. Do not infer an opening from wetness alone.

Synthetic positive: Morgan withdraws from Rowan’s anus. Rowan guides Morgan’s hand back there; Morgan slides two fingers into the remaining lubricant. → fingering, Morgan → Rowan.

Boundary control: Morgan slides two fingers into spilled lubricant on a table. → no fingering.

### F09: secondary guard crosscheck, not a seventeenth primary target

Wolfbird, p1889; expected Ilya Rozanov → Claire, ChatGPT reference. Main implementation family remains participant resolution (family 8).

- **explicit**, p1885, 1889: An explicitly adult female client receives finger contact between the legs followed by lubricated finger entry.
- **local-context**, p1887, 1889: The named practitioner performs the action; vaginal anatomy follows the client context. A main-pair partner must not replace the client simply because the client is absent from the initial cast.
- **observed-engine**, p1889: The trace chooses the main-pair receiver instead of the client and produces no surviving finger act. Guard relaxation alone cannot fix participant selection or body-site typing.

## Useful owner adjudication, without blocking clear cases

- **F10:** did finger contact actually occur, or was this solely an attempt? The existing owner inventory says performed; preserve it while avoiding a general effort-only rule.
- **F06:** does the preparation/result sequence establish finger contact, or just oiling and positioning? If source context cannot resolve that, flag the facet rather than turning the inference into a new label.
- **F04:** performer attribution relies on surrounding action, not ownership in the finger clause. An ambiguous multi-person variant must remain unresolved.
- **F08:** resolve Jay/Jason Lane against private source metadata before interpreting an exact-name scoring failure. This is an identity check, not an invitation to rewrite the owner/reference labels.
- **F02 and T07 remain separate:** remembered fingering and urethral sounding need scope/taxonomy adjudication; do not recover them as current anal acts just to satisfy the original denominator. Their references are retained in the JSON.

## Existing positives and new negative controls

The companion JSON lists **41 previously benchmark-covered controls: 37 fingering and 4 toys, across 19 fics**. Review provenance: **20 Owner, 20 Both (Claude and ChatGPT agree), 1 ChatGPT**. These are source-bound regression controls, not a fresh private-source review or new gold set. Replay them; preserve instrument, body site, participants and performed versus hint status, not just a nonempty hit.

Add the paired synthetic negatives alongside each failing positive above. Across families, also cover: fingers on furniture/hair/mouth; device in storage; attempted insertion stopped before contact; surface/vaginal device with no anal target; partner merely observing self-use; remembered acts remaining noncurrent; toy withdrawal followed by penile insertion; fingers and penis concurrently at one opening; and a third-person client omitted from the main pairing.

## Overlap to inspect before implementing

[Claude PR #196](https://github.com/reconsidering/trust-but-verify-/pull/196), inspected head `096551f3ec14f0829be2958d7e279b4f3d712788`, was merged during preparation of this handoff. The evidence above remains tied to the earlier engine commit; it is not a replay of the merged fixes. It reports entrance-contact fixes, instrument-ended boundaries, narrow finger patterns and self/client attribution work. Its implementation and claimed gains have **not** been replayed in this supplement. Check which exact case IDs it already covers before duplicating changes.

Its reported fingering denominator 63 and toy denominator 18 differ from this frozen benchmark’s 61 and 17. Do not directly compare percentages. Its broad caution about oral toys does not establish that T05 is out of scope: T05 includes later physical anal toy use as well as earlier oral use.

## Acceptance checklist for the implementing AI

1. Freeze the original 349-event full inventory and source versions. Preserve the 78-entry finger/toy subset: 61 fingering, 17 toys. Separate adjudication of F02/T07 must not silently improve recall by dropping difficult entries.
2. Inspect PR #196/current main, then reproduce one primary case and its negative at a time. Use narrow pattern/guard changes; retain paired clinical paraphrased unit tests. Do not regenerate model files or edit owner labels as part of a detector fix.
3. For each case record: prior candidate; drop/resolution reason; new act and instrument; performer/receiver; body site; occurrence kind; matching paragraph and hashes; alias treatment; remaining uncertainty. Retain failures too. A nearby hit, a wrong person or a hint is not performed-act recovery.
4. Replay all 41 covered controls plus the 20 original misses using the same scorer, then the complete fixed inventory. Report recovered, still missed, wrong-act, wrong-participant and hint-only outcomes without changing denominators. Inspect all new hits for false positives; recall alone cannot establish precision.
5. Run targeted unit tests while iterating. Before pushing detector changes, run npm test, npm run build, npm run check, and the AGENTS.md all-fic hit regression against the branch base; inspect every moved reading. Include tagged/tag-free comparisons where attribution depends on supplied pair metadata.
6. Deliver a plain-language table of each case and each changed reading, identify which fixes overlap #196, disclose unresolved inferred facets, and leave retraining to a separate change after owner acceptance.

## Validation of this report

Validated primary-case uniqueness (16), secondary crosscheck (1), reference identities against the original trace, control count/provenance, and JSON structure. No detector or confidence code changed, so no fresh engine suite, regeneration or performance claim is attached to this documentation-only handoff.
