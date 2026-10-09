# Cock-cage scene review

`review/cock-cages.html` contains 50 selected passages across eight fics with an explicit cock-cage tag. It is linked from the other review sets. Tags determine eligibility, not whether an event occurs. This is a targeted device review, not an exhaustive inventory of every tagged work or an accuracy estimate.

| Fic | Passages | Engine cues | Action/context proposals |
|---|---:|---:|---:|
| Innocent Until | 9 | 14 | 4 |
| Better Lock It In Your Pocket | 7 | 11 | 5 |
| you're stumbling like the nazarene | 6 | 7 | 5 |
| Prince, Prisoner, Puppy, Parent | 3 | 10 | 2 |
| Rental Agreement | 3 | 5 | 2 |
| Sugar Alpha | 5 | 5 | 2 |
| A WereCompeer | 8 | 27 | 9 |
| Tricks of the Trade | 9 | 32 | 8 |
| Total | 50 | 111 | 37 |

The assistant proposes 16 incorrect cues, 79 supported cues and 16 uncertain cues. These remain proposals until the owner reviews them. Several passages can be phases of one encounter, and multiple cues can describe one action. Counts are not independent scene or mistake counts.

## Selection and findings

The source metadata was scanned for cock-cage tags. Cage vocabulary was screened independently, selected passages and surrounding context were read closely, then compared with fresh tagged audits on main `8c745f1`. All eight included works establish adult context through explicit adult ages/age-up notices, adult professional settings, university/adult household settings, or explicit adult narration. Childhood/family references are not cage participants. Two further tagged works were not included because this pass did not establish an adult-only sexual context; this does not assert that either work depicts minors in these cage passages.

The selection covers fitting, wearing, touching, key possession, removal, relocking without removal, remembered self-fitting, proposed use, refusal, and abstinence without a device. Supported controls are included so a future guard can be checked against real cage use as well as false positives.

Possible errors shown for owner review include:

- In Innocent Until, confinement metaphors and equipment in a drawer become wearer cues.
- In Sugar Alpha, observers or unrelated characters become the cage wearer’s partner; a proposed cage is attributed to a different pair.
- In the nazarene work, Louis’s role is assigned to Harry, key transfer is confused with the partner’s cage, and a current wearer cue appears despite explicit freedom.
- In A WereCompeer, Boyd fits Stiles’s device but a remembered match names Derek as receiver. Discussion after removal needs a distinction between a legitimate device-dynamic cue and current wearing.
- In Tricks of the Trade, unboxing is read as bodily unlocking/keyholding, and abstinence expressly involving no equipment becomes device wearing.

Device-role behavior cues can reasonably express control plans without asserting a completed fitting. Those are distinguished from unsupported actual-wearer claims, and ambiguous cases are marked uncertain. A recalled, correctly attributed cage dynamic is not rejected merely because it is recalled. No device event establishes anal penetration. The physical fitter, relationship controller, wearer and observer need not be the same people.

The existing general claim helper sometimes describes a wearer’s pairing partner as the person who physically locked the device. This review instead says the engine credits a wearer within a pairing, without adding that unsupported physical assertion. Actual fitting/key possession are separate proposals.

## Confidence and privacy

13 selected cues have a committed-model probability for their exact features. The other 98 have neither a feature vector nor an unambiguous individual displayed score in the fresh output. They say unavailable; pairing scores and vibe weights are not substituted. Assistant scores are subjective confidence, not measured accuracy. A related keyholder hint does not become a calibrated probability for a specific removal merely because the hint supports it.

Many cage cues currently bypass the context-model feature path. Their owner labels can help per-pattern reliability and preserve reviewed claim identities; they will not all directly enter context-model training without a separate feature-path change. This PR changes no detector patterns, guards, labels, model weights, reliability table or metrics.

Only paraphrases, names, metadata, paragraph references and hashes are published. The original source paragraphs load locally from the matching HTML or ZIP, verified by file and paragraph hashes. Private paragraphs stay in memory, and are not stored in browser answers or exported. Source paragraph totals describe file size, not proof of exhaustive review.

## Owner workflow

1. After merging and Pages deployment, open `review/cock-cages.html` and load the samples ZIP once. It loads all eight matching fics locally. Switch fics using the selector; refreshing requires reloading the private sources.
2. Agree with all assistant assessments in a passage or answer each card separately. Agreement fills notes, applicable error boxes, participants and occurrence. Edit anything that needs correction. Disagreement leaves the replacement verdict open. No whole-scene checkbox is required.
3. Export all fic answers as one `cock-cage-review-answers.json`, or use Share on a supported phone. Restore accepts that same combined JSON and only replaces older decisions.

Answers persist per fic in browser storage and remain in memory across fic switches even if storage is unavailable. All passages are visible by default, including supported controls. Export before changing device or browser.

## Later import

Stage a combined owner export using fresh output paths:

```sh
node scripts/import-cock-cage-review.mjs \
  public/review/cock-cage-index.json \
  /path/to/cock-cage-review-answers.json \
  /path/to/new-cage-review-import
```

The importer produces separate confidence and inventory files per fic. It refuses an existing output directory or a protected labels/model directory. Explicit uncertain decisions are excluded from training; unanswered cues and omitted events do not become negative labels. Remembered self-fitting and explicitly rejected wearing remain review context, not new performed events. Chastity events are stored as unscored device events, rather than scored penetrative acts. Conflicting legacy claim keys retain the existing quarantine behavior.

Owner answers are not accepted automatically by this PR. Review staged imports before incorporating them; detector fixes and retraining remain separate.

## Validation

Fresh tagged audits of the eight included sources; source-hash and paragraph-loader verification for each; exact model probabilities; privacy and paragraph bounds; supported, incorrect and uncertain answer round trips; correct attribution of self-fitting and helper fitting; unscored device events; combined-export identity validation; fic switching and autofill; disagreement without inverted labels; full unit suite and production build.
