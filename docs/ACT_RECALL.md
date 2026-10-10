# Per-act recall

[Fixed-review historical comparison](FIXED_REVIEW_PERFORMANCE.md) · [First measured baseline](ACT_RECALL_BASELINE.md) · [Baseline data](data/act-recall-baseline.json)

Run `npm run recall -- ao3-samples` after detection changes. It writes `ACT_RECALL_REPORT.md`, `ACT_RECALL_REPORT.json`, and appends a summary to `ACT_RECALL_HISTORY.jsonl` with a readable `ACT_RECALL_HISTORY.md` timeline in the private fic directory. An optional second argument chooses a persistent report directory. No labels, patterns, or confidence-model files are changed.

The report evaluates independent performed-act inventories in `tests/scene-review`: completed owner windows, positive entries from partial owner windows, suspect-review act inventories, and eligible AI deep-dive inventory events at reviewer confidence 95% or higher. AI events must explicitly be current/performed and have a supported act name; historical references, intentions, uncertain activity, and unsupported categories are listed separately. Known age-ineligible sources are skipped before extraction.

For each act, **strict recall = correct act and participants inside the cited range / verifiable expected events**. Blowjob performer means the person sucking, not the engine's oral “top.” Duplicate events with exactly the same source, range, act and participants count once; owner provenance takes precedence. This is event coverage within the reviewed selection, not unbiased whole-corpus scene recall. Overlapping ranges can still refer to one scene. Gold scene checks remain a separate regression guard and are not mixed into this denominator. The internal surviving reading stream is evaluated; this does not certify that every matching reading appears in the displayed scene list.

The columns distinguish wrong people, wrong act, hint/context only, nearby-only matches (within one paragraph), and no match. Nearby-only matches do not inflate strict recall. Missing sources, changed source bytes, unverifiable paragraph identity, invalid events and adjudication exclusions are excluded from the denominator and listed for follow-up. Zero expected events displays “—”, not 100%.

Source bytes must match the stored SHA-256. Paragraph identity must match the inventory's full paragraph checksum or all stored event-range paragraph hashes against the current engine paragraphs. Reports contain identifiers and metadata, never fic prose. Nothing unlisted in a positive-only inventory becomes a false-positive or hint label.

Combined counts are accompanied by separate owner, AI, and partial/assistant tables. They count events equally; they do not reuse the confidence-training weights. Use the owner table for the strongest evidence. Small or selectively reviewed categories are not population estimates.

History rows record engine commit, inventory fingerprint, available fic count and per-act counts. Compare runs with the same inventory and scoring fingerprints, denominator, and corpus coverage; otherwise changes in review coverage can change recall independently of engine behavior. Repeated identical runs do not add another history row. Keep the private history directory between runs to retain the timeline. This history is separate from `docs/METRICS.md`, whose log loss and AUC only evaluate detected readings.

Legacy inventory category names “Anal penetration (penis)” and “Toy insertion” retain their file-compatible names: under current AGENTS.md, contact at the anal entrance counts even without insertion. No source labels are changed by this report.

Private snapshots contain only paragraph hashes and surviving reading metadata. They are reused only when both source bytes and the entire `src/` tree plus dependency lockfile are unchanged; inventory paragraph verification is repeated even on cached runs. Keep this cache private alongside the reports.
