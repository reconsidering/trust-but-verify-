# Implementation handoff: 20 missing fingering and toy entries

Report-only investigation of main **6833870**, selected from the fixed timeline's latest detector **7f77a76**. This report changes no detector, training label, inventory, confidence model or reliability table.

## Result and scope corrections

All **20/20** selected entries still score **missed** on latest main: **12 fingering**, **8 toy**, across **9 adult-screened fics**. They are reviewed inventory entries, not necessarily 20 unique scenes. A missing expected act can coexist with another correct act or an unrelated hint at the citation.

Close context review identifies **18 current-act detection targets** and **2 scope cases**:

- **F02:** explicitly remembered fingering. Recover a historical interpretation if appropriate, but do not manufacture a current scene. Queue the inventory occurrence for adjudication.
- **T07:** real urethral sounding, recorded under generic Toy insertion by the owner. The scorer supports anal/self toy activity, not sounding. Preserve the owner judgment; decide the category separately instead of counting it as anal toy sex.

These are proposed scope corrections, not an edited benchmark. The published denominator and labels remain unchanged. Correctly credited hypothetical/fantasy/wanted interpretations may be right under current AGENTS.md; they still do not satisfy a performed-act recall entry.

**No engine confidence is assigned to a missing reading.** The detector emitted no corresponding scored act. Fabricating a 0% score would conflate absence with calibrated confidence.

## What was actually traced

Reused the existing adult-screened HTML files and source-bound inventory identities. Verified source SHA-256, replayed the unmodified main detector through its existing `trace`, `audit` and `debug` hooks, and inspected the cited passage with adjacent context. Stored raw material privately outside the repository. Published only identity metadata, trace attribution, surviving act metadata, paraphrases and implementation proposals.

The trace hook runs after some early guards and initial resolution, before later refinements and guards. **No trace record is not proof that no regex matched.** Each no-trace diagnosis below is supported by reading the relevant pattern forms; it is an implementation starting point, not a claim that every early guard was instrumented. For unresolved return paths, reproduce with the paraphrased test and inspect the indicated guard before changing it.

A supplemental lexical scan of quote-masked cited sentences corroborated the missing finger/toy forms. That scan used the initial cast and omitted the engine's epithet and other sentence rewrites, so it is supporting evidence rather than a substitute for the full replay. It also found unrelated candidates rejected before the trace hook (F07, F11, F12); recovering those candidates indiscriminately would introduce errors.

Paragraph numbers are **zero-based `analyzeWithPatterns(..., {debug})` indices**, not PDF pages or HTML paragraph counts. Exact inventory identifiers, source checksums and available paragraph hashes are in [the structured handoff](data/finger-toy-missing-trace.json). The handoff is evidence/proposals, **not a training-label import**.

## Suggested implementation order

| Order | Change family | Cases | Main safeguards |
|---|---|---|---|
| 1 | Direct anatomical finger wording: gerunds, retained fingers, fingertip contact, reverse-order rim contact | F01, F03, F04, F08, F12 | Keep mouths, gloves, buttocks and nonsexual targets out; retain simultaneous valid acts |
| 2 | Narrow finger-reaction guard; preserve actual reinsertion | F05; related F09 | Do not admit palms flexing, fingers in fabric or unexplained vague insertion |
| 3 | Explicit self-finger actions and locally grounded continuations | F10, F11 | Self performer/receiver, achieved entrance contact, no imaginary-partner substitution |
| 4 | Toy subject, replacement and bare-reference insertion | T01, T02, T03 | Verified toy, target and actor; boundaries and removal/replacement reset state |
| 5 | Supported toy aliases, ongoing use and artificial-cock references | T04, T05, T06 | Device-specific anatomical evidence; separate physical use from fantasy; no new scene per continuation |
| 6 | Finger preparation summaries and residue references | F06, F07 | Named actor and established receiver/target; no jar/table or bystander fallback |
| 7 | Negated relief versus negated performance | T08 | Do not promote refusal, failed reach or wishes to performed acts |
| 8 | Named adult client attribution and vaginal classification | F09 | Local client identity; no main-partner substitution; no anal default |
| Separate | Inventory occurrence / sounding taxonomy review | F02, T07 | Preserve owner judgments; do not game recall by changing scope silently |

This order is based on specificity and expected regression risk, not a measured promise of recovered counts. The earlier entrance-contact guard suggestion remains worth auditing generally, but the 20 traces do not establish `dd5-fingers-circle-hole` as the cause of any selected miss.

## Case index

