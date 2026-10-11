# Fingering and toy detection: implementation and independent review

This detector change implements the supported portions of the six-family evidence handoff. It adds narrow contact/instrument forms and ownership guards; it does not change owner labels, confidence models or the definition of performed activity. All examples below are adult clinical paraphrases. Private source text is not included.

## What changed and why

| Family | Implementation | Boundaries / remaining work |
| --- | --- | --- |
| 1. Explicit finger wording | Participial pumping, retained fingers, prostate contact, fingertip entry and fingers at an anal rim. | Nonbody targets are rejected. Fingers and penile/oral activity can coexist; neither replaces the other. F08 still needs alias adjudication. |
| 2. Withdrawal / reinsertion | Immediately withdrawn fingers can remain the instrument when entry resumes with “again.” | Explicit instrument evidence takes priority. A new penis or condom ends inherited fingers; a flexing hand is not insertion. |
| 3. Self-fingering | Reach/own-body contact can identify self-use. A named person being turned toward is not automatically the actor. | The sleeping partner stays uninvolved. F10's effort-to-contact inference is not promoted to performed activity. |
| 4. Toy identity over local sentences | Toy-subject entry and locally identified plug size/pronoun entry. Bind humans from named manipulation or an explicit request/fulfilment. | No human owner means decline. Storage, mouth targets, newer finger referents and scene boundaries prevent inherited anal toy entry. |
| 5. Ongoing internal toy use | Anal prostate massager, locally identified fake penis, physically activated inflatable toy, and moving stimulator. | Require anatomical placement. Physical self-use remains separate from an imagined partner; generic surface devices do not qualify. |
| 6. Preparation / residue | Explicit opening with fingers and finger entry into residue at an established body site. | Oiling alone is insufficient. The actual F06 passage remains unresolved. Explicit owned residue entry suppresses a same-sentence reversed vague hand-guidance duplicate. |

Planned, conditional and interrupted new self-use forms remain wanted readings rather than performed acts. Explicit memory controls remain historical. These are occurrence distinctions, not judgments that correctly attributed hints are wrong.

## Measurements

The final source is commit `05455da`, based on main `97d8341`. Documentation/results commits after it do not change detector bytes. The machine-readable results accompanying this report record engine, reference-inventory and scorer fingerprints, all 20 selected cases, all 41 covered controls, every changed inventory status and the corpus reading audit.

| Inventory category | Before | After |
| --- | --- | --- |
| Anal penetration (penis) | 50/65 (76.9%) | 50/65 (76.9%) |
| Blowjob | 40/54 (74.1%) | 40/54 (74.1%) |
| Rimming | 10/18 (55.6%) | 10/18 (55.6%) |
| Vaginal penetration (penis) | 0/2 (0.0%) | 0/2 (0.0%) |
| Fingering | 40/61 (65.6%) | 47/61 (77.0%) |
| Toy insertion | 4/17 (23.5%) | 10/17 (58.8%) |
| Handjob | 30/77 (39.0%) | 30/77 (39.0%) |
| Solo masturbation | 18/55 (32.7%) | 18/55 (32.7%) |

**13 previously missed events recovered:** seven finger events and six toy events. All 41 protected controls remain matched. No previously matched event among all 349 entries is lost. All 349 source citations verify across 31 fics. Total matched entries: 192 → 205.

Among the 16 primary six-family cases: 13 matched, one alias mismatch (F08), and two still missed (F06/F10). Among the original 20: 13 matched, one alias mismatch, six still missed. No denominator or accepted label changed.

Two concurrent-act statuses change without losing a matched act: Needing p783 oral activity goes from missed to wrong-act when the correct finger action is newly found; Innocent p4889 expected penile activity goes from hint-only to wrong-act when correct rim contact is found. Neither expected concurrent act is claimed recovered. The full JSON includes every changed status and all 349 before/after statuses, matched by identity rather than array position.

Engine fingerprint: `dc4d0f64c66d3b99924e5ad229c35aaa1c2a2606dfcd6810e67805a6afe905b0`. Inventory fingerprint: `5c20e965c78ee23d2fcce607d771e62071efb3bd74795555babd329724af03a7`. The scorer files are identical to the branch base. Their fingerprint differs from the older history report’s reference fingerprint, so it is stored separately rather than presented as the old scoring version.


