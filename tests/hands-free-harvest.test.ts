// @vitest-environment jsdom
// Finds orgasm passages in anal scenes across the sample fics, for the owner to say which were hands-free (npm run hands-free-harvest; skipped otherwise).
// The detector's own verdict is kept out of the page and saved apart, so the answers measure how many the detector finds (recall) and how many of its hints are right.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { extractFromHtml } from "../src/extract";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";
import { SCENE_BREAK } from "../src/heuristic/markers";

const out = process.env.HF_OUT;
const dir = process.env.AO3_DIR ?? "ao3-samples";
const ORGASM = /\b(?:came|comes|coming(?!\s+(?:back|up|down|to|from|over|home|out|into|closer|near|around|through))|cum|cums|cumming|cummed|orgasm\w*|climax\w*|spill\w*|spurt\w*|shot|shoot\w*|ejaculat\w*|release[sd]?|tipped\s+over|peak\w*|undone|shatter\w*|crest\w*|burst)\b/i;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const narration = (p: string) => p.replace(/[“"][^”"]*[”"]/g, " ");
const sentences = (p: string) => p.split(/(?<=[.!?”"])\s+/);

describe.skipIf(!out)("hands-free harvest", () => {
  it("collects candidates", () => {
    const skip = new Set((process.env.HF_SKIP ?? "").split(",").filter(Boolean));
    const only = new Set((process.env.HF_ONLY ?? "").split(",").filter(Boolean));
    const files = readdirSync(dir).filter((f) => f.endsWith(".html") && !skip.has(f.replace(/\.html$/, "")) && (!only.size || only.has(f.replace(/\.html$/, "")))).sort();
    const all: Record<string, unknown>[] = [];
    for (const f of files) {
      const buf = readFileSync(join(dir, f));
      const w = extractFromHtml(buf.toString("utf8"));
      const hits: AuditHit[] = [];
      let paras: string[] = [];
      analyzeWithPatterns(w.text, w.meta, { quiet: true, audit: (h) => hits.push(h), debug: (d) => { paras = d.paras; } });
      const anal = hits.filter((h) => h.kind === "act" && h.cat === "anal" && (h.act.startsWith("anal sex") || h.act === "fingering" || h.act === "rimming" || /toy/.test(h.act)));
      const manual = new Set(hits.filter((h) => h.kind === "handjob" || h.kind === "masturbation" || h.act === "handjob" || h.act === "masturbation").map((h) => h.para));
      const hf = hits.filter((h) => h.act === "hands-free orgasm" || h.act === "prostate orgasm");
      for (let pi = 0; pi < paras.length; pi++) {
        const p = paras[pi];
        const mine = hf.filter((h) => h.para === pi);
        const prior = anal.filter((a) => a.para <= pi && a.para >= pi - 8 && !paras.slice(a.para + 1, pi + 1).some((q) => SCENE_BREAK.test(q)));
        const inScene = p.length >= 40 && sentences(narration(p)).some((s) => ORGASM.test(s)) && prior.length > 0;
        // Every passage the detector flagged is included, even where no anal act was found nearby, so its hints can be checked too.
        if (!inScene && !mine.length) continue;
        const last = prior[prior.length - 1];
        all.push({
          key: `${f.replace(/\.html$/, "")}#${pi}#${sha(p).slice(0, 12)}`, fic: f, para: pi, sourceSha256: createHash("sha256").update(buf).digest("hex"),
          top: last?.a ?? mine[0]?.b ?? "", bottom: last?.b ?? mine[0]?.a ?? "", lastAnalPara: last?.para ?? -1,
          manualNearby: [pi - 2, pi - 1, pi].some((i) => manual.has(i)), detected: mine.length > 0, detectedCredit: mine[0]?.a ?? "", detectedVia: mine[0]?.via ?? "",
          before: paras[pi - 1] ?? "", para_text: p, after: paras[pi + 1] ?? "",
        });
      }
    }
    mkdirSync(out!, { recursive: true });
    writeFileSync(join(out!, "candidates.json"), JSON.stringify(all, null, 1));
    const by = (k: (r: any) => boolean) => all.filter(k).length;
    console.log(`HF_POOL total=${all.length} detected=${by((r) => r.detected)} undetected=${by((r) => !r.detected)} undetected_noManual=${by((r) => !r.detected && !r.manualNearby)} undetected_manual=${by((r) => !r.detected && r.manualNearby)}`);
  });
});
