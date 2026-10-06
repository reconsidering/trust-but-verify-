#!/usr/bin/env node
// Blind spot-checks of Claude-made labels, round after round. Each round the tool learns from every answer so far (tests/spotcheck/rounds.json) which of the
// Claude labels not yet checked are most likely to be wrong, and builds the next page.
//   npm run spotcheck -- next [--n 100] [--explore 10]   build the next page: ao3-samples/.spotcheck/round-N/page.html (publish it as an Artifact; it does not show Claude's verdicts)
//   npm run spotcheck -- next --unlabelled [--n 100] [--random 10] [--per 4]   the same for readings NO ONE has labelled yet, ranked by how likely the engine is to be wrong
//        (its chance of being wrong × how much the verdict depends on it, at most --per per pattern) plus --random random ones: ao3-samples/.spotcheck/unlabelled-N/page.html
//   npm run spotcheck -- import-unlabelled <answers dir> [--round N] [--date YYYY-MM-DD]   write the owner's answers to tests/labels/spot-DATE.json (the context model and reliability table learn from it)
//   npm run spotcheck -- import <answers dir> [--round N] [--date YYYY-MM-DD]   take the owner's answers from the page's saved "reviews" collection, replace
//        Claude's labels with the owner's in tests/right-set, and record the round in tests/spotcheck/rounds.json (keys, labels and answers only: no fic text)
// Needs the sample fics in ao3-samples/ (the first run of `next` reads them all, about 6 minutes; the readings are then cached until the engine or labels change).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { rank } from "./spotcheck-rank.mjs";
import { applyOwnerAnswers } from "./spotcheck-apply.mjs";

const args = process.argv.slice(2);
const step = args[0];
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const dir = resolve(process.env.AO3_DIR ?? "ao3-samples");
const work = join(dir, ".spotcheck");
const roundsFile = "tests/spotcheck/rounds.json";
const readRounds = () => (existsSync(roundsFile) ? JSON.parse(readFileSync(roundsFile, "utf8")).rounds : []);
if (!["next", "import", "import-unlabelled"].includes(step)) { console.error("usage: npm run spotcheck -- next [--n 100] [--explore 10] [--unlabelled [--random 10] [--per 4]] | import <answers dir> [--round N] | import-unlabelled <answers dir> [--round N]"); process.exit(2); }
if (!existsSync(dir)) { console.error(`No sample fics at ${dir}: upload ao3-samples.zip and run npm run setup-fics first.`); process.exit(2); }
mkdirSync(work, { recursive: true });

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".ts") ? [join(d, e.name)] : []));
function candidates() {
  const h = createHash("sha1");
  for (const f of [...walk("src").sort(), ...readdirSync("tests/right-set").sort().map((x) => join("tests/right-set", x))]) h.update(readFileSync(f));
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".html")).sort()) h.update(f);
  const file = join(work, `candidates-${h.digest("hex").slice(0, 12)}.json`);
  if (!existsSync(file)) {
    console.log("reading the fics for Claude-labelled readings (about 6 minutes the first time)…");
    const r = spawnSync("npx", ["vitest", "run", "tests/spotcheck-candidates.test.ts", "--reporter=dot", "--testTimeout=1500000"], { env: { ...process.env, SPOT_OUT: file, AO3_DIR: dir }, stdio: ["ignore", "ignore", "inherit"] });
    if (r.status) process.exit(r.status);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "n/a");

