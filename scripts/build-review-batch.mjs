// Builds public claim metadata from local audit snapshots. Story paragraphs and sentences stay local.
// node scripts/build-review-batch.mjs snapshots-dir samples-dir public/review/next-batch.json --fics fic1,fic2 --commit <engine-commit>
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { claim } from "./review-claims.mjs";
import { baseVia, hashKey, slugOf } from "./right-set.mjs";

const [snapshotDir, sampleDir, output] = process.argv.slice(2);
const opt = (name) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const allowed = new Set((opt("fics") ?? "").split(",").filter(Boolean));
const engineCommit = opt("commit");
if (!snapshotDir || !sampleDir || !output || !allowed.size || !engineCommit) throw Error("Supply snapshots, samples, output, reviewed adult fic names (--fics), and --commit.");
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
// Read generated numeric coefficients as data; do not evaluate TypeScript source.
const learned = readFileSync("src/heuristic/learned.ts", "utf8").split("export const MODEL:")[1];
const bias = Number(/bias:\s*([\d.-]+)/.exec(learned)[1]), prior = Number(/prior:\s*([\d.-]+)/.exec(learned)[1]);
const weights = JSON.parse(/weights:\s*(\[[^\]]*\])/.exec(learned)[1]);
const precisionBody = /export const PRECISION[^=]*=\s*\{([\s\S]*?)\n\};/.exec(readFileSync("src/heuristic/reliability.ts", "utf8"))[1];
const precision = Object.fromEntries([...precisionBody.matchAll(/"([^"]+)":\s*([\d.]+)/g)].map((m) => [m[1], Number(m[2])]));
const probability = (h) => {
  const p = Math.min(0.99, Math.max(0.01, precision[h.via.replace(/~elided$/, "")] ?? 0.9));
  const z = bias + prior * Math.log(p / (1 - p)) + h.f.reduce((sum, value, i) => sum + value * (weights[i] ?? 0), 0);
  return 1 / (1 + Math.exp(-z));
};
const labelled = new Set();
for (const file of readdirSync("tests/labels").filter((f) => f.endsWith(".json"))) for (const key of Object.keys(JSON.parse(readFileSync(join("tests/labels", file), "utf8")).labels)) labelled.add(key);
const known = new Map();
for (const file of readdirSync("tests/right-set").filter((f) => f.endsWith(".json"))) {
  const data = JSON.parse(readFileSync(join("tests/right-set", file), "utf8"));
  known.set(data.fic, new Set([...(data.entries ?? []), ...(data.negatives ?? [])].map((r) => `${baseVia(r.via ?? "")}#${r.h}`)));
}
const snapshots = [], candidates = [], seen = new Set();
for (const file of readdirSync(snapshotDir).filter((f) => f.endsWith(".html.json")).sort()) {
  const data = JSON.parse(readFileSync(join(snapshotDir, file), "utf8"));
  if (!allowed.has(data.file.replace(/\.html$/, ""))) continue;
  // Supplement the manually reviewed adult source list with explicit warning/age exclusions.
  const html = readFileSync(join(sampleDir, data.file), "utf8");
  const minorAge = /\b(?:twelve|thirteen|fourteen|fifteen|sixteen|seventeen|1[2-7])[- ](?:year[- ]old|years old)\b/i;
  const minorSex = data.paras.some((p, i) => minorAge.test(p) && /\b(?:sex|sexual|fuck\w*|cock|dick|penetrat\w*|orgasm|masturbat\w*|blowjob)\b/i.test(data.paras.slice(Math.max(0, i - 1), i + 2).join(" ")));
  if (/>\s*Underage\s*</i.test(html) || /\b(?:underage|under age|adult\/minor|teenage|high school)\b/i.test(data.meta.freeforms.join(" ")) || minorSex) continue;
  snapshots.push(data);
  const excluded = known.get(slugOf(data.title ?? "")) ?? new Set();
  for (const h of data.hits) {
    if (!h.f || !h.b || !["act", "wanted", "hypothetical", "history", "handjob"].includes(h.kind) || !/^(?:anal sex|blowjob|rimming|fingering|handjob|mutual handjob)/.test(h.act)) continue;
    const key = `${h.via}#${hash(h.sentence).toString(16)}`;
    if (labelled.has(key) || excluded.has(`${baseVia(h.via)}#${hashKey(h.sentence)}`) || seen.has(key)) continue;
    // Keep excerpts around adult scene participants; a named child elsewhere in a household scene is not a review target.
    const excerpt = data.paras.slice(Math.max(0, h.para - 8), h.para + 9).join(" ");
    if (/\b(?:child|children|kid|kids|toddler|baby boy|baby girl|teenager|underage)\b/i.test(excerpt)) continue;
    seen.add(key);
    const a = h.attribution;
    const risk = (a ? [a.top, a.bottom].filter((x) => ["last-subject", "recent", "partner"].includes(x)).length : 0) +
      (a?.nearbyCharacters >= 3 ? 2 : 0) + (a?.partnerCandidates > 1 ? 1 : 0) + (h.act === "fingering" ? 1 : 0) + (/^(?:push-into|let-in|hole-around|penis-in-mouth|dd3-slipping-second)/.test(h.via) ? 2 : 0);
    const sex = h.f[0] + h.f[1], direct = (a?.top === "name" ? 1 : 0) + (a?.bottom === "name" ? 1 : 0);
    candidates.push({ ...h, key, fic: data.file, risk, control: direct * 3 + sex - risk, p: probability(h), random: hash(`review-oct6:${key}`) });
  }
}
const picked = [], used = new Set(), perFic = new Map(), perPattern = new Map(), lanes = {};
if (process.argv.includes("--diagnostic")) console.log(JSON.stringify({ sources: snapshots.map((s) => s.file), candidates: Object.fromEntries(snapshots.map((s) => [s.file, candidates.filter((r) => r.fic === s.file).length])) }));
function take(pool, count, lane) {
  let n = 0;
  // At most five readings per fic across the entire batch, and four per base pattern.
  for (const r of pool) {
    const pattern = baseVia(r.via);
    if (used.has(r.key) || (perFic.get(r.fic) ?? 0) >= 5 || (perPattern.get(pattern) ?? 0) >= 4) continue;
    used.add(r.key); perFic.set(r.fic, (perFic.get(r.fic) ?? 0) + 1); perPattern.set(pattern, (perPattern.get(pattern) ?? 0) + 1);
    picked.push(r); lanes[r.key] = lane; if (++n === count) break;
  }
  if (n !== count) throw Error(`Only ${n}/${count} ${lane} readings available; expand the reviewed adult source list.`);
}
take([...candidates].sort((a, b) => b.risk - a.risk || a.random - b.random), 20, "targeted");
take([...candidates].sort((a, b) => a.random - b.random), 10, "random");
take(candidates.filter((r) => r.p >= 0.9).sort((a, b) => b.control - a.control || a.random - b.random), 10, "high-confidence-controls");
picked.sort((a, b) => hash(`order:${a.key}`) - hash(`order:${b.key}`));
const files = new Set(picked.map((r) => r.fic));
const sources = snapshots.filter((s) => files.has(s.file)).map((s) => ({ file: s.file, title: s.title ?? s.file, sourceSha: s.sourceSha, paragraphSha: s.paragraphSha, paragraphCount: s.paras.length }));
const rows = picked.map((r, i) => ({ id: `B${i + 1}`, key: r.key, fic: r.fic, para: r.para, pattern: r.via, a: r.a, b: r.b, act: r.act, kind: r.kind, ...(r.role ? { role: r.role } : {}), claim: r.act === "mutual handjob" ? `${r.a.split(" ")[0]} is manually stimulating both his and ${r.b.split(" ")[0]}'s cocks.` : claim(r) }));
const batchId = "oct6-" + createHash("sha256").update(JSON.stringify({ engineCommit, rows, sources })).digest("hex").slice(0, 12);
writeFileSync(output, JSON.stringify({ schema: "engine-review-batch/v1", batchId, engineCommit, sources, rows }, null, 1) + "\n");
writeFileSync(join(snapshotDir, "batch-selection.json"), JSON.stringify({ batchId, candidates: candidates.length, lanes, files: [...files] }, null, 1));
console.log(`${rows.length} readings across ${sources.length} fics: 20 targeted, 10 random, 10 high-confidence controls. No story text written to ${output}.`);
