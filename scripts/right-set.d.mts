export interface RightEntry {
  kind: "scene" | "hint" | "solo";
  card: string;
  pairing: string;
  h: string;
  via?: string;
  top?: string;
  bottom?: string;
  who?: string;
  role?: string;
  wants?: boolean;
  conf?: number;
  marks: { right: number; wrong: number };
  seen?: string[];
  disputedOn?: string[];
  retired?: boolean | string;
  misread?: boolean;
  /** Below 1 for labels from an unverified pass; absent = the owner's own mark (1). */
  weight?: number;
  /** Exact claim-bound audit record supplies this observation; do not count twice. */
  trainingDelegated?: boolean;
  corroboration?: {id:string;batchId:string;confidence:number;engineCommit:string};
  source?: string;
}
export interface RightSet { fic: string; title: string; entries: RightEntry[]; negatives?: RightEntry[] }
export const MISREAD_LABELS: string[];
export function normKey(s: string): string;
export function hashKey(s: string): string;
export function slugOf(title: string): string;
export function baseVia(v: string): string;
export function idOf(e: Partial<RightEntry>): string;
export function parseReport(md: string): { title: string; slug: string; right: (Omit<RightEntry, "marks"> & { side: string })[]; wrong: (Omit<RightEntry, "marks"> & { side: string })[] };
export function mergeReport(set: Partial<RightSet>, parsed: ReturnType<typeof parseReport>, date: string, opts?: { weight?: number; weightWrong?: number; source?: string }): { added: number; confirmed: number; disputed: number };
export function strengthOf(e: RightEntry): "strong" | "single" | "weighted" | "disputed" | "retired";
export function weightOf(e: Partial<RightEntry>): number;
export function allowedWeightedChanges(n: number, meanWeight: number): number;
