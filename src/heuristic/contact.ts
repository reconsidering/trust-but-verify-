/** Explicit external contact is a directional hint, not an insertion. */
export const PENIS_BUTTOCK_CONTACT = 'penis against buttocks';
export function explicitPenisButtockContact(pattern:string,match:string):boolean {
 return /^(?:rut-against-ass|grind-cock-on-ass|grind-ass-back|dd-frot-rut-against|penis-rests-against-buttocks|buttocks-rest-against-penis)$/.test(pattern) &&
  /\b(?:cock|dick|penis|prick|shaft|erection|hard-?on)\b/i.test(match) && /\b(?:ass|arse|butt|buttocks|backside|bum)\b/i.test(match);
}
