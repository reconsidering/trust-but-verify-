# Icarus, Burning — full-text deep dive

Reviewed against main `933086dc9f3d78a3aba2c0e987668e4748a01928` on 2026-10-10. The PDF has 572 pages and 240,816 stated words. All 8,111 normalized paragraphs were read in five consecutive ranges, followed by contextual review of every raw engine reading and an independent check of proposed errors and misses. No story text is committed. Paragraph locations below are zero-based in the reproducibly normalized private HTML.

Only definite ChatGPT judgments at **≥95% reviewer confidence** enter training, at **weight 0.9**. These are AI judgments, not human gold. The cutoff applies to this conversation and future additions; older AI and owner labels are unchanged. Reviewer confidence, label weight and engine confidence are separate.

| Assessment | Count |
| --- | ---: |
| Supported readings | 51 |
| Incorrect readings | 31 |
| Uncertain readings | 5 |
| Accepted labels at 0.9 | 76 (46 right / 30 wrong) |
| Withheld readings | 11 |
| Accepted feature-bearing confidence rows | 71 |
| Inventory records, including hypothetical and broader contact | 48 |
| Candidate additional performed activities ≥95% | 8 |

The 11 withheld readings comprise five uncertain assessments and six claims that collide under the existing pattern/short-hash matching key. Opposite judgments for the same short key are not imported. Five accepted records lack feature vectors and contribute to weighted pattern reliability rather than the current context learner.

## Excluded uploads

AGENTS.md says to decline fics containing minors in sexual content. **The Dogs of War** references a sexual encounter at seventeen. **The Golden Cage** includes sexual exploitation beginning at fifteen. They receive no new labels or inventories. Only safety screening was performed, and no text or new private HTML samples for those two are added.

## Verdict and confidence checks

The machine-readable report retains the actual character identities. Examples below use invented adult aliases: Morgan is the penetrating partner; Rowan is the receptive partner.

| Interpretation | Current engine | Reviewer |
| --- | --- | --- |
| Anal roles | Splits one actual relationship into two alias pairings; both one-way, confidence 89.8% and 82.4% | One actual pairing, Morgan penetrates Rowan; 99% |
| Blowjob | Two alias pairings show one-way oral verdicts at 13.6% and 22.4% | No performed blowjob found; 98% |
| Rimming | No scenes; generic 45% absence score | No performed rimming found; 98% |
| Hands-free receptive orgasm | No affirmative claim added in this review | Not established: explicit climaxes are stimulated; the abbreviated repeat encounter does not establish absence of touch |

The nickname **Jay** and full name **Jason Lane** designate the same person. The engine instead creates separate pairings and can attribute a partnered action between the aliases. This fragments evidence and confidence. It is a detection/entity finding; this PR does not fix it.

## Main findings and follow-up proposals

1. **Character identity and action ownership:** canonicalize a nickname only with work-specific evidence linking it to a cast member. Distinguish touching one’s own forehead or neck from comforting a partner; do not blanket-remove real reassuring touch. An adult officer rubbing his own forehead must not become comfort of an absent lover.
2. **Occurrence and modality:** an imagined mouth around a penis is not performed oral contact. Preserve the already-correct future and fantasy hints, and narrow occurrence classification to the matched clause.
3. **Instrument and anatomy:** a previously used finger must not carry over after explicit penile insertion. A raised thigh is positioning, not inserted fingers. A figurative taste of someone’s desperation is not a blowjob.
4. **Roles and scene transitions:** the presence of two names and a penis is insufficient to reverse participants. Explicit withdrawal followed by leg positioning should not produce a fresh insertion claim until re-entry. The grouped scene may remain correct while its individual supporting sentence is wrong.
5. **Missing activity:** prioritize explicit partnered genital rubbing, external anal stimulation, a finger inserted alongside retained penile penetration, and partnered manual assistance. Keep missed evidence and corrected attribution distinct from a wholly undetected act.

