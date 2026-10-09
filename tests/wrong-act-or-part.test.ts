// @vitest-environment jsdom
import{describe,it,expect}from'vitest';import{emptyMeta,type Ao3Meta}from'../src/ao3';import{analyzeWithPatterns,type AuditHit}from'../src/heuristic';
// The wrong act or body part, or contact counted as penetration. Invented adults; every sentence is a paraphrase.
const META:Ao3Meta={...emptyMeta(),rating:'Explicit',categories:['M/M'],fandoms:['Original Work'],relationships:['Morgan Vale/Rowan Marsh'],characters:['Morgan Vale','Rowan Marsh'],freeforms:[]};
const run=(text:string)=>{const hits:AuditHit[]=[];analyzeWithPatterns('Morgan and Rowan are adult men.\n\n'+text.split('||').join('\n\n'),META,{quiet:true,audit:h=>hits.push(h)});return hits;};
const anal=(hits:AuditHit[])=>hits.filter(h=>h.kind==='act'&&h.cat==='anal'&&h.act.startsWith('anal sex'));
const base=(h:AuditHit)=>h.via.replace(/~elided$/,'');
describe('drying off is not masturbation',()=>{
 it('“rubbed himself down” with a towel',()=>{
  expect(run('Rowan buries his face in Morgan’s shirt, breathing him in, and pulls away when his cock twitches.||He rubs himself down, shaking his head at the intrusion of having someone in his space.').filter(h=>base(h)==='mast-himself')).toEqual([]);
 });
 it('still reads a man stroking himself',()=>{
  expect(run('Rowan stroked himself slowly in the dark, breathing hard.').filter(h=>base(h)==='mast-himself').length).toBeGreaterThan(0);
 });
});
describe('sucking a thumb is not a blowjob',()=>{
 it('hollowed cheeks around a thumb the sentence before',()=>{
  expect(run('Morgan traced Rowan’s lip, letting the tip of his thumb slide inside. Rowan sucked on it, wrapping his tongue around it, hollowing his cheeks.').filter(h=>base(h)==='hollowed-cheeks')).toEqual([]);
 });
 it('still reads hollowed cheeks in a blowjob with fingers nearby',()=>{
  expect(run('Rowan took Morgan into his mouth in one swift movement. Morgan gasped, fingers fisting in his hair. Rowan worked him slowly, swirling over the tip, hollowing his cheeks to pull him deeper.').filter(h=>h.cat==='oral'&&h.kind==='act').length).toBeGreaterThan(0);
 });
 it('still reads hollowed cheeks around a cock',()=>{
  expect(run('Rowan knelt and took Morgan’s cock deep, sucking hard, hollowing his cheeks.').filter(h=>h.cat==='oral'&&h.act==='blowjob').length).toBeGreaterThan(0);
 });
});
describe('“fucking him with his mouth” is oral, not anal sex',()=>{
 it('a fantasy of a mouth',()=>{
  expect(run('Rowan stared at the bathroom tiles.||“Fuck!” He just came, untouched, thinking about Morgan fucking him with his mouth.').filter(h=>base(h)==='fuck'&&/anal sex/.test(h.act))).toEqual([]);
 });
 it('still reads a plain fucking',()=>{
  expect(anal(run('Rowan stared at the bathroom tiles.||Morgan fucked him hard.')).length).toBeGreaterThan(0);
 });
});
describe('relaxing into a body is not pushing into it',()=>{
 it('“sinking into his body” in a bath',()=>{
  expect(run('Morgan had fucked him raw the night before, and his ass still ached.||He scoots over, leaving room for Morgan to join him. Morgan sheds his clothes and settles into the bath behind him. The warmth of Morgan’s body against his skin has Rowan sinking into his body, letting the water lap against them.').filter(h=>base(h)==='push-into')).toEqual([]);
 });
 it('still reads sinking into a body that is meant',()=>{
  expect(anal(run('Morgan sank into Rowan’s ass with a groan.')).length).toBeGreaterThan(0);
 });
});
describe('heat spreading is not an ass around a cock',()=>{
 it('“the heat from his ass work its way to his cock”',()=>{
  expect(anal(run('Rowan squeezed his thighs together, feeling the heat from his ass work its way to his cock.'))).toEqual([]);
 });
});
describe('fingers held to a nose are not inserted',()=>{
 it('shoving them under his own nose',()=>{
  expect(run('Morgan held his slick fingers to Rowan’s nose, waited, then shoved his fingers under his own nose and breathed in.').filter(h=>h.act==='fingering')).toEqual([]);
 });
 it('still reads fingers shoved in',()=>{
  expect(run('Morgan shoved two fingers into Rowan’s ass.').filter(h=>h.act==='fingering').length).toBeGreaterThan(0);
 });
});
