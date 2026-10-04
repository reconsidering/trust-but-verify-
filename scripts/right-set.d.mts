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
}
export interface RightSet { fic: string; title: string; entries: RightEntry[] }
export function normKey(s: string): string;
export function hashKey(s: string): string;
export function slugOf(title: string): string;
export function baseVia(v: string): string;
export function idOf(e: Partial<RightEntry>): string;
export function parseReport(md: string): { title: string; slug: string; right: (Omit<RightEntry, "marks"> & { side: string })[]; wrong: (Omit<RightEntry, "marks"> & { side: string })[] };
export function mergeReport(set: Partial<RightSet>, parsed: ReturnType<typeof parseReport>, date: string): { added: number; confirmed: number; disputed: number };
export function strengthOf(e: RightEntry): "strong" | "single" | "disputed" | "retired";
