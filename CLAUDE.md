# Notes for Claude

- The sample fics (`ao3-samples/`) are never committed. If the user uploads `ao3-samples.zip` (or asks to set up the fics), run
  `npm run setup-fics -- <path to the zip>`: it unzips into `ao3-samples/` and reads every fic once (about 6 minutes) so checks and
  regressions are cached. Say what you are doing, then carry on with the user's request.
- How a change is checked: `docs/TESTING.md`. Where things live in the engine: `docs/ENGINE_MAP.md`.
- Tests and docs paraphrase; never quote fic text. Decline fics with minors in sexual content.
- Spot-checks of Claude-made labels: `npm run spotcheck -- next` builds the next blind page (publish it as a private Artifact with the `db` capability, never show Claude's verdicts); after the owner answers, save the page's `reviews` collection with ArtifactData (`out_dir`) and run `npm run spotcheck -- import <dir>`. For readings nobody has labelled: `npm run spotcheck -- next --unlabelled` and `import-unlabelled <dir>` (same page and answer steps). Details: `docs/TESTING.md`.
- How to judge a reading when labelling or reviewing (blowjob wording, fingers or a cock at the anal entrance): "How to judge a reading" in `AGENTS.md`.

## Working efficiently (speed and tokens, without losing accuracy)
- **Narrowest check first, full check once.** While iterating: one test file, or `npm run check -- --only <fic>` (the fast loop in `docs/TESTING.md`). Before pushing an engine change: the full `npm run check` and `npm run regress -- --hits --all`, once. They answer different questions (`check` = labelled readings are right and the build passes; `regress` = what else moved), so neither replaces the other.
- **Don't re-read fics or re-run what is cached.** `setup-fics`, `eval` and `regress` cache per engine version in `ao3-samples/.eval/`; an unchanged tree is free. Use `npm run trace` to see why one reading came out as it did, not a patched bundle.
- **Script the counting, read only the sample.** To find which patterns are weak, group the label files (`tests/right-set/*.json`: `via`, `kind`, `weight`, `retired`, `misread`) with a short script and print counts. Then read a handful of sentences per group. Print aggregates first and cap output (`head`, `slice`); don't paste hundreds of labels or whole fics into the conversation. Eight samples shows what kinds of mistake exist, not how common each is: count the whole group before ranking causes.
- **Keep scratch work out of the repo and reuse it.** Dumps, chunk files and patches belong in the scratchpad; re-use an earlier dump instead of re-extracting. Save a regen patch before a risky branch change.
- **Parallelise independent work, delegate bulk reading.** Independent commands go in one call. For a read of hundreds of sentences, a subagent that returns a grouped table keeps the raw text out of the main thread; test it on a small group first, since its mistakes read as confidently as its findings.
- **What not to trade away.** Blind review (never show a reviewer the other verdict), the right-set replay, the `regress` baseline comparison, and reading the actual sentences before naming a cause. A guess about why a pattern fails has been wrong before.