| Case | Fic | Paragraphs | Inventory ID / event ID | Expected act | Handling |
|---|---|---|---|---|---|
| T01 | were-compeer.html | 462 | were-compeer-act-23 / 23 | Toy insertion | Detection proposal |
| T02 | were-compeer.html | 473 | were-compeer-act-25 / 25 | Toy insertion | Detection proposal |
| T03 | were-compeer.html | 532–533 | were-compeer-act-26 / 26 | Toy insertion | Detection proposal |
| T04 | needing-the-knot.html | 86–88 | needing-the-knot-act-1 / 1 | Toy insertion | Detection proposal |
| T05 | needing-the-knot.html | 118–123 | needing-the-knot-act-2 / 2 | Toy insertion | Detection proposal |
| F01 | needing-the-knot.html | 783 | needing-the-knot-act-24 / 24 | Fingering | Detection proposal |
| F02 | wicked-thing.html | 249 | wicked-thing-act-4 / 4 | Fingering | Scope adjudication |
| F03 | wretched-rhetoric.html | 644–657 | wretched-rhetoric-act-10 / 10 | Fingering | Detection proposal |
| F04 | wretched-rhetoric.html | 605 | wretched-rhetoric-act-34 / 34 | Fingering | Detection proposal |
| F05 | foxden-park.html | 1133–1144 | foxden-park-act-32 / 32 | Fingering | Detection proposal |
| F06 | foxden-park.html | 1331–1332 | foxden-park-act-39 / 39 | Fingering | Detection proposal |
| F07 | foxden-park.html | 1334–1338 | foxden-park-act-41 / 41 | Fingering | Detection proposal |
| F08 | icarus-burning.html | 3311 | icarus-burning-act-23 / 23 | Fingering | Detection proposal |
| F09 | wolfbird.html | 1889 | wolfbird-primary-inv-28 / 28 | Fingering | Detection proposal |
| T06 | innocent-until.html | 1234 | M10 / 0 | Toy insertion | Detection proposal |
| T07 | innocent-until.html | 1693–1695 | M17 / 1 | Toy insertion | Scope adjudication |
| T08 | sugar-alpha.html | 849 | W19 / A8 | Toy insertion | Detection proposal |
| F10 | sugar-alpha.html | 850 | W19 / A10 | Fingering | Detection proposal |
| F11 | sugar-alpha.html | 1760–1761 | W29 / A13 | Fingering | Detection proposal |
| F12 | innocent-until.html | 4889 | T16 / A10 | Fingering | Detection proposal |

## Individual findings and test requirements

All test examples below refer to **adult Morgan and adult Rowan** and are newly invented paraphrases. Assert semantic act, performer, receiver, anatomy and occurrence, rather than a fixed pattern ID or a particular confidence number.

### T01 — Toy as grammatical subject

**Location:** `were-compeer.html`, paragraphs 462–462; `chatgpt-five-fic-deep-dives.json`, `were-compeer-act-23`, event `23`. Expected: Derek Hale → Stiles Stilinski; anal toy insertion.

**Trace and context:** A named partner lubricates an established plug; the toy then slides into the receiver and settles beyond the rim. There is no relevant traced match at paragraph 462.

**Proposed change:** Add a bounded toy-subject entry pattern. Resolve the receiver from explicit body ownership and the performer from the preceding named manipulation, rather than treating the toy as a person.

**Start in:** `src/heuristic/patterns.ts: review-inserts-named-toy / review-toy-tip-inside`; `src/heuristic/index.ts: handleMatch / namedActionOwner`. Search by symbol; line numbers drift.

**Positive test:** Morgan lubricates a plug for Rowan. The plug slides into Rowan’s anus. → partnered toy act, Morgan → Rowan.

**Boundary test:** Morgan lubricates a plug and puts it in its storage case. → no toy act.

### T02 — Replacement by size reference

**Location:** `were-compeer.html`, paragraphs 473–473; `chatgpt-five-fic-deep-dives.json`, `were-compeer-act-25`, event `25`. Expected: Stiles Stilinski → Stiles Stilinski; self anal toy insertion.

**Trace and context:** The adult wearer replaces an earlier plug with a larger size and describes it entering. A plug-worn prep reading survives, but the new self-use act does not.

**Surviving readings:** `plug-worn` at 473: wearing a plug (prep); `chastity-wearer` at 473: wearing a chastity device (behavior). None covers the expected scored act.

**Proposed change:** Recognize a new insertion with a size/reference phrase only when the same local passage explicitly establishes a plug and the wearer. Do not promote every wearing-plug hint to an insertion.

**Start in:** `src/heuristic/patterns.ts: self-toy-own-hole / self-toy-it`; `src/heuristic/index.ts: plugScan`. Search by symbol; line numbers drift.

**Positive test:** Rowan removes his small plug and inserts the larger one into himself. → self toy act.