// Readings nobody has labelled: the review-queue test ranks them, and the page does not show the engine's own estimate.
const unlabelledDir = (round) => join(work, `unlabelled-${round}`);
const lastUnlabelled = () => readdirSync(work).map((x) => /^unlabelled-(\d+)$/.exec(x)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b).at(-1) ?? 0;
if (step === "next" && args.includes("--unlabelled")) {
  const n = Number(opt("n", "100")), random = Number(opt("random", "10")), per = opt("per", "4");
  const round = lastUnlabelled() + 1, out = unlabelledDir(round);
  mkdirSync(out, { recursive: true });
  console.log("reading the fics for readings no one has labelled yet (about 6 minutes)…");
  const r = spawnSync("npx", ["vitest", "run", "tests/review-queue.test.ts", "--reporter=dot", "--testTimeout=1500000", "-t", "lists the hits"], { env: { ...process.env, AO3_DIR: dir, QUEUE_LOW: String(n - random), QUEUE_RANDOM: String(random), QUEUE_HIGH: "0", QUEUE_PER: per }, stdio: ["ignore", "ignore", "inherit"] });
  if (r.status) process.exit(r.status);
  const q = JSON.parse(readFileSync(join(dir, "REVIEW_QUEUE.json"), "utf8"));
  const rows = q.rows.map((x) => ({ ...x, note: "" }));
  writeFileSync(join(out, "rows.json"), JSON.stringify({ rows }, null, 1));
  const lede = "Judged without seeing what the engine thinks of itself. For each, is the claim true of the highlighted sentence in its context? The first name in a claim is the person the engine credited with the action. Wrong = the claim is false (or the sentence is not that act at all). Not sure = the context does not settle it.";
  const b = spawnSync("node", ["scripts/build-review-page.mjs", join(out, "rows.json"), join(out, "page.html"), `Unlabelled Readings ${round}`, lede], { stdio: "inherit" });
  if (b.status) process.exit(b.status);
  console.log(`\nUnlabelled set ${round}: ${rows.length} readings from ${q.candidates} not labelled by anyone (${rows.length - random} ranked, ${random} random).\nPage: ${join(out, "page.html")}\nPublish it as an Artifact (private), and when you have answered: npm run spotcheck -- import-unlabelled <answers dir>`);
  process.exit(0);
}

if (step === "import-unlabelled") {
  const answersDir = args[1];
  if (!answersDir || answersDir.startsWith("--")) { console.error("usage: npm run spotcheck -- import-unlabelled <answers dir> [--round N] [--date YYYY-MM-DD]"); process.exit(2); }
  const round = Number(opt("round", String(lastUnlabelled())));
  const rowsFile = join(unlabelledDir(round), "rows.json");
  if (!round || !existsSync(rowsFile)) { console.error("No unlabelled set built yet: run npm run spotcheck -- next --unlabelled first."); process.exit(2); }
  const date = opt("date", new Date().toISOString().slice(0, 10));
  const r = spawnSync("node", ["scripts/import-review-answers.mjs", rowsFile, answersDir, `tests/labels/spot-${date}.json`], { stdio: "inherit" });
  if (r.status) process.exit(r.status);
  console.log("Run npm run check, commit tests/labels, and open a PR; retrain with npm run regen -- --model-only after merging.");
  process.exit(0);
}

if (step === "next") {
  const n = Number(opt("n", "100")), explore = Number(opt("explore", "10"));
  const rounds = readRounds();
  const round = (rounds.at(-1)?.round ?? 0) + 1;
  const cands = candidates();
  const { picked, model, available } = rank(cands, rounds, { n, explore });
  const out = join(work, `round-${round}`);
  mkdirSync(out, { recursive: true });
  const rows = picked.map((c, i) => ({ n: i + 1, key: c.key, pattern: c.via, fic: c.fic, a: c.a, b: c.b, act: c.act, kind: c.kind, role: c.role, before: c.before, para: c.para, after: c.after, note: "" }));
  writeFileSync(join(out, "rows.json"), JSON.stringify({ rows }, null, 1));
  writeFileSync(join(out, "picked.json"), JSON.stringify(Object.fromEntries(picked.map((c) => [c.key, { picked: c.picked, score: Number(c.score.toFixed(3)) }]))));
  const lede = "Judged without seeing what Claude said. For each, is the claim true of the highlighted sentence in its context? The first name in a claim is the person the engine credited with the action. Wrong = the claim is false (or the people are swapped); Fine = true; Not sure = can't tell.";
  const b = spawnSync("node", ["scripts/build-review-page.mjs", join(out, "rows.json"), join(out, "page.html"), `Spot-Check Round ${round}`, lede], { stdio: "inherit" });
  if (b.status) process.exit(b.status);
  const ranked = picked.filter((c) => c.picked === "ranked");
  console.log(`\nRound ${round}: ${picked.length} readings from ${available} not yet checked (${ranked.length} ranked, ${picked.length - ranked.length} random).`);
  console.log(model.score
    ? `The ranking learned from ${model.rows} answers; on answers it had not seen it separates your disagreements with AUC ${model.loo.toFixed(2)} (0.5 = no better than chance). Overall you disagreed with Claude on ${pct(Math.round(model.base * model.rows), model.rows)} so far; it expects about ${pct(Math.round(ranked.reduce((s, c) => s + c.score, 0)), ranked.length)} of the ranked picks.`
    : "Fewer than 20 answers so far, so the ranking is only: Claude's \"wrong\" calls first.");
  console.log(`Page: ${join(out, "page.html")}\nPublish it as an Artifact (private), and when you have answered: npm run spotcheck -- import <answers dir>`);
}

