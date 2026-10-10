// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { emptyMeta, type Ao3Meta } from '../src/ao3';
import { analyzeWithPatterns, type AuditHit } from '../src/heuristic';

// Invented adult paraphrases. These test act, people and occurrence, not regex IDs.
const meta: Ao3Meta = {...emptyMeta(), rating:'Explicit', fandoms:['Original Work'], categories:['M/M'], relationships:['Morgan Vale/Rowan Marsh'], characters:['Morgan Vale','Rowan Marsh']};
const run = (text:string) => {
  const hits:AuditHit[]=[];
  analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text,meta,{quiet:true,audit:h=>hits.push(h)});
  return hits;
};
const finger = (h:AuditHit) => /fingering/.test(h.act) && ['act','solo'].includes(h.kind);
const toy = (h:AuditHit) => /toy/.test(h.act) && ['act','solo'].includes(h.kind);
const has = (hits:AuditHit[],type:typeof finger,a:string,b:string,para?:number) => hits.some(h=>type(h)&&h.a===''+a+' Vale'&&(h.b===b+' Marsh'||a===b&&h.kind==='solo')&&(para===undefined||h.para===para));
const paired = (text:string,type:typeof finger,para?:number) => expect(has(run(text),type,'Morgan','Rowan',para)).toBe(true);
const none = (text:string,type:typeof finger) => expect(run(text).filter(type)).toEqual([]);

