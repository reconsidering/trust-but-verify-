# Current anal-error review

[Machine-readable review data](data/current-anal-error-review.json). This data is a report, not an accepted-label import; existing labels remain unchanged.

Engine: `4fd987ef1eafce76d2026a272f7d34cf184ae12e` (latest main when checked).

All 152 anal-category wrong-labelled rows from the fresh current-main confidence evaluation, replayed and contextually reviewed. This is not a full-corpus false-negative search or an exhaustive inventory of unlabelled errors. Oral-category rimming is outside this scope.

Replay current main, match the exact pattern and sentence hash, read the cited paragraph and surrounding action; widen context where instrument, occurrence, or participants were unclear. One primary cause per reading; explanations retain overlapping problems. Counts are reading claims, not distinct sex scenes. No fic text included. No patterns, guards, labels, or generated model files changed.

Reviewed **152 readings in 142 paragraphs across 27 fics**. My review supports **147 errors**, leaves **3 unresolved**, and supports **2 current readings despite their surviving wrong labels**. These are independent reviewer assessments, not new accepted training labels. Owner judgments were preserved.

| Primary cause | Performed anal sex | Other anal readings | Total |
|---|---:|---:|---:|
| Wrong participants, ownership, or roles | 18 | 23 | 41 |
| Wrong instrument: penis, fingers, or toys | 15 | 9 | 24 |
| External contact or movement mistaken for insertion (or the reverse) | 10 | 10 | 20 |
| Nonsexual wording mistaken for a sexual cue | 5 | 12 | 17 |
| Wrong occurrence: current, imagined, remembered, or anticipated | 5 | 12 | 17 |
| Wrong site: mouth, thighs, clothing, or a masturbation sleeve | 7 | 4 | 11 |
| Unsupported or incorrectly typed anal-role hint | 0 | 11 | 11 |
| Solo activity confused with partnered activity | 0 | 6 | 6 |
| Insufficient evidence for the specific act — unresolved | 0 | 3 | 3 |
| Current reading supported despite surviving wrong label | 1 | 1 | 2 |

The other anal readings include fingering, solo acts, preparation, desires, fantasies, body cues, and role hints. The 61 performed-anal readings exclude toy-labelled acts and fingering. A single paragraph can generate several different pattern readings; these counts should not be described as 152 separate scenes.

## Findings to reconcile before changing detection

- `tricks-of-the-trade.html`, paragraph 3773, `pushed-in#855bdcff`: current penile insertion and role direction are supported by surrounding preparation, entry, and continuing thrusts. The old rejection is hash-only; the later owner-confirmed anal range in `tests/scene-review/suspect-two-569919fdfb5e.json` also covers this event.
- `lightning.html`, paragraph 2550, `fuck#51959f8b`: my reading supports the current hypothetical direction, although the owner previously marked it wrong without an attached explanation. This needs owner re-review, not an automatic reversal of the owner label.
- The three unresolved claims are generic renewed sex in `jacks.html` paragraph 1276, unspecified self-preparation in `were-compeer.html` paragraph 975, and an ambiguous object of desire in `belonging.html` paragraph 5558.

## Priority for follow-up

1. Participant/ownership fixes and local instrument selection account for 65 confirmed errors, including 33 of the 60 upheld performed-anal errors. Start with narrow, paraphrased regression tests on these families.
2. Separate actual insertion from external contact and preserve the actual penetration site. These account for 31 additional confirmed errors, including 17 performed-anal errors.
3. Address nonsexual lexical matches and clause-level occurrence scope; preserve real acts that are adjacent to fantasies or memories.
4. Reconcile disputed labels separately, then retrain and evaluate on held-out fics. Do not interpret this audit as a recall measurement.

## Wrong participants, ownership, or roles — 41 readings

Check clause subjects, possessive body-part ownership, receiver versus performer perspective, absent-character fallback, and pronoun/epithet carryover. Relevant functions: elidedSubject, resolvePair, partnerOf, and the ownership refinements in handleMatch.

Patterns involved: `fuck` (6), `push-into` (4), `passive-fucked` (3), `spread-legs` (2), `fill` (2), `lined-up` (2), `riding` (2), `pushed-in` (2), `be-fucked` (2), `came-inside` (2), `grab-ass` (1), `dd2-pulled-out-of-him` (1), `pressure-at-hole` (1), `penis-against` (1), `self-finger` (1), `cum-enters` (1), `adds-finger` (1), `dd-fucks-into-him` (1), `inside` (1), `rock-into` (1), `dd3-slipping-second` (1), `plug-in-ass` (1), `prostate` (1), `bounce-in-lap` (1).

### belonging.html · paragraph 524 · `spread-legs~elided#bac64c05`

- Past label: **wrong**. Current engine: spreading their legs; prep; credited person: Dean Winchester; other person: Castiel; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner spreads his own legs to sit across the viewpoint adult's thighs; the engine assigns the spreading to the viewpoint adult.

### found-in-the-upside-down.html · paragraph 2169 · `fuck#62d62acb`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Billy Hargrove; other person: Steve Harrington; credited role: top.
- My assessment: **Error supported**, 97.0% confidence.
- Reason: The contemplated permission would let the other adult penetrate the viewpoint character; the engine credits the viewpoint character as penetrator.

### foxden-park.html · paragraph 701 · `grab-ass~elided#32a49985`

- Past label: **wrong**. Current engine: grabbing an ass; touch; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner's hands grab the viewpoint adult's buttocks; the engine attributes the grab to the viewpoint adult.

### foxden-park.html · paragraph 1155 · `fuck~elided#59a5f04f`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Catherine Fox-Mountchristen-Windsor; other person: Henry Fox-Mountchristen-Windsor.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named adult partner performs the thrusts; the engine credits an absent relative.

