# How the pattern engine works

The free, no-AI part of the app: `src/heuristic/` is a pattern-matching engine. This page is the reference for what it reads and how it
decides. Where each piece lives in the code: [ENGINE_MAP.md](ENGINE_MAP.md). How the rating is shown and what the page lets you do:
[PAGE_FEATURES.md](PAGE_FEATURES.md). The vibe and everyday-dynamic ratings built on top of it: [VIBES.md](VIBES.md).

## Reading the work

Analysis runs in the browser by default (the pattern engine in a background worker). If Claude analysis is
requested, the extracted story text is sent to Anthropic; the original file is not uploaded.
AO3 metadata is kept separately from story text. HTML chapter-note blocks and labeled notes in AO3 text/PDF
downloads are excluded from act detection when their boundaries are identifiable; when AO3 doesn't mark where a
chapter's notes end, only their first block is set aside, so a chapter is never lost. One-shots' preface summary
and notes are handled the same way. PDF line positions are used to preserve paragraph gaps, and a line that stops
mid-sentence is joined to the next, while one-paragraph-per-line text files keep their paragraphs.

**Fandom, pairing, word count** come from the tag block AO3 puts at the top of every download (PDF, EPUB,
HTML). Relationship tags with `/` count as pairings; `&` (platonic) tags are ignored. Without AO3 tags, the
word count is estimated and the main characters are guessed from frequently capitalized names.

## 1. Characters, nicknames and anatomy

**Characters**: names and short forms from the AO3 tags (“Harry Potter” → “Harry”, “Potter”; shared
surnames are dropped), gender from a built-in list of common fanfiction characters (for the fandoms the work is
tagged with), the M/M / F/F category, or pronoun continuity in the text, and
first-person (“I”) or reader-insert (“you”) narration. The narrator comes from a “POV X” tag, or else is the
main character who is named in dialogue but rarely in narration. Without tags, a first name and surname
that appear together (“Draco Malfoy”) but otherwise never share a sentence are merged into one person.
**Original characters**: generic tags (“Original Male Character(s)”, “OFC”, “Original Characters”) are
filled with the most-mentioned names in the text that aren't canon characters, so “Harry Potter/Original
Male Character” becomes “Harry Potter/Jonah”. Named OC tags (“Kyle (Original Character)”, “OMC - Jonah”)
are used as given, and Original Work fics with no character tags get their cast from the text. OCs
take their gender from the tag and are listed in the notes.

**Known characters and nicknames**: `src/heuristic/canon-data.ts` lists several hundred characters from ~70
fandoms (Supernatural, Harry Potter, Captive Prince, Marvel, Stranger Things, 9-1-1, Teen Wolf, BTS/K-pop,
anime, games, Wicked and more) with their other names (“Cas” for Castiel, “Damianos” for Damen, “Deadpool” for
Wade). A nickname is added only if the text actually uses it, and names that look alike (“Damen”/“Damianos”)
are merged. A work with two tags for one person (“Galinda Upland” beside “Glinda the Good”, when the text only
says Glinda) becomes one character; two tags that are both well used (“Tom Riddle”, “Voldemort”) stay apart.
A tagged character who never appears by name (“The Mute”) takes the name of the original character the text
uses. First-person fics whose sections are headed by a name (“Scott - Saturday, September 6”) switch narrator
at each heading.

**Category presumption**: tagged *only* M/M (or only F/F), characters are presumed to be men (or women) and the
sex to be between them. This is context, not a ban: a scene with someone of the other gender stays when it is
clearly real (both people named, or the pair seen in more than one sentence) and is dropped when it rests on a
single pronoun-only reading, which is where false flags come from. Any other category (F/M, Multi, Other) removes
the presumption. A work rated Explicit or Not Rated with almost no recognised acts gets a note quoting the
passages that read like sex scenes, since the sex may be written non-graphically.

