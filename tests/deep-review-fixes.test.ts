// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// Fixes from the owner's Sugar Alpha and New Bitch deep reviews. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string,meta=META)=>{const hits:AuditHit[]=[];const r=analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),meta,{quiet:true,audit:h=>hits.push(h)});return{hits,pair:r.pairings[0]};};
const anal=(hits:AuditHit[])=>hits.filter(h=>h.kind==='act'&&h.cat==='anal'&&h.act.startsWith('anal sex'));

describe('a plug belongs to whoever is in the scene, not to the tagged chastity wearer',()=>{
 const meta:Ao3Meta={...META,relationships:['Morgan Vale/Rowan Marsh','Avery Lane/Quinn Hart'],characters:['Morgan Vale','Rowan Marsh','Avery Lane','Quinn Hart'],freeforms:['Cock Cages','Avery Lane wears a cock cage']};
 it('does not credit the tagged wearer when the scene is someone else’s',()=>{
  const{hits}=run('Morgan kissed Rowan and pressed him down onto the bed.||Morgan slicked a black plug and eased it into Rowan’s ass until it sat snug.',meta);
  expect(hits.filter(h=>h.via==='plug-worn'&&h.a==='Avery Lane')).toEqual([]);
 });
 it('does not credit the tagged wearer for a sentence about someone else, even with the wearer nearby',()=>{
  const{hits}=run('Avery sat across the classroom, bored.||Later Rowan shifted in his seat and remembered the plug inside him.',meta);
  expect(hits.filter(h=>h.via==='plug-worn'&&h.a==='Avery Lane')).toEqual([]);
 });
});

describe('oral scenes are not anal sex',()=>{
 it('“pushes all the way in” while his mouth is full is the mouth',()=>{
  expect(anal(run('Rowan knelt and sucked Morgan’s cock, his lips stretched wide around it.||Morgan teased his mouth with shallow thrusts until he pushed all the way in.').hits)).toEqual([]);
 });
 it('“rocks in deep, holding his jaw” after a blowjob is the mouth',()=>{
  expect(anal(run('Rowan swallowed around Morgan’s cock, gagging.||“That’s it,” Morgan said, holding his jaw steady while he rocked in deep.').hits)).toEqual([]);
 });
 it.each([
  'Rowan blinked up at Morgan as he thrust into him, then licked the come from his lips.',
  'Morgan’s hand flew up to cover Rowan’s mouth as Morgan thrust his cock into Rowan in one stroke.',
  'Rowan was sucking a mark into Morgan’s neck. Morgan thrust into him with abandon.',
 ])('keeps anal sex when a mouth, a gasp or a sucked finger is only nearby: %s',text=>{
  expect(anal(run(text).hits).length).toBeGreaterThan(0);
 });
 it('keeps a real anal scene that follows a blowjob and names the hole',()=>{
  expect(anal(run('Rowan sucked Morgan’s cock until he was hard.||Morgan lubed up, lined up with Rowan’s hole and pushed all the way in.').hits).length).toBeGreaterThan(0);
 });
});

describe('clothed rubbing is not penetration',()=>{
 it('thrusts while still fully clothed, ending in his trousers, are not anal sex',()=>{
  expect(anal(run('Morgan, still fully clothed, ground down on Rowan, the force of his thrusts pushing Rowan up the bed until Morgan came in his trousers.').hits)).toEqual([]);
 });
 it('rubbing a clothed length along a cock is frottage, not a handjob',()=>{
  const{hits}=run('Morgan kissed Rowan hard on the bed. Morgan rubbed his fully clothed length along Rowan’s cock.');
  expect(hits.filter(h=>h.via.startsWith('hj-stroke')).map(h=>h.act)).not.toContain('handjob');
 });
});

describe('the tagged wearer keeps a plug in a scene with their partner',()=>{
 const meta:Ao3Meta={...META,freeforms:['Dom/sub','Sub Rowan']};
 it('keeps the plug when the partner is named only with a possessive or as the one acting',()=>{
  const{hits}=run('Morgan told him to bend over.||He ends up over Morgan’s knee, a silicone plug nudging his prostate every time Morgan’s palm lands.',meta);
  expect(hits.filter(h=>h.via==='plug-worn'&&h.a==='Rowan Marsh').length).toBe(1);
 });
 it('keeps the plug when the sentence names the partner pulling it out of the wearer',()=>{
  expect(run('Rowan lay sprawled on the bed, wrung out.||Morgan crawled onto the bed, gently easing the plug from Rowan’s stretched hole.',meta).hits.filter(h=>h.via==='plug-worn'&&h.a==='Rowan Marsh').length).toBe(1);
 });
 it('keeps the plug when “want” is about something else in the sentence',()=>{
  expect(run('Rowan’s lips desperately want to complain about the plug sitting deep in his ass.',meta).hits.filter(h=>h.via==='plug-worn'&&h.a==='Rowan Marsh').length).toBe(1);
 });
 it('does not read a plan as a plug being worn',()=>{
  expect(run('“I want you plugged all evening,” Morgan said.',meta).hits.filter(h=>h.via==='plug-worn')).toEqual([]);
 });
});

describe('single readings from the reviews',()=>{
 it('a finger on a lift button is not fingering',()=>{
  expect(run('Morgan kissed Rowan in the car park, then jammed his finger into the lift button.').hits.filter(h=>h.act==='fingering')).toEqual([]);
 });
 it('a finger alongside a cock in a mouth is not anal fingering',()=>{
  expect(run('Rowan sucked Morgan’s cock, lips swollen.||Morgan pushed in a finger and Rowan gagged around both.').hits.filter(h=>h.act==='fingering')).toEqual([]);
 });
 it('a fingertip at the rim with insertion explicitly denied is not fingering',()=>{
  expect(run('Morgan’s finger circled his rim, pressing but not putting it in.').hits.filter(h=>h.act==='fingering')).toEqual([]);
 });
 it('the slit of a cock is not a vulva',()=>{
  expect(run('Morgan took the head of Rowan’s cock in his mouth, tonguing his slit.').hits.filter(h=>h.act==='cunnilingus')).toEqual([]);
 });
 it('working a plug in with slick fingers is a toy, not fingering',()=>{
  expect(run('Morgan slicked his fingers, working a thick plug into Rowan’s ass.').hits.filter(h=>h.kind==='act'&&h.cat==='anal').map(h=>h.act)).not.toContain('fingering');
 });
 it('clenching around a knot is not masturbation',()=>{
  expect(run('Morgan’s knot swelled inside him and Rowan clenched, squeezing himself around it.').hits.filter(h=>h.act==='masturbation')).toEqual([]);
 });
 it('rubbing an erection against buttocks is contact, not a handjob',()=>{
  expect(run('Morgan rubbed his erection against Rowan’s buttocks.').hits.filter(h=>h.act==='handjob')).toEqual([]);
 });
 it('taking his cock out to slide inside is not a handjob or masturbation',()=>{
  expect(run('Morgan took his cock out of his boxers, spat in his hand and used it to make the slide inside Rowan easier.').hits.filter(h=>h.act==='handjob'||h.act==='masturbation')).toEqual([]);
 });
});
