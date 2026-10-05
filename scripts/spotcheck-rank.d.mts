export interface Answer { key: string; fic: string; via: string; kind: string; p?: number; claude: "ok" | "wrong"; owner: string }
export interface Round { round: number; date: string; answers: Answer[] }
export interface Cand { key: string; fic: string; via: string; kind: string; p?: number; claude: "ok" | "wrong"; [k: string]: unknown }
export const baseOf: (via: string) => string;
export function answeredRows(rounds: Round[]): (Answer & { disagree: number })[];
export function fitLogistic(X: number[][], y: number[], lambda?: number, iters?: number): number[];
export function auc(ps: number[], ys: number[]): number;
export function train(rounds: Round[]): { score: ((c: Partial<Cand>) => number) | null; rows: number; loo: number; weights?: number[]; base?: number };
export function rank(cands: Cand[], rounds: Round[], opts?: { n?: number; explore?: number; perPattern?: number }): { picked: (Cand & { score: number; picked: string })[]; model: ReturnType<typeof train>; available: number };
