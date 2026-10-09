export interface HandsFreePicked { n: number; key: string; detected: boolean; manualNearby: boolean; stratumWeight: number | null }
export interface HandsFreeTally { n: number; yes: number; touched: number; other: number; unsure: number; unanswered: number }
export interface HandsFreeSummary { flagged: HandsFreeTally; clear: HandsFreeTally; manual: HandsFreeTally; precision: number | null; estimatedMissed: number | null; recall: number | null; missedKeys: string[] }
export function summarise(picked: HandsFreePicked[], answers: Record<string | number, string>): HandsFreeSummary;