No pattern, guard, character resolution, confidence-model coefficient or gold label is changed here. Those proposed fixes need separate paraphrased tests and corpus regression checks.

## Incorrect readings

These are raw-claim judgments; a wrong raw reading can sit inside an otherwise correctly detected scene. The confidence shown is the reviewer’s confidence in the judgment. Per-hit engine probabilities and displayed verdict scores are retained separately in the JSON report.

| Reading | Paragraph | Pattern / occurrence | Reviewer confidence | Why incorrect | Training |
| --- | ---: | --- | ---: | --- | --- |
| icarus-burning-0 | 2181 | lips-around / act | 99% | Desire clauses span this sentence and prior paragraph2180. Rowan refuses and moves away2182–2185, so this is a fantasy rather than a performed act. | 0.9 |
| icarus-burning-1 | 2700 | sucked / act | 99% | Both men are sheltering behind vehicles in an armed standoff; moving his lips to signal words has no sexual contact. | 0.9 |
| icarus-burning-4 | 3260 | penis-against / act | 99% | Morgan is the mover established3258–3259, and Morgan inserts in the following sentence. The named receiver inside the clause was chosen as penis owner, reversing roles. | 0.9 |
| icarus-burning-6 | 3263 | stretched-open~elided / act | 99% | Fingers were withdrawn3254; penis insertion3260 overrides the earlier finger instrument. No renewed finger use occurs here. | 0.9 |
| icarus-burning-17 | 8024 | push-into~elided / act | 99% | Penetration only starts after undressing and Rowan preparing himself at 8045. | 0.9 |
| icarus-burning-19 | 8047 | pushed-in~elided / act | 99% | A metaphor about taste and throat causes a face-fucking reading. Morgan is penetrating Rowan anally. | 0.9 |
| icarus-burning-23 | 8063 | stretched-open~elided / act | 99% | A hand under the thigh opens Rowan’s posture. No fingers enter the anus; penis reentry occurs at 8065. | 0.9 |
| icarus-burning-24 | 8063 | thrusts-filling / act | 97% | Opening the leg position is not itself insertion or thrusting; the explicit withdrawal at 8063 and reentry at 8065 bound the gap. | 0.9 |
| icarus-burning-26 | 645 | care-soothe~elided / behavior | 99% | There is no comforting of Morgan: the touched forehead belongs to the performer, and Morgan is absent from the scene. | 0.9 |
| icarus-burning-29 | 1281 | care-soothe~elided / behavior | 99% | The performer is explicitly the governor. Engine Rowan/Rowan pair is actually two aliases of the same person, not the actor and recipient. | 0.9 |
| icarus-burning-30 | 1322 | care-soothe / behavior | 99% | The action is self-directed, and Morgan has already left the room, so the claimed comforting of Morgan is unsupported. | 0.9 |
| icarus-burning-32 | 1394 | care-soothe / behavior | 99% | No comfort directed toward Elliot occurs; his headache and self-touch are explicit. | 0.9 |
| icarus-burning-33 | 1442 | care-soothe / behavior | 99% | The hand touches the performer’s own forehead; no soothing of Elliot is described. | 0.9 |
| icarus-burning-35 | 1888 | sub-pinned / behavior | 96% | Context1884–1888 describes being caught before falling and being positioned for comfort. The cited closeness is not physical restraint or pinning. | 0.9 |
| icarus-burning-38 | 2134 | care-soothe / behavior | 99% | Possessive self-reference and solitary information-processing2134 make this self-soothing, not comforting Morgan. | 0.9 |
| icarus-burning-40 | 2231 | care-soothe~elided / behavior | 99% | Explicit self-owned forehead2231 is not contact with or comfort offered to Morgan. | 0.9 |
| icarus-burning-43 | 2797 | dom-pin~elided / behavior | 99% | The pronoun object follows Adrian, whom Morgan is towing. Rowan is separately named doing another action in this same sentence2797. | 0.9 |
| icarus-burning-45 | 3142 | care-soothe~elided / behavior | 99% | The sentence explicitly distinguishes releasing partner contact from touching his own forehead3142. | 0.9 |
| icarus-burning-51 | 3231 | hj-stroke~elided / handjob | 99% | The action follows Morgan’s dialogue and explicitly resumes the handjob3226–3230. Rowan and Rowan are the same receiver, not distinct giver and receiver. | 0.9 |
| icarus-burning-53 | 3242 | adds-finger~elided / hypothetical | 99% | The touch is actual, not hypothetical, and the fingertip only rubs externally3242. Receiver is Rowan, not Morgan as the bottom-role claim names. | 0.9 |
| icarus-burning-54 | 3242 | pressure-at-hole~elided / touch | 99% | Morgan is actor through this paragraph; Rowan is recipient. Engine credited the giver role to Rowan. | 0.9 |
| icarus-burning-62 | 3850 | dialogue:calling someone a good boy/girl / petname | 99% | the adviser speaks, the following discussion identifies Elliot as the person being discussed, and the phrase is third-person description rather than a direct pet name within the analyzed couple. | 0.9 |
| icarus-burning-63 | 4193 | sinks-to-floor / prep | 99% | Paragraphs4191–4206 explicitly describe overwhelming fear, retching, bleeding and efforts to regain control. Morgan is elsewhere until4242. No oral-sex preparation occurs. | 0.9 |
| icarus-burning-64 | 4278 | dialogue:anal sex / said | 99% | Paragraphs4275–4283 concern a political threat used to provoke Morgan’s protective response; the passive taking language concerns capture, not an anal role. | 0.9 |
| icarus-burning-67 | 4651 | care-soothe / behavior | 99% | Paragraphs4629–4653 establish Morgan is physically elsewhere and Rowan touches his own forehead. Sage is the nearby person supporting Rowan, not Morgan as recipient of his self-directed action. | 0.9 |
| icarus-burning-68 | 5767 | sinks-to-floor / prep | 99.5% | The full surrounding sequence is an armed fight involving several attackers. The movement immediately avoids a blade, and the next action is retrieval of a weapon and counterattack. No sexual posture or sexual recipient is established. | 0.9 |
| icarus-burning-69 | 6678 | care-soothe / behavior | 99.5% | Possessive reference is to the named subject's own free hand and neck. The nearby paragraph mentions the partner's linked fingers, but that does not turn self-touch into an interpersonal comforting action. The conversation is apologetic, yet the matched action is self-directed. | 0.9 |
| icarus-burning-70 | 6819 | flustered-verb / behavior | 99% | The named subject of the flushing verb is Elliot; Rowan only raises an eyebrow. | Withheld: More than one detected claim shares the legacy pattern/short-hash key |
| icarus-burning-76 | 8026 | dd-hj-fingers-around~elided / handjob | 99% | The possessive identifies self-touch; the following paragraph confirms Rowan grips himself to restrain his own orgasm. | 0.9 |
| icarus-burning-78 | 8038 | passive-fucked / hypothetical | 98% | The comparison concerns Morgan as receiver while Rowan actually self-fingers. The engine’s hypothetical top assignment is reversed. | 0.9 |
| icarus-burning-79 | 8038 | self-finger~elided / solo | 99% | Rowan is explicitly named as stretching himself and the earlier paragraph begins his self-preparation. | 0.9 |

