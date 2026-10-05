export const EXPLICIT: RegExp;
export const SOFT: RegExp;
export const FADE_TAGS: RegExp;
export function trim(paras: string[], flagged?: number[], freeforms?: string[]): { keep: boolean[]; share: number; mode: "trimmed" | "full"; why: string };
export function trimmedText(paras: string[], keep: boolean[], offset?: number): string;
