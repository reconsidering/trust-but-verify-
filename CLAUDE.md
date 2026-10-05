# Notes for Claude

- The sample fics (`ao3-samples/`) are never committed. If the user uploads `ao3-samples.zip` (or asks to set up the fics), run
  `npm run setup-fics -- <path to the zip>`: it unzips into `ao3-samples/` and reads every fic once (about 6 minutes) so checks and
  regressions are cached. Say what you are doing, then carry on with the user's request.
- How a change is checked: `docs/TESTING.md`. Where things live in the engine: `docs/ENGINE_MAP.md`.
- Tests and docs paraphrase; never quote fic text. Decline fics with minors in sexual content.
