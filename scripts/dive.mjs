#!/usr/bin/env node
// A deep dive into one fic, as steps. Everything it writes goes to ao3-samples/.dive/<fic>/ (local only, like the fics themselves).
//
//   npm run dive -- pack <fic> [--base <git ref>]     read the fic with the BASE engine (default origin/main; the commit is remembered in base.json so eval and import keep comparing against the engine the labels were made with) and write what a labeller needs:
//        A<n>.md   the engine's readings in chunks of 50, to judge right / wrong / wrong_person / unsure
//        B<n>.md   sexual-looking paragraphs the engine said nothing about, in chunks of 50, to say whether an act is there
//        fulltext.txt + inv ranges   the whole fic by numbered paragraph, in ~1000-paragraph ranges, for an independent inventory of every scene
//        prompts.md  a ready-made prompt for each chunk. Give each to a subagent; each writes A<n>-labels.json, B<n>-labels.json or inv<n>.json here.
//   npm run dive -- eval <fic> [--base <git ref>] [--full]     merge the labels and compare the base engine with the working tree: wrong readings gone / still
//        there, right readings kept / lost, new readings, recall on the paragraphs it missed, recall on the inventoried scenes. Prints the problems GROUPED BY PATTERN (biggest first) and writes every reading to eval.md; --full prints them all.
//   npm run dive -- import <fic> [--weight 0.9]       add the judged readings to tests/right-set (weighted, source "claude"). Weak cues the owner has
//        ruled on (a smack, arching, fingers in a mouth) are left undecided, not wrong; see WEAK_CUES.
//   npm run dive -- gold <fic> --pairing "A/B" --top "A" --bottom "B" [--blowjob] [--note "…"]
//        write tests/gold/<fic>.json from the inventories: the scenes where --top penetrates (or rims) --bottom, only those the engine reports
//        now (a regression guard, not a recall measure; the count it leaves out is printed and written into the note).
//
// The loop: pack → label with subagents (read prompts.md) → fix the engine, running `npm run dive -- eval <fic>` after each change (about 40 s) →
// import → gold → `npm run check` and `npm run regress` once before committing.
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hashKey, mergeReport, slugOf } from "./right-set.mjs";

const args = process.argv.slice(2);
const step = args[0];
const fic = args[1];
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes(`--${n}`);
if (!step || !fic || !["pack", "eval", "import", "gold"].includes(step)) {
  console.error("usage: npm run dive -- pack|eval|import|gold <fic> [options]   (see the top of scripts/dive.mjs)");
  process.exit(2);
}
const samples = resolve(process.env.AO3_DIR ?? "ao3-samples");
const out = join(samples, ".dive", fic);
mkdirSync(out, { recursive: true });
// The labels refer to the readings of the engine they were packed with, so after `pack` the base is pinned to that commit (base.json) and eval keeps using it.
const pinned = existsSync(join(out, "base.json")) ? JSON.parse(readFileSync(join(out, "base.json"), "utf8")).sha : undefined;
const base = opt("base", step === "pack" ? "origin/main" : pinned ?? "origin/main");
const sha = (b) => createHash("sha1").update(b).digest("hex").slice(0, 12);