**Boundary test:** Rowan leaves his plug in and selects a larger one for tomorrow. → no new insertion.

### T03 — Bare it-in after toy preparation

**Location:** `were-compeer.html`, paragraphs 532–533; `chatgpt-five-fic-deep-dives.json`, `were-compeer-act-26`, event `26`. Expected: Stiles Stilinski → Stiles Stilinski; self anal toy insertion.

**Trace and context:** The adult removes one plug, lubricates another, and succeeds in inserting it in the next paragraph. No target-range match survives. self-toy-it currently requires a target after the insertion words.

**Proposed change:** Support a bare pronoun-object insertion continuation across a short paragraph boundary, with verified toy referent and self receiver. Reset old instrument state after removal, then establish the newly selected toy.

**Start in:** `src/heuristic/patterns.ts: self-toy-it`; `src/heuristic/event-evidence.ts: continuationInstrument`; `src/heuristic/index.ts: scene boundary checks`. Search by symbol; line numbers drift.

**Positive test:** Rowan removes a plug and lubricates a larger anal plug. Next paragraph: He finally pushes it in. → self toy act.

**Boundary test:** Rowan removes a plug, picks up a charging cable and pushes it in. → no insertion continuation.

### T04 — Prostate massager identity and ongoing use

**Location:** `needing-the-knot.html`, paragraphs 86–88; `chatgpt-five-fic-deep-dives.json`, `needing-the-knot-act-1`, event `1`. Expected: Dean Winchester → Dean Winchester; toy penetration.

**Trace and context:** A solo adult installs a prostate massager, activates it and moves against it. The trace finds an unrelated handjob candidate and a later plug-worn hint; neither covers the self toy use.

**Initial candidates:** `hj-stroke` at 86: Castiel → Dean Winchester (pronoun). These are initial candidates, not endorsed final claims.

**Surviving readings:** `hj-stroke` at 86: handjob (handjob); `plug-worn` at 88: wearing a plug (prep). None covers the expected scored act.

**Proposed change:** Add prostate-massager and dual-headed-massager aliases when the physical target is supported. Cover putting an established massager in place and moving against it. Keep ongoing use separate from a newly counted insertion.

**Start in:** `src/heuristic/patterns.ts: self-toy / toy vocabulary`; `src/heuristic/index.ts: solo routing`; `src/heuristic/event-evidence.ts: PART / type`. Search by symbol; line numbers drift.

**Positive test:** Rowan settles an anal prostate massager inside himself, switches it on and rocks against it. → self toy use.

**Boundary test:** Rowan switches on a massage device resting against his shoulder. → no anal toy act.

### T05 — A dildo described as a cock during solo fantasy

**Location:** `needing-the-knot.html`, paragraphs 118–123; `chatgpt-five-fic-deep-dives.json`, `needing-the-knot-act-2`, event `2`. Expected: Dean Winchester → Dean Winchester; toy penetration.

**Trace and context:** The adult first uses an identified silicone dildo orally, then lowers his anus onto it and activates its inflatable knot. Imagined partner actions are interleaved with physical solo use.

**Initial candidates:** `body-hole-ache` at 118: Castiel → Dean Winchester (inferred). These are initial candidates, not endorsed final claims.

**Surviving readings:** `body-hole-ache` at 118: aching hole (body). None covers the expected scored act.

**Proposed change:** Retain the established artificial instrument across cock/knot references, track the mouth-to-anus target change, and classify physical self-use separately from imagined partner actions. Do not treat the imagined partner as the performer.

**Start in:** `src/heuristic/patterns.ts: self-toy / riding-it`; `src/heuristic/event-evidence.ts: continuationInstrument / occurrenceContext`; `src/heuristic/index.ts: solo versus partnered routing`. Search by symbol; line numbers drift.

**Positive test:** Rowan holds a silicone dildo, briefly mouths it, then lowers his anus onto it while imagining Morgan. → performed self anal toy use; imagined Morgan remains contextual.

**Boundary test:** Rowan only imagines sitting on the dildo while holding it. → contextual reading, no performed act.

### F01 — Sentence-opening pumping gerund

**Location:** `needing-the-knot.html`, paragraphs 783–783; `chatgpt-five-fic-deep-dives.json`, `needing-the-knot-act-24`, event `24`. Expected: Castiel → Dean Winchester; fingering.

**Trace and context:** A named adult begins pumping three fingers into the receiver’s explicitly named opening while also giving oral stimulation. No candidate is traced in paragraph 783.

**Proposed change:** Add a narrow finger-object gerund pattern for pumping into an explicit target, resolving the omitted performer from the preceding named clause. Preserve concurrent oral activity.

