# How a change is checked

Two different questions, two different tools, and a fast loop for working on one fic. Where things live in the engine: `docs/ENGINE_MAP.md`.

## While you work on one fic — the fast loop (about 1–2 min)
- `npm run check -- --only belonging,werecompeer` runs the unit suite, the build, and the gold and right-set runs for just those fics (a part of a name is enough). Its gold totals are shown but not compared with the baseline.
- `npm run regress -- --only belonging --hits` compares just that fic (exact file name) with the baseline.
- `npm run trace -- <fic> "<pattern regex>" [fromPara] [toPara]` shows why a reading came out as it did: each match, who the engine first made top and bottom, the subjects it was going on (elided, clause, last, point of view), and which readings survived the guards. Use it instead of patching trace lines into a bundle.
- The unit suite includes `tests/smoke.test.ts`: speed on long quotes and sentences, a woman in an M/F pair, the alpha/omega tag rule, and a shared term of address. They are the mistakes that used to cost a full regression run to find.
- Run the full `check` and `regress` once before you commit, not after every fix.

## A deep dive on one fic — `npm run dive`
Steps (everything goes to `ao3-samples/.dive/<fic>/`, local like the fics; details at the top of `scripts/dive.mjs`):
1. `npm run dive -- pack <fic>` (remembers the base commit in `base.json`, so later steps compare against the same one) reads the fic with the base engine (`--base`, default `origin/main`) and writes the readings in chunks of 50 to judge, the sexual-looking paragraphs the engine missed, the numbered full text in ~1000-paragraph ranges, and `prompts.md` with a ready-made prompt for each chunk. The scene-listing helpers read `inv<n>-text.txt`: the fic with stretches that have nothing sexual or leading up to it cut out (`scripts/trim.mjs`: explicit wording, build-up and morning-after cues, and anything near what the engine read), unless the tags say fade-to-black, the cut would keep under 25% or over 85% of the text, or you pass `--full-read` to `pack`. `fulltext.txt` is always the whole fic.
2. Give each prompt to a subagent (in parallel). They write `A<n>-labels.json`, `B<n>-labels.json` and `inv<n>.json` into the same folder.
3. Fix the engine; after each change `npm run dive -- eval <fic>` (about 40 s; `--full` lists every reading, the file `eval.md` always does) groups the wrong readings by pattern and prints precision before and after, right readings kept or lost, wrong ones gone or still there, new readings, recall on the missed paragraphs and on the inventoried scenes.
4. `npm run dive -- import <fic>` adds the judged readings to `tests/right-set` at weight 0.9 (source `claude`; weak cues the owner has ruled on are left undecided), and `npm run dive -- gold <fic> --pairing "A/B" --top A --bottom B` writes `tests/gold/<fic>.json` from the inventories (only scenes the engine reports now: a regression guard, not a recall measure).
5. Then the full `npm run check` and `npm run regress -- --hits --all` once, and a PR. Regenerate the generated files separately (below).

## Generated files — `npm run regen`
`src/heuristic/reliability.ts` (per-pattern precision) and `learned.ts` (the context model) are made from the labels. They change on every label import, so PRs that carry them conflict with each other. **Do not regenerate them inside a label or fix PR.** A workflow (`.github/workflows/regen.yml`) regenerates `reliability.ts` for you after every `REGEN_EVERY` merges that touched labels (repository variable, default 5; it opens a PR, never pushes to `main`; needs Settings > Actions > General > "Allow GitHub Actions to create and approve pull requests"; you can also run it by hand from the Actions tab with *force*). It can't do `learned.ts`, which replays the sample fics that exist only on your machine, so that one stays a local `npm run regen`. The unit suite only *warns* when `reliability.ts` is behind the labels (`STRICT_GENERATED=1` makes it fail). After a batch of PRs has merged, run `npm run regen` (about 9 minutes; `--reliability-only` takes seconds), run `npm run check`, and commit the two files on their own.

## Is this change right? — `npm run check` (about 2.5 min, every change)
- The unit suite (`--no-isolate`, so jsdom is built once per worker) and the build.
- **Gold labels** (`tests/gold`): hand-checked verdicts, real scenes, point of view, who sent each text. Scored against the last *accepted* totals; a drop fails the check.
- **Right-set replay** (`tests/right-set`): the readings marked right in mistake reports. A "strong" one that changed fails.
  - **Weighted labels**: a pass that is not the owner's own (`import-right-set.mjs --weight 0.9 --source claude`) stores `weight`/`source` on each entry. These are never strong: they are reported, and a set fails only if more of them change than the label noise allows (`1 - weight` plus 5 points, at least 2). They count fractionally in the reliability table and the context model. The owner marking the same reading right later makes it full weight; an unverified "wrong" cannot dispute an owner-marked right.
- The gold and right-set runs are spread over the cores (one shard per core, fics balanced by their recorded run time). Reading the longest fic takes about 1.3 GB, each shard gets a 3 GB heap (`--heap MB`), and the number of jobs is capped at one per 3 GB of memory (`--jobs N` overrides it). A shard that runs out of memory is run again alone with an 8 GB heap. Fic titles for the right-set replay are cached in `ao3-samples/.eval/titles.json`. They need the local `ao3-samples/` folder; without it only the unit suite and build run.
- `npm run check -- --accept` records the run's gold totals as the new baseline (after you have judged a drop to be a deliberate, correct change).

## What else did it change? — `npm run regress` (all fics, about 4 min)
- Compares the working tree with a baseline (HEAD when `src/` is dirty, else `origin/main`, or `--base <ref>`) over **all** the sample fics.
- It finds changes nobody has labelled. It cannot say whether a change is right.
- `--hits` prints a short summary per fic: how many readings disappeared, appeared, or moved to the other person, grouped by pattern, with up to 2 examples each. Every moved reading goes to `ao3-samples/.eval/regress-hits.txt` (`--hits-file` changes it); `--full` prints them all. **Read the summary, then open the file for any pattern you don't understand.** In the last six engine versions, 23 of 52 fics changed at least once and the changes are spread over many fics, so a subset (`--fast`) is not a safe check. A reduced corpus (only paragraphs near hits) found 44-73% of the real differences and invented others.
- Results are kept per engine version (`ao3-samples/.eval/`), so the baseline runs once and an unchanged tree is free.

## Closing the loop
When `--hits` shows a change you judge **correct**, record it so the next change is checked against it automatically:
- a **scene** or verdict: add it to the gold set (`scenes`, or `notScenes` for a removed false positive) in `tests/gold/<fic>.json`;
- a **hint** (who a line points at, a speaker, a prep/ogling/dialogue cue): gold has no hint labels, so mark it "looks right" on the page (or in a mistake report) and import it with `scripts/import-right-set.mjs`.
Over time more of the diff becomes something `check` can answer by itself.

Run `npm run regress -- --hits --all` before pushing a change to `src/`. The optional pre-push hook (`.githooks/pre-push`) does the same.
