import { expect, it } from 'vitest';
import { handsFreeOrgasmEvidence, renderHandsFreeOrgasmIndicator } from '../src/hands-free-orgasm';
import type { ActResult, Desire } from '../src/types';

const reading = (extra: Partial<Desire> = {}): Desire => ({
  who: 'Rowan Marsh', role: 'bottom', wants: true, kind: 'body',
  act: 'hands-free orgasm', where: 'Chapter 2', confidence: 0.85,
  evidence: 'Rowan climaxes without manual stimulation during the encounter.',
  ...extra,
});
const pairing = 'Morgan Vale/Rowan Marsh';

it('uses the individual reading score, with 75% included and lower or unavailable scores excluded', () => {
  expect(handsFreeOrgasmEvidence({ desires: [reading({ confidence: 0.75 })] }, pairing)).toHaveLength(1);
  for (const confidence of [0.749, 0.39, undefined, NaN, Infinity, -1, 1.1]) {
    expect(renderHandsFreeOrgasmIndicator({ desires: [reading({ confidence })] }, pairing)).toBeUndefined();
  }
  const anal: ActResult = {
    verdict: 'one_way', top: 'Morgan Vale', bottom: 'Rowan Marsh', summary: '',
    instances: [], desires: [], confidence: { score: 0.99, label: 'High', reasons: [] },
    people: [{ name: 'Rowan Marsh', top: 0, bottom: 0.99 }],
  };
  expect(renderHandsFreeOrgasmIndicator(anal, pairing)).toBeUndefined();
});

it('does not turn wishes, fantasies, historical mentions or a prostate orgasm alone into a hands-free event', () => {
  for (const kind of ['wanted', 'fantasy', 'hypothetical', 'history', 'said', 'prep'] as const) {
    expect(handsFreeOrgasmEvidence({ desires: [reading({ kind, confidence: 0.99 })] }, pairing)).toEqual([]);
  }
  for (const extra of [{ wants: false }, { act: 'prostate orgasm' }, { role: 'top' as const }]) {
    expect(handsFreeOrgasmEvidence({ desires: [reading(extra)] }, pairing)).toEqual([]);
  }
});

it('keeps evidence within the pairing and rejects ambiguous pairing membership', () => {
  expect(handsFreeOrgasmEvidence({ desires: [reading({ who: 'Taylor Reed' })] }, pairing)).toEqual([]);
  for (const names of ['Morgan Vale/Rowan Marsh/Taylor Reed', 'Rowan Marsh/Rowan Marsh', ' /Rowan Marsh']) {
    expect(handsFreeOrgasmEvidence({ desires: [reading()] }, names)).toEqual([]);
  }
});

it('shows expandable evidence, score and location for either receiving character in a switching pair', () => {
  const desires = [reading(), reading({ who: 'Morgan Vale', confidence: 0.95, where: 'Chapter 4' })];
  const box = renderHandsFreeOrgasmIndicator({ desires }, pairing)!;
  expect(box.tagName).toBe('DETAILS');
  expect(box.querySelector('summary')?.textContent).toContain('Bottom has a hands-free orgasm');
  expect(box.querySelectorAll('li')[0].textContent).toContain('Morgan Vale · 95% sure · Chapter 4');
  expect(box.querySelectorAll('li')[1].textContent).toContain('Rowan Marsh · 85% sure · Chapter 2');
  expect(box.querySelector('.evidence')?.textContent).toBe(desires[0].evidence);
  expect(desires[0].who).toBe('Rowan Marsh'); // Display sorting does not reorder the analysis.
});

it('renders uploaded evidence as text, rather than interpreting HTML', () => {
  const evidence = '<img src=x onerror="throw new Error()">';
  const box = renderHandsFreeOrgasmIndicator({ desires: [reading({ evidence })] }, pairing)!;
  expect(box.querySelector('.evidence')?.textContent).toBe(evidence);
  expect(box.querySelector('img')).toBeNull();
});