**Start in:** `src/heuristic/patterns.ts: fingers-into / fingers-enter-hole`; `src/heuristic/index.ts: elidedSubject / namedActionOwner`. Search by symbol; line numbers drift.

**Positive test:** Morgan moves behind Rowan. Pumping two fingers into Rowan’s anus, he continues oral stimulation. → fingering, Morgan → Rowan.

**Boundary test:** Morgan pumps lotion into his hand. → no fingering.

### F02 — Explicit remembered event

**Location:** `wicked-thing.html`, paragraphs 249–249; `chatgpt-five-fic-deep-dives.json`, `wicked-thing-act-4`, event `4`. Expected: Obi-Wan Kenobi → Anakin Skywalker; fingering.

**Trace and context:** The passage repeatedly frames the event as remembered, including enumerated fingers entering. The saved inventory marks it current. No target-range match is traced.

**Proposed change:** Do not create a current-act reading to satisfy this inventory. Queue occurrence adjudication without changing the label here. A new enumeration pattern may recover a correctly attributed historical hint, which AGENTS.md considers a right interpretation, but it must not count toward current-act recall.

**Start in:** `inventory: chatgpt-five-fic-deep-dives.json / wicked-thing-act-4`; `src/heuristic/patterns.ts: fingers-enter-hole`; `src/heuristic/event-evidence.ts: occurrenceContext`; `src/heuristic/index.ts: remembered / kind selection`. Search by symbol; line numbers drift.

**Positive test:** Rowan remembers Morgan inserting one finger and then a second. → historical fingering reading, no current scene.

**Boundary test:** Morgan inserts two fingers into Rowan’s anus now. → performed fingering; ordinary past-tense narration must also remain performed.

### F03 — Finger state, retained fingers and motion

**Location:** `wretched-rhetoric.html`, paragraphs 644–657; `chatgpt-four-pdf-deep-dives.json`, `wretched-rhetoric-act-10`, event `10`. Expected: Obi-Wan Kenobi → Anakin Skywalker; anal-fingering.

**Trace and context:** A named adult has fingers deep inside the receiver; later they remain there, move and are withdrawn. Only an unrelated, reversed rimming reading is traced at the end of the range. The explicit finger state is not recognized.

**Initial candidates:** `licked-hole~elided` at 657: Anakin Skywalker → Obi-Wan Kenobi (pronoun). These are initial candidates, not endorsed final claims.

**Surviving readings:** `licked-hole~elided` at 657: rimming (act). None covers the expected scored act.

**Proposed change:** Add owned/held finger-state forms, including has/had fingers inside, inside of, intervening depth modifiers and retained motion. Use ownership and local receiver references. Do not count every continuation as another scene.

**Start in:** `src/heuristic/patterns.ts: fingers-inside / fingers-enter-hole`; `src/heuristic/index.ts: occurrenceContext / ownership refinements`; `src/heuristic/builders.ts: groupScenes`. Search by symbol; line numbers drift.

**Positive test:** Morgan has two fingers deep inside Rowan’s anus. They remain inside as Morgan curls them. → one ongoing fingering scene.

**Boundary test:** Morgan has two fingers inside his glove. → no sexual act.

### F04 — Unowned finger noun with explicit prostate target

**Location:** `wretched-rhetoric.html`, paragraphs 605–605; `chatgpt-four-pdf-deep-dives.json`, `wretched-rhetoric-act-34`, event `34`. Expected: Obi-Wan Kenobi → Anakin Skywalker; anal-fingering.

**Trace and context:** The receiver reacts as fingers contact his prostate. Existing fingers-find-prostate expects a possessive owner token; this noun phrase has none. The surrounding active scene identifies the performer.

**Proposed change:** Add a prostate-contact finger-noun pattern that resolves an omitted owner only from an established local actor. Preserve ambiguity if several actors remain possible; do not invent penile penetration from prostate contact.

**Start in:** `src/heuristic/patterns.ts: fingers-find-prostate`; `src/heuristic/index.ts: namedActionOwner / resolvePair`. Search by symbol; line numbers drift.

**Positive test:** Morgan positions himself behind Rowan. Two fingers brush Rowan’s prostate. → fingering, Morgan → Rowan.

**Boundary test:** Several adults surround Rowan; an unidentified hand reaches for him. → do not assign a confident named performer.

### F05 — Reinsertion mistaken for a body-part reaction

**Location:** `foxden-park.html`, paragraphs 1133–1144; `chatgpt-foxden-park-deep-dive.json`, `foxden-park-act-32`, event `32`. Expected: Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; fingering.

**Trace and context:** pushed-in~elided initially resolves Alex → Henry at paragraph 1135, but no reading survives. The body-part reaction guard’s prefix regex also accepts finger followed by out, so it rejects an explicit withdrawal-and-reinsertion. Other sentences in the range describe fingertip insertion and second-finger contact but do not yield a finger act.