describe('finger/toy handoff: direct finger anatomy',()=>{
  it('F01: participial pumping has a human performer and explicit target',()=>paired('Morgan crouched behind Rowan, pumping three fingers into Rowan’s anus.',finger));
  it('F03: retained fingers remain a performed finger act in ordinary past narration',()=>paired('Morgan had two slick fingers deep inside Rowan’s anus, curling them slowly.',finger));
  it('F04: a named finger owner touching a prostate is not penile penetration',()=>{
    const hits=run('Morgan’s fingers brushed Rowan’s prostate.');
    expect(has(hits,finger,'Morgan','Rowan')).toBe(true);
    expect(hits.filter(h=>h.kind==='act'&&h.act==='anal sex')).toEqual([]);
  });
  it('F08: fingertip insertion survives alongside an explicit penile act',()=>{
    const hits=run('Morgan pushed his cock into Rowan’s anus. Morgan pressed the tip of one finger into Rowan’s anus alongside his cock.');
    expect(has(hits,finger,'Morgan','Rowan')).toBe(true);
    expect(hits.some(h=>h.kind==='act'&&h.act==='anal sex'&&h.a==='Morgan Vale'&&h.b==='Rowan Marsh')).toBe(true);
  });
  it('F12: fingers stroke an anal rim without needing entry',()=>paired('Morgan stroked Rowan’s anal rim with two fingers.',finger));
  it('explicitly remembered retained fingers stay historical',()=>{
    const hits=run('Rowan remembered Morgan had two slick fingers deep inside Rowan’s anus.');
    expect(hits.filter(finger)).toEqual([]);
    expect(hits.some(h=>/fingering/.test(h.act)&&h.kind==='history')).toBe(true);
  });
  it('fingers on a glove, face or furniture do not count',()=>{
    for(const text of ['Morgan had two fingers deep inside his glove.','Morgan stroked Rowan’s cheek with two fingers.','Morgan pumped lotion into his hand.'])none(text,finger);
  });
});
describe('finger/toy handoff: reinsertion guard',()=>{
  it('F05: withdrawal and explicit reinsertion retain the finger instrument',()=>paired('Morgan pushed one finger into Rowan’s anus.\n\nMorgan draws his finger out and presses in again.',finger,2));
  it('a body-part reaction does not become penetration',()=>none('Morgan’s fingers flex, pressing into a cushion.',finger));
  it('an explicit penis after withdrawal overrides finger reinsertion wording',()=>{
    const hits=run('Morgan pushed one finger into Rowan’s anus.\n\nMorgan draws his finger out and presses in again with his cock.');
    expect(hits.some(h=>h.para===2&&finger(h))).toBe(false);
    expect(hits.some(h=>h.para===2&&h.kind==='act'&&h.act==='anal sex')).toBe(true);
  });
  it('a condom after withdrawal ends fingers',()=>{
    const hits=run('Morgan pushed one finger into Rowan’s anus.\n\nMorgan draws his finger out, puts on a condom and presses in again.');
    expect(hits.filter(h=>h.para===2&&finger(h))).toEqual([]);
  });
});
describe('finger/toy handoff: self-use',()=>{
  it('F11: explicit self-fingering is not assigned to a sleeping partner',()=>{
    const hits=run('Morgan was asleep. Rowan was alone and fingered his own hole, his fingers sliding inside.');
    expect(hits.some(h=>finger(h)&&h.kind==='solo'&&h.a==='Rowan Marsh')).toBe(true);
    expect(hits.some(h=>finger(h)&&h.kind==='act')).toBe(false);
  });
  it('F11: reaching around to poke the own opening remains self-use',()=>{
    const hits=run('Morgan was asleep. Rowan arched his back to use two fingers to poke his hole.');
    expect(hits.some(h=>finger(h)&&h.kind==='solo'&&h.a==='Rowan Marsh')).toBe(true);
  });
  it('F11: the person turned toward is not the self-fingering actor',()=>{
    const hits=run('Morgan was asleep.\n\nHe takes hold of his cock. Turning toward Morgan, he shifts on his side, arching his back to use two fingers to poke his hole.');
    expect(hits.some(h=>finger(h)&&h.kind==='solo'&&h.a==='Rowan Marsh')).toBe(true);
    expect(hits.some(h=>finger(h)&&h.a==='Morgan Vale')).toBe(false);
  });
  it('effort interrupted before contact is not performed',()=>none('Rowan tried to get his fingers inside his own anus, but stopped before they touched it.',finger));
});
describe('finger/toy handoff: bounded toy references',()=>{
  it('T01: toy subject follows named manipulation',()=>paired('Morgan lubricated a plug for Rowan’s anus. The plug slid into Rowan’s anus and settled behind the rim.',toy));
  it('T02: next size has a locally introduced plug referent',()=>{
    const hits=run('Rowan was alone and had an anal plug.\n\nRowan inserted the next size into his own anus.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo'&&h.a==='Rowan Marsh'&&h.para===2)).toBe(true);
  });
  it('T03: removal then new selection supports completed pronoun insertion',()=>{
    const hits=run('Rowan was alone. Rowan removed the plug from his anus and picked up a larger plug.\n\nRowan lubricated it and inserted it into his own anus.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo'&&h.a==='Rowan Marsh'&&h.para===2)).toBe(true);
  });
  it('an explicit partner target does not become implicit self-placement',()=>{
    const hits=run('Morgan lubricated a plug for Rowan’s anus. Morgan pushes it in.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo'&&h.a==='Morgan Vale')).toBe(false);
  });
  it('partner toy removal and an embedded lubricant explanation are not self-use',()=>{
    const hits=run('Rowan has a plug in his anus. Morgan spreads lube around his entrance.\n\nMorgan pulls the plug out of Rowan. The plug slides out with the lube Morgan used to push it inside.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo')).toBe(false);
  });
  it('a later finger referent cannot inherit an earlier toy',()=>{
    const hits=run('Morgan held a plug near Rowan’s anus, then set it down. Morgan lubricated one finger at Rowan’s anus. It slides in.');
    expect(hits.some(h=>toy(h))).toBe(false);
  });
  it('planning the next plug size is wanted, not a performed insertion',()=>{
    const hits=run('Rowan was alone and had an anal plug.\n\nRowan will put in the next size into his own anus.');
    expect(hits.filter(toy)).toEqual([]);
    expect(hits.some(h=>/toy/.test(h.act)&&h.kind==='wanted')).toBe(true);
  });
  it('storage and a scene break do not establish a toy act',()=>{
    none('Morgan lubricated a plug. The plug slid into its case.',toy);
    none('Rowan picked up a plug.\n\n***\n\nRowan inserted it into a box.',toy);
  });
});
describe('finger/toy handoff: aliases and ongoing use',()=>{
  it('T04: a prostate massager inserted in an own anus is a self toy act',()=>{
    const hits=run('Rowan inserted a prostate massager into his own anus.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo'&&h.a==='Rowan Marsh')).toBe(true);
  });
  it('T05: fake penis stays a toy at an explicit anal target',()=>{
    const hits=run('Rowan was alone with a dildo. Rowan lowered his anus onto the fake cock.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo'&&h.a==='Rowan Marsh')).toBe(true);
    expect(hits.some(h=>h.kind==='act'&&h.act==='anal sex')).toBe(false);
  });
  it('T05: physical toy activation is separate from imagined partner activity',()=>{
    const hits=run('Rowan was alone with an inflatable dildo.\n\nRowan activates the toy, its inflatable knot swelling. The full bulb filling Rowan’s ass brings relief.');
    expect(hits.some(h=>toy(h)&&h.kind==='solo'&&h.a==='Rowan Marsh'&&h.para===2)).toBe(true);
  });
  it('T06: a moving stimulator has an established anal target',()=>paired('Morgan placed a stimulator inside Rowan’s anus.\n\nMorgan moved the stimulator back and forth inside Rowan.',toy,2));
  it('a surface device or an oral toy does not become anal use',()=>{
    none('Morgan moved the stimulator along Rowan’s arm.',toy);
    none('Rowan put a dildo in his mouth.',toy);
  });
});
describe('finger/toy handoff: preparation and residue',()=>{
  it('F06: opening a named anus using oiled fingers is performed',()=>paired('Morgan oiled his fingers and coaxed Rowan’s anus open with them.',finger));
  it('F07: fingers entering residue require a recently established anatomical site',()=>paired('Morgan withdrew his cock from Rowan’s anus. Morgan pushed two fingers into the lubricant left inside Rowan’s anus.',finger));
  it('F07: guiding the partner’s hand is not a reversed finger act',()=>{
    const hits=run('Morgan withdrew his cock from Rowan’s anus. Rowan reaches for Morgan’s hand and guides it back into his body as Morgan slides two fingers into the wetness he just left inside him.');
    expect(has(hits,finger,'Morgan','Rowan')).toBe(true);
    expect(hits.some(h=>finger(h)&&h.a==='Rowan Marsh'&&h.b==='Morgan Vale')).toBe(false);
  });
  it('oiling alone and fingers in spilled lubricant are not performed',()=>{
    none('Morgan oiled his fingers and waited.',finger);
    none('Morgan pushed two fingers into the lubricant spilled on the table.',finger);
  });
});
