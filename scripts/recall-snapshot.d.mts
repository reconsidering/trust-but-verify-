export function sha256(s: string): string;
export function engineFingerprint(root?: string): string;
export function paragraphHash(p: string): string;
export function recallCollector(): {
  audit: (h: { para: number; via: string; kind: string; cat?: string; act: string; a: string; b?: string; role?: string }) => void;
  debug: (d: { paras: string[] }) => void;
  snapshot: (html: string, fingerprint: string) => { engineFingerprint: string; sourceSha: string; paragraphSha: string; paragraphVerified: boolean; paragraphHashes: string[]; hits: unknown[] };
};
export function writeRecallSnapshot(cacheDir: string, file: string, snapshot: unknown): void;
export function recallCacheExists(cacheDir: string, file: string): boolean;
