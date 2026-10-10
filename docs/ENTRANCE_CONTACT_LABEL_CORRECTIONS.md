# Entrance-contact label corrections — October 10, 2026

The owner approved these eight corrections after review against the new AGENTS.md tagging conventions. Contact at the anal opening counts as fingering, penile anal sex or a toy act, according to the instrument; insertion is not required. No detection rules or generated confidence models are changed.

| Work | Zero-based paragraph | Claim ID | Corrected label |
|---|---:|---|---|
| like a dog with a bird at your door | 1290 | dogbird-2 | fingering: correct |
| lover, you can’t be wrong | 1488 | lover-you-cant-be-wrong-37 | fingering: correct |
| Heavyweight | 4103 | heavyweight-18 | fingering: correct |
| Heavyweight | 4103 | heavyweight-19 | fingering: correct |
| Foxden Park | 1129 | foxden-park-15 | anal sex: correct |
| Belonging is Longing is Now | 1227 | C0117 | fingering: correct |
| Belonging is Longing is Now | 2439 | C0121 | fingering: correct |
| Whisper in My Ear | 434 | C0655 | fingering: correct |

The five AI labels keep weight 0.9. Updated reviewer confidence is 99% for the finger-contact readings and 96% for Foxden Park, whose contact site depends more on surrounding positioning. The three owner labels remain full weight. Old negative entries are removed, earlier retired positive entries are restored where present, and the historical judgments and reasons are retained in correction metadata. Source fingerprints, paragraph and sentence hashes, participants, act identities and original review timestamps are preserved.

Adult paraphrases: Morgan circles Rowan’s anal rim with a finger before insertion; this is already fingering. Rowan positions his anal opening against Morgan’s penis before further preparation; this already counts as anal sex. Fingertips on a thigh, clothed body rubbing, wrong participants or the wrong instrument remain separate issues.

The earlier deep-dive reports and CURRENT_ANAL_ERROR_REVIEW.md describe their original review snapshots. These eight claims should no longer be counted among their wrong labels. Three other affected old report entries remain outside this correction: the October 3 Hate the Way It Feels So Good label was not in the approved eight, and Icarus Burning’s rim-contact claims still have incorrect ownership or occurrence. No unrelated label is changed.

Retraining the confidence model and reliability table remains a separate task after merging.

## Validation

All eight corrected claims match current main's exact source, paragraph, act, occurrence and participants. The full check passed the unit suite, build, gold evaluation and two right-set shards. Its remaining right-set shard timed out at 900 seconds during concurrent execution; splitting that same shard into two smaller groups with 8 GB heaps passed both groups (18 tests each). One other shard required the check script's automatic larger-heap retry and then passed. The original full-check command exited nonzero because of the timeout; no detection assertion was weakened or removed.

Available-corpus gold totals: verdicts 15/15, scenes right 80, flipped 0, missed 0, false positives 5, point of view 74.3%, text senders 27/27. The private restored corpus had no saved accepted baseline, so the check created a local baseline. No gold file, engine source, generated model or private fic is included in this change.
