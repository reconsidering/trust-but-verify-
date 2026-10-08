import JSZip from "jszip";
import { extractFromHtml } from "../src/extract";
import { splitParagraphs } from "../src/text";

export type ReviewSource = { file: string; title: string; sourceSha: string; paragraphSha: string; paragraphCount: number };
export type ReadingProposal = { revision: string; verdict: "correct" | "wrong" | "uncertain"; reading: string; rationale: string; confidence: number; errors: string[] };
export type SceneActProposal = { id: string; revision: string; act: string; performer: string; receiver: string; occurrence: string; evidence: { from: number; to: number }; reviewerConfidence: number; note: string; engineReadingKeys: string[]; engineConfidence: number | null };
export type SceneEngineReading = { key: string; para: number; pattern: string; act: string; kind: string; claim: string; confidence: number | null; a: string; b?: string; role?: string; features: number[]; attribution: Record<string, string | number | boolean> };
export type ActReview = { revision: string; verdict?: "correct" | "wrong" | "uncertain"; act: string; performer: string; receiver: string; occurrence: string; context: string; errors: string[] };
export type PastLabel = { source: string; verdict: "ok" | "wrong" | "unclear"; provenance: string; date?: string; claim: string; identityVerified: boolean; key: string; weight?: number; confidence?: number; retired?: string; errors?: string[] };
export type LabelAudit = { pastLabels: PastLabel[]; priority: number; occurrence: string; changed: boolean; quarantined: boolean; status: string; reasons: string[]; recentEvidence: string[]; referenceClaim?: string; referenceCommit?: string; referenceIsOriginal?: boolean };
export type ReviewRow = { id: string; key: string; fic: string; para: number; pattern: string; a: string; b?: string; act: string; kind: string; role?: string; claim: string; gold?: { file: string; hash: string; pairing: string; act: string; verdict: string }; evidence?: { from: number; to: number }[]; engineConfidence?: number; proposal?: ReadingProposal; sceneActs?: SceneActProposal[]; engineReadings?: SceneEngineReading[]; trainingNotes?: string[]; labelAudit?: LabelAudit };
export type ReviewBatch = { schema: "engine-review-batch/v1" | "engine-gold-review/v1" | "engine-gold-range-review/v1"; batchId: string; engineCommit: string; sources: ReviewSource[]; rows: ReviewRow[]; selection?: { method: string; answerFile?: string; [key: string]: unknown } };
export type ReviewAnswer = { verdict?: "correct" | "wrong" | "uncertain"; errors: string[]; context: string; updatedAt: string; proposalReview?: "agree" | "disagree" | "uncertain"; proposalRevision?: string; actReviews?: Record<string, ActReview>; coverageComplete?: boolean; pastLabelReview?: "keep" | "replace" | "uncertain" };

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
  if (a.pastLabelReview !== undefined && !['keep', 'replace', 'uncertain'].includes(a.pastLabelReview)) return false;
  if (a.coverageComplete !== undefined && typeof a.coverageComplete !== 'boolean') return false;
  if (a.actReviews !== undefined && (!a.actReviews || typeof a.actReviews !== 'object' || Array.isArray(a.actReviews) || Object.values(a.actReviews).some(r => !r || typeof r !== 'object' || typeof r.revision !== 'string' || !r.revision || !['act','performer','receiver','occurrence','context'].every(k => typeof r[k as keyof ActReview] === 'string') || (r.verdict !== undefined && !['correct','wrong','uncertain'].includes(r.verdict)) || !Array.isArray(r.errors) || r.errors.some(e => typeof e !== 'string')))) return false;
  if ((a.proposalReview !== undefined || a.proposalRevision !== undefined) && (!['agree', 'disagree', 'uncertain'].includes(a.proposalReview ?? '') || typeof a.proposalRevision !== 'string' || !a.proposalRevision.trim())) return false;
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
    if (a.proposalReview && a.proposalRevision !== row.proposal?.revision) throw Error("An answer refers to a different proposed reading.");
    for (const [id, review] of Object.entries(a.actReviews ?? {})) if (!row.sceneActs?.some(act => act.id === id && act.revision === review.revision)) throw Error('An answer refers to a different act proposal.');
    if (a.coverageComplete !== undefined && !row.sceneActs) throw Error('This batch does not support act coverage answers.');
    if (a.pastLabelReview !== undefined && !row.labelAudit) throw Error('This batch does not support past-label answers.');
    if (row.sceneActs && JSON.stringify(a.evidence) !== JSON.stringify(row.evidence)) throw Error('An answer does not match its scene window.');
    if (batch.schema === "engine-gold-range-review/v1" && (JSON.stringify(a.gold) !== JSON.stringify(row.gold) || JSON.stringify(a.evidence) !== JSON.stringify(row.evidence))) throw Error("An answer does not match its gold range.");
    seen.add(a.id);
  }
  let changed = 0;
  for (const a of data.answers) if (!current[a.id] || a.updatedAt > current[a.id].updatedAt) {
    current[a.id] = { verdict: a.verdict, errors: a.errors, context: a.context, updatedAt: a.updatedAt, ...(a.proposalReview ? { proposalReview: a.proposalReview, proposalRevision: a.proposalRevision } : {}), ...(a.actReviews ? { actReviews: structuredClone(a.actReviews) } : {}), ...(a.coverageComplete !== undefined ? { coverageComplete: a.coverageComplete } : {}), ...(a.pastLabelReview ? {pastLabelReview: a.pastLabelReview} : {}) };
    changed++;
  }
  return changed;
}