**Initial candidates:** `pushed-in~elided` at 1135: Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor (inferred); `stretched-open~elided` at 1139: Henry Fox-Mountchristen-Windsor → Alex Claremont-Diaz (pronoun). These are initial candidates, not endorsed final claims.

**Proposed change:** Narrow the pushed-in elided body-part-reaction guard to an actual body-part subject/reaction; do not reject a person withdrawing a finger and inserting it again. Preserve the finger instrument through reinsertion. Add a bounded fingertip-entry form with a locally established receiver. The open-them-up match at 1139 refers to fingers; do not salvage it as a person being opened.

**Start in:** `src/heuristic/index.ts: pushed-in elided guard after slicked-self / before ORAL_ENTRY`; `src/heuristic/patterns.ts: fingers-into / FINGERS`; `src/heuristic/event-evidence.ts: continuationInstrument`. Search by symbol; line numbers drift.

**Positive test:** Morgan’s finger is inside Rowan’s anus. Morgan draws his finger out and presses in again. → fingering, same pair.

**Boundary test:** Morgan’s palm flexes, pressing into a cushion. → no penetration.

**Reproduction result on unmodified main:** with an established finger-in-anus action, the invented withdrawal-and-reinsertion test produces a correctly resolved `pushed-in~elided` candidate but no surviving reading. An equivalent version using a single withdrawal verb produces a surviving `fingering` act for the same pair. The finger/cushion boundary produces no act. This reproduces the narrow guard failure without changing engine code; no proposed patch has been tested yet.

### F06 — Lubricated fingers plus coaxes-open summary

**Location:** `foxden-park.html`, paragraphs 1331–1332; `chatgpt-foxden-park-deep-dive.json`, `foxden-park-act-39`, event `39`. Expected: Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; fingering.

**Trace and context:** The active pair is explicit and the performer oils his fingers before opening the receiver. The sole trace is self-own-fingers with an absent bystander attribution, which does not survive. Oil on one’s own fingers is not self-fingering.

**Initial candidates:** `self-own-fingers` at 1331: Henry Fox-Mountchristen-Windsor → Percy "Pez" Okonjo (inferred). These are initial candidates, not endorsed final claims.

**Proposed change:** Recognize coax/coaxes/coaxed someone open only with same-action finger preparation and sexual target context. Resolve the explicit main-clause actor/receiver, without reusing the rejected self-touch candidate.

**Start in:** `src/heuristic/patterns.ts: stretched-open`; `src/heuristic/index.ts: elidedSubject / self-own-fingers guards`. Search by symbol; line numbers drift.

**Positive test:** Morgan lubricates his fingers, then gently coaxes Rowan’s anus open with them. → partnered fingering.

**Boundary test:** Morgan oils his fingers before coaxing a stuck jar open. → no fingering.

### F07 — Insertion into locally established wetness

**Location:** `foxden-park.html`, paragraphs 1334–1338; `chatgpt-foxden-park-deep-dive.json`, `foxden-park-act-41`, event `41`. Expected: Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; fingering.

**Trace and context:** After penile withdrawal, the receiver guides the partner’s hand back into his body and the named partner inserts two fingers into the residue there. push-into~elided resolves an absent bystander → Alex and is discarded; the explicit finger-object action is missed.

**Initial candidates:** `push-into~elided` at 1334: Percy "Pez" Okonjo → Alex Claremont-Diaz (pronoun). These are initial candidates, not endorsed final claims.

**Proposed change:** Support finger insertion into a locally established anatomical target described by residue/wetness. Prefer the named finger inserter and established receiver over stale recent-character fallback. Do not infer an opening from wetness alone.

**Start in:** `src/heuristic/patterns.ts: fingers-into`; `src/heuristic/index.ts: resolvePair / bodyPair / outsider fallback`; `src/heuristic/event-evidence.ts: namedActionOwner`. Search by symbol; line numbers drift.

**Positive test:** Morgan withdraws from Rowan’s anus. Rowan guides Morgan’s hand back there; Morgan slides two fingers into the remaining lubricant. → fingering, Morgan → Rowan.

**Boundary test:** Morgan slides two fingers into spilled lubricant on a table. → no fingering.

### F08 — Simultaneous finger and penis contact

**Location:** `icarus-burning.html`, paragraphs 3311–3311; `chatgpt-icarus-burning-deep-dive.json`, `icarus-burning-act-23`, event `23`. Expected: Samiel Tremark → Jason Lane; fingering.

**Trace and context:** The paragraph correctly retains two penile-act readings. It also describes finger contact at the receiver’s opening and slight fingertip entry alongside the penis. No separate fingering reading survives.

