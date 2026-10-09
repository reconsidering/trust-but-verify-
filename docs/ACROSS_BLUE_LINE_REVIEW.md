# Across the Blue Line review

The review is at `review/across-the-blue-line.html`, linked from the other review sets. It uses the existing deep-review page and feedback importer. No engine rules, labels, models or reliability tables change here.

## What to review

12 passages contain 35 proposed incorrect engine readings and 10 proposed missed or corrected acts. Multiple pattern matches describe the same encounter; these totals are not counts of distinct scenes. The main adult couple is Cody Michaud and Mikko Korhonen. Cody is explicitly 21. The reviewed encounters involve adult professional players; childhood sports memories are nonsexual.

This upload has no relationship or character tags. The baseline uses the normal cast-inference path, without supplying a relationship to make the engine succeed. The fresh audit on main commit `379bc2e` contains 40 readings. Five unrelated everyday cues are excluded from this errors-only selection.

The principal finding is incorrect first-person attribution. Chapter 24 identifies Cody as narrator, yet oral sex and sexual-role hints are assigned to Luca/Mikko. Chapter 32 again identifies Cody as narrator, but many fingering and anal readings are assigned to Cody/Duke or Mikko/Duke. The main couple is absent from the engine’s pairing results. Several oral readings also reverse who owns the penis and who is using their mouth.

Other proposed errors include a birthday beckoning gesture counted as fingering, loosening a skate lace counted as a handjob, an emotional admission counted as anal penetration, and a cat cuddling on a couch counted as sexual aftercare. One holding cue occurs during penetration rather than after the encounter. The page includes corrections for preparation and desire, without converting these into penetration.

The proposed act inventory covers both oral directions, both handjob directions, clothed and unclothed genital rubbing, each character’s self-stimulation, Mikko fingering Cody, and Mikko penetrating Cody anally. Corrected acts are separate from labels on the old incorrect engine claims. The recalled anal encounter is fully depicted as having happened: past-perfect narration does not make it hypothetical or create another present-day encounter. The self-stimulation continuing through fingering and penetration is recorded as one contiguous episode.

## Method and confidence

Independently screen the whole source for sexual vocabulary, then closely read the identified encounters and expanded surrounding context before comparing the fresh engine audit. This is not a guarantee of exhaustive recall across all 156,351 words and 17,399 source paragraphs. The page reports the source size, not an assertion that every possible missed act was found. AO3 tags do not establish an act.

Each selected engine claim has its current committed-model probability when its context features are available. Otherwise it uses an unambiguous displayed score for the same evidence, pattern and credited person, or says unavailable. Assistant confidence is subjective. A missed or correctly attributed replacement act has no invented engine score; the score for the original wrong claim remains on its own card. Summary verdict scores are taken from the fresh full engine output.

No fic text is published. Citations are zero-based paragraph indices and the source is identified by hashes. Original paragraphs appear only after loading the matching private HTML or sample ZIP. Character names are retained so corrections are easy to understand.

## Owner steps and later import

1. Open the review and load the uploaded Across the Blue Line HTML or sample ZIP.
2. Agree with all assessments in a passage when they are right, or answer individual cards and edit the corrections. Agree/disagree refers to the assistant assessment. Disagreement does not silently assert the inverse. No whole-scene checkbox is required.
3. Export the answers and send back the JSON. Answers can be restored or shared on another device.

Passage agreement fills individual decisions, corrections, participants, occurrence and applicable error boxes. It does not say that unlisted acts are absent. Confirmed replacement acts become an act inventory; explicit engine decisions become confidence-training labels. No proposed assessment is imported before owner review.

After reviewing the exported file, import separately with:

```sh
node scripts/import-deep-review.mjs \
  public/review/across-the-blue-line-deep-review.json \
  /path/to/across-the-blue-line-deep-review-answers.json \
  /path/to/new-confidence-labels.json \
  /path/to/new-act-inventory.json
```

This review PR does not perform that import or retrain. Detection fixes and retraining remain separate changes.

## Validation

Fresh source audit, browser-loader source-hash verification, feedback round-trip tests, confidence calculations against the committed model, privacy/paragraph-bound checks, agreement/autofill and disagreement behavior, plus the full unit suite and production build.