/** Past judgments and current claims stay separate; neither assistant nor historical verdicts prefill answers. */
export function validatePastLabelBatch(batch: ReviewBatch): ReviewBatch {
  const score = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
  if (batch.schema !== 'engine-review-batch/v1' || batch.rows.length !== 50 || !batch.selection?.method || !/^[a-f0-9]{40}$/.test(batch.engineCommit)) throw Error('The past-label review is incomplete.');
  const ids = new Set<string>(), keys = new Set<string>();
  for (const row of batch.rows) {
    const source = batch.sources.find(s => s.file === row.fic), audit = row.labelAudit, proposal = row.proposal;
    if (!source || ids.has(row.id) || keys.has(row.key) || !Number.isInteger(row.para) || row.para < 0 || row.para >= source.paragraphCount || !score(row.engineConfidence) || !proposal || !score(proposal.confidence) || !proposal.revision || !proposal.reading || !proposal.rationale || !['correct','wrong','uncertain'].includes(proposal.verdict) || !audit?.pastLabels.length || !audit.status || !audit.occurrence || !row.evidence?.length || row.evidence.some(e => !Number.isInteger(e.from) || !Number.isInteger(e.to) || e.from < 0 || e.from > row.para || e.to < row.para || e.to >= source.paragraphCount)) throw Error('A past-label item is missing its claim, confidence, history or citation.');
    for (const label of audit.pastLabels) if (!['ok','wrong','unclear'].includes(label.verdict) || !label.source || !label.key || !label.claim || !label.provenance || typeof label.identityVerified !== 'boolean' || (label.confidence !== undefined && !score(label.confidence))) throw Error('A historical label has invalid provenance.');
    ids.add(row.id); keys.add(row.key);
  }
  return batch;
}

/** Validate the scored batch before showing any assistant proposals. */
export function validateSuspectBatch(batch: ReviewBatch, expectedRows = 40): ReviewBatch {
  const score = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
  if (batch.schema !== 'engine-review-batch/v1' || batch.rows.length !== expectedRows || !batch.selection?.method || !/^[a-f0-9]{40}$/.test(batch.engineCommit)) throw Error('The likely-error review batch is incomplete.');
  const ids = new Set<string>(), keys = new Set<string>();
  for (const row of batch.rows) {
    const p = row.proposal, source = batch.sources.find(s => s.file === row.fic);
    if (ids.has(row.id) || keys.has(row.key) || !source || !Number.isInteger(row.para) || row.para < 0 || row.para >= source.paragraphCount || !score(row.engineConfidence) || !p || !score(p.confidence) || !p.revision || !p.reading?.trim() || !p.rationale?.trim() || !['correct', 'wrong', 'uncertain'].includes(p.verdict) || !Array.isArray(p.errors) || !p.errors.every(e => typeof e === 'string') || !row.evidence?.length || row.evidence.some(e => !Number.isInteger(e.from) || !Number.isInteger(e.to) || e.from < 0 || e.to >= source.paragraphCount || e.from > row.para || e.to < row.para)) throw Error('A likely-error reading has invalid confidence, context, or proposal metadata.');
    ids.add(row.id); keys.add(row.key);
    if (row.sceneActs !== undefined) {
      const eventIds = new Set<string>(), hitKeys = new Set(row.engineReadings?.map(h => h.key));
      if (!row.sceneActs.length || !row.engineReadings?.length || hitKeys.size !== row.engineReadings.length) throw Error('Missing or duplicate scene act metadata.');
      for (const hit of row.engineReadings) if (!hit.key || !hit.claim || !Number.isInteger(hit.para) || hit.para < row.evidence![0].from || hit.para > row.evidence![0].to || (hit.confidence !== null && !score(hit.confidence)) || !hit.features.every(Number.isFinite)) throw Error('Invalid scene engine reading.');
      for (const act of row.sceneActs) {
        if (eventIds.has(act.id) || !act.id || !act.revision || !act.act || !act.performer || !act.occurrence || !score(act.reviewerConfidence) || (act.engineConfidence !== null && !score(act.engineConfidence)) || !Number.isInteger(act.evidence.from) || !Number.isInteger(act.evidence.to) || act.evidence.from < row.evidence![0].from || act.evidence.to > row.evidence![0].to || act.evidence.from > act.evidence.to || act.engineReadingKeys.some(k => !hitKeys.has(k))) throw Error('Invalid scene act proposal.');
        const scores = row.engineReadings.filter(h => act.engineReadingKeys.includes(h.key)).map(h => h.confidence).filter((v): v is number => v !== null);
        if (act.engineConfidence !== (scores.length ? Math.max(...scores) : null)) throw Error('Act confidence does not match its engine readings.');
        eventIds.add(act.id);
      }
    }
  }
  return batch;
}