if (step === "import") {
  const answersDir = args[1];
  if (!answersDir || answersDir.startsWith("--")) { console.error("usage: npm run spotcheck -- import <answers dir> [--round N] [--date YYYY-MM-DD]"); process.exit(2); }
  const rounds = readRounds();
  const round = Number(opt("round", String((rounds.at(-1)?.round ?? 0) + 1)));
  if (rounds.some((r) => r.round === round)) { console.error(`Round ${round} is already recorded.`); process.exit(2); }
  const date = opt("date", new Date().toISOString().slice(0, 10));
  const rowsFile = join(work, `round-${round}`, "rows.json");
  const rows = existsSync(rowsFile) ? JSON.parse(readFileSync(rowsFile, "utf8")).rows : [];
  const picked = existsSync(join(work, `round-${round}`, "picked.json")) ? JSON.parse(readFileSync(join(work, `round-${round}`, "picked.json"), "utf8")) : {};
  const adir = existsSync(join(answersDir, "reviews")) ? join(answersDir, "reviews") : answersDir;
  const MAP = { wrong: "wrong", fine: "ok", unsure: "unclear" };
  const byKey = new Map(candidates().map((c) => [c.key, c]));
  const answers = [];
  for (const f of readdirSync(adir).filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(adir, f), "utf8")); const a = d.data ?? d;
    const key = a.key || rows.find((r) => r.n === a.n)?.key;
    const c = byKey.get(key);
    if (!key || !MAP[a.v] || !c) continue;
    answers.push({ key, fic: c.fic, via: c.via, kind: c.kind, p: c.p, claude: c.claude, owner: MAP[a.v], a: c.a, picked: picked[key]?.picked });
  }
  if (!answers.length) { console.error("No answers found for this round's readings."); process.exit(1); }
  const done = applyOwnerAnswers(answers, date);
  const slim = answers.map(({ a, ...x }) => x);
  writeFileSync(roundsFile, JSON.stringify({ rounds: [...rounds, { round, date, answers: slim }] }, null, 1) + "\n");
  const stat = (set) => {
    const ok = set.filter((x) => x.claude === "ok" && x.owner !== "unclear"), wr = set.filter((x) => x.claude === "wrong" && x.owner !== "unclear");
    return `Claude's "right" calls held ${pct(ok.filter((x) => x.owner === "ok").length, ok.length)} of ${ok.length}; its "wrong" calls held ${pct(wr.filter((x) => x.owner === "wrong").length, wr.length)} of ${wr.length}`;
  };
  console.log(`Round ${round}: ${answers.length} answers (${answers.filter((x) => x.owner === "unclear").length} not sure). ${stat(answers)}.`);
  const dis = (set) => { const s = set.filter((x) => x.owner !== "unclear"); return `${pct(s.filter((x) => x.owner !== x.claude).length, s.length)} (of ${s.length})`; };
  const rk = answers.filter((x) => x.picked === "ranked"), rn = answers.filter((x) => x.picked === "random");
  if (rk.length) console.log(`You disagreed with Claude on ${dis(rk)} on the ranked picks${rn.length ? ` and ${dis(rn)} on the random ones` : ""}.`);
  const all = [...rounds.flatMap((r) => r.answers), ...answers];
  console.log(`All rounds (${all.length}): ${stat(all)}.`);
  console.log(`Labels updated: ${JSON.stringify(done)}. Run npm run check, commit tests/right-set and tests/spotcheck, and open a PR; retrain with npm run regen -- --model-only after merging.`);
}
