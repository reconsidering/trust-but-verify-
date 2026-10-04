// The file the "Save looks-right set" button downloads: the readings marked right (and the ones reported wrong, so a reading that is
// both can be set aside), as hashes and names only, never the fic's text. scripts/import-right-set.mjs folds it into tests/right-set.
import type { FlaggedScene } from "./report";

/** Same key as scripts/right-set.mjs: letters only, lower case, first 60, hashed. */
export function hashKey(s: string): string {
  const k = s.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 60);
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
export const slugOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const baseVia = (v: string | undefined) => (v ?? "").replace(/~(?:elided|one-sided)$/, "");
const ACTS = new Set(["anal", "blowjob", "rimming", "cunnilingus", "vaginal"]);

export interface SavedEntry {
  kind: "scene" | "hint" | "solo";
  card: string;
  pairing: string;
  h: string;
  via: string;
  top?: string;
  bottom?: string;
  who?: string;
  role?: string;
  wants?: boolean;
  conf?: number;
}

/** One saved reading, or undefined for lines that cannot be found again (tag checks, vibe ratings, manual lines). */
export function savedEntry(f: FlaggedScene): SavedEntry | undefined {
  if (!f.evidence) return undefined;
  const base = { card: f.card, pairing: f.pairing, h: hashKey(f.evidence), via: baseVia(f.pattern) };
  const conf = f.confidence !== undefined ? Math.round(f.confidence * 100) : undefined;
  if (f.card === "solo" && f.kind === "hint") return { kind: "solo", ...base, who: f.top };
  if (!ACTS.has(f.card)) return undefined;
  if (f.kind === "scene") return { kind: "scene", ...base, top: f.top, bottom: f.bottom, ...(conf !== undefined ? { conf } : {}) };
  if (f.kind === "hint") {
    const m = /^(NOT )?(top|bottom)\b/.exec(f.bottom);
    if (!m) return undefined;
    return { kind: "hint", ...base, who: f.top, role: m[2], wants: !m[1], ...(conf !== undefined ? { conf } : {}) };
  }
  return undefined;
}

export function rightSetFile(title: string, right: FlaggedScene[], wrong: FlaggedScene[]) {
  const pick = (xs: FlaggedScene[]) => xs.map(savedEntry).filter((x): x is SavedEntry => !!x);
  return { title, slug: slugOf(title), right: pick(right), wrong: pick(wrong) };
}
