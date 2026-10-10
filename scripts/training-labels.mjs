// Audit assignments are keyed by claim identity; later owner files retain their precedence.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
export function trainingLabels(dir) {
  const out = new Map();
  const files = readdirSync(dir).filter(f=>f.endsWith('.json')).sort().map(file=>({file,data:JSON.parse(readFileSync(join(dir,file),'utf8'))}));
  // Provisional AI files may replace the initial agent audit, never an owner assignment,
  // even when a future owner import sorts before the corroboration filename.
  const ownerKeys = new Set(files.filter(({file,data})=>!data.weights && !/^audit(?:[-.]|$)/.test(file)).flatMap(({data})=>Object.keys(data.labels ?? {})));
  for (const {file,data} of files) {
    for (const [key,label] of Object.entries(data.labels ?? {})) {
      if (data.weights && ownerKeys.has(key)) continue;
      if (label === 'unclear') continue;
      const weight = data.weights?.[key] ?? 1;
      if (!Number.isFinite(weight) || weight <= 0 || weight > 1) throw Error(`Invalid label weight: ${file} ${key}`);
      out.set(key,{label,weight});
    }
    for (const key of Object.keys(data.superseded ?? {})) if (!data.weights || !ownerKeys.has(key)) out.delete(key);
  }
  return out;
}