### foxden-park.html · paragraph 1157 · `fill#f0bb2108`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penetrator ejaculates inside the receiver, but the engine assigns penetration to the receiver.

### foxden-park.html · paragraph 1161 · `dd2-pulled-out-of-him#db598754`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult penetrator withdraws from the receiver; the engine reverses their roles.

### foxden-park.html · paragraph 1334 · `push-into~elided#6263de3f`

- Past label: **wrong**. Current engine: fingering; act; credited person: Percy "Pez" Okonjo; other person: Alex Claremont-Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named adult inserts two fingers into his partner; the engine substitutes an absent friend and reverses the recipient.

### hate.html · paragraph 1516 · `lined-up#8eb959a0`

- Past label: **wrong**. Current engine: lining up; prep; credited person: Eddie Munson; other person: Steve Harrington; credited role: top.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The receiver positions himself over his partner's penis; the engine attributes the lining-up action to the penetrator instead.

### heavyweight.html · paragraph 6433 · `fuck#f1f5b680`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Castiel; other person: Sam Winchester; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: An adult silently wants to have sex with his partner after a visitor leaves; the engine attaches the desire to the partner and visitor instead.

### icarus-burning.html · paragraph 3242 · `pressure-at-hole~elided#752eeb59`

- Past label: **wrong**. Current engine: teasing a hole; touch; credited person: Jay; other person: Samiel Tremark; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner performs the external anal touch; the engine credits the receiver as the one teasing the other's anus.

### icarus-burning.html · paragraph 3260 · `penis-against#5cc8ed69`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Jay; other person: Samiel Tremark.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult feeling contact at his anus is the receiver; the other adult moves his hips and enters. The engine reverses these roles.

### icarus-burning.html · paragraph 8038 · `passive-fucked#582083e8`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Samiel Tremark; other person: Jason Lane; credited role: top.
- My assessment: **Error supported**, 97.0% confidence.
- Reason: The comparison depicts the moving partner as if he were receptive, while the actual self-fingering belongs to the viewpoint adult. Crediting the partner with a top-directed hint misreads the comparison.

### icarus-burning.html · paragraph 8038 · `self-finger~elided#86c0a1ef`

- Past label: **wrong**. Current engine: fingering himself; solo; credited person: Samiel Tremark; other person: Jay; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Self-fingering is explicitly performed by the viewpoint adult; the engine assigns it to the partner moving beneath him.

### jacks.html · paragraph 1696 · `passive-fucked~elided#dc29e`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Dracula; other person: Jack Seward; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The viewpoint adult asks to be penetrated; the engine assigns the bottom-directed desire to his penetrating partner.

### jacks.html · paragraph 2788 · `push-into#2f8aa1af`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dracula; other person: Frank Renfield.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named receiver in the same paragraph is replaced with an unrelated character.

### jacks.html · paragraph 11598 · `riding#15398360`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Jack Seward; other person: Dracula.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penetrator continues moving through the receiver's orgasm; the verb ride is interpreted as the penetrator receiving.

### kissed.html · paragraph 3021 · `pushed-in#125f2ff0`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dustin Henderson; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult viewpoint character recalls sex with his adult partner; an unrelated character is selected as penetrator.

### knock-me-up.html · paragraph 115 · `cum-enters#85809687`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named partner ejaculates while penetrating the viewpoint adult; the engine reverses who penetrates and receives.

### lover-you-cant-be-wrong.html · paragraph 222 · `fuck#6dcdb429`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Steve Harrington; other person: Tommy Hagan; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: A third person's hostile comments concern imagined desires of unspecified men, not that third person's own desire to penetrate the viewpoint adult.

### lover-you-cant-be-wrong.html · paragraph 1126 · `be-fucked#92ae002`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Eddie Munson; other person: Steve Harrington; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The viewpoint adult wants to be penetrated; the engine credits the partner with that bottom-directed desire.

### lover-you-cant-be-wrong.html · paragraph 1289 · `passive-fucked~elided#ff198d88`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Steve Harrington; other person: Eddie Munson; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The viewpoint adult hopes for somewhere comfortable to receive penetration; the engine calls this a top-directed wish.

### lover-you-cant-be-wrong.html · paragraph 1396 · `pushed-in#a1cfaf38`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner inserts a lubricated finger into the viewpoint adult; the engine reverses performer and receiver.

### lover-you-cant-be-wrong.html · paragraph 1418 · `adds-finger#35aac9ae`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner reinserts one then two fingers into the viewpoint adult; the engine reverses these roles.

### lover-you-cant-be-wrong.html · paragraph 1449 · `be-fucked~elided#7b5c82d5`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receptive viewpoint adult thinks of himself as needing to be penetrated; the engine makes him the penetrator.

### lover-you-cant-be-wrong.html · paragraph 1490 · `riding~elided#f4db1441`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Eddie Munson; other person: Tommy Hagan.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named viewpoint adult moves onto his partner's penis; the engine selects an absent former friend as receiver.

### lover-you-cant-be-wrong.html · paragraph 1496 · `fill~elided#76cd0abe`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The viewpoint adult feels his partner's inserted penis filling him; the engine reverses penetration roles.

### lover-you-cant-be-wrong.html · paragraph 1508 · `dd-fucks-into-him#48856870`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Tommy Hagan; other person: Steve Harrington.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A second penetration pattern makes the same absent-friend substitution on this sentence.

### lover-you-cant-be-wrong.html · paragraph 1508 · `push-into#48856870`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Tommy Hagan; other person: Steve Harrington.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named partner resumes thrusting; the engine substitutes an absent former friend.