These are **strict cited-event recall measurements on a selected 349-event inventory**, not whole-corpus recall or precision. The denominator stays fixed, including historical/urethral scope entries. An expected concurrent act can remain missing even when a different correct act is newly detected in its range. A `wrong-act` scoring status therefore needs the actual reading audit; it does not alone prove a new false positive. No AUC/log-loss improvement is claimed and no retraining was run.

## Final validation

`npm run check -- --jobs 2 --heap 8000` passed on final source: unit suite, both gold/right-set shards, and type-check/build. Final focused tests: 47/47. An independent gold replay in a detached `97d8341` worktree produced exactly the same gold totals as the final branch. The runner had no prior saved accepted baseline; its automatic private baseline write is not used as evidence of improvement.

```text
ok   unit suite (179s)
ok   gold + right-set 1/2 (711s)
ok   gold + right-set 2/2 (516s)
ok   build (6s)
gold: verdicts 15/15, scenes right 80 (flipped 0, missed 0), false positives 5, point of view 74.3%, text senders 27/27
check passed in 717s
```

Both gold runs retain **22 stale citations and five existing false-positive scenes**. Passing these totals does not establish error-free detection. No accepted baseline, source fic or test label is committed.

`npm run regress -- --hits --all --base 97d8341 --jobs 2` completed successfully for **64/64 fics in tagged and tag-free modes**: **19 added tagged readings across 11 fics, zero removed readings, zero verdict changes, and 14 aggregate count/confidence changes**.

Of the 19 additions, **17 were checked against surrounding adult-screened source and are supported**. F08 remains an unresolved reference alias, not an accepted identity correction. **Two additions in Pact of Ice and Fire remain excluded from adjudication** because earlier reviews could not establish adult status (`PAST_LABEL_REVIEW_2.md`, `SUSPECT_SCENE_REVIEW_3.md`). No sexual source paragraphs from that work were reviewed here. No claim is made that those two readings are correct. No excluded-work verdict changes occur.

The supported additions comprise 13 strict recoveries, the Jay/Jason reference mismatch, one supported rim-contact reading outside the fixed inventory, and two additional wordings of already detected finger acts (Lover and Tricks). No newly incorrect reading was found among these 17 inspected additions. That is an audit result, not a precision estimate for all existing readings.

### Every moved tagged reading

| Fic / zero-based paragraph | Pattern | Review finding / adult paraphrase |
| --- | --- | --- |
| belonging.html / 4695 | `review-fingers-over-rim` | supported: Morgan touches Rowan's anal rim with two fingers during the ongoing adult encounter; insertion is not required. |
| foxden-park.html / 1135 | `pushed-in~elided` | supported: Morgan withdraws his finger and immediately reinserts it into Rowan, before a later instrument change. |
| foxden-park.html / 1334 | `review-fingers-residue` | supported: After penile withdrawal, Morgan puts two fingers into the lubricant remaining inside Rowan; Rowan only guides Morgan's hand. |
| icarus-burning.html / 3311 | `review-fingertip-entry` | supported act; alias unresolved: Morgan adds fingertip entry while penile contact continues with Rowan. |
| innocent-until.html / 1234 | `review-stimulator-motion~elided` | supported: Morgan moves an established internal stimulator back and forth in Rowan. |
| innocent-until.html / 4889 | `review-fingers-over-rim` | supported: Morgan strokes Rowan's anal rim with fingers during another ongoing sexual act. |
| lover-you-cant-be-wrong.html / 1403 | `review-pumping-fingers` | supported; additional wording in an already detected act: Morgan pumps named fingers in Rowan's anus during the current encounter. |
| needing-the-knot.html / 87 | `review-self-massager` | supported: Rowan physically uses the installed prostate massager on himself after his partner has left. |
| needing-the-knot.html / 122 | `review-self-inflatable-toy` | supported: Rowan physically activates a locally identified inflatable toy inside his own anus; an imagined partner does not operate it. |
| needing-the-knot.html / 783 | `review-pumping-fingers` | supported: Morgan pumps three fingers into Rowan's opening while oral activity also occurs; a later paragraph changes to a penis. |
| pact-of-ice-and-fire.html / 547 | `review-fingertip-entry` | excluded: adult status unconfirmed: Not adjudicated. Prior adult-status exclusions remain in force. |
| pact-of-ice-and-fire.html / 4628 | `review-retained-fingers` | excluded: adult status unconfirmed: Not adjudicated. Prior adult-status exclusions remain in force. |
| sugar-alpha.html / 1760 | `review-self-finger-poke` | supported: Rowan reaches to use his own fingers at and inside his opening while Morgan sleeps. |
| tricks-of-the-trade.html / 412 | `review-retained-fingers` | supported; additional wording in an already detected act: Morgan retains two fingers inside Rowan after gradual finger entry; another finger is added afterward. |
| were-compeer.html / 462 | `review-toy-subject-entry` | supported: Morgan fulfils Rowan's request and prepares a plug; the toy then enters Rowan and settles beyond the rim. |
| were-compeer.html / 473 | `review-self-toy-size` | supported: After the partner has left, Rowan inserts the next size of an established plug on his own. |
| were-compeer.html / 533 | `review-self-toy-pronoun` | supported: Rowan removes one plug, selects and lubricates a larger one, then completes its insertion into himself. |
| wretched-rhetoric.html / 605 | `review-finger-prostate` | supported: Morgan's fingers contact Rowan's prostate while Rowan's own hands grip nearby furniture. |
| wretched-rhetoric.html / 644 | `review-retained-fingers` | supported: Morgan keeps fingers inside Rowan and curls them during ordinary past-tense narration. |

