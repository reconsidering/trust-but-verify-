# Trust (Tags) But Verify

A small web app: drop in an AO3 download (PDF, EPUB, HTML, or TXT) and it tells you

1. **Fandom**
2. **Pairing**
3. **Word count**
4. **Who tops and bottoms**, and whether anyone switches:
   - **Anal:** top = penetrative partner, bottom = anally receptive partner.
   - **Oral**, reported per act in plain words rather than top/bottom:
     - **Blowjobs:** who sucks cock and who gets sucked.
     - **Rimming:** who eats ass and whose ass gets eaten.
     - **Cunnilingus** (shown when someone in the pair has a vagina): who eats out and who gets eaten out.

     Each act gets its own verdict, so someone who both sucks and rims their partner isn't mistaken for a switch.

   An **Anal role switching found** indicator appears when each partner has at least
   one anal scene scored 75% or higher. Expand it to see the strongest scene in
   each direction and its confidence. The scenes can occur at different points
   in the work; hints and oral, finger or toy acts do not trigger this indicator.

   Every act also shows a **by-person** confidence for each partner in each role (e.g. Dunk tops 97% /
   bottoms 9%; Aerion sucks cock 97% / gets sucked 97%). The roles are scored independently, so someone who
   switches scores high on both. Each score is built from that person's scenes in the role (scenes worked
   out only from pronouns count less, and one shaky scene against many the other way counts little), plus
   hints (which alone stay under about 45%) and AO3 role tags (which alone stay around 60%).
5. **Vibe**: an overall rating for each partner in each pairing, from *Total top* through *Vers top*, *Vers* and
   *Vers bottom* to *Total bottom* (or *Unclear*), with a confidence score and the evidence it rests on (see
   [docs/VIBES.md](docs/VIBES.md)).
6. **Everyday dynamic**: a second rating per person for who leads and who follows *outside* the sex, kept apart from top/bottom
   (*Follows* … *Leads*).

> **Ratings are evidence, not verdicts.** Everything is read from the words on the page, so a fic that fades to black, uses unusual
> phrasing or hides who "he" is can be misread. Each result shows its confidence and the sentences behind it, and you can report a mistake.

## Where to read more

| If you want to know… | Read |
|---|---|
| How the engine reads a fic (characters, acts, pronouns, hints, point of view, confidence) | [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md) |
| How the vibe and everyday-dynamic ratings are built | [docs/VIBES.md](docs/VIBES.md) |
| What the page offers: evidence, tags-vs-text, mistake reports, “Looks right”, texts, Claude second opinion | [docs/PAGE_FEATURES.md](docs/PAGE_FEATURES.md) |
| Where things live in the code, and traps to avoid | [docs/ENGINE_MAP.md](docs/ENGINE_MAP.md) |
| How a change is checked (`check`, `regress`, `dive`, `trace`, `regen`) | [docs/TESTING.md](docs/TESTING.md) |
| What each kind of test evidence is (gold, right-set, reliability, context model, audit) | [docs/EVALUATION.md](docs/EVALUATION.md) |
| How the context model's accuracy (log loss, AUC) has changed over time | [docs/METRICS.md](docs/METRICS.md) |

## Privacy and how it runs

Analysis runs in the browser by default (the pattern engine in a background worker). If you ask for the optional Claude second opinion, the
extracted story text is sent to Anthropic with your own API key (kept in your browser, sent only to `api.anthropic.com`); the original file is
never uploaded. Marks and mistake reports stay in your browser unless you copy them out.

## Running locally

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # the unit suite: parser, EPUB, pattern engine, canon, anatomy, vibe, and a phrasing accuracy table
npm run build    # type-check and build the static site into dist/
```

## Project layout

| Path | What is there |
|---|---|
| `src/` | The app: file readers (`extract.ts`, `pdf/`), AO3 tag parsing (`ao3.ts`), the vibe rating (`vibe.ts`), reports (`report.ts`, `testgen.ts`), the page (`main.ts`) |
| `src/heuristic/` | The pattern engine: `patterns.ts` (act patterns), `index.ts` (scan and guards), `resolve.ts` / `pov.ts` / `address.ts` (who is who), `builders.ts` (scenes and confidence), `reliability.ts` and `learned.ts` (generated from labels) |
| `tests/` | Unit tests (one `roundNN.test.ts` per fix round, paraphrased, never quoting fics) plus the label sets: `gold/` (hand-checked scenes), `right-set/` (readings marked right), `labels/` (audit samples) |
| `scripts/` | Developer tools: `check`, `regress`, `eval`, `dive`, `trace`, `regen`, the label importers |
| `docs/` | The reference pages listed above |
| `.github/workflows/` | `deploy.yml` (publish to GitHub Pages) and `regen.yml` (regenerates the reliability table every few merges) |

## Working on the engine (developers)

A folder of AO3 `.html` downloads (`ao3-samples/`, never committed) is what the checks run against. The commands you will use, in order of
how often:

```sh
npm run check -- --only <fic>        # fast loop while working on one fic (1-2 min)
npm run trace -- <fic> "<pattern>"   # why did the engine read it that way?
npm run dive -- pack|eval|import|gold <fic>   # a deep dive on one fic: pack readings for labelling, measure fixes, save the labels
npm run check                        # the full check before every commit (about 2.5 min)
npm run regress -- --hits --all      # what else changed on all fics (summary; --full lists every reading)
npm run regen                        # regenerate reliability.ts and learned.ts after a batch of label imports (about 9 min)
```

- **Deep dives.** `dive pack` reads the fic and writes the engine's readings in chunks for helpers (subagents) to label right/wrong, plus an
  independent list of every sex scene. The scene-listing helpers read a **trimmed** copy of the fic (stretches with nothing sexual or leading up
  to it are cut) and the whole fic when the tags say fade-to-black, when the cut would save almost nothing, or when `--full-read` is given.
  Details: [docs/TESTING.md](docs/TESTING.md).
- **Generated files.** `src/heuristic/reliability.ts` is regenerated by a GitHub workflow after every few label merges (it opens a PR);
  `learned.ts` needs the local fics and is regenerated by hand. Do not regenerate either inside a fix PR.
- **Speed.** The full check shards the label runs over the cores (about 2.5 minutes on 4 cores), and every `regress`/`eval` result is cached
  per engine version.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. Turn it on once in
**Settings → Pages → Build and deployment → Source: GitHub Actions**. The build is plain static files, so
`dist/` also works on Netlify, Cloudflare Pages, etc.
