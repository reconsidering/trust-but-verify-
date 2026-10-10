import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { engineFingerprint, paragraphHash, recallCacheExists, recallCollector, sha256, writeRecallSnapshot } from "../scripts/recall-snapshot.mjs";

// The snapshot `npm run eval` saves for the act-recall benchmark (tests/act-recall-run.test.ts reads it). Adult paraphrases only; no fic text.
it("hashes a paragraph the way the benchmark does (FNV-1a, hex)", () => {
  expect(paragraphHash("")).toBe("811c9dc5");
  expect(paragraphHash("a")).toBe("e40c292c");
  expect(paragraphHash("Morgan kissed Rowan.")).toBe(paragraphHash("Morgan kissed Rowan."));
  expect(paragraphHash("Morgan kissed Rowan.")).not.toBe(paragraphHash("Rowan kissed Morgan."));
});

it("the run test and the shared module use the same hash constants and file order", () => {
  const run = readFileSync("tests/act-recall-run.test.ts", "utf8");
  expect(run).toContain("2166136261");
  expect(run).toContain("16777619");
  expect(run).toContain("sha(paras.join('\\n'))");
  expect(run).toContain("sha(engineFiles('src').map(p=>p+'\\n'+readFileSync(p,'utf8')).join('\\n')+readFileSync('package-lock.json','utf8'))");
});

it("collects only what the scorer reads, and the paragraph hashes from the engine's own paragraphs", () => {
  const c = recallCollector();
  c.audit({ para: 3, via: "fingers-into", kind: "act", cat: "anal", act: "fingering", a: "Morgan", b: "Rowan", role: undefined, sentence: "ignored", f: 1 } as never);
  c.debug({ paras: ["one", "two"] });
  const snap = c.snapshot("<html>adult</html>", "fp");
  expect(snap).toEqual({
    engineFingerprint: "fp",
    sourceSha: sha256("<html>adult</html>"),
    paragraphSha: sha256("one\ntwo"),
    paragraphVerified: false,
    paragraphHashes: [paragraphHash("one"), paragraphHash("two")],
    hits: [{ para: 3, via: "fingers-into", kind: "act", cat: "anal", act: "fingering", a: "Morgan", b: "Rowan", role: undefined }],
  });
  expect(JSON.stringify(snap)).not.toContain("ignored");
});

it("the engine fingerprint follows the source files and the lockfile", () => {
  const root = mkdtempSync(join(tmpdir(), "fp-"));
  mkdirSync(join(root, "src", "sub"), { recursive: true });
  writeFileSync(join(root, "src", "a.ts"), "export const a = 1;");
  writeFileSync(join(root, "src", "sub", "b.ts"), "export const b = 2;");
  writeFileSync(join(root, "package-lock.json"), "{}");
  const base = engineFingerprint(root);
  expect(engineFingerprint(root)).toBe(base);
  writeFileSync(join(root, "src", "sub", "b.ts"), "export const b = 3;");
  expect(engineFingerprint(root)).not.toBe(base);
  const changed = engineFingerprint(root);
  writeFileSync(join(root, "package-lock.json"), '{"x":1}');
  expect(engineFingerprint(root)).not.toBe(changed);
});

it("writes <cache>/<fic>.html.json where the benchmark reads it", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "rc-")), ".act-recall-cache");
  expect(recallCacheExists(dir, "story.html")).toBe(false);
  writeRecallSnapshot(dir, "story.html", { ok: true });
  expect(recallCacheExists(dir, "story.html")).toBe(true);
  expect(JSON.parse(readFileSync(join(dir, "story.html.json"), "utf8"))).toEqual({ ok: true });
});
