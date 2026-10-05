# How a change is checked

Two different questions, two different tools.

## Is this change right? — `npm run check` (about 100 s, every change)
- The unit suite (`--no-isolate`, so jsdom is built once per worker) and the build.
- **Gold labels** (`tests/gold`): hand-checked verdicts, real scenes, point of view, who sent each text. Scored against the last *accepted* totals; a drop fails the check.
- **Right-set replay** (`tests/right-set`): the readings marked right in mistake reports. A "strong" one that changed fails.
  - **Weighted labels**: a pass that is not the owner's own (`import-right-set.mjs --weight 0.9 --source claude`) stores `weight`/`source` on each entry. These are never strong: they are reported, and a set fails only if more of them change than the label noise allows (`1 - weight` plus 5 points, at least 2). They count fractionally in the reliability table and the context model. The owner marking the same reading right later makes it full weight; an unverified "wrong" cannot dispute an owner-marked right.
- The gold and right-set runs are spread over the spare cores, a few fics each. The longest fics take about 4 GB each to read, so the number of jobs is also capped at one per 6 GB of memory (`--jobs N` overrides it); a run killed with SIGKILL means the machine ran out of memory. They need the local `ao3-samples/` folder; without it only the unit suite and build run.
- `npm run check -- --accept` records the run's gold totals as the new baseline (after you have judged a drop to be a deliberate, correct change).

## What else did it change? — `npm run regress` (all fics, about 4 min)
- Compares the working tree with a baseline (HEAD when `src/` is dirty, else `origin/main`, or `--base <ref>`) over **all** the sample fics.
- It finds changes nobody has labelled. It cannot say whether a change is right.
- `--hits` lists every reading that appeared or disappeared, with the sentence. **Read those.** In the last six engine versions, 23 of 52 fics changed at least once and the changes are spread over many fics, so a subset (`--fast`) is not a safe check. A reduced corpus (only paragraphs near hits) found 44-73% of the real differences and invented others.
- Results are kept per engine version (`ao3-samples/.eval/`), so the baseline runs once and an unchanged tree is free.

## Closing the loop
When `--hits` shows a change you judge **correct**, record it so the next change is checked against it automatically:
- a **scene** or verdict: add it to the gold set (`scenes`, or `notScenes` for a removed false positive) in `tests/gold/<fic>.json`;
- a **hint** (who a line points at, a speaker, a prep/ogling/dialogue cue): gold has no hint labels, so mark it "looks right" on the page (or in a mistake report) and import it with `scripts/import-right-set.mjs`.
Over time more of the diff becomes something `check` can answer by itself.

Run `npm run regress -- --hits --all` before pushing a change to `src/`. The optional pre-push hook (`.githooks/pre-push`) does the same.