## Candidate additional performed activities

These eight inventory records identify absent act readings in the cited ranges. They are not eight proven wholly missed sex scenes: several occur inside a scene already detected as another act. No synthetic confidence-training hit is created.

| Paragraph range | Activity | Reviewer confidence | Paraphrased evidence |
| --- | --- | ---: | --- |
| 1242–1245 | body rubbing | 99% | The adult pair rub their clothed genitals together while one lies over the other. |
| 2160–2173 | body rubbing | 98% | Morgan rubs against Rowan while both remain clothed. |
| 3191–3215 | body rubbing | 98% | The partners rub their bodies together, eventually with direct genital contact. |
| 3242–3242 | external anal stimulation | 98% | Morgan rubs Rowan’s anal opening before insertion. |
| 3311–3311 | fingering | 98% | Morgan inserts a fingertip beside his penis while Rowan is still penetrated. |
| 7730–7733 | body rubbing | 99% | Morgan grinds against Rowan while straddling him through their clothing. |
| 8014–8015 | body rubbing | 99% | Naked Rowan rubs against Morgan’s still-clothed lap. |
| 8062–8062 | handjob | 99% | Morgan assists Rowan’s penis stimulation with his own hand. |

Separate corrections: masturbation at 8026–8029 is already detected as a handjob for the wrong recipient; self-fingering at 8037–8040 is already detected but assigned to the wrong person. The manual stimulation at 8005–8009 adds earlier evidence to an encounter with a later detected handjob. Self-friction against bedding at 3287–3289 is retained as inventory evidence without claiming a missing supported detector category.

