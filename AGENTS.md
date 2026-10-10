# Notes for an AI coding assistant (ChatGPT / Codex, or any other)

This is "Trust (Tags) But Verify": a small web app plus a rule-based text-analysis engine (no AI inside) that reads AO3 fanfiction downloads and
reports, for adult characters, who tops and bottoms, with a confidence score and the sentences behind it. TypeScript (Vite + Vitest). It analyses
fiction text with patterns; it does not generate any. Read `README.md`, then `docs/ENGINE_MAP.md` (where things live) and `docs/TESTING.md` (how a
change is checked). Claude Code (`CLAUDE.md`) also works in this repository, so check for overlap first (see "Working alongside Claude").

## Rules of the project (please follow)
- **Never quote fic text** in code, tests, docs or comments. Tests use short *paraphrased* sentences with made-up names (see `tests/round88.test.ts`, `tests/round89.test.ts`).
- Decline fics where minors appear in sexual content.
- The sample fics (`ao3-samples/`) are **not** in the repository and are never committed. The label files (`tests/right-set`, `tests/gold`, `tests/labels`,
  `tests/spotcheck`) store paragraph hashes and names only.
- Do not regenerate `src/heuristic/reliability.ts` or `src/heuristic/learned.ts` inside a fix: they are generated from the labels (`npm run regen`) and need the fics.
- For blowjobs "top" means the one *being sucked* and "bottom" the one sucking; for rimming "top" is the one doing it.
- The owner is a beginner with code and GitHub: explain changes in plain language and keep what they must do small. The owner merges pull requests.

## How to judge a reading (tagging conventions)
Use these whenever you label a reading, review a scene, or judge a mistake report, so the labels stay consistent. Judge the **act in the text**, not the name of the pattern
that happened to match (the pattern that reads a sentence can change after a retrain, as `sucked` became `took-in-mouth` and `penis-into` became `penis-inside`).
- **Oral on a penis is one act: a blowjob**, however it is worded ("took him in his mouth", "swallowed him down", "lips around", "sucked", "went down on him"). Do not treat
  "took in mouth" or any other wording as a separate act. Top is the one being sucked, bottom the one sucking.
- **Fingers at the anal entrance count as fingering**, with no insertion needed: teasing, circling, rubbing or pressing at the hole, rim or entrance. Fingers on the cheeks, thighs,
  waistband, hair or mouth do not.
- **A cock at the anal entrance counts as anal sex**, with no insertion needed: a penis against, catching on, nudging or pressing at the hole, rim or entrance. A penis between the
  cheeks or thighs, or rubbing the buttocks without touching the opening, is body contact, not anal sex.
- **A toy at the anal entrance counts** the same way, with no insertion needed: a plug, dildo or vibrator held, pressed or rubbed at the hole, rim or entrance. Tag it as a **toy act**
  ("anal sex (strap-on/toy)", or a toy used on himself), not as penile anal sex and not as fingering.
- **If it never reached the opening** (stopped, refused or interrupted before contact), it is not performed. Contact at the opening counts even if it goes no further.
- Labels made before this rule (2026-10-10) that called entrance contact "mistaken for insertion" (the 20 "external contact" readings in `docs/CURRENT_ANAL_ERROR_REVIEW.md`, and
  some owner labels on "presses fingers to his rim") may need re-review; do not change them without the owner's say-so.

## What you can and cannot run
- Works anywhere: `npm install`, `npm test` (the unit suite, about a minute), `npm run build` (type-check and build), `npm run dev`.
- Needs the owner's fics (kept on the owner's machine, not here): `npm run check` (gold and right-set runs), `npm run regress` (what else changed across all
  fics), `npm run dive`, `npm run trace`, `npm run spotcheck`, `npm run regen`. **Without the fics you cannot verify an engine change against real fics.**
  So for an engine change: keep it small and guarded, add a paraphrased test, run `npm test` and `npm run build`, and say plainly in the pull request that
  `npm run check` and `npm run regress -- --hits --all --base origin/main` still need to be run (the owner or Claude Code can run them) before merging.
- If the owner gives you `ao3-samples.zip` (or asks you to set up the fics), run `npm run setup-fics -- <path to the zip>`: it unzips into `ao3-samples/`
  and reads every fic once (about 6 minutes) so checks and regressions are cached. Say what you are doing, then carry on with the owner's request.

