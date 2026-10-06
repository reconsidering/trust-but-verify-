import JSZip from "jszip";
import { extractFromHtml } from "../src/extract";
import { splitParagraphs } from "../src/text";

export type ReviewSource = { file: string; title: string; sourceSha: string; paragraphSha: string; paragraphCount: number };
export type ReviewRow = { id: string; key: string; fic: string; para: number; pattern: string; a: string; b?: string; act: string; kind: string; role?: string; claim: string; gold?: { file: string; hash: string; pairing: string; act: string; verdict: string }; evidence?: { from: number; to: number }[] };
export type ReviewBatch = { schema: "engine-review-batch/v1" | "engine-gold-review/v1" | "engine-gold-range-review/v1"; batchId: string; engineCommit: string; sources: ReviewSource[]; rows: ReviewRow[] };
export type ReviewAnswer = { verdict?: "correct" | "wrong" | "uncertain"; errors: string[]; context: string; updatedAt: string };

export const checksum = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>)), (b) => b.toString(16).padStart(2, "0")).join("");

// Use the same extraction and paragraph splitting as the detector, without running the detector on the phone.
export function reviewParagraphs(html: string): string[] {
  const text = extractFromHtml(html).text.replace(/\[\[AO3_UNCERTAIN_NOTE_START\]\][\s\S]*?\[\[AO3_UNCERTAIN_NOTE_END\]\]/g, "").replace(/\[\[AO3_[A-Z_]+\]\]/g, "");
  return splitParagraphs(text.replace(/^([ \t]*>[ \t]*\S.*|.*\S[ \t]*<[ \t]*)$/gm, "\n$1\n"));
}

export async function verifyStory(bytes: Uint8Array, sources: ReviewSource[]): Promise<{ source: ReviewSource; paras: string[] } | undefined> {
  const sha = await checksum(bytes);
  const match = sources.find((s) => s.sourceSha === sha);
  if (!match) return undefined;
  const paras = reviewParagraphs(new TextDecoder().decode(bytes));
  if (paras.length !== match.paragraphCount || await checksum(new TextEncoder().encode(paras.join("\n"))) !== match.paragraphSha) throw Error(`The paragraphs in ${match.title} do not match this batch.`);
  return { source: match, paras };
}

/** ZIP entries are read in memory, never extracted to disk or uploaded. Only HTML entries are considered. */
export async function* storyBytes(file: { name: string; arrayBuffer: () => Promise<ArrayBuffer> }): AsyncGenerator<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!/\.zip$/i.test(file.name)) { yield bytes; return; }
  const zip = await JSZip.loadAsync(bytes);
  for (const entry of Object.values(zip.files)) if (!entry.dir && /\.html?$/i.test(entry.name) && !entry.name.startsWith("__MACOSX/")) yield await entry.async("uint8array");
}

export function validAnswer(value: unknown): value is ReviewAnswer {
  if (!value || typeof value !== "object") return false;
  const a = value as ReviewAnswer;
  return (a.verdict === undefined || ["correct", "wrong", "uncertain"].includes(a.verdict)) && Array.isArray(a.errors) && a.errors.every((e) => typeof e === "string") && typeof a.context === "string" && typeof a.updatedAt === "string";
}

export function importAnswers(batch: ReviewBatch, payload: unknown, current: Record<string, ReviewAnswer>): number {
  const data = payload as { schema?: string; batchId?: string; engineCommit?: string; answers?: (ReviewAnswer & { id: string; key: string; fic: string; paragraph: number; sourceSha: string; gold?: ReviewRow["gold"]; evidence?: ReviewRow["evidence"] })[] };
  if (data?.schema !== batch.schema || data.batchId !== batch.batchId || data.engineCommit !== batch.engineCommit || !Array.isArray(data.answers)) throw Error("These answers belong to a different review batch.");
  // Validate everything before merging, so a malformed file cannot partially overwrite saved answers.
  const seen = new Set<string>();
  for (const a of data.answers) {
    const row = batch.rows.find((r) => r.id === a.id);
    const source = row && batch.sources.find((s) => s.file === row.fic);
    if (!row || seen.has(a.id) || a.key !== row.key || a.fic !== row.fic || a.paragraph !== row.para || a.sourceSha !== source?.sourceSha || !validAnswer(a)) throw Error("An answer does not match this batch.");
    if (batch.schema === "engine-gold-range-review/v1" && (JSON.stringify(a.gold) !== JSON.stringify(row.gold) || JSON.stringify(a.evidence) !== JSON.stringify(row.evidence))) throw Error("An answer does not match its gold range.");
    seen.add(a.id);
  }
  let changed = 0;
  for (const a of data.answers) if (!current[a.id] || a.updatedAt > current[a.id].updatedAt) {
    current[a.id] = { verdict: a.verdict, errors: a.errors, context: a.context, updatedAt: a.updatedAt };
    changed++;
  }
  return changed;
}