### Every aggregate change

The existing native `anal.scenes` rollup includes auxiliary finger/toy evidence; it is broader than the strict penile-event score above. Increased native scene/hint totals are **not** recovered penile-act counts. These additions can change confidence scores even though confidence model/settings are untouched. All 14 changes preserve verdict and participant direction.

| Fic / mode | Native anal scenes | Hints | Confidence |
| --- | --- | --- | --- |
| foxden-park.html / tagged | 4 → 6 | 1 → 1 | 59 → 66 |
| foxden-park.html / tag-free | 4 → 6 | 1 → 1 | 54 → 61 |
| icarus-burning.html / tagged | 4 → 5 | 4 → 4 | 85 → 88 |
| icarus-burning.html / tag-free | 4 → 5 | 16 → 16 | 94 → 94 |
| innocent-until.html / tagged | 18 → 20 | 63 → 63 | 97 → 97 |
| innocent-until.html / tag-free | 18 → 20 | 58 → 58 | 97 → 97 |
| needing-the-knot.html / tagged | 8 → 9 | 24 → 26 | 97 → 97 |
| needing-the-knot.html / tag-free | 8 → 9 | 21 → 23 | 94 → 94 |
| sugar-alpha.html / tagged | 11 → 11 | 60 → 61 | 97 → 97 |
| sugar-alpha.html / tag-free | 11 → 11 | 60 → 61 | 92 → 92 |
| were-compeer.html / tagged | 15 → 16 | 59 → 61 | 97 → 97 |
| were-compeer.html / tag-free | 16 → 17 | 51 → 53 | 84 → 84 |
| wretched-rhetoric.html / tagged | 1 → 3 | 11 → 11 | 8 → 5 |
| wretched-rhetoric.html / tag-free | 1 → 3 | 11 → 11 | 5 → 5 |

Wretched retains its existing very-low-confidence direction; the added opposite-role finger evidence lowers tagged confidence from 8 to 5. This PR does not establish that its overall verdict is correct or fix that existing rollup. A reviewer should inspect the auxiliary-evidence contribution separately from strict act identity.


## Errors found while implementing, then corrected