**Initial candidates:** `penis-into` at 3311: Samiel Tremark → Jay (pronoun); `penis-inside` at 3311: Samiel Tremark → Jay (pronoun). These are initial candidates, not endorsed final claims.

**Surviving readings:** `penis-into` at 3311: anal sex (act); `penis-inside` at 3311: anal sex (act). None covers the expected scored act.

**Proposed change:** Add supported tip-of-finger entry and pads-of-fingers entrance contact, resolving the action separately. Do not retype the valid penile reading or let a deduplication rule collapse different acts in one sentence.

**Start in:** `src/heuristic/patterns.ts: fingers-into / finger entrance-contact families`; `src/heuristic/index.ts: act refinement / dedupe`; `src/heuristic/builders.ts: per-act grouping`. Search by symbol; line numbers drift.

**Positive test:** Morgan’s penis remains inside Rowan. Morgan presses a fingertip against Rowan’s anal opening beside it. → both penile anal sex and fingering.

**Boundary test:** Morgan’s penis remains inside Rowan while his fingers touch Rowan’s shoulder. → penile act only.

### F09 — Adult client outside the main pairing

**Location:** `wolfbird.html`, paragraphs 1889–1889; `chatgpt-six-upload-deep-dives.json`, `wolfbird-primary-inv-28`, event `28`. Expected: Ilya Rozanov → Claire; vaginal fingering.

**Trace and context:** The surrounding passage names an adult female client. pushed-in~elided initially resolves Ilya → Shane instead. The candidate has a fingers-slick prefix and is discarded; no vaginal fingering survives. The current body-part-reaction guard also matches this prefix.

**Initial candidates:** `pushed-in~elided` at 1889: Ilya Rozanov → Shane Hollander (inferred). These are initial candidates, not endorsed final claims.

**Proposed change:** First establish the local named adult client as receiver and retain the performer from the session. Then recognize finger-noun sliding-in with the locally stated between-legs target. Narrow the same reaction guard without permitting fingers in nonsexual targets. Do not credit the main male partner or classify this as anal.

**Start in:** `src/heuristic/characters.ts: buildCast / local participant discovery`; `src/heuristic/index.ts: resolvePair / pushed-in elided reaction guard / holeType`; `src/heuristic/patterns.ts: fingers-enter-hole`. Search by symbol; line numbers drift.

**Positive test:** Morgan’s adult client is Rowan, a woman. Morgan touches her between her legs; his lubricated fingers slide in. → vaginal fingering, Morgan → Rowan.

**Boundary test:** Morgan adjusts a female client’s sleeve; his fingers slide into the fabric. → no sexual act and no attribution to his usual partner.

### T06 — Stimulator alias and motion of an existing toy

**Location:** `innocent-until.html`, paragraphs 1234–1234; `missed-2051db5b4e06.json`, `M10`, event `0`. Expected: James "Bucky" Barnes → Steve Rogers; Toy insertion.

**Trace and context:** An already inserted stimulator moves back and forth inside the named receiver under the performer’s control. No candidate is traced at the citation.

**Proposed change:** Recognize stimulator as a toy only when physical anal placement is established locally. Add ongoing movement of an inserted toy, distinct from a new insertion event.

**Start in:** `src/heuristic/patterns.ts: toy vocabulary / review-inserts-named-toy`; `src/heuristic/event-evidence.ts: PART / type`; `src/heuristic/builders.ts: scene grouping`. Search by symbol; line numbers drift.

**Positive test:** Morgan has placed an anal stimulator inside Rowan and moves it back and forth. → ongoing partnered toy act.

**Boundary test:** Morgan adjusts a muscle stimulator attached to Rowan’s arm. → no anal toy act.

### T07 — Urethral sounding outside the scored anal-toy category

**Location:** `innocent-until.html`, paragraphs 1693–1695; `missed-2051db5b4e06.json`, `M17`, event `1`. Expected: James "Bucky" Barnes → Steve Rogers; Toy insertion.

**Trace and context:** The passage explicitly identifies a urethral sound and its target. This is a real toy activity, but actualActOf currently represents anal/self toy acts, not urethral sounding. No candidate is traced.

**Proposed change:** Do not make anal toy patterns capture this to improve anal recall. Preserve the owner judgment and queue a taxonomy decision: represent sounding as a separate unscored activity or add a separate evaluated category with its own inventory and tests. Do not silently delete or recast the owner event.

**Start in:** `scripts/scene-review-scope.mjs: actualActOf / SCORED_ACTS`; `inventory: missed-2051db5b4e06.json / M17 event 1`; `future dedicated sounding pattern / UI category`. Search by symbol; line numbers drift.

