// The per-fic engine snapshot the act-recall benchmark scores (tests/act-recall-run.test.ts reads it from <dir>/.act-recall-cache/<fic>.html.json).
// `npm run eval` (and so `npm run regress`) already runs the engine over every fic with the real tags, so it writes the same snapshot as a by-product
// (tests/ao3-eval.test.ts) and the benchmark finds it cached instead of reading all the fics a second time. The fingerprint and the paragraph hash MUST
// be computed exactly as tests/act-recall-run.test.ts computes them, or the benchmark simply does not find the snapshot and reads the fic itself.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const sha256 = (s) => createHash("sha256").update(s).digest("hex");

const engineFiles = (p) => readdirSync(p, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? engineFiles(join(p, e.name)) : [join(p, e.name)])).sort();
/** Hash of everything under src/ plus package-lock.json: the engine the snapshot was made with. */
export function engineFingerprint(root = ".") {
  const src = join(root, "src");
  return sha256(engineFiles(src).map((p) => p + "\n" + readFileSync(p, "utf8")).join("\n") + readFileSync(join(root, "package-lock.json"), "utf8"));
}

/** FNV-1a of one paragraph, as hex: how a reviewed event proves it still points at the same paragraph. */
export const paragraphHash = (p) => {
  let h = 2166136261;
  for (let i = 0; i < p.length; i++) h = Math.imul(h ^ p.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
};

/**
 * Collects what the benchmark needs from one engine run: pass `audit` and `debug` to analyzeWithPatterns, then call `snapshot(html)`.
 * Only the fields the scorer reads are kept (no sentence text).
 */
export function recallCollector() {
  const hits = [];
  let paragraphSha = "";
  let paragraphHashes = [];
  return {
    audit: ({ para, via, kind, cat, act, a, b, role }) => hits.push({ para, via, kind, cat, act, a, b, role }),
    debug: ({ paras }) => {
      paragraphSha = sha256(paras.join("\n"));
      paragraphHashes = paras.map(paragraphHash);
    },
    snapshot: (html, fingerprint) => ({ engineFingerprint: fingerprint, sourceSha: sha256(html), paragraphSha, paragraphVerified: false, paragraphHashes, hits }),
  };
}

/** Writes <cacheDir>/<file>.json (file is the fic's name with .html), where the benchmark looks. */
export function writeRecallSnapshot(cacheDir, file, snapshot) {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, file + ".json"), JSON.stringify(snapshot));
}

export const recallCacheExists = (cacheDir, file) => existsSync(join(cacheDir, file + ".json"));