### lover-you-cant-be-wrong.html · paragraph 1510 · `inside~elided#6f9305c2`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Steve Harrington; other person: Eddie Munson; credited role: top.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The receptive adult imagines unprotected ejaculation from the penetrator; the engine credits the receptive adult with the penetrating role.

### more-views.html · paragraph 886 · `spread-legs~elided#13e26340`

- Past label: **wrong**. Current engine: spreading their legs; prep; credited person: Sam Winchester; other person: Dean Winchester; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner spreads the receiver's legs; the engine credits a third character with the receptive preparation.

### needing-the-knot.html · paragraph 19 · `fuck~elided#1d5d327c`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Dean Winchester; other person: Castiel; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult desires to be knotted by the visiting partner; the engine assigns him the top-directed desire.

### panuelo-melody.html · paragraph 1391 · `fuck~elided#dd9758fc`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult moves his empty anus backward wanting to receive penetration, not to penetrate his partner.

### panuelo-melody.html · paragraph 1732 · `rock-into#e4270918`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner's arms hold the receiver while the partner drives his penis deeper; the engine reverses their roles.

### please.html · paragraph 3849 · `push-into#2b157886`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Will Byers; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The named adult partner is penetrating the adult viewpoint character; an unrelated character is selected as penetrator and the actual penetrator becomes the receiver.

### prince-prisoner-puppy.html · paragraph 507 · `came-inside#ff0b155e`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Telemachus; other person: Antinous.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The king is the penetrating adult, but the smaller-man wording makes the engine credit the receptive adult with penetration.

### tricks-of-the-trade.html · paragraph 1696 · `dd3-slipping-second#b3c14af0`

- Past label: **wrong**. Current engine: fingering; act; credited person: Dean Winchester; other person: Castiel.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The main couple watches a different adult Dom finger his own adult partner; their names are incorrectly substituted for the performers.

### tricks-of-the-trade.html · paragraph 1774 · `lined-up#785146cf`

- Past label: **wrong**. Current engine: lining up; prep; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult who prepared himself positions himself to receive his partner's penis; the engine makes his lining-up action top-directed.

### tricks-of-the-trade.html · paragraph 2135 · `plug-in-ass#8c3a1aed`

- Past label: **wrong**. Current engine: wearing a plug; prep; credited person: Castiel; other person: Dean Winchester; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The viewpoint adult remembers the plug in his own anus; the engine assigns plug wearing to the partner whose speech prompted the thought.

### were-compeer.html · paragraph 248 · `came-inside~elided#b20bdf27`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Vernon Boyd; other person: Derek Hale.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The actual pair is already having anal sex; an unrelated assistant is selected as penetrator and the actual penetrator as receiver. Ejaculation is outside, not inside.

### whisper.html · paragraph 452 · `prostate~elided#8672e3c3`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver asks for more stimulation as his partner's thrusts reach his prostate; the engine turns that into a top-directed desire for the receiver.

### wretched-rhetoric.html · paragraph 1034 · `bounce-in-lap#9874619d`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Anakin Skywalker; other person: Obi-Wan Kenobi.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult riding is the receiver and his partner is the penetrator; the engine reverses the two because the sentence starts with the partner's hands.

## Wrong instrument: penis, fingers, or toys — 24 readings

Make the explicit local instrument win over nearby unrelated fingers or older toy context. Preserve a toy across vague continuations until a demonstrated instrument change; do not invent a penis from prostate contact. Check continuationInstrument and the refinement near index.ts:2310.

Patterns involved: `push-into` (5), `pushed-in` (3), `stretched-open` (3), `prostate` (3), `rock-into` (2), `passive-fucked` (1), `riding` (1), `fill` (1), `takes-it-inside` (1), `fingers-inside` (1), `fuck` (1), `hole-around-name` (1), `clenched-around` (1).

### belonging.html · paragraph 691 · `passive-fucked~elided#e88b92f5`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A plug is held at the entrance and the receiver anticipates being stretched for it; the engine invents penile anal sex.

### belonging.html · paragraph 1356 · `pushed-in~elided#76b11636`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult is trying to insert an explicitly introduced plug; the engine treats it as partnered penile penetration, before successful insertion occurs.

### belonging.html · paragraph 1460 · `push-into#d7bf8d42`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner drives an explicitly identified toy against the prostate, not his penis.

### belonging.html · paragraph 2165 · `push-into~elided#e13610cb`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Two fingers push semen farther into the receiver; vague fucking wording causes a false penile-penetration reading.

### belonging.html · paragraph 3446 · `stretched-open~elided#db234e3`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver is stretched by an explicitly named penis; the engine calls it fingering.

### belonging.html · paragraph 3867 · `stretched-open#23e1f1f5`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Ongoing penile thrusts and prostate contact are mistaken for finger insertion.

### belonging.html · paragraph 4708 · `riding~elided#57c63cb5`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver pushes back onto fingers the partner is keeping still, not onto a penis.

### belonging.html · paragraph 5047 · `fill~elided#c9588eb8`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A mechanical arm inserts a dildo; the engine calls it penile penetration by the partner.

### belonging.html · paragraph 5213 · `rock-into#4b9d076d`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penetrating cock is a machine-mounted dildo while the partner is elsewhere giving instructions.

### belonging.html · paragraph 5235 · `takes-it-inside~elided#d8d15f76`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver moves onto an explicitly fake, machine-mounted cock; it is not the partner's penis.

### belonging.html · paragraph 5602 · `push-into#8f6e3b8d`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner inserts an explicitly introduced chilled knot-shaped toy, not his penis.

### icarus-burning.html · paragraph 3263 · `stretched-open~elided#f6ac4163`

- Past label: **wrong**. Current engine: fingering; act; credited person: Samiel Tremark; other person: Jay.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The scene is continuing penile penetration; raising a leg for access does not establish inserted fingers.

