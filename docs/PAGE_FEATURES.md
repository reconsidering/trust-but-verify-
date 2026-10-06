# What the page shows and what you can do with it

Everything here is in the browser; marks and reports stay in your browser unless you copy them out. How the ratings are worked out:
[HOW_IT_WORKS.md](HOW_IT_WORKS.md) and [VIBES.md](VIBES.md).

## Reading a rating: evidence and per-line confidence

   **See what a rating rests on:** each line of a vibe card (“Sex acts: top ×99…”) expands into every piece of
   evidence behind it, with its role, weight, where it was found and the text it came from (a sentence, or the AO3
   tag). Tick any of them to send them with the error report; ticking one starts a report item for that rating.

   **Per-line confidence.** Every line under “Desire, fantasy & hints” has its own “N% sure” (hover for why). It starts from what
   kind of line it is (said outright or a stated preference are firm, a fantasy less, a ‘what if’ least) and the strength of
   the wording, goes up when the person is named or other lines point the same way, and down when the speaker was only guessed,
   the people were inferred, the wording is hedged (“maybe”, “kind of”) or other lines point the other way. A line’s
   confidence scales how much it counts toward the verdict’s confidence, the per-person odds and a hints-only reading.

## Tags vs text

   **Tags vs text.** Below the results, each AO3 tag that names an act, a role or a kink is checked against what the patterns
   found: **supported** (with the lines), **not found** (the sex may fade to black or be phrased in a way the patterns miss),
   **contradicted** (a “Top X” tag when the scenes show X bottoming) or **can’t tell**. Act tags (Anal Sex, Blow Jobs, Hand Jobs,
   Rimming, Masturbation…) use the act results; Top/Bottom/Switch tags are counted from the scenes alone, not from the person’s
   odds, which already lean on the tag; kinks (edging, orgasm denial, praise, bondage, spanking, cock cage, panties,
   exhibitionism, aftercare, safeword, negotiation, degradation, daddy, knotting, choking, collars) need enough sentences near
   sexual narration. Tags that name nothing checkable (Slow Burn, Angst…) are left out, and tags that mean the same thing share a row.

## Report a mistake

**Report a mistake**: under each scene, hint line and vibe rating, “Report a mistake” opens a short form: tick what’s wrong (wrong
character flagged as topping or bottoming, roles reversed, wrong act, not a sex act, solo act shown as a scene
with the partner, a wish rather than an event, wrong people; for a vibe rating, leaning too far toward top or
bottom, or the wrong confidence) and say why. Select part of a sentence first and it’s noted as the part you mean.
Missed scenes (or any text you select on the page) and other comments can be added too, and each item has a
checkbox to leave it out of the report.
**Copy test skeletons** turns the same items into a vitest file with one test each (swapped roles expect the
reverse, a wish expects no scene, and so on). The fic’s sentence appears only in a comment to delete; you replace
each `PARAPHRASE_ME` with a made-up sentence, fill in the TODOs, and check the test fails before the fix.
Each individual factor under a vibe rating has its own “What's wrong with this?” form with options for a wrong
speaker, a pronoun pointing at the wrong person, credited to the wrong character, roles reversed, not a sexual cue,
an everyday action, a figure of speech, a wish rather than an event, negated, counted twice, wrong tier, and counts
for too much or too little. Scenes and hint lines offer the same kinds of options (wrong speaker, wrong pronoun,
negated, figurative, duplicate…). The problems you name for a factor are printed right under that factor in the report. “Copy report for Claude” produces a text report (work tags, what the analyzer concluded, each
flagged sentence with its surrounding passage, the scene confidence and reasons, and your explanation) to paste
into Claude to find which pattern misfired. Nothing is sent anywhere; the report holds the passages you flag, so
read it before sharing.

## “Looks right” and the confidence check

   **Checking the confidence numbers.** Everything that has a “Report a mistake” button (scenes, hint lines, solo and
   hand-play lines, tag checks, vibe and everyday-dynamic ratings, and each factor under a rating) also has a “✓ Looks right”
   button. Pressing it again undoes it, and marking an item right takes it off the mistake list (and the other way round). Once an item is marked right, a "Context in the report for this one" menu appears under it, the same choice as in the mistake form (as shown, or 1, 2, 4 or 8 paragraphs either side), so a reading you checked travels with its passage.
   Items marked right go into the copied report in their own section, “Things I checked that look right”, with the
   note that they deserve more confidence than the rest but are not right in every context, and “Copy test skeletons” turns
   them into tests that a fix should keep passing unless there is a reason.
   Scenes and lines that carry a confidence number also feed the calibration table: pressing it marks the item right; reporting a mistake that says it was misread (wrong top/bottom, wrong speaker,
   wrong pronoun, not a sex act, a wish…) marks it wrong. Marks are kept in your browser only (never sent anywhere), and the
   “Is the confidence calibrated?” panel at the bottom shows stated confidence against how often those items were right, in
   bins, with the average gap. Export them as JSON, import them back or clear them; a summary also goes into the copied
   mistake report, so the numbers can be tuned against real checks.

## Text messages

**Text messages.** Chat-style lines ("Shane: Why?", often under a timestamp, with a phone cue or a long exchange nearby) and
bracketed logs ("[Anakin] pick up your phone"), narrated texting ("Cas texted him", "he texts Eddie back", "his phone buzzes with a text. It's Buck") are recognized so the lines can be attributed: a contact name ("Lily",
"Unknown Number") is matched to the character on the other end, and each chat line is rewritten as dialogue from the sender
before analysis, so a texted "I want to fuck you" counts like a spoken one. There is no separate card; "Texting" and "Sexting"
tags are checked against the text in the tags-vs-text section.
Arrow-style texts are read too: a line starting with ">" is sent by the viewpoint character (the narrator, or whoever was named
just before) and a line ending in "<" (or starting with "<") is received from the other one of the pair.

## Two ratings or one

A switch above the results chooses between **Two ratings** (the sexual vibe and the everyday dynamic, kept apart) and
**One combined vibe**, the earlier single rating with taking charge, caring, pet names, power bottoms and yielding folded
into tier 6 (“Dominant or submissive behaviour, positions and cuddling”). The choice is remembered in your browser, and
switching it keeps any mistakes you've already flagged.

## Claude second opinion (optional)

**Claude second opinion (optional)** — with your own Anthropic API key, Claude (Opus 5.5 by default) reads
the story text and returns the same result shape, including desire/fantasy lines and its own confidence. Long works
(over 150k words, or “Sex scenes only”) are cut down to the opening plus passages that look sexual, retaining
paragraph and chapter context.

Your API key stays in your browser and is sent only to `api.anthropic.com`.