**Anatomy** follows the words in the text first (“his cunt”, “her cock”), then tags: a tag naming someone trans
(“Trans Eddie Munson”) or saying they have a vagina or are intersex (“Intersex Dean Winchester”, “Dean
Winchester Has A Vagina”) gives a man a vagina; “futanari” / trans-woman tags give a woman a penis. An *Omega*
tag alone does **not**, because omegaverses differ; it takes an omega tag together with an intersex/vagina tag,
and a general intersex/vagina tag with no names only makes men's anatomy uncertain.

## 2. Act patterns

**Act patterns**: ~50 sentence patterns per act — e.g. “X fucked Y”, “X’s cock slid into Y”, “Y rode X”,
“Y’s hole clenched around X’s cock”, “Y sucked X off”, “X’s cock between Y’s lips”, “X rimmed Y”,
“X’s tongue in Y’s hole”, passive forms (“Y was fucked by X”), fingering, and sentences with the subject
left out (“climbed on top and rode him”). Words for the anus go beyond “hole” and “ass”: butthole, anus,
pucker, rosebud, starfish, sphincter, ring of muscle, back entrance, and (for rimming) crack and cleft.
The prostate counts as anal (“X nailed his prostate”, “milked”, “ground against”), and so do allusions to
it, which are read as “his prostate”: “that bundle of nerves inside him”, “his sweet spot” (but not the
sweet spot on his neck), “the spot inside Harry”, “his p-spot”, “the spot that made him see stars”. **Toys count**: dildos, vibrators, plugs, beads and strap-ons (“pushed the dildo into Dean”, “slid a vibrator
inside her”, “fucked him with the strap-on”, “eased a plug into her ass”). **Whoever is penetrated is the
bottom**; the one doing it (or wearing the strap-on or harness) is the top. Wearing a plug, lining a toy up at
a hole, and strapping on a harness are hints. **Using a toy on yourself counts as bottoming**: fucking yourself on a dildo, sliding a plug or vibrator into yourself, riding one, teasing your hole with one, or wearing a plug each count about as much as a scene for that person's bottom odds and appear under “Sex acts” in the vibe. Women with women
get the same treatment (strap-on play is vaginal sex, or anal when an ass is named); two women with no anal in
the text get no anal card built from Top/Bottom tags. Someone tagged both “Top X” and “Bottom X” is versatile
with their partner, never with themselves.
Innocent look-alikes (“sucked in a breath”, “blew him a kiss”, “fingers in his hair”, “pushed into the room”,
“top first, then trousers”, “top of my class”, “circled her clit” with a hand) are excluded.

## 3. Pronouns and epithets

**Pronouns and epithets**: “he”/“she” as a subject means the last subject; the other person in a two-person
sex scene is the partner. Epithets are recognized for hair colour (“the blond”, “the redhead”, “the
dark-haired man”), height (“the taller man”, “the shorter of the two”), size (“the bigger man”, “the
smaller one”), age (“the older wizard”, “the younger man”, “the thirty-year-old”), nationality (“the
American”, “the Brit”, “the Frenchman”), roles (“the alpha”, “the auror”), and stacks of these (“the tall
American soldier”). Who they mean is learned from the text: “Draco’s blond hair”, “Harry was taller than
Draco”, “Steve towered over Tony”, “Steve was a big man”, “Draco was two years older”, “Steve’s American
accent”, “Bucky was from Russia”, “Draco, the blond,”, Alpha/Omega tags, and consistent use across the
fic (a second pass). With two main characters, the opposite is inferred (taller known → shorter is the
other). Otherwise an epithet falls back to “the person who isn’t the current subject”. Noble and medieval
titles work as epithets too (“the lord”, “the baron”, “the prince”, “the knight”, “the squire”, “the
countess”…). Titles worn by a named character teach the epithet ("Lord Cregan" → "the lord", "Prince Jacaerys" → "the prince"), and a word in front of a title doesn't change who it is ("the dragon prince", "the northern lord"). "The boy", "the lad", "the youth" and "the kid" mean the younger one. Relationship words (“his husband”, “her lover”) are always relative: they mean the partner of
whoever “his” is, never one fixed person. After “permitted/let/forced X to …”, a later “he” is X. Each scene shows
whether roles came from names or pronouns/epithets.
More pronoun rules: in a sentence that names no one, “the hand on his cock and the tongue probing into him” is one
person (the one receiving); after “Cas’s hands … holding him down as he …” or “Cas’s hand wandered, cupping …”
the “he” and the participle belong to Cas; “Dean had no warning before he …” is the other man; “beg him to just
fuck him” makes the asker the bottom. A qualifier on a relationship tag (“brief Castiel/Meg Masters”) is not
part of the name. An untagged quote takes its speaker from the action sentence right before it (“Cas pulled his
fingers free… ‘Good boy’”) or from the listener’s reaction right after it (“…” Dean’s breath hitched); lines
about a show other people are performing (“the sub”, “his Dom”) are skipped.