### lover-you-cant-be-wrong.html · paragraph 848 · `push-into~elided#d98c1a33`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Steve Harrington; other person: Eddie Munson; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The explicitly imagined entry is with one finger, not penile penetration.

### lover-you-cant-be-wrong.html · paragraph 851 · `pushed-in#881d4aa9`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult pushes his own finger deeper during solo exploration, not his penis into his partner.

### lover-you-cant-be-wrong.html · paragraph 1506 · `fingers-inside#45ab5ae3`

- Past label: **wrong**. Current engine: fingering; act; credited person: Eddie Munson; other person: Steve Harrington.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner withdraws his thumb and resumes forceful penile thrusts; the engine calls the new action finger insertion.

### lover-you-cant-be-wrong.html · paragraph 1506 · `push-into~elided#45ab5ae3`

- Past label: **wrong**. Current engine: fingering; wanted; credited person: Eddie Munson; other person: Steve Harrington; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Withdrawal of a thumb is followed by actual penile thrusts; the engine makes this desired fingering, mixing both instrument and occurrence.

### needing-the-knot.html · paragraph 606 · `rock-into#19824871`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penetrating instrument is a finger while the performer gives oral stimulation; vague pressing is misclassified as penile anal sex.

### needing-the-knot.html · paragraph 1133 · `fuck#e858e9e4`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Explicit penile penetration continues; mention of fingers being licked causes the engine to call it fingering instead.

### needing-the-knot.html · paragraph 1225 · `hole-around-name#8a328328`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dean Winchester; other person: Castiel.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver clenches around his partner's inserted fingers, not his penis.

### panuelo-melody.html · paragraph 1572 · `clenched-around#caf612f6`

- Past label: **wrong**. Current engine: fingering; act; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver clenches around the inserted penis; nearby fingers squeeze an external body part and are wrongly carried over as the instrument. The engine also reverses performer and receiver.

### prince-prisoner-puppy.html · paragraph 70 · `prostate#1ddef398`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Antinous; other person: Telemachus.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The internal massage continues with one finger explicitly left inside earlier, not with a penis.

### tricks-of-the-trade.html · paragraph 415 · `prostate#9324cc2e`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Prostate contact is explicitly produced by curled fingers, not a penis.

### tricks-of-the-trade.html · paragraph 456 · `pushed-in#a9ab8ca1`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The lubricated penis enters after toy and finger preparation; the engine incorrectly carries the previous fingers forward.

### were-compeer.html · paragraph 212 · `prostate~elided#9d31dd8a`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Derek Hale; other person: Stiles Stilinski.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The sweet spot is reached by inserted fingers during a handjob, not penile penetration.

## External contact or movement mistaken for insertion (or the reverse) — 20 readings

Require evidence of crossing the opening rather than merely touching, rubbing, lifting, pressing, or repositioning; also avoid demoting ongoing explicit penetration to external contact. Check fingers-to-hole, adds-finger, riding/sank-down, and related guards.

Patterns involved: `adds-finger` (3), `push-into` (2), `fingers-to-hole` (1), `finger-noun-to-hole` (1), `dd-grinds-onto-cock` (1), `penis-fills` (1), `pushed-in` (1), `dd-finger-slips-into` (1), `fingers-inside` (1), `stretched-open` (1), `thrusts-filling` (1), `sank-down` (1), `fingers-into` (1), `hole-around` (1), `passive-fucked` (1), `fuck` (1), `thrusts-falter` (1).

### belonging.html · paragraph 1227 · `fingers-to-hole#b249daf8`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Fingers press at the rim during orgasm; no finger insertion is described.

### belonging.html · paragraph 2439 · `adds-finger#264f1fa0`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A finger passes between the buttocks and rubs a dry rim, then withdraws externally; this is not finger insertion.

### dogbird.html · paragraph 1290 · `finger-noun-to-hole#60e2c4bd`

- Past label: **wrong**. Current engine: fingering; act; credited person: Evan "Buck" Buckley; other person: Eddie Diaz.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Initial fingertip contact circles the rim; the first insertion happens in the following paragraph.

### foxden-park.html · paragraph 1129 · `dd-grinds-onto-cock#af6573df`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Grinding brings the penis up against the desired opening; insertion occurs later, not in this sentence.

### hate.html · paragraph 1518 · `penis-fills#dc1a78ed`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Eddie Munson; other person: Steve Harrington.
- My assessment: **Error supported**, 96.0% confidence.
- Reason: The tip presses at the rim but the receiver does not yet give way; full insertion follows later. Treat this as attempted entry rather than completed penetration.

### heavyweight.html · paragraph 2192 · `pushed-in#731a8cd`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adults press their bare chests together while kissing; this is not anal insertion.

### heavyweight.html · paragraph 4103 · `dd-finger-slips-into#f29df6ee`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: A second pattern treats the same external rim contact as penetrative fingering, although insertion has not begun.

### heavyweight.html · paragraph 4103 · `fingers-inside#f29df6ee`

- Past label: **wrong**. Current engine: fingering; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The fingers circle the anal rim; the next paragraph explicitly postpones insertion.

### icarus-burning.html · paragraph 3242 · `adds-finger~elided#752eeb59`

- Past label: **wrong**. Current engine: fingering; hypothetical; credited person: Samiel Tremark; other person: Jay; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: A finger travels externally along the cleft and rubs the rim; it is not inserted, even hypothetically.

### icarus-burning.html · paragraph 8024 · `push-into~elided#23733bb4`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Samiel Tremark; other person: Jason Lane.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner pushes upward while still clothed, before undressing and insertion several paragraphs later.

### icarus-burning.html · paragraph 8063 · `stretched-open~elided#1edf3764`