// ── reading the fic with an engine ────────────────────────────────────────────────────────────────────────────────
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".ts") ? [join(d, e.name)] : []));
const nowKey = () => sha(walk("src").sort().map((f) => readFileSync(f)).reduce((h, b) => h + sha(b), ""));
function runEngine(cwd, file) {
  const r = spawnSync("npx", ["vitest", "run", "tests/dive.test.ts", "--reporter=dot"], { cwd, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, DIVE_FIC: fic, DIVE_OUT: file, AO3_DIR: samples } });
  if (r.status) { console.error("reading the fic failed"); process.exit(r.status); }
  return JSON.parse(readFileSync(file, "utf8"));
}
function baseReadings() {
  const sh = execFileSync("git", ["rev-parse", base], { encoding: "utf8" }).trim().slice(0, 12);
  const file = join(out, `readings-base-${sh}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  console.log(`reading ${fic} with ${base} (${sh}) in a temporary copy…`);
  const tmp = mkdtempSync(join(tmpdir(), "dive-"));
  try {
    execFileSync("git", ["worktree", "add", "--detach", tmp, base], { stdio: "ignore" });
    symlinkSync(resolve("node_modules"), join(tmp, "node_modules"));
    cpSync("tests/dive.test.ts", join(tmp, "tests", "dive.test.ts"));
    return runEngine(tmp, file);
  } finally {
    try { execFileSync("git", ["worktree", "remove", "--force", tmp], { stdio: "ignore" }); } catch { rmSync(tmp, { recursive: true, force: true }); }
  }
}
function nowReadings() {
  const file = join(out, `readings-now-${nowKey()}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  console.log(`reading ${fic} with the working tree…`);
  return runEngine(process.cwd(), file);
}

const clip = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
const whoOf = (r) => (r.kind === "scene" ? `${r.top}>${r.bottom}` : r.kind === "hint" ? `${r.who}:${r.role}${r.wants === false ? "-not" : ""}` : r.who);
const keyOf = (r) => `${r.kind}|${r.card}|${whoOf(r)}|${hashKey(r.ev ?? "")}`;
const labelFiles = (re) => readdirSync(out).filter((f) => re.test(f)).sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
const readJson = (f) => JSON.parse(readFileSync(join(out, f), "utf8"));
const loadLabels = () => {
  const A = labelFiles(/^A\d+-labels\.json$/).flatMap((f) => readJson(f).A ?? []);
  const B = labelFiles(/^B\d+-labels\.json$/).flatMap((f) => readJson(f).B ?? []);
  A.sort((x, y) => parseInt(x.id.slice(1)) - parseInt(y.id.slice(1)));
  return { A, B };
};

// ── pack ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const STRONG = /\b(?:cock|dick|prick|erection|hard-?on|balls|hole|rim|entrance|ass|arse|prostate|thrust\w*|fuck\w*|knot\w*|lube\w*|slick\w*|condom|orgasm\w*|cum|come|came|coming|moan\w*|blowjob|suck\w*|swallow\w*|lick\w*|tongue|nipples?|naked|straddl\w*|ride|riding|grind\w*|stroke\w*|jerk\w*|spread|inside him|inside me|fingers?|bite|bit|scent|sweat\w*|gasp\w*|pant\w*)\b/gi;
function doPack() {
  writeFileSync(join(out, "base.json"), JSON.stringify({ ref: base, sha: execFileSync("git", ["rev-parse", base], { encoding: "utf8" }).trim() }));
  const d = baseReadings();
  const { paras, readings } = d;
  writeFileSync(join(out, "paras.json"), JSON.stringify(paras));
  writeFileSync(join(out, "fulltext.txt"), paras.map((p, i) => `[${i}] ${p}`).join("\n"));
  const ctx = (i) => `${i > 0 ? "[before] " + clip(paras[i - 1], 420) + "\n" : ""}>>> ${clip(paras[i], 1100)}\n${i + 1 < paras.length ? "[after] " + clip(paras[i + 1], 420) : ""}`;
  const head = `# Review pack: ${fic}\n\nPairing(s) per the AO3 tags: ${d.relationships.join("; ")}. Characters: ${d.characters.slice(0, 8).join(", ")}.\n\n`;
  const covered = new Set(readings.map((r) => r.para).filter((p) => p !== undefined));
  const nearCovered = (i) => [i - 1, i, i + 1].some((j) => covered.has(j));
  const candidates = paras.map((p, i) => ({ i, n: (p.match(STRONG) ?? []).length })).filter((x) => x.n >= 3 && !nearCovered(x.i)).map((x) => x.i);
  const A = readings.map((r, n) => {
    const id = `R${n + 1}`;
    const who = r.kind === "scene" ? `${r.top} (top/active) → ${r.bottom} (bottom/receiving)` : r.kind === "hint" ? `${r.who} points toward ${r.role}${r.wants === false ? " (NOT)" : ""}` : r.who;
    const body = r.para !== undefined ? ctx(r.para) : r.ev;
    return { id, md: `### ${id} | para ${r.para} | ${r.kind.toUpperCase()} ${r.card} | ${who} | pattern ${r.via} | ${r.act ?? ""}${r.dkind ? " | " + r.dkind : ""}${r.conf ? " | conf " + r.conf + "%" : ""}\n${body}\n\n` };
  });
  const B = candidates.map((i, n) => ({ id: `M${n + 1}`, para: i, md: `### M${n + 1} | para ${i}\n${ctx(i)}\n\n` }));
  writeFileSync(join(out, "index.json"), JSON.stringify({ A: A.map((a, n) => ({ id: a.id, ...readings[n], ev: undefined })), B: B.map(({ id, para }) => ({ id, para })) }));
  const chunk = (items, size, tag, title) => {
    const files = [];
    for (let k = 0; k * size < items.length; k++) {
      const part = items.slice(k * size, (k + 1) * size);
      const f = `${tag}${k + 1}.md`;
      writeFileSync(join(out, f), head + `## ${title}\n\n` + part.map((x) => x.md).join(""));
      files.push({ f, first: part[0].id, last: part[part.length - 1].id });
    }
    return files;
  };
  const aFiles = chunk(A, 50, "A", "PART A: engine readings to judge"), bFiles = chunk(B, 50, "B", "PART B: sexual-looking paragraphs the engine said NOTHING about");
  // Inventory ranges: about 1000 paragraphs each (~100 KB).
  const ranges = [];
  for (let from = 0; from < paras.length; from += 1000) ranges.push([from, Math.min(paras.length - 1, from + 999)]);
  const P = (f) => join(out, f);
  const prompts = [`# Prompts for ${fic}\n\nOne subagent per chunk, in parallel. ${A.length} readings, ${B.length} missed-paragraph candidates, ${paras.length} paragraphs.\n`];
  for (const { f, first, last } of aFiles) prompts.push(`## ${f.replace(".md", "")} (${first}–${last})\n\nYou are labelling readings produced by a rule-based detector for an adult fanfic (analysis of fiction for role statistics). Read ${P(f)}. For each reading R<n> (a SCENE = the engine claims an act happened with top/bottom; a HINT = the engine claims a person's words/body point toward topping/bottoming; SOLO = solo masturbation), judge using the shown paragraph context (the >>> line is the evidence; hints and solos show only the sentence). Card meaning: anal = penetration of the anus (cock, fingers, toys); top = penetrator, bottom = receiver. For blowjob, top = person receiving (the cock owner), bottom = giver. Rimming top = giver.\nVerdict per reading: right | wrong (not what it claims: no such act or cue, or another act) | wrong_person (act real but roles or person swapped; give correct_top and correct_bottom) | unsure. Be strict about WHO: the person penetrated, stretched, plugged or knotted is bottoming; the one doing the penetrating (including fingers and toys) is topping. A cage, spanking alone or a submissive vibe is not an anal cue by itself.\nWrite JSON to ${P(f.replace(".md", "-labels.json"))} as {"A":[{"id":"${first}","verdict":"…","note":"one short sentence","correct_top":"","correct_bottom":""},…]} covering every R in the file. Never quote more than a few words of the fic. Reply with only a two-line summary.\n`);
  for (const { f, first, last } of bFiles) prompts.push(`## ${f.replace(".md", "")} (${first}–${last})\n\nA rule-based detector analysed an adult fanfic (role statistics) and said NOTHING about the paragraphs in ${P(f)} (items M<n>, with before/after context; the >>> line is the candidate). For each M decide whether the paragraph (with context) contains or clearly narrates a sex act between people, and which. Write JSON to ${P(f.replace(".md", "-labels.json"))} as {"B":[{"id":"${first}","hasAct":true|false,"act":"anal|blowjob|rimming|handjob|frottage|toy|fingering|none|other","active":"person penetrating or giving (for a blowjob: the giver)","receiving":"person penetrated or receiving","cue":"3-6 word paraphrase","note":"one short sentence"},…]} for every M. Be precise about who penetrates and who is penetrated (fingers, toys, plugs, cock and knot all count; the penetrated person is the bottom). Never quote more than a few words. Reply with only a two-line summary.\n`);
  ranges.forEach(([a, b], k) => prompts.push(`## inv${k + 1} (paragraphs ${a}–${b})\n\nRead paragraphs [${a}]–[${b}] of ${P("fulltext.txt")} (an adult fanfic analysed for role statistics; one numbered paragraph per line; use Read with offset/limit in chunks). Produce an independent inventory of every sexual scene or sexual act in that range, as JSON to ${P(`inv${k + 1}.json`)}: {"scenes":[{"from":para,"to":para,"acts":[{"act":"anal-cock|anal-fingers|anal-toy|anal-knot|blowjob|rimming|handjob|frottage|other","active":"person penetrating / giving","receiving":"person penetrated / receiving","paras":[first,last]}],"note":"one short sentence"}],"roleSummary":{"penetrations":"for each ordered pair (who penetrates whom, with what), a short list with paragraph numbers, or none"}}. Be exact about who does what to whom, including toys, plugs, fingers; note scenes where one person acts and the other watches or orders. Never quote more than a few words. Reply with a two-line summary.\n`));
  writeFileSync(join(out, "prompts.md"), prompts.join("\n"));
  console.log(`${fic}: ${readings.length} readings (${aFiles.length} chunks), ${B.length} missed-paragraph candidates (${bFiles.length} chunks), ${paras.length} paragraphs (${ranges.length} inventory ranges).\nWrote ${out}\nNext: give each prompt in ${join(out, "prompts.md")} to a subagent, then \`npm run dive -- eval ${fic}\`.`);
}

// ── eval ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function doEval() {
  const old = baseReadings().readings, now = nowReadings().readings;
  const { A, B } = loadLabels();
  const lines = [];
  const say = (s = "") => { lines.push(s); console.log(s); };
  if (!A.length) { console.error("no A<n>-labels.json yet"); process.exit(2); }
  const byId = new Map(A.map((l) => [l.id, l]));
  const missing = old.map((_, i) => `R${i + 1}`).filter((id) => !byId.has(id));
  if (missing.length) say(`WARNING: ${missing.length} readings have no label (${missing.slice(0, 8).join(", ")}…)`);
  const nowKeys = new Set(now.map(keyOf)), oldKeys = new Set(old.map(keyOf));
  const c = { right: 0, wrong: 0, wrong_person: 0, unsure: 0 }, kept = [], lost = [], gone = [], stay = [];
  old.forEach((r, i) => {
    const l = byId.get(`R${i + 1}`);
    if (!l) return;
    c[l.verdict] = (c[l.verdict] ?? 0) + 1;
    if (l.verdict === "unsure") return;
    const here = nowKeys.has(keyOf(r));
    const row = `R${i + 1} ${l.verdict} ${r.kind} ${r.card} ${whoOf(r)} ${r.via} :: ${(l.note ?? "").slice(0, 70)}`;
    if (l.verdict === "right") (here ? kept : lost).push(row);
    else (here ? stay : gone).push(row);
  });
  const decided = c.right + c.wrong + c.wrong_person;
  say(`# ${fic}: base ${base} vs working tree`);
  say(`labelled ${A.length} of ${old.length}: right ${c.right}, wrong ${c.wrong}, wrong person ${c.wrong_person}, unsure ${c.unsure}.`);
  say(`precision before: ${decided ? ((100 * c.right) / decided).toFixed(1) : "n/a"}% of the ${decided} decided readings`);
  say(`after: ${kept.length} right readings kept, ${lost.length} lost; ${gone.length} wrong ones gone, ${stay.length} still there → ${kept.length + stay.length ? ((100 * kept.length) / (kept.length + stay.length)).toFixed(1) : "n/a"}% (not counting ${now.filter((r) => !oldKeys.has(keyOf(r))).length} new readings nobody has judged)`);
  // The same pattern and sentence now credited to someone else: a right reading that moved, not one that was lost.
  const nowBySentence = new Map(now.map((r) => [`${String(r.via).replace(/~elided$/, "")}|${r.card}|${hashKey(r.ev ?? "")}`, r]));
  const movedTo = (row) => nowBySentence.get(`${String(row.r.via).replace(/~elided$/, "")}|${row.r.card}|${hashKey(row.r.ev ?? "")}`);
  const baseVia = (v) => String(v).replace(/~elided$/, "");
  const grouped = (rows, extra = () => "") => {
    const m = new Map();
    for (const row of rows) m.set(baseVia(row.r.via), [...(m.get(baseVia(row.r.via)) ?? []), row]);
    return [...m].sort((a, b) => b[1].length - a[1].length).map(([via, rs]) => `  ${via} ×${rs.length}: ${rs.slice(0, 6).map((x) => x.id).join(" ")}${rs.length > 6 ? " …" : ""} — ${rs[0].note.slice(0, 70)}${extra(rs)}`).join("\n");
  };
  const asRows = (xs) => xs.map((x) => { const m = /^R(\d+) (\S+) (.*?) :: (.*)$/.exec(x); const id = `R${m[1]}`; return { id, r: old[Number(m[1]) - 1], note: m[4], verdict: m[2] }; });
  const lostRows = asRows(lost), stayRows = asRows(stay);
  const reallyLost = lostRows.filter((x) => !movedTo(x)), movedRows = lostRows.filter((x) => movedTo(x));
  say(`\nRIGHT READINGS LOST: ${reallyLost.length} (+ ${movedRows.length} that only moved to another person, usually fine)\n${reallyLost.length ? grouped(reallyLost) : "  none"}`);
  say(`\nWRONG READINGS STILL THERE: ${stayRows.length}${stayRows.length ? " (by pattern, biggest first: fix the top ones first)" : ""}\n${stayRows.length ? grouped(stayRows) : "  none"}`);
  const newOnes = now.filter((r) => !oldKeys.has(keyOf(r)));
  const newBy = new Map();
  for (const r of newOnes) newBy.set(baseVia(r.via), [...(newBy.get(baseVia(r.via)) ?? []), r]);
  say(`\nNEW READINGS (not judged): ${newOnes.length}\n${[...newBy].sort((a, b) => b[1].length - a[1].length).map(([via, rs]) => `  ${via} ×${rs.length}: ${whoOf(rs[0])} :: ${clip(String(rs[0].ev ?? ""), 80)}`).join("\n") || "  none"}`);
  // Everything, for reading when a group needs a closer look.
  lines.push("\n--- every reading ---", ...lost.map((x) => `LOST ${x}`), ...stay.map((x) => `STILL WRONG ${x}`), ...newOnes.map((r) => `NEW ${r.kind} ${r.card} ${whoOf(r)} ${r.via} :: ${clip(String(r.ev ?? ""), 120)}`));
  if (flag("full")) { console.log("\n--- every reading ---"); for (const x of lines.slice(lines.indexOf("--- every reading ---") + 1)) console.log(x); }
  // Recall on the paragraphs the engine said nothing about.
  if (B.length) {
    const idx = readJson("index.json").B, paraOf = new Map(idx.map((x) => [x.id, x.para]));
    const acts = B.filter((b) => b.hasAct);
    const near = (rs, p) => rs.some((r) => r.para !== undefined && Math.abs(r.para - p) <= 1);
    const newOnly = acts.filter((b) => near(now, paraOf.get(b.id)) && !near(old, paraOf.get(b.id)));
    say(`\nMISSED PARAGRAPHS: ${B.length} labelled, ${acts.length} contain an act; the working tree now covers ${newOnly.length} of them that the base did not.`);
  }
  // Recall on the inventoried scenes.
  const inv = labelFiles(/^inv\d+\.json$/).flatMap((f) => readJson(f).scenes ?? []);
  if (inv.length) {
    const fam = (a) => (/^anal/.test(a) ? "anal" : a === "blowjob" ? "blowjob" : a === "rimming" ? "rimming" : null);
    // Someone using a toy or fingers on themselves is not a scene between the pair, so it is not counted as one to find.
    const firstWord = (x) => String(x).replace(/["“”]/g, "").split(/\s+/)[0].toLowerCase();
    const selfAct = (a) => /\bself\b|\bhimself\b|\bherself\b|\bown\b/i.test(`${a.active} ${a.receiving}`) || firstWord(a.active) === firstWord(a.receiving);
    const truth = inv.flatMap((s) => [...new Set(s.acts.filter((a) => !selfAct(a)).map((a) => fam(a.act)).filter(Boolean))].map((act) => ({ act, from: s.from, to: s.to })));
    const rep = (rs) => rs.filter((r) => r.kind === "scene");
    const found = (rs, t) => rep(rs).some((r) => r.card === t.act && r.para !== undefined && r.para >= t.from - 3 && r.para <= t.to + 3);
    const fb = truth.filter((t) => found(old, t)).length, fn = truth.filter((t) => found(now, t)).length;
    say(`\nSCENE RECALL (inventory of ${truth.length} scenes, a scene counts when a reported scene lies within 3 paragraphs; a scene merged into a neighbour can look missed): base ${fb} (${((100 * fb) / truth.length).toFixed(0)}%) → now ${fn} (${((100 * fn) / truth.length).toFixed(0)}%)`);
    say(`still missed: ${truth.filter((t) => !found(now, t)).map((t) => `${t.act} ${t.from}-${t.to}`).join(", ") || "none"}`);
  }
  writeFileSync(join(out, "eval.md"), lines.join("\n"));
}

// ── import ────────────────────────────────────────────────────────────────────────────────────────────────────────
// Cues the owner has ruled on: a smack on the ass and a cock grinding between cheeks are weak top cues (round 82), so a labeller who called them
// "wrong" is left undecided. Arching, kneeling and fingers in a mouth are weak and not worth teaching the model in either direction.
const WEAK_CUES = /spank|swat|slap|smack|arch|leg-spreading|kneeling to present|fingers in mouth|ogling|caged cock hurting|grinding between/i;
function doImport() {
  const base0 = baseReadings(), old = base0.readings, now = nowReadings().readings;
  const { A } = loadLabels();
  const weight = Number(opt("weight", "0.9"));
  const right = [], wrong = [], seen = new Set();
  const outItem = (r, via) => {
    const e = r.kind === "scene" ? { kind: "scene", card: r.card, pairing: r.pairing, top: r.top, bottom: r.bottom } : r.kind === "hint" ? { kind: "hint", card: r.card, pairing: r.pairing, who: r.who, role: r.role, wants: r.wants } : { kind: "solo", card: "solo", pairing: r.pairing, who: r.who };
    e.via = String(via || "").replace(/~(?:elided|one-sided)$/, "");
    e.h = hashKey(r.ev ?? "");
    if (r.conf) e.conf = r.conf;
    return e;
  };
  let weakSkipped = 0;
  old.forEach((r, i) => {
    const l = A.find((x) => x.id === `R${i + 1}`);
    if (!l || l.verdict === "unsure") return;
    if (l.verdict !== "right" && WEAK_CUES.test(l.note ?? "")) { weakSkipped++; return; }
    const match = now.find((n) => keyOf(n) === keyOf(r));
    if (l.verdict === "right") { if (match && !seen.has(keyOf(match))) { seen.add(keyOf(match)); right.push({ ...outItem(match, match.via), side: "right" }); } }
    else wrong.push({ ...outItem(r, r.via), misread: true, side: "wrong", gone: !match });
  });
  const title = base0.title;
  const parsed = { title, slug: slugOf(title), right, wrong };
  const file = join("tests", "right-set", `${parsed.slug}.json`);
  const set = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { entries: [] };
  const r = mergeReport(set, parsed, new Date().toISOString().slice(0, 10), { weight, source: "claude" });
  writeFileSync(file, JSON.stringify(set, null, 1) + "\n");
  console.log(`${title}: ${right.length} right and ${wrong.length} wrong readings (${weakSkipped} weak-cue "wrong" labels left undecided); ${r.added} added, ${r.confirmed} confirmed, ${r.disputed} disputed → ${file}`);
}

// ── gold ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const paraHash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16); };
function doGold() {
  const pairing = opt("pairing"), top = opt("top"), bottom = opt("bottom");
  if (!pairing || !top || !bottom) { console.error('gold needs --pairing "A/B" --top "A" --bottom "B"'); process.exit(2); }
  const paras = readJson("paras.json"), now = nowReadings().readings.filter((r) => r.kind === "scene");
  const inv = labelFiles(/^inv\d+\.json$/).flatMap((f) => readJson(f).scenes ?? []);
  const first = (n) => n.split(/\s+/)[0].replace(/["“”]/g, "");
  const mine = (who, n) => String(who).replace(/["“”]/g, "").startsWith(first(n));
  const wanted = [];
  for (const s of inv) {
    const acts = new Set();
    for (const a of s.acts) {
      if (a.act.startsWith("anal") && mine(a.active, top) && mine(a.receiving, bottom)) acts.add("anal");
      if (a.act === "rimming" && mine(a.active, top) && mine(a.receiving, bottom)) acts.add("rimming");
      if (flag("blowjob") && a.act === "blowjob" && mine(a.active, bottom) && mine(a.receiving, top)) acts.add("blowjob");
    }
    for (const act of acts) wanted.push({ act, from: s.from, to: s.to });
  }
  const found = wanted.filter((t) => now.some((r) => r.card === t.act && r.para !== undefined && r.para >= t.from - 2 && r.para <= t.to + 2));
  const g = {
    fic,
    note: `${opt("note", "")} Scenes come from independent reads of the fic; only ${top} penetrating (or rimming) ${bottom} is listed, and only scenes the engine reports now, as a guard against role flips. ${wanted.length - found.length} of the ${wanted.length} listed by the readers are left out because the engine did not report them (some are merged into a neighbouring scene).`.trim(),
    verdicts: [{ pairing, act: "anal", verdict: "one_way", top, bottom }],
    scenes: found.sort((a, b) => a.from - b.from || a.act.localeCompare(b.act)).map((t) => ({ act: t.act, from: t.from, to: t.to, top, bottom, h: paraHash(paras[t.from]) })),
    complete: [], notScenes: [], pov: [],
  };
  const file = join("tests", "gold", `${fic}.json`);
  writeFileSync(file, JSON.stringify(g, null, 1) + "\n");
  console.log(`${file}: ${g.scenes.length} scenes (${wanted.length - found.length} left out).`);
}

({ pack: doPack, eval: doEval, import: doImport, gold: doGold })[step]();