## 4. Desire and fantasy

**Desire / fantasy**: wanting (“he wanted Draco to fuck him”), imagining (“imagined Harry sucking him
off”), hypotheticals, habits (“he’d always bottomed”), dialogue requests (“Fuck me,” Harry begged;
“I want to ride you”), and negations (“didn’t want to bottom”). These are listed separately and never
counted as acts. Negated acts (“didn’t fuck him”) are dropped.

## 5. Hints (same-sex pairs)

**Hints (same-sex pairs)**: behaviour short of sex counts toward confidence. Fingering someone, checking out
or grabbing their ass, grinding against it, lining up, slicking up or rolling on a condom suggests top;
staring at someone’s crotch or bulge, a mouth watering at it, grinding one’s ass back, spreading one’s legs,
getting on hands and knees, or kneeling between someone’s legs suggests bottom. Sucking on someone’s
fingers (or having fingers pushed into one’s mouth) suggests the person sucking cock; fingering oneself or using a
dildo, plug or toy on oneself (“fingered himself open”, “rode the plug”) suggests an anal bottom. Dialogue counts too
(“nice ass”, “you’re so tight” → speaker tops; “you feel so big”, “I need your knot” → speaker bottoms).
“Fuck me” only counts as a request when it is one: not after an interjection (“well, fuck me”), before a
new clause (“fuck me, it’s cold”), in idioms (“fuck me sideways”), when muttered or sworn, or with no sex
nearby in the narration.
With no on-page anal sex, these give an “Unclear” verdict that leans one way, at low confidence.
Everyday sentences are kept out: lying on your stomach counts as presenting only with ass or hips nearby; “pushed
back” needs a sexual follow-on; leaking or aching needs a real hole word; “slid in next to” isn’t penetration;
shoving someone aside, fights, torture and rescues, dancing, family hugs and “take over the job” aren’t
dominance or submission; “no way X was asking…” is disbelief, not a stated dislike; “bottomed the dildo out” is
the top seating a toy; “done this to himself” is solo prep; the slit of a cock isn’t cunnilingus. Weak dialogue
cues (check-ins, aftercare, pet names) need an unambiguous sexual word within three paragraphs, or several loose
ones, so comfort after a nightmare doesn’t count.
A toy used on yourself counts as bottoming, and how sure it is depends on the wording: “fucked himself with the
dildo” or “fucked his own ass” (or wearing a plug) counts fully, while “pushed the dildo into his ass” with no
one else in the sentence counts a little over half as much. A long solo scene counts about twice, not once per
sentence, and “got himself fucked” or “made himself come” are not solo toy use.
Bottom wishes and tastes in dialogue: “I want to get fucked”, “I wanna be bred”, “I want him to plow me”, “I want his cock
inside me”, “put it in me”, “come inside me”, “plow me”, “take me hard”, “I want to ride that dick” (whoever the cock
belongs to) are bottom wishes; “I love getting fucked”, “I love taking dick”, “I love cock”, “I’m a cockslut” are stated
tastes. “Get fucked up”, “fucked over”, “go get fucked” and “use me as a shield” are not.