- Past label: **wrong**. Current engine: fingering; act; credited person: Samiel Tremark; other person: Jay.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: A hand lifts a thigh during repositioning; no new finger insertion is described.

### icarus-burning.html · paragraph 8063 · `thrusts-filling#1edf3764`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Samiel Tremark; other person: Jay.
- My assessment: **Error supported**, 98.0% confidence.
- Reason: The adults briefly separate and reposition; lifting a thigh to move closer does not itself describe a new insertion.

### kissed.html · paragraph 4318 · `sank-down#3d221efc`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Eddie Munson; other person: Steve Harrington.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The penetrator lowers himself into a post-orgasm embrace while remaining inside; the receiver is not riding him.

### lover-you-cant-be-wrong.html · paragraph 1488 · `fingers-into#bf21f815`

- Past label: **wrong**. Current engine: fingering; act; credited person: Eddie Munson; other person: Steve Harrington.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The thumb initially presses against the stretched rim beside an inserted penis; thumb insertion happens several paragraphs later.

### needing-the-knot.html · paragraph 1106 · `hole-around#39258cd3`

- Past label: **wrong**. Current engine: penis against buttocks; touch; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The receiver is already riding the inserted penis, confirmed by the immediately following thrust; the engine demotes this to external buttock contact.

### panuelo-melody.html · paragraph 1391 · `passive-fucked~elided#dd9758fc`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult moves his buttocks against empty space and wants to be filled; no partner is penetrating him.

### the-lathe.html · paragraph 1769 · `push-into#361ebba7`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adults press together while kissing on a couch; no anal insertion is described.

### were-compeer.html · paragraph 694 · `fuck~elided#b7ccd1ab`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Vernon Boyd; other person: Derek Hale.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adults rub together while clothed, explicitly without penetration; the engine also assigns the scene to an unrelated assistant.

### were-compeer.html · paragraph 696 · `thrusts-falter#172a376e`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Derek Hale; other person: Stiles Stilinski.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Erratic thrusts accompany orgasm inside clothing during body rubbing, not anal penetration.

### whisper.html · paragraph 434 · `adds-finger#15a77f8c`

- Past label: **wrong**. Current engine: fingering; act; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A fingertip lightly massages dry skin at the rim; there is no finger insertion.

## Nonsexual wording mistaken for a sexual cue — 17 readings

Guard ordinary clothing/container entry, collisions, boxing/fighting, mental/supernatural metaphors, academic rankings, and returning to reality. Broad push-into, pushed-in, thrust-back and stretched-open families recur.

Patterns involved: `thrust-back` (5), `push-into` (5), `pushed-in` (2), `dd2-finger-shoved-into` (1), `fingers-inside` (1), `self-finger` (1), `penis-into` (1), `topped` (1).

### covered.html · paragraph 879 · `thrust-back#342fcdbe`

- Past label: **wrong**. Current engine: pushing back; touch; credited person: Asami Sato; other person: Korra; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Returning abruptly to reality is a figure of speech, not a receptive sexual movement.

### hate.html · paragraph 735 · `dd2-finger-shoved-into#ae9aefb9`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Fingers go under a waistband to remove underwear, not into an anus.

### heavyweight.html · paragraph 9 · `thrust-back#25733ba9`

- Past label: **wrong**. Current engine: pushing back; touch; credited person: Dean Winchester; other person: Mick Davies; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Pushing back is resistance during a boxing exchange, not a receptive sexual movement.

### heavyweight.html · paragraph 1332 · `push-into~elided#33f79b79`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Strangers shove the adult protagonist on the street; no hypothetical sexual act is described.

### heavyweight.html · paragraph 1665 · `push-into#970f5f07`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Gabriel; other person: Castiel.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A teammate collides with another adult in a celebratory embrace after a boxing match; no penetration occurs.

### heavyweight.html · paragraph 2017 · `fingers-inside#50a942b4`

- Past label: **wrong**. Current engine: fingering; hypothetical; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Knuckles driving into someone refer to a imagined punch in a boxing match, not fingering.

### heavyweight.html · paragraph 4024 · `push-into#cad83edc`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dean Winchester; other person: Castiel.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The object being entered is a boxing glove, not another person's body.

### heavyweight.html · paragraph 4524 · `pushed-in#2dbee31d`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Dean Winchester; other person: Castiel; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Hope breaking inside someone is an emotional metaphor, not desired penetration.

### heavyweight.html · paragraph 5595 · `thrust-back~elided#29e51a7a`

- Past label: **wrong**. Current engine: pushing back; touch; credited person: Dean Winchester; other person: Castiel; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The movement is a shoulder shove during a boxing clinch, not an anal role cue.

### prince-prisoner-puppy.html · paragraph 502 · `thrust-back~elided#b9c2ad9b`

- Past label: **wrong**. Current engine: pushing back; touch; credited person: Telemachus; other person: Antinous; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult pushes at the other adult's shoulders to resist him; this is not an anal pushing-back cue.

### the-lathe.html · paragraph 1291 · `self-finger~elided#c3aefe91`

- Past label: **wrong**. Current engine: fingering himself; solo; credited person: Steve Harrington; other person: Eddie Munson; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Opening oneself to supernatural possession is figurative, not solo fingering.

### the-lathe.html · paragraph 1893 · `push-into#1546b09a`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Eddie Munson; other person: Steve Harrington.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A physical assault and defensive shove are mistaken for anal penetration; the engine also substitutes the romantic partner for the attacker.

### the-lathe.html · paragraph 1893 · `thrust-back#4a6628fd`

- Past label: **wrong**. Current engine: pushing back; touch; credited person: Eddie Munson; other person: Steve Harrington; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The backward shove occurs in a fight, not as an anal receptive movement.

### were-compeer.html · paragraph 87 · `penis-into#14bf2a41`

