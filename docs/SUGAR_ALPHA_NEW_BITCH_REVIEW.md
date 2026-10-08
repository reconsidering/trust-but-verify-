# Sugar Alpha and New Bitch: errors-only owner review

These two pages propose corrections and missing acts after independent whole-text screening and detailed reading of sexual passages with their surrounding context. They compare against fresh tagged engine runs on main commit `b91edd7`. They do not change detection rules, labels, confidence coefficients or reliability tables.

| Work | Words | Source paragraphs | Audit readings examined | Selected incorrect readings | Proposed missed/corrected acts | Review passages |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sugar Alpha | 81,224 | 2,428 | 254 | 63 | 18 | 40 |
| New Bitch | 177,840 | 7,944 | 197 | 20 | 9 | 19 |

The counts are individual pattern readings and act proposals, not independent mistakes or encounters. Several patterns can make the same mistake. Adjacent issues share a passage and can be confirmed together. All selected reading assessments propose “engine wrong”; supported readings, everyday dynamics and unresolved possibilities are omitted. This is a targeted review set, not an exhaustive gold inventory or an estimate of accuracy or recall.

Age screening found an explicit adult age-up notice and an adult age for Stiles in Sugar Alpha. New Bitch establishes its sexual participants as adults through stated age and post-university chronology. Its child-family passages are nonsexual and are outside this review. No fic text is published. Actual character names and paraphrases identify the proposed corrections. Damen is the engine’s canonical name for Damianos.

## What needs checking

Sugar Alpha has proposed errors involving an anticipated obligation treated as performed sex, a thumb treated as a penis, oral roles reversed, penile anatomy treated as vulval anatomy, clothed genital rubbing treated as penetration, a parking control treated as a body, and plug ownership carrying over from Isaac into Stiles’s scenes. Several actual acts are demoted to hypothetical readings. Requests for anal sex and oral references to a knot also contaminate act-specific hints.

Its act proposals include missed oral sex between Isaac and Peter, solo stimulation, self-fingering, anal toys, a separate rimming encounter, full-hand penetration and urethral sounding. Sounding has its own review category so a rod in the urethra is not recorded as an anal toy. Scrotal oral contact stays distinct from a penile blowjob. One corrected body-rubbing proposal replaces false anal/handjob claims.

New Bitch has proposed errors involving planned or imagined sex counted as performed, oral finger contact counted as anal fingering, external finger pressure counted as insertion, reversed oral and anal participants, self-stimulation counted as a handjob on a partner, and lubrication for entry counted as manual sex. Conversely, a fulfilled elevator fantasy and an enacted entry after a wish are incorrectly left as hints. A morning riding summary needs both its occurrence and roles corrected.

Its act proposals include mutual hand stimulation recorded in each direction, solo stimulation, missed rimming and a following handjob in the changing room, manual stimulation during anal sex, and the completed morning riding encounter. The external penis-against-buttocks correction preserves the specific anal-role hint without calling the contact penile penetration. Supported “past experience with others” hints were deliberately excluded: their nearby pairing name does not mean the engine attributed the earlier acts to that partner.

## Using the pages

After merging and the Pages deployment, open:

- [Sugar Alpha](https://reconsidering.github.io/trust-but-verify-/review/sugar-alpha.html)
- [New Bitch](https://reconsidering.github.io/trust-but-verify-/review/new-bitch.html)

1. Select the original fic HTML or the sample ZIP. It is read locally on the device. Source and paragraph checksums must match before answering is enabled.
2. Check the cited paragraphs under each proposed act and the surrounding passage. Agree/disagree refers to the assistant’s assessment. Each reading and act can be answered independently, or agree with everything in the passage to save time. Optional auto-next advances after passage agreement.
3. Agreement fills the proposed engine verdict, correction, applicable errors, act participants, occurrence and citations. Disagreement leaves the engine verdict open; it does not assume the opposite claim. There is no “I read the whole scene” checkbox.
4. Export the answers, or use Share/save on supported phones, then send the JSON back. Browser autosave is local; export before switching device or browser.

The source paragraphs appear only after local loading. They are not included in the exported answers. The pages do not imply that unlisted hints or acts are wrong or absent.

## Scores and later imports

An engine score is the committed model’s probability for the exact pattern record and context when its features are available. Otherwise the page uses the engine’s displayed score only when the exact evidence, pattern and credited person identify it unambiguously. The basis is stated on every reading. An unavailable score is shown as unavailable; a missing or corrected act without a matching detection has no engine score, rather than zero. Assistant confidence is subjective and must not be interpreted as measured accuracy.

The new review choices for fisting, urethral sounding and genital oral contact, plus the existing penis-against-buttocks choice, validate and export without being coerced into another act. They are preserved as unscored inventory events where the current evaluation does not score that category. No detection behavior or scored-act definition changes here.

Only explicit owner decisions become training labels. Confirmed performed acts become positive scene events; an omitted act never becomes a negative label. Existing claim identity and conflicting-key quarantine remain in force. Import each page separately with fresh output files:

```sh
node scripts/import-deep-review.mjs public/review/sugar-alpha-deep-review.json sugar-alpha-deep-review-answers.json sugar-alpha-labels-output.json sugar-alpha-scenes-output.json
node scripts/import-deep-review.mjs public/review/new-bitch-deep-review.json new-bitch-deep-review-answers.json new-bitch-labels-output.json new-bitch-scenes-output.json
```

Review and incorporate those owner imports in a separate change. Retrain the confidence model separately afterwards. These proposals are not labels before the owner confirms them.

## Validation

Fresh real-fic audit: both selected tests passed. Dataset and browser tests cover source-bound citations, exact model probabilities, errors-only selection, individual and bulk agreement, disagreement without an invented replacement label, and export/import of the added review categories. Both actual HTML downloads also passed the browser loader’s source and paragraph verification. The full unit suite passed (1,622 tests; 13 skipped), and the production type-check/build passed. No fic, engine code, label or generated model file is committed.