## 6. Point of view

**Point of view.** Whose “he” or “I” a stretch of text is told from comes from the chapter heading (“Chapter 3: Steve”,
“Eddie's POV”), from a short line that is just a name, or a name followed by a break such as “Eddie, later that night” (never inside quotation marks, never a full sentence), inside a chapter, or, with neither, from whose feelings the chapter keeps
reporting (“Steve felt…”, “Steve wondered…”: six or more, at least two and a half times the other man's). In that person's
stretch, a sentence that opens with “He felt / wanted / thought…” or “His heart raced…” is them, whoever was named in the
line before; and in alternating first person a chapter headed with the narrator's name says whose “I” follows. Also new:
“He wanted to be fucked” / “needed to get fucked” (no one named) is a bottom desire.

   Third person is not always omniscient: a tag naming one POV character ("POV Steve Harrington", "Eddie Munson POV") makes
   a third-person work that character's throughout, "Third Person Limited" (or close/deep third) turns on the section
   rules below even without an "alternating" tag, and "Omniscient" turns point of view off.
   In a work tagged as alternating POV, each dated or timed section heading ("June 2011– Las Vegas", "Three weeks later–
   Detroit") starts a new stretch told from the first of the pair named in its narration (not in a quoted line, a chat line or
   a speech tag), and the camera also switches inside a section when the narration moves to the other one and the next few
   paragraphs report only their experience. A chat line like "Ilya: who is this" is never read as a heading.

## 7. Solo acts, handjobs and oral phrasings

**Solo acts** get their own card, per person: masturbation (“jerked himself off”, “stroked his own cock”,
“masturbated”, “got himself off”, “thrust up into his own fist”), self-fingering and toys on oneself. Masturbation
is never counted toward top or bottom. Self-fingering and toys keep counting as anal-bottom evidence for someone
with an ass; for a woman (or anyone with a vulva) they count that way only when the sentence says ass or anal,
otherwise they are solo and vaginal. A wish or plan (“wanted to touch himself”, “if he jerked off”) and a partner
being touched (“jerked Eddie off”) are not solo acts.
**Handjobs and frottage** between the pair get a card too: who uses their hand on whom (“stroked Steve’s cock”,
“wrapped a hand around Eddie’s cock”, “shoved a hand into his underwear”, “tightened his grip on his cock”), and mutual
moments (“wrapped his hands around them both”, “rubbed their cocks together”). They are not ranked top or bottom.
“He stroked his cock” counts only with the partner in the sentence or the one before (and no thought of them), because on
its own it is usually solo.
Oral phrasings include a cock taken out of the mouth, a throat squeezing around a cock, a cock forced down the
throat, fighting the urge to gag, tasting precum at the back of the throat, a grip in the hair with hips pushed
forward, the back of the tongue around the head, and an open mouth against a zipper. “Not without taking …” cancels
out, and “could taste/feel” is perception, not a hypothetical.

## 8. Verdict and confidence

**Verdict and confidence**: hits are grouped into scenes. “Switches” means each partner tops in at
least one scene (a single weak contrary hit is flagged as a possible exception instead). Confidence goes
up with more scenes, named (not pronoun) evidence, matching AO3 tags (“Bottom X”, “Switching”) and
matching desire/fantasy lines and hints, and down when tags or desires disagree. The reasons are shown on each card.
7. **Scene confidence**: every scene also gets its own “N% sure” (hover for why). It starts from the strength of
the best sentence, goes up when several sentences agree or the people are named, and down when the people were
only inferred, other sentences in the scene point the other way, or the wording is ambiguous (“rode him” can
describe either partner). A shaky scene that goes against nearly every firm scene in the pair loses more. Scene
confidence scales how much the scene counts toward the verdict, the per-person odds and the vibe rating, and a
scene under 40% sure can’t on its own make someone a switch.