- Past label: **wrong**. Current engine: anal sex; fantasy; credited person: Vernon Boyd; other person: Stiles Stilinski; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A penis and testicles imagined within a chastity device are mistaken for anal penetration involving the assistant.

### wicked-thing.html · paragraph 3121 · `push-into~elided#42b534fb`

- Past label: **wrong**. Current engine: fingering; act; credited person: Obi-Wan Kenobi; other person: Anakin Skywalker.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Metaphorical fingers entering the adult's mind describe a supernatural connection, not anal fingering, even though actual sex surrounds it.

### wicked-thing.html · paragraph 3673 · `pushed-in~elided#b2682c96`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Anakin Skywalker; other person: Obi-Wan Kenobi.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A void inside the adult's mind and his failed escape are mistaken for physical penetration.

### wretched-rhetoric.html · paragraph 1224 · `topped~elided#a66f7f70`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Anakin Skywalker; other person: Obi-Wan Kenobi.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: An academic ranking using the word top is mistaken for topping a partner.

## Wrong occurrence: current, imagined, remembered, or anticipated — 17 readings

Apply future, conditional, memory, and fantasy scope to the relevant clause or referenced event, without swallowing adjacent real action. Distinguish actual scene narration from recalled summaries and recordings.

Patterns involved: `push-into` (5), `fuck` (2), `passive-fucked` (2), `thrusts-falter` (1), `penis-inside` (1), `bottomed-out` (1), `dd2-pulled-out-of-him` (1), `toy-removed` (1), `bent-over-furniture` (1), `riding` (1), `fill` (1).

### belonging.html · paragraph 3534 · `thrusts-falter#d0f6575b`

- Past label: **wrong**. Current engine: anal sex; fantasy; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penetrator is physically thrusting while discussing a fantasy; the fantasy wrongly swallows the real action.

### belonging.html · paragraph 4017 · `push-into~elided#ce682f98`

- Past label: **wrong**. Current engine: anal sex; fantasy; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A fantastical scenario is discussed in speech, but the adult punctuates it with real thrusting and knot insertion; the latter is wrongly demoted.

### belonging.html · paragraph 5522 · `penis-inside#facd657`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult tries to place the partner's penis inside but is stopped; successful insertion is counted before it happens.

### bluebells.html · paragraph 841 · `push-into~elided#69034915`

- Past label: **wrong**. Current engine: anal sex; fantasy; credited person: David Shepherd; other person: Brother Diarmuid; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult actually penetrates his husband; mention of a long-held dream wrongly makes the present act fantasy.

### hate.html · paragraph 1423 · `push-into~elided#a5a36664`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Eddie Munson; other person: Steve Harrington.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult imagines pushing inside while actually rubbing externally; the text explicitly says insertion has not happened.

### hate.html · paragraph 1705 · `push-into#f62c18aa`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Eddie Munson; other person: Steve Harrington; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Pounding occurs in the present scene; a habitual-arousal comparison in the preceding paragraph wrongly demotes it to hypothetical.

### jacks.html · paragraph 1393 · `fuck#36b99705`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Jack Seward; other person: Dracula; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The adult reflects on sex already permitted and experienced; the past-perfect construction is misread as a hypothetical.

### jacks.html · paragraph 2219 · `fuck#a8307d0f`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dracula; other person: Jack Seward.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A description of the previous night's encounter and its recording is counted as a new current anal act.

### jacks.html · paragraph 3750 · `push-into#8909459`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Jack Seward; other person: Dracula; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner actually enters and continues anal penetration; the engine demotes this completed action to hypothetical.

### jacks.html · paragraph 4135 · `bottomed-out~elided#4debe477`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Jack Seward; other person: Dracula; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner is actively penetrating and reaches full depth; an earlier possibility of later soreness wrongly makes this hypothetical.

### jacks.html · paragraph 12006 · `passive-fucked#ae35a035`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dracula; other person: Jack Seward.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult considers waking his sleeping partner with sex but explicitly lets him sleep; imagined penetration is counted as performed.

### panuelo-melody.html · paragraph 1786 · `dd2-pulled-out-of-him~elided#f3872f8b`

- Past label: **wrong**. Current engine: anal sex; fantasy; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner actually withdraws after orgasm; a wish about retaining semen nearby wrongly demotes the withdrawal to fantasy.

### were-compeer.html · paragraph 575 · `toy-removed#196e3e17`

- Past label: **wrong**. Current engine: taking a toy out; touch; credited person: Derek Hale; other person: Stiles Stilinski; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The plug remains inside; a predicted gush when it is removed is counted as present toy removal.

### were-compeer.html · paragraph 613 · `bent-over-furniture#60dbd648`

- Past label: **wrong**. Current engine: bending over; prep; credited person: Stiles Stilinski; other person: Derek Hale; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult recalls having been bent over earlier; this is not present preparation for another scene.

### were-compeer.html · paragraph 1009 · `riding~elided#4828d05a`

- Past label: **wrong**. Current engine: anal sex (riding); wanted; credited person: Stiles Stilinski; other person: Derek Hale; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult is actively riding his partner; desire for later ejaculation elsewhere in the paragraph wrongly demotes the riding to wanted.

### were-compeer.html · paragraph 1010 · `fill#2add321c`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Derek Hale; other person: Stiles Stilinski.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Penetration is ongoing, but the specific filling and ejaculation described here are desired future outcomes, not completed ejaculation.

### wretched-rhetoric.html · paragraph 912 · `passive-fucked#14fbd5b`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Anakin Skywalker; other person: Obi-Wan Kenobi; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The passage describes ongoing insertion and receptive fullness, not merely a hypothetical anal act.

## Wrong site: mouth, thighs, clothing, or a masturbation sleeve — 11 readings

