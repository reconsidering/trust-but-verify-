#!/usr/bin/env node
// The hands-free review page: orgasm passages in anal scenes, for the owner to say which were hands-free. Needs the pool made by `npm run hands-free-harvest`.
//   node scripts/build-hands-free-page.mjs [pool dir=ao3-samples/.hands-free/pool] [out dir=ao3-samples/.hands-free/round-1] [--seed S] [--per-fic 3] [--clear 45] [--manual 12]
// Mixes ALL passages the detector flagged with random ones it did not, in one order, and does not show which is which. Publish page.html as a private
// Artifact with the db capability. manifest.json (no story text) keeps what the detector said, so the answers measure its recall and precision.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const poolDir = pos[0] ?? "ao3-samples/.hands-free/pool", outDir = pos[1] ?? "ao3-samples/.hands-free/round-1";
const seed = opt("seed", "hands-free-1"), perFic = Number(opt("per-fic", 3)), nClear = Number(opt("clear", 45)), nManual = Number(opt("manual", 12));
const read = (d) => { try { return JSON.parse(readFileSync(join(d, "candidates.json"), "utf8")); } catch { return []; } };
// A second pool (pool-extra) holds passages the detector flagged that the first run missed; keys are unique, so the two are merged.
const merged = new Map(); for (const c of [...read(poolDir), ...read(`${poolDir}-extra`)]) merged.set(c.key, c);
const pool = [...merged.values()];
const rank = (c) => createHash("sha256").update(seed + c.key).digest("hex");
const byRank = (a, b) => rank(a).localeCompare(rank(b));
// Round-robin over the fics (the best-ranked passage of each fic first, then the second of each, up to --per-fic), so every fic is represented and the
// weights below can stand for the whole pool.
const take = (list, n) => {
  const per = {}; for (const c of [...list].sort(byRank)) (per[c.fic] ??= []).push(c);
  const out = []; for (let round = 0; round < perFic && out.length < n; round++) for (const f of Object.keys(per).sort((a, b) => rank({ key: a }).localeCompare(rank({ key: b })))) { if (per[f][round] && out.length < n) out.push(per[f][round]); }
  return out;
};
const detected = pool.filter((c) => c.detected);
const picked = [...detected, ...take(pool.filter((c) => !c.detected && !c.manualNearby), nClear), ...take(pool.filter((c) => !c.detected && c.manualNearby), nManual)].sort(byRank);

const ORGASM = /\b(?:came|comes|coming(?!\s+(?:back|up|down|to|from|over|home|out|into|closer|near|around|through))|cum|cums|cumming|cummed|orgasm\w*|climax\w*|spill\w*|spurt\w*|shot|shoot\w*|ejaculat\w*|release[sd]?|tipped\s+over|peak\w*|undone|shatter\w*|crest\w*|burst)\b/i;
const narration = (p) => p.replace(/[“"][^”"]*[”"]/g, " ");
const mark = (p) => { const s = p.split(/(?<=[.!?”"])\s+/).find((x) => ORGASM.test(narration(x))); return s ? p.replace(s, `【${s}】`) : p; };
const title = (f) => f.replace(/\.html$/, "").replace(/-/g, " ");
// annotations.json (optional, next to the page): per passage key, the analyzer's answer and Claude's, shown in a closed panel on each card.
let notes = {}; try { notes = JSON.parse(readFileSync(join(outDir, "annotations.json"), "utf8")); } catch {}
const rows = picked.map((c, i) => ({
  n: i + 1, key: c.key, pn: c.para, fic: title(c.fic), pattern: "", before: c.before, para: mark(c.para_text), after: c.after,
  claim: `Does ${c.bottom} come here without anyone (including themself) touching their penis, from anal or prostate stimulation alone?`,
  ...(notes[c.key] ?? {}),
}));
// How many unflagged, untouched-looking passages in the fic each sampled one stands for, so the answers can estimate how many the detector missed.
const poolBy = {}, pickBy = {};
for (const c of pool) if (!c.detected && !c.manualNearby) poolBy[c.fic] = (poolBy[c.fic] ?? 0) + 1;
for (const c of picked) if (!c.detected && !c.manualNearby) pickBy[c.fic] = (pickBy[c.fic] ?? 0) + 1;
const manifest = picked.map((c, i) => ({ n: i + 1, stratumWeight: !c.detected && !c.manualNearby ? Number((poolBy[c.fic] / pickBy[c.fic]).toFixed(3)) : null, key: c.key, fic: c.fic, para: c.para, sourceSha256: c.sourceSha256, bottom: c.bottom, top: c.top, detected: c.detected, detectedCredit: c.detectedCredit, detectedVia: c.detectedVia, manualNearby: c.manualNearby }));
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "rows.json"), JSON.stringify({ rows }, null, 1));
writeFileSync(join(outDir, "manifest.json"), JSON.stringify({ seed, made: new Date().toISOString().slice(0, 10), poolSize: pool.length, picked: manifest }, null, 1) + "\n");
const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "hands-free-page.tpl.html"), "utf8");
const lede = "These are passages from the sample fics where someone comes during or just after anal sex.";
writeFileSync(join(outDir, "page.html"), tpl.replaceAll("/*TITLE*/", "Hands-free orgasm review").replace("/*LEDE*/", lede).replace("/*ROWS*/", JSON.stringify(rows).replaceAll("</", "<\\/")));
console.log(`${rows.length} passages (${detected.length} flagged by the detector, ${picked.length - detected.length} not) from a pool of ${pool.length} -> ${join(outDir, "page.html")}`);
