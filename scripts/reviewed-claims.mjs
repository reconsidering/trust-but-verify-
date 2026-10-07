// A review belongs to a claim, not merely to the sentence that produced it.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function claimOf(hit, fic, sourceSha) {
  return {fic, sourceSha, paragraph: hit.para, pattern: hit.via ?? hit.pattern,
    act: hit.act, kind: hit.kind, a: hit.a ?? '', b: hit.b ?? '', role: hit.role ?? ''};
}
export function sameClaim(reviewed, current) {
  return ['fic','sourceSha','paragraph','pattern','act','kind','a','b','role']
    .every(k => (reviewed[k] ?? '') === (current[k] ?? ''));
}
export function reviewedClaims(root) {
  const manifests = new Map();
  const reviewDir = join(root, 'public/review');
  if (existsSync(reviewDir)) for (const file of readdirSync(reviewDir).filter(f => f.endsWith('.json')).sort()) {
    const batch = JSON.parse(readFileSync(join(reviewDir,file),'utf8'));
    if (batch.schema === 'engine-review-batch/v1') manifests.set(batch.batchId,batch);
  }
  const out = new Map();
  for (const file of readdirSync(join(root,'tests/labels')).filter(f => f.endsWith('.json')).sort()) {
    const labels = JSON.parse(readFileSync(join(root,'tests/labels',file),'utf8'));
    const batch = manifests.get(labels.batchId);
    for (const answer of labels.answers ?? []) {
      if (!answer.key) continue;
      const row = batch?.rows.find(r => r.id === answer.id && r.key === answer.key);
      // Missing metadata must not turn a versioned review into an unversioned label.
      const source = batch?.sources.find(s => s.file === row?.fic);
      out.set(answer.key, answer.claim ?? (row && source ? claimOf(row,row.fic,source.sourceSha) : null));
    }
    for (const key of Object.keys(labels.superseded ?? {})) out.set(key,null);
  }
  return out;
}
export function cacheFingerprint(files, features) {
  const hash = createHash('sha256').update(JSON.stringify(features));
  for (const file of [...new Set(files)].sort()) hash.update(file).update('\0').update(readFileSync(file)).update('\0');
  return hash.digest('hex');
}
export function validRowsCache(cache, fingerprint, featureCount) {
  return cache?.schema === 'engine-learning-rows/v2' && cache.fingerprint === fingerprint &&
    Array.isArray(cache.rows) && cache.rows.length > 0 && cache.rows.every(r =>
      typeof r.key === 'string' && typeof r.fic === 'string' && ['0','1'].includes(String(r.y)) &&
      Number.isFinite(r.wt) && r.wt > 0 && Array.isArray(r.f) && r.f.length === featureCount && r.f.every(Number.isFinite));
}