Require the actual destination to be anal; preserve an established oral/thigh/device context across vague motion and withdrawal. Explicit mouth evidence must override generic sinking, pushing, and pulling-out patterns.

Patterns involved: `pushed-in` (3), `push-into` (2), `stretched-open` (1), `dd2-pulled-out-of-him` (1), `body-hole-ache` (1), `riding` (1), `sank-down` (1), `hand-in-pants-poss` (1).

### belonging.html · paragraph 1054 · `push-into#b423fe09`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penis moves between the receiver's thighs and past his testicles; this is thigh sex, not anal insertion.

### belonging.html · paragraph 2462 · `pushed-in#8e5aacf7`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult inserts his penis into a masturbation sleeve, not his partner's anus; the engine also reverses ownership.

### belonging.html · paragraph 2863 · `pushed-in~elided#6462d66e`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The penile movement is through the partner's open lips, explicitly followed by deeper mouth penetration.

### hate.html · paragraph 1507 · `stretched-open#2210888f`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Working someone up describes stroking both penises together, not anal fingering.

### heavyweight.html · paragraph 4086 · `pushed-in#61768a8d`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The surrounding action explicitly continues oral penetration; it is incorrectly also emitted as anal sex.

### jacks.html · paragraph 4108 · `dd2-pulled-out-of-him#129bedc7`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Dracula; other person: Jack Seward.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The withdrawal follows explicit throat penetration and gagging; the engine invents an anal withdrawal.

### jacks.html · paragraph 9442 · `body-hole-ache#bb627480`

- Past label: **wrong**. Current engine: aching hole; body; credited person: Jack Seward; other person: Dracula; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The aching body part is the nipples; anal clenching elsewhere in the sentence does not establish anal soreness.

### panuelo-melody.html · paragraph 1377 · `push-into~elided#ab1d26d`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Alex Claremont-Diaz; other person: Beatrice Fox-Mountchristen-Windsor; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The explicit act is current oral penetration; the engine emits hypothetical anal penetration involving an absent relative.

### panuelo-melody.html · paragraph 1379 · `riding#8c83589e`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A second riding pattern on the same oral-sex paragraph invents anal insertion.

### panuelo-melody.html · paragraph 1379 · `sank-down#e0277c9e`

- Past label: **wrong**. Current engine: anal sex (riding); act; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Lowering onto a penis occurs with the mouth, explicitly described as oral penetration, not anal riding.

### steady-eddie.html · paragraph 2023 · `hand-in-pants-poss#aa4b9921`

- Past label: **wrong**. Current engine: hand down the back of the pants; touch; credited person: Eddie Munson; other person: Steve Harrington; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The hand enters the front of the underwear to stroke the penis; it is not a hand down the back or anal-directed touch.

## Unsupported or incorrectly typed anal-role hint — 11 readings

Do not equate clenching with aching, resistance with receptive thrusting, self-looking with partner-ogling, spanking with grabbing, or looking at an insertion site with an anal-bottom preference.

Patterns involved: `body-hole-ache` (3), `ogle-crotch` (2), `grab-ass` (1), `arch-back` (1), `stated-bottom-pref` (1), `thrust-back` (1), `body-sore-ass` (1), `ogle-crotch-where` (1).

### a-la-carte.html · paragraph 1964 · `ogle-crotch~elided#116db755`

- Past label: **wrong**. Current engine: checking out a crotch; ogling; credited person: Anakin Skywalker; other person: Obi-Wan Kenobi; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult threatens hypothetical outsiders who might look at his partner; he is not himself checking out the partner's penis.

### belonging.html · paragraph 2810 · `body-hole-ache#915b5f70`

- Past label: **wrong**. Current engine: aching hole; body; credited person: Dean Winchester; other person: Castiel; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The anus clenches during intense stimulation, but this paragraph does not describe an aching hole.

### belonging.html · paragraph 3735 · `grab-ass#5e87c247`

- Past label: **wrong**. Current engine: grabbing an ass; touch; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The described action is spanking while prostate stimulation continues, not grabbing the buttocks.

### belonging.html · paragraph 5428 · `body-hole-ache#98a64b3c`

- Past label: **wrong**. Current engine: aching hole; body; credited person: Dean Winchester; other person: Castiel; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The gaping anus clenches to retain semen; the text does not describe aching or pain.

### jacks.html · paragraph 2067 · `arch-back#1adacf82`

- Past label: **wrong**. Current engine: arching their back; touch; credited person: Jack Seward; other person: Dracula; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The adult arches while receiving oral stimulation, not as evidence of an anal receptive movement.

### kissed.html · paragraph 2292 · `stated-bottom-pref~elided#dc79bcd4`

- Past label: **wrong**. Current engine: saying they like to bottom; stated; credited person: Eddie Munson; other person: Steve Harrington; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A discussion of liking someone and feeling unwanted is misread as a preference for anal bottoming.

### needing-the-knot.html · paragraph 439 · `thrust-back#c03e4250`

- Past label: **wrong**. Current engine: pushing back; touch; credited person: Castiel; other person: Dean Winchester; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Pushing back describes resisting an internal urge to dominate and letting the other adult lead, not moving the anus backward.

### panuelo-melody.html · paragraph 1740 · `body-hole-ache#3a9a2f7f`

- Past label: **wrong**. Current engine: aching hole; body; credited person: Henry Fox-Mountchristen-Windsor; other person: Alex Claremont-Diaz; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The receiver's anus clenches during orgasm; clenching does not itself establish an aching hole.

### prince-prisoner-puppy.html · paragraph 667 · `body-sore-ass#1b168a0c`