**Positive test:** Morgan places a urethral sound into adult Rowan’s urethra. → sounding category if supported; never anal toy sex.

**Boundary test:** Morgan places a plug at Rowan’s anal opening. → anal toy act, not sounding.

### T08 — Negative relief statement contains an actual self toy act

**Location:** `sugar-alpha.html`, paragraphs 849–849; `sugar-alpha-errors-b91edd7-v1.json`, `W19`, event `A8`. Expected: Stiles Stilinski → Stiles Stilinski; Toy insertion.

**Trace and context:** The adult tries multiple forms of relief, including an explicitly identified dildo in his own anus; the sentence negates relief, not performance. No target-range match is traced.

**Proposed change:** Add a self-use gerund form that supports the local negated-relief construction. Keep negation scoped to its predicate: unsuccessful relief does not mean the attempted stimulation never occurred. Do not weaken genuine no-contact or refusal guards.

**Start in:** `src/heuristic/patterns.ts: self-toy-own-hole / elided variants`; `src/heuristic/index.ts: NEG / notOnly / occurrence classification`. Search by symbol; line numbers drift.

**Positive test:** Rowan tries an anal dildo, but even inserting it into himself does not ease the ache. → performed self toy act.

**Boundary test:** Rowan decides not to insert the dildo and leaves it in its case. → no performed toy act.

### F10 — Self fingers inside of him in an effort/result construction

**Location:** `sugar-alpha.html`, paragraphs 850–850; `sugar-alpha-errors-b91edd7-v1.json`, `W19`, event `A10`. Expected: Stiles Stilinski → Stiles Stilinski; Fingering.

**Trace and context:** The isolated adult describes straining to get his own fingers inside himself. No fingering candidate is traced; the only traced candidate is an unrelated wish for a partner, correctly discarded.

**Initial candidates:** `fuck~elided` at 850: Stiles Stilinski → Derek Hale (pronoun). These are initial candidates, not endorsed final claims.

**Proposed change:** Recognize get-own-fingers-inside-of-self only with local physical/contact evidence. Resolve self-use from the actor and body ownership, not the later imagined partner. Distinguish achieved contact from failed reach or a mere plan.

**Start in:** `src/heuristic/patterns.ts: self-finger / fingers-inside`; `src/heuristic/index.ts: self-fingering routing / occurrenceContext`. Search by symbol; line numbers drift.

**Positive test:** Rowan’s fingers are inside his own anus; reaching around strains his back. → self-fingering.

**Boundary test:** Rowan tries to reach his anus but cannot touch it. → no performed self-fingering.

### F11 — Poking the opening and bare finger continuation

**Location:** `sugar-alpha.html`, paragraphs 1760–1761; `sugar-alpha-errors-b91edd7-v1.json`, `W29`, event `A13`. Expected: Stiles Stilinski → Stiles Stilinski; Fingering.

**Trace and context:** The adult uses fingers at his own opening and then describes them sliding in while the partner sleeps. No relevant trace or audit reading appears. The later waking partner does not become the performer.

**Proposed change:** Cover use-fingers-to-poke an explicit opening and a bare fingers-slide-in continuation with verified self target. Contact already counts; do not require deeper insertion. Preserve self-use until an explicit new actor intervenes.

**Start in:** `src/heuristic/patterns.ts: self-finger / fingers-enter-hole / entrance contact`; `src/heuristic/index.ts: local reflexive ownership`. Search by symbol; line numbers drift.

**Positive test:** Rowan uses two fingers to touch his own anal opening. They slide in while Morgan sleeps. → self-fingering, Rowan → Rowan.

**Boundary test:** Rowan pokes Morgan’s shoulder to wake him. → no fingering.

### F12 — Reverse-order rim contact and coordinated gerunds

**Location:** `innocent-until.html`, paragraphs 4889–4889; `suspect-two-569919fdfb5e.json`, `T16`, event `A10`. Expected: James "Bucky" Barnes → Steve Rogers; Fingering.

**Trace and context:** The named performer strokes the receiver’s rim using fingers, followed by coordinated fingering/kissing at an anaphoric hole. No candidate is traced in paragraph 4889.

**Proposed change:** Add verb-over-receiver-rim-with-fingers order and a tightly bounded anatomical anaphor for coordinated actions. First recover the explicit rim contact; do not let kissing suppress simultaneous finger stimulation or reinterpret cheek contact as entrance contact.

**Start in:** `src/heuristic/patterns.ts: finger-noun-to-hole / fingers-to-hole / finger contact families`; `src/heuristic/index.ts: anatomy and oral guards`. Search by symbol; line numbers drift.