1. Unowned toy-subject entry could crash resolution. It now declines rather than inventing humans; named manipulation/request contexts can bind a supported pair.
2. Self-contact initially credited the sleeping partner. The narrow facing-character contrast fixes the supported case without rewriting generic pronoun resolution.
3. A newly recovered residue-entry act concealed an extra reversed hand-guidance reading in the same sentence. The recall scorer counted the correct act and could not detect this extra error. A failing paraphrased test and a complete hit audit caught it; the explicit owned act now wins.
4. A future plug-size plan with an eligible anal target was initially promoted to performed self-use. A positive-trigger negative control reproduced it; planned activity now stays wanted.
5. Finger reinsertion fallback initially overrode an explicitly named later penis. A failing boundary test fixed the priority: explicit current instrument, then immediate reinsertion evidence, then earlier context.

The unit file contains 32 paraphrased tests. Its assertions require act, participants and occurrence, rather than a particular regex ID. Together with rounds 95/96 the final focused suite passed 47/47.

6. Corpus regression found a partner-removal passage triggering self-use through an embedded lubricant-purpose clause. A closer pronoun-owned-target test failed before the fix; the new rule rejects that explanatory clause. The simpler explicitly named-target test had already passed, illustrating why reproductions must retain the relevant ambiguity.

## Deliberately unresolved

- **F06:** oiling and preparation suggest finger contact but do not support a safe general detector addition. The synthetic explicit-contact case is covered; the source event is not claimed recovered.
- **F10:** attempted self-contact has insufficient explicit achieved-contact evidence for a broad performed rule. Preserve the owner inventory without changing the detector's occurrence boundary.
- **F08:** the engine detects the fingertip action with Samiel Tremark and Jay; the frozen reference expects Jason Lane. Do not silently equate these identities or modify a label to make recall pass.
- **F09:** vaginal fingering with a client outside the main pair needs cast/identity work, beyond the first six families.
- **F02 / T07 / T08:** remembered fingering, urethral sounding, and a relief-negation toy case remain outside this implementation. The denominator is not reduced for them.

## Citation and replay safeguards

Source files must match their SHA. Stored paragraph hashes must match cited engine paragraphs. Wolfbird's saved full-paragraph SHA comes from pre-rewrite extraction: its raw SHA matches, raw and engine extraction have 5,640 paragraphs, and all 30 cited ranges are identical. The helper verifies both the declared raw SHA and cited-range identity/counts when the full engine SHA differs. It does not waive mismatches or edit citations.

`replay-fixed-inventory.mjs` compares the frozen history inventory using the existing scorer, writes prose-free snapshots and refuses to finish if engine bytes change while loaded. An archived engine can be replayed with current extraction/scoring for a fair detector comparison. Reference and actual scorer fingerprints are recorded separately. Selected `REPLAY_ONLY` runs write a separate report and cannot replace the full result.

## Reproduce and independently verify

1. Read `AGENTS.md`, the six-family handoff, this report, and `FINGER_TOY_IMPLEMENTATION_LOG.md`. Use only adult-screened private sources; do not copy fic prose into public artifacts.
2. Run `npx vitest run tests/finger-toy-handoff.test.ts tests/round95.test.ts tests/round96.test.ts`. Inspect the negative controls as closely as positive cases.
3. Run `node scripts/replay-fixed-inventory.mjs ao3-samples <private-output-dir>`. Confirm all 349 citations verify and all 41 covered controls stay matched. To compare the baseline, archive `97d8341`'s `src` into an isolated directory with dependencies available, and pass that directory plus the baseline ref as the third/fourth arguments. Keep extraction/scoring fixed.
4. Run `npm run check -- --jobs 2 --heap 8000` and `npm run regress -- --hits --all --base 97d8341 --jobs 2`. Examine every moved reading, not only verdict changes. Raw regression output is private because it contains source prose.
5. Check the safe result JSON against private source paragraphs, focusing on instrument replacement, hand ownership, self-use, hints and concurrent acts. Do not infer precision from recovered inventory entries.
6. Resolve the alias/contact/scope questions separately with the owner. Import or edit labels only in a separately authorized label task. Retrain confidence separately after detector changes and label review; this PR preserves generated model files.

Full-corpus regression includes automated cached analysis of all 64 samples. Manual source adjudication is restricted to adult-screened works; any moved reading from a declined work is listed as excluded, not reviewed as sexual evidence. Tagged hit differences and both tagged/tag-free verdict differences are recorded separately: the existing regression export stores individual hits only from the tagged pass.