- Past label: **wrong**. Current engine: loose or sore after sex; body; credited person: Telemachus; other person: Antinous; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The passage says pain has gone while the adult adapts to ongoing penetration; it does not describe residual anal soreness after sex.

### were-compeer.html · paragraph 66 · `ogle-crotch~elided#511dda45`

- Past label: **wrong**. Current engine: checking out a crotch; ogling; credited person: Stiles Stilinski; other person: Derek Hale; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The viewpoint adult looks at his own hairless penis; this is not ogling the partner as an anal bottom cue.

### whisper.html · paragraph 449 · `ogle-crotch-where~elided#1efc7fe6`

- Past label: **wrong**. Current engine: staring at a bulge; ogling; credited person: Alex Claremont-Diaz; other person: Henry Fox-Mountchristen-Windsor; credited role: bottom.
- My assessment: **Error supported**, 99.0% confidence.
- Reason: The penetrator looks at the insertion site during actual anal sex; this is not a bulge-ogling cue making him the bottom.

## Solo activity confused with partnered activity — 6 readings

Resolve who owns both the moving hand/fingers and the receiving body. Lubricating one's own fingers is not self-insertion; an imagined absent partner must not become the recipient of actual solo activity.

Patterns involved: `pushed-in` (2), `self-toy-it` (1), `self-own-fingers` (1), `pressure-at-hole` (1), `dd2-finger-shoved-into` (1).

### belonging.html · paragraph 1228 · `self-toy-it~elided#5e637fee`

- Past label: **wrong**. Current engine: using a toy on himself; solo; credited person: Castiel; other person: Dean Winchester; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The partner removes a plug from the receiver's mouth and puts it in the receiver's anus; the engine calls this the partner using it on himself.

### foxden-park.html · paragraph 1331 · `self-own-fingers#420faba0`

- Past label: **wrong**. Current engine: fingering himself; solo; credited person: Percy "Pez" Okonjo; other person: Henry Fox-Mountchristen-Windsor; credited role: bottom.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Using oil on one's own fingers precedes fingering the partner; it is neither solo insertion nor an act by the absent friend.

### lover-you-cant-be-wrong.html · paragraph 846 · `pressure-at-hole#4ac67bb8`

- Past label: **wrong**. Current engine: teasing a hole; touch; credited person: Steve Harrington; other person: Eddie Munson; credited role: top.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The actual external rim touch is self-touch while a partnered scenario is imagined; the engine makes it a touch given to the absent partner.

### lover-you-cant-be-wrong.html · paragraph 855 · `pushed-in~elided#7540a8c4`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: The adult inserts and moves his own finger; the absent imagined partner is not receiving actual fingering.

### lover-you-cant-be-wrong.html · paragraph 856 · `dd2-finger-shoved-into~elided#8dbd3693`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: Adding a second finger occurs during self-fingering, not partnered fingering.

### lover-you-cant-be-wrong.html · paragraph 856 · `pushed-in~elided#8dbd3693`

- Past label: **wrong**. Current engine: fingering; act; credited person: Steve Harrington; other person: Eddie Munson.
- My assessment: **Error supported**, 99.9% confidence.
- Reason: A second pattern on the same self-fingering paragraph invents partnered insertion.

## Insufficient evidence for the specific act — unresolved — 3 readings

Owner re-review needed; do not force a precise act from generic sex or preparation wording.

Patterns involved: `push-into` (1), `made-love-to` (1), `self-finger` (1).

### belonging.html · paragraph 5558 · `push-into~elided#21b804db`

- Past label: **wrong**. Current engine: anal sex; wanted; credited person: Castiel; other person: Dean Winchester; credited role: top.
- My assessment: **Unresolved**, 78.0% confidence.
- Reason: The adult wants to retain something tasted while actual anal penetration continues. The object of the wish may be saliva or another bodily fluid; the sentence does not securely establish a new top-directed anal-sex desire.

### jacks.html · paragraph 1276 · `made-love-to~elided#cc2cf4de`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Jack Seward; other person: Dracula; credited role: bottom.
- My assessment: **Unresolved**, 75.0% confidence.
- Reason: Renewed sex is contemplated, so hypothetical status is defensible, but the phrase alone does not establish anal rather than another sexual activity.

### were-compeer.html · paragraph 975 · `self-finger~elided#69112a1f`

- Past label: **wrong**. Current engine: fingering himself; solo; credited person: Stiles Stilinski; other person: Derek Hale; credited role: bottom.
- My assessment: **Unresolved**, 80.0% confidence.
- Reason: The adult prepares himself offscreen, but the text does not say whether he uses fingers, a toy, or another method. A definite solo-fingering claim overstates the evidence.

## Current reading supported despite surviving wrong label — 2 readings

Reconcile the saved judgment with the current claim and later owner evidence; no label changes were made during this audit.

Patterns involved: `fuck` (1), `pushed-in` (1).

### lightning.html · paragraph 2550 · `fuck#51959f8b`

- Past label: **wrong**. Current engine: anal sex; hypothetical; credited person: Evan "Buck" Buckley; other person: Eddie Diaz; credited role: top.
- My assessment: **Current reading supported; label needs re-review**, 98.0% confidence.
- Reason: The adult imagines the other adult penetrating him; the current hypothetical reading gets that direction right. The surviving owner wrong answer has no reason attached and should be rechecked, not silently changed.

### tricks-of-the-trade.html · paragraph 3773 · `pushed-in#855bdcff`

- Past label: **wrong**. Current engine: anal sex; act; credited person: Castiel; other person: Dean Winchester.
- My assessment: **Current reading supported; label needs re-review**, 99.9% confidence.
- Reason: The current reading is explicitly supported: finger preparation ends, the partner lubricates his penis, then penetrates and thrusts. A later owner-confirmed anal range also covers this passage; the old hash-only wrong label needs reconciliation.
