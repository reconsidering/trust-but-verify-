import type { ActResult, Instance } from './types';

/** Use scene evidence, not the aggregate verdict or tag/hint-driven role odds. */
export function analSwitchEvidence(act: ActResult, pairing: string): [Instance, Instance] | undefined {
  const names = pairing.split('/').map(name => name.trim());
  if (names.length !== 2 || !names[0] || !names[1] || names[0] === names[1]) return;
  const directions = names.map((top, n) => act.instances
    .filter(scene => scene.top === top && scene.bottom === names[1 - n]
      && Number.isFinite(scene.confidence) && scene.confidence! >= 0.75 && scene.confidence! <= 1
      && scene.act.split(',').some(label => /^anal sex(?: \(riding\))?$/.test(label.trim())))
    .sort((a, b) => b.confidence! - a.confidence!)[0]);
  if (directions[0] && directions[1]) return [directions[0], directions[1]];
}

export function renderAnalSwitchIndicator(act: ActResult, pairing: string): HTMLElement | undefined {
  const evidence = analSwitchEvidence(act, pairing);
  if (!evidence) return;
  const box = document.createElement('details');
  box.className = 'anal-switch-indicator';
  const summary = document.createElement('summary');
  summary.textContent = 'Anal role switching found · High-confidence scenes';
  box.append(summary);
  const explanation = document.createElement('p');
  explanation.textContent = 'Each partner tops in at least one anal scene scored 75% or higher. This can include scenes at different points in the work.';
  box.append(explanation);
  const list = document.createElement('ul');
  for (const scene of evidence) {
    const item = document.createElement('li');
    item.textContent = `${scene.top} tops ${scene.bottom} · ${Math.round(scene.confidence! * 100)}% sure${scene.where ? ` · ${scene.where}` : ''}`;
    list.append(item);
  }
  box.append(list);
  return box;
}
