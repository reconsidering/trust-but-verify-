# Vibe rating and everyday dynamic

Two ratings per person in each pairing: the **sexual vibe** (who tops and bottoms) and the **everyday dynamic** (who leads and who follows
outside the sex). They are kept apart on purpose. Engine details: [HOW_IT_WORKS.md](HOW_IT_WORKS.md); the display switch and reports:
[PAGE_FEATURES.md](PAGE_FEATURES.md).

## Sexual vibe

Each partner in a pairing gets one of *Total top*, *Vers top*, *Vers*, *Vers bottom*, *Total bottom* or
*Unclear*, plus a confidence score and a list of what it rests on. The evidence is weighed in this order, most
important first:

1. **Actual sex acts** in the work (penetration, strap-ons, fingering)
2. **Stating what they are or prefer**, and AO3 role tags.
   - *Said in dialogue:* “I'm a top”, “I like being on top”, “I never bottom”, “I never top”, “I love being fucked”.
   - *Said about someone:* “he liked being fucked”, “she loved being in control”, “he'd always been the one who topped”
     (or “the type to take charge” / “the one who took it”). “On top of the world” is nothing.
   - *Tags:* “Top X”, “Bottom X”, “Switch X”, “Power Bottom X” (a bottom who also takes charge), “Service Top X” (a top
     who also gives way), “Pillow Prince/Princess X” and “Size Queen X” (lean bottom), “Dominant X”/“Dom!X”
     (leans top) and “Submissive X”/“Sub X” (leans bottom) at a lower weight than Top/Bottom since a dynamic isn't a
     position, and pair-wide tags (“Switching”, “Dom/sub”, “Praise Kink”, “Daddy Kink”, “Power Dynamics”) which
     count a little for whoever gives the praise, pet names or care in the text.
3. **Groping and similar behaviour** (grabbing an ass, fingering, lining up, spreading legs), and **how the body
   shows it afterwards**, which is a strong bottom signal even without a named scene: a sore ass, walking funny or
   sitting down gingerly after a night with sex around it, come leaking out of a hole, a hole clenching around
   nothing, feeling full or empty. A leaking pipe, a sore throat and a long drive are not.
4. **Desires, plans and fantasies** (“he wanted Draco to fuck him”, “fuck me,” he begged)
5. **Other hints**, like ogling a bulge or an ass
6. **Positions and cuddling**: *position and initiative* (pulling someone onto their lap, pinning wrists → top; climbing
   into a lap, having your wrists held → bottom; asking “ready?”, “tell me if it hurts” → top) and *cuddling positions*
   (resting or sleeping with your head on someone's chest, being the little spoon → bottom; being the one whose chest it
   is, being the big spoon → top). Position is two-sided, so the other person gets the opposite reading at a lower
   weight. These only feed the vibe, never the anal/oral cards. Dominant or submissive behaviour is no longer part of
   the vibe: it has its own axis, below.
7. **AO3 tag counts**: a very faint prior from how often AO3 tags the character as a top or bottom, for ~230
   popular characters (`src/heuristic/ao3-prior-data.ts`, from the community Top Tops / Top Bottoms / Most
   Versatile sheets). It is only used for characters in a fandom the work is tagged with, nudges per-person
   anal odds by at most about 15% on its own, and anything in the text outweighs it.

Each tier votes top or bottom with a strength that levels off as evidence piles up, and higher tiers outweigh
lower ones (`src/vibe.ts`). Confidence rises with how much evidence there is and how well it agrees, and is capped
when only faint hints (about 40%) or only the tag counts (about 12%) exist. A single faint hint never makes anyone
a “total”.

**“His clit” as a penis.** In some dom/sub fics a man’s penis is called his clit. When the tags say it’s that kind of work
(Master/Slave, Dom/sub, BDSM, humiliation, chastity, cock cages, feminization, “gender words just go anywhere”…), every
category is M/M, and nothing says anyone has a vulva (no intersex, omega, trans, pussy, cuntboy… tag), “his clit” and “Teo’s clit”
are read as cocks. Otherwise a clit stays a clit.

**Vaginal sex** is reported separately: only whether it happens and between whom. Anal vs vaginal is decided
by the words in the sentence (“his cunt”, “her ass”, “front hole”), not by gender, since trans men and intersex characters
(and omegas, in some omegaverses) may have vaginas and some women have penises; anatomy (by gender, or what the text says a character has)
is only the fallback. When a sentence doesn't say, it goes the way that bottom's clearly worded scenes went
(a character whose other scenes all mention his “seam” or “cunt” gets vaginal), then by the paragraph. Between
two men, a scene that still doesn't say is counted as anal. Going down on someone with a vagina is cunnilingus (the licker is the top, like rimming).

## Omegaverse

In a work tagged alpha/beta/omega (or one that uses the words all through the text), nonsexual gestures count
toward the everyday dynamic: baring the neck or scent gland, lowering the eyes, nesting and submitting to an alpha read as
following; scenting, growling at someone, the alpha voice, gripping the scruff and a claiming bite read as leading.
"Alpha Dean" / "Omega!Cas" character tags lean the character the same way. These feed the dynamic axis and the combined
vibe, not the sexual top/bottom vibe.

## Everyday dynamic (leads / follows)

A second rating per person, shown next to the vibe, for who leads and who follows *outside* the sex. It is kept apart
from top/bottom on purpose: in a lot of fics one man cares for and protects the other but is the one who bottoms, or
the other way round. Evidence comes in four tiers: **stated dynamic** (tags like “Dominant Cas”, “Submissive Dean”, “Power
Bottom X”, and pet names or aftercare backed up by a “Dom/sub” or “Praise Kink” tag); **taking charge** (pinning, gripping a
chin or wrists, lifting or carrying, giving orders, leading someone by the hand, taking control of a kiss); **caring,
protecting and praising** (tucking a blanket around someone, handing them ice or food, stroking their hair, stepping
between them and a threat, “I've got you”, “let me clean you up”, “good boy”); and **yielding** (going pliant, letting
someone lead, being pinned, blushing or stammering with the other one right there). Doing something *to* the other person
credits them with the opposite reading at a lower weight (the one led follows; the one held is the one holding's
counterpart), except for blushing, which is only one side. Labels run Follows, Leans following, Balanced, Leans leading,
Leads. The same expandable factors and “What's wrong with this?” forms work here, and a Dom/Sub tag is checked against
this axis (with the tag itself left out) in “Tags vs text”.

**Terms of address.** Fics build their own vocabulary of address ("sir", "baby", "your highness", "half man", "Scotty"). The engine
notes the forms of address in lines whose speaker is certain (tagged) and learns a term once it has been used for the same
person three times. Two things follow. A term used for one of the pair almost every time tells who an untagged line is for, so
the other one said it ("Fuck me, half man" after three tagged "half man"s from Steve is Steve; an ABO fic's untagged "Alpha,
please, fuck me" is the omega). And lopsided use feeds the everyday-dynamic axis: a title (sir, master, your highness, daddy)
used at least three times as often one way as the other is a yielding cue for the sayer, and a pet name (baby, princess,
sweetheart) used that lopsidedly is a caring, leading cue. Terms both of them use cancel out.