**Positive test:** Morgan strokes Rowan’s anal rim with his fingers while kissing the same opening. → fingering plus any independently supported oral contact.

**Boundary test:** Morgan strokes Rowan’s buttock with his fingers while kissing Rowan’s cheek. → no anal fingering.

## Implementation contract for the next AI agent

1. Read latest AGENTS.md, ENGINE_MAP.md and TESTING.md; fetch main and check competing branches. Do not treat these proposals as proven patches. Reproduce each intended behavior with a small invented-adult test first. Do not quote private prose in tests, comments or the PR.
2. Respect entrance contact: fingers/toys at the anal opening count even without insertion. Fingers on buttocks, at a mouth or touching hair do not. A stopped act that never reaches the opening is not performed. Keep vaginal and anal targets distinct.
3. Make one narrow family of fixes at a time. For toy references use bounded event evidence with performer, receiver, instrument, target and occurrence. Explicit current action wins over stale preparation. Stop carryover at scene/chapter boundaries, actor/receiver changes and instrument withdrawal/replacement; do not let an unrelated mouth/hand action erase simultaneous anal stimulation.
4. Repair attribution rather than forcing a generic current-pair fallback. Self acts remain self; local adult clients require evidence; fake/machine instruments are not a partner’s penis. Unknown performer remains unknown.
5. Preserve semantic distinctions: insertion versus ongoing stimulation versus merely wearing/removing a device. Existing inventories sometimes count ongoing activity; recover the activity without inventing repeated insertion scenes.
6. Keep F02 and T07 out of an anal-current-act recovery claim until adjudicated. Do not edit owner labels or overwrite the old fixed benchmark. If the owner approves a new inventory version, report its denominator/fingerprint separately. No inference of negative labels from missing hints.
7. Run the focused paraphrased tests first. Then run `npm test`, `npm run build`, full `npm run check`, and `npm run regress -- --hits --all --base <fix-base> <samples>` once. Review **every moved reading**, in tagged and tag-free modes, including newly added false positives. On this main version, regress runs both modes by default; do not use `--quick`, which skips the tag-free pass. Do not assume an improvised metadata-stripping run is equivalent.
8. Rerun these 20 targets and the full reviewed-act inventory. Report recovered entries, wrong-act/participant changes, lost correct readings and scoped exclusions separately. Deduplicate overlapping scenes when describing scene totals. A pattern fix is accepted for semantic detection gains, not a higher confidence score alone.
9. Leave generated `learned.ts`, `reliability.ts` and METRICS.md untouched in the fix PR. Re-adjudicate any old label whose act/person identity changed; import owner answers only through the supported importer. Retrain separately after merging and measure confidence on unseen fics.

### Reproducing the trace privately

The source files must match the structured handoff’s `sourceSha` values. A differently converted PDF/HTML can change paragraph indexing. With those adult-screened files in `<samples>`:

```sh
AO3_DIR=<samples> npm run trace -- foxden-park '.*' 1129 1148 > /tmp/foxden-finger-trace.txt
AO3_DIR=<samples> npm run trace -- were-compeer '.*' 458 466 > /tmp/were-toy-trace.txt
```

Repeat for the case table ranges with approximately four paragraphs either side; widen context when ownership or instrument changes remain unclear. The existing command prints private source text, so keep its output outside Git and do not paste it into a report. Its final section shows surviving readings; initial matches do not prove an act survived.

The safe replay helper below checks all 20 identities, uses the built-in trace/audit/debug hooks, and exports **no source text**:

```sh
node scripts/trace-reviewed-misses.mjs <samples> /tmp/finger-toy-replay.json
```

An optional final argument such as `were-compeer.html` limits the helper to that fic for the development loop. It fails on source or citation-checksum mismatches instead of applying stale paragraph indices.

## Verification for this report

- Latest-main base: `68338708cd8d600ace41dea533892d3af564b043`; comparison selection: `7f77a765cea99589cb8d75c4d5da67ba3da3e787`.
- Unmodified detector replay: nine fics, all twenty target windows; all still score missed under the existing scorer.
- Original source checksums verified; citation hashes/extraction identities retained. Every cited passage and nearby context read before proposing a cause.
- Safe replay helper smoke-tested on all three WereCompeer targets, including citation hashes; it reproduced the three misses. The independent nine-fic trace above supplied the remaining observations.
- Invented-adult reinsertion probe reproduced the guard failure and its wording contrast; a nonsexual boundary remained absent.
- Existing recall/provenance scoring tests: 15 passed across `tests/recall-trend.test.mjs` and `tests/act-recall.test.ts`. Safe helper syntax and structured-data identity checks passed.
- No pattern, guard, label, inventory, model, sample file or confidence setting changed. No claim that the proposed fixes already pass regression checks.
