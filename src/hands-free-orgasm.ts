import type { ActResult, Desire } from './types';

/** Explicit performed-orgasm readings only; aggregate role scores cannot establish an orgasm. */
export function handsFreeOrgasmEvidence(anal: Pick<ActResult, 'desires'>, pairing: string): Desire[] {
  const names = pairing.split('/').map(name => name.trim());
  if (names.length !== 2 || names.some(name => !name) || names[0] === names[1]) return [];
  return anal.desires.filter(reading =>
    reading.act === 'hands-free orgasm' && reading.kind === 'body' && reading.wants &&
    reading.role === 'bottom' && names.includes(reading.who) &&
    Number.isFinite(reading.confidence) && reading.confidence! >= 0.75 && reading.confidence! <= 1,
  ).sort((a, b) => b.confidence! - a.confidence!);
}

export function renderHandsFreeOrgasmIndicator(anal: Pick<ActResult, 'desires'>, pairing: string): HTMLElement | undefined {
  const readings = handsFreeOrgasmEvidence(anal, pairing);
  if (!readings.length) return;
  const box = document.createElement('details');
  box.className = 'hands-free-orgasm-indicator';
  const summary = document.createElement('summary');
  summary.textContent = 'Bottom has a hands-free orgasm · High-confidence evidence';
  box.append(summary);
  const explanation = document.createElement('p');
  explanation.textContent = 'At least one hands-free orgasm reading scores 75% or higher. It supports the receiving role; anal fingering or toys can also be involved.';
  box.append(explanation);
  const list = document.createElement('ul');
  for (const reading of readings) {
    const item = document.createElement('li');
    item.textContent = `${reading.who} · ${Math.round(reading.confidence! * 100)}% sure${reading.where ? ` · ${reading.where}` : ''}`;
    if (reading.reasons?.length) item.title = reading.reasons.join('; ');
    if (reading.evidence) {
      const evidence = document.createElement('div');
      evidence.className = 'evidence';
      evidence.textContent = reading.evidence;
      item.append(evidence);
    }
    list.append(item);
  }
  box.append(list);
  return box;
}