## Working alongside Claude
- Before starting, look at the open pull requests and branches (`claude`-style names such as `fix-notes`, `weak-patterns`, `retrain-model` are Claude's) and avoid editing
  the same files at the same time, especially `src/heuristic/index.ts` and `src/heuristic/patterns.ts`.
- Work on your own branch (for example `chatgpt/<short-topic>`), one topic per pull request, never on `main`. Write the pull request description in plain language:
  what was wrong, what you changed, how you checked it, and what is left to check.

## How a fix is made (the loop used so far)
1. A mistake report names a sentence and what is wrong. Work out why the engine read it that way (`src/heuristic/index.ts` `handleMatch` is a long run
   of guards, each with a quoted-example comment; subject/person logic is in `resolve.ts`, `pov.ts`, `address.ts`; patterns are in `patterns.ts`).
2. Reproduce it with a paraphrased test (copy the `run()` helper from `tests/round88.test.ts`). Make it fail.
3. Fix with the narrowest guard or pattern change; keep the comment-with-example style.
4. `npm test`, `npm run build`; then the owner's (or Claude's) `npm run check` and `npm run regress -- --hits --all --base origin/main`; read every reading that moved.

## Things learned the hard way
- A regex with nested optional whitespace made fics about 10x slower: use lookbehinds, and keep `tests/smoke.test.ts` passing.
- Two men share "he/his": a guard that treats "ran his fingers through his hair" as self-touch removes real caring cues unless the sentence has a cue (frustration, fixing it…).
- A guard that drops an act can hide real flashback scenes; prefer demoting to a weaker reading (kind "hypothetical") when the act really happened.
- Claim wording on review pages once said the opposite of what the engine meant for readings crediting the *receiver*; wording lives in `scripts/review-claims.mjs`.
- Widening a regex that decides "this sentence starts with an outsider's name" made sentences starting "Though," look like outsiders: test the regex against ordinary sentence openers.

## Working efficiently (speed and tokens, without losing accuracy)
- **Narrowest check first, full check once.** While iterating: one test file, or `npm run check -- --only <fic>` (the fast loop in `docs/TESTING.md`). Before pushing an engine change: the full `npm run check` and `npm run regress -- --hits --all`, once. They answer different questions (`check` = labelled readings are right and the build passes; `regress` = what else moved), so neither replaces the other.
- **Don't re-read fics or re-run what is cached.** `setup-fics`, `eval` and `regress` cache per engine version in `ao3-samples/.eval/`; an unchanged tree is free. Use `npm run trace` to see why one reading came out as it did, not a patched bundle.
- **Script the counting, read only the sample.** To find which patterns are weak, group the label files (`tests/right-set/*.json`: `via`, `kind`, `weight`, `retired`, `misread`) with a short script and print counts. Then read a handful of sentences per group. Print aggregates first and cap output (`head`, `slice`); don't paste hundreds of labels or whole fics into the conversation. Eight samples shows what kinds of mistake exist, not how common each is: count the whole group before ranking causes.
- **Keep scratch work out of the repo and reuse it.** Dumps, chunk files and patches belong in the scratchpad; re-use an earlier dump instead of re-extracting. Save a regen patch before a risky branch change.
- **Parallelise independent work, delegate bulk reading.** Independent commands go in one call. For a read of hundreds of sentences, a subagent that returns a grouped table keeps the raw text out of the main thread; test it on a small group first, since its mistakes read as confidently as its findings.
- **What not to trade away.** Blind review (never show a reviewer the other verdict), the right-set replay, the `regress` baseline comparison, and reading the actual sentences before naming a cause. A guess about why a pattern fails has been wrong before.

## Where the numbers are
`docs/METRICS.md` (the context model's log loss and AUC over time) and `docs/EVALUATION.md` (what each kind of evidence is). Current state: gold 17/17 verdicts,
scenes right 79 (flipped 0, missed 0); context model on unseen fics AUC about 0.72, log loss about 0.185.

## Open work
Known engine problems not yet fixed: the "smaller man" epithet flip (prince-prisoner-puppy), "the Dom/the sub" as epithets, a bystander chosen as the
left-out subject over the pair (were-compeer), anal scenes only picked up as an ogling hint ("the heat of being inside him… thrust"), toy/fingers/cock act typing.
Ideas ranked by value: verdict-level accuracy on all fics, more missed-scene (recall) checks, spot-checking unlabelled readings, features for how the engine chose the person.