A brief genital brush at 8013 was reduced below 95% after independent QA and withheld as a separate masturbation judgment. Ordinary backward cuddling at 7026 remains uncertain under the broad role-hint taxonomy. Desired acts and remembered fantasies are not counted as performed misses.

## Files and label safety

- `tests/right-set/icarus-burning.json`: qualifying positive and negative judgments at 0.9, with reviewer confidence recorded.
- `tests/labels/chatgpt-icarus-burning-claims.json`: identity metadata only; the labels map is empty so these judgments are not accidentally trained at unit weight. Each is bound to the source hash, paragraph, pattern, act, occurrence, participants and role.
- `tests/scene-review/chatgpt-icarus-burning-deep-dive.json`: all 87 assessments, current engine and reviewer verdicts/confidences,48 inventories, paragraph hashes, QA decisions and withheld reasons.
- `tests/icarus-burning-deep-dive.test.ts`: complete coverage, confidence/weight/provenance checks, protection of prior audit judgments and optional raw-claim replay against the private HTML.

Existing owner/AI labels and the generated model, reliability table and METRICS.md are unchanged. Importing these labels does not itself fix detection or change live confidence. Retrain separately after merging.

## Private PDF reproduction

```sh
node scripts/prepare-pdf-sample.mjs Icarus_Burning.pdf ao3-samples/icarus-burning.html --title 'Icarus, Burning' --chapters 34/34
AO3_DIR=ao3-samples npx vitest run tests/icarus-burning-deep-dive.test.ts
```

The helper uses the application’s PDF joining and extraction. HTML extraction collapses one doubled horizontal space in this upload. The helper now accepts that existing horizontal-whitespace normalization while requiring all other text, including paragraph boundaries, to match. All 87 audit claims, sentences, feature vectors and their ordering are identical between the original PDF extraction and normalized HTML. Both original PDF and normalized HTML hashes are stored; different downloads require re-review.

## Validation

- Full `npm run check -- --jobs 3 <eligible corpus>` passed: unit suite, build and all three gold/right-set shards. The script recovered each shard from its initial 3GB memory limit by rerunning it alone with 8GB.
- Gold verdicts 15/15; scenes right 80, flipped 0, missed 0; false positives 5; text senders 27/27. No worse than the accepted baseline. Those five false positives are pre-existing accepted totals.
- Raw-claim replay: all 76 accepted identities found exactly;4  tests passed.
- PDF/HTML parity: all 87 audit claims, sentences, features and ordering identical.
- `git diff --check` passed.

The corpus contains 54 eligible/private samples. Previously declined Negotiation is excluded; other earlier declined works are absent. Existing gold files lacking a supplied eligible sample remain outside this run. No generated production model or sample file is committed.
