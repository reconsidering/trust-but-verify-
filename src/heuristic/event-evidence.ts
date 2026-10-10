// Bounded evidence for an action's continuation; nearby words alone are not proof.
export type Instrument = 'finger' | 'toy' | 'tongue' | 'penis';
const INSERT = /\b(?:push|press|slip|slid|sink|sank|insert|ease|penetrat|bottom)\w*\b/i;
const PART = /\b(?:thumbs?|fingers?|digits?|knuckles?|plugs?|dildos?|vibrators?|toys?|tongue|cock|dick|penis|shaft)\b/gi;
export function continuationInstrument(match:string,before:string,after:string):Instrument|undefined {
  const direct=[...match.matchAll(PART)].pop()?.[0].toLowerCase();
  const type=(p:string):Instrument=>/thumb|finger|digit|knuckle/.test(p)?'finger':/plug|dildo|vibrator|toy/.test(p)?'toy':p==='tongue'?'tongue':'penis';
  if(direct) return type(direct);
  if(!INSERT.test(match)) return;
  const later=/^\s*[,;]?[^.!?]{0,65}\b(?:with|using|by)\s+(?:his|her|their|a|the)\s+(thumb|finger|plug|dildo|tongue|cock|dick|penis)\b/i.exec(after);
  if(later) return type(later[1].toLowerCase());
  const prior=before.slice(-650);
  // The last finger or toy named has since been taken out or replaced: what follows is a new act.
  if(instrumentEnded(prior)) return;
  // Named instruments used on hair/clothes or explicitly removed cannot continue insertion.
  const candidates=[...prior.matchAll(PART)].filter(m=>{
    const tail=prior.slice(m.index!+m[0].length);
    // A verb such as "let me plug the opening" does not name an inserted plug.
    if(/^plugs?$/i.test(m[0]) && !/\b(?:a|the|his|her|their|my|your)\b[^.!?]{0,35}\s$/i.test(prior.slice(Math.max(0,m.index!-40),m.index!))) return false;
    const selectedToy=/plug|dildo|vibrator|toy/i.test(m[0]) && /\b(?:pick(?:s|ed|ing)?\s+up|grabb?\w*|hold\w*|reach\w*\s+for|fetch\w*|retriev\w*|g[eo]t|got|took|take|bring|brought|produc\w*)\s+(?:a|the|his|her|their|that|this)\s*$/i.test(prior.slice(Math.max(0,m.index!-45),m.index!));
    return !/\bhad\s+(?:helped|stretched|loosened)\b/i.test(tail.slice(0,45)) && !/\b(?:hair|curls|sheets|shirt|jaw|scalp|lips|mouth|face)\b/i.test(tail.slice(0,50)) &&
      !/\b(?:withdraw|remov|pull\w*\s+(?:out|free)|take\w*\s+out)\w*/i.test(tail) &&
      (selectedToy || /\b(?:rim|anus|asshole|hole|ass|arse|inside|lube|lubricant|lubricat\w*)\b/i.test(prior.slice(Math.max(0,m.index!-80),m.index!+150)));
  });
  const last=candidates.pop();
  if(last) return type(last[0].toLowerCase());
  return undefined;
}

/** An explicitly named action subject; names in reactions or possessive objects do not qualify. */
export function namedActionOwner(before:string,names:string):string|undefined {
  const re=new RegExp(`\\b(${names})(?:['’]s\\s+(?:finger|thumb|hand|tongue)\\b|\\s+(?:(?:did|does|was|is|had)\\s+(?:not\\s+|n['’]t\\s+)?(?:even\\s+)?|didn['’]t\\s+(?:even\\s+)?)?(?:squirt|oil|lubricat|scissor|insert|push|slip|slid|wrap|dip|lower|move|ran|run|take|takes|took|taking)\\w*\\b)`, 'g');
  return [...before.slice(-650).matchAll(re)].pop()?.[1];
}

export type OccurrenceContext = 'history' | 'fantasy' | 'wanted' | 'habitual' | 'recording';
/** Only explicit framing extends beyond a match; ordinary past-tense narration stays performed. */
export function occurrenceContext(prefix:string,sentence:string,previous:string,next:string):OccurrenceContext|undefined {
  if(/\b(?:now|back in the present|returned to the present|in reality)\b/i.test(prefix.slice(-70))) return;
  if(/\b(?:memor(?:y|ies) of|remember(?:ed|ing|s) (?:how|when|the|that|him|her|them)|recall(?:ed|ing|s) (?:how|when|that))\b/i.test(prefix.slice(-240))) return 'history';
  if(/\bmissed (?:work|class|the meeting) because\b/i.test(prefix)) return 'history';
  if(/\bthe fact that\b/i.test(prefix) && /\b(?:touched|stroked|jerked)\b[^.!?]{0,80}\b(?:watching|watched) (?:that|the) video\b/i.test(sentence)) return 'history';
  if(/\b(?:image|sight|picture|vision) of\b/i.test(prefix) && /\b(?:appear\w*|flash\w*|form\w*)\b[^.!?]{0,80}\b(?:head|mind|imagination)\b/i.test(sentence)) return 'fantasy';
  if(/\bidea of\b/i.test(prefix)) return 'fantasy';
  if(/\bremembered\s+[A-Z][a-z]+/.test(prefix)) return 'history';
  if(/\bneed(?:ed|s)?\s+to\s+be\s+(?:knotted|fucked|taken)\b/i.test(prefix)) return 'wanted';
  if(/\b(?:imagin(?:es|ed|ing)|fantasi[sz](?:es|ed|ing)|pictur(?:es|ed|ing))\b/i.test(prefix.slice(-160))) return 'fantasy';
  if(/\babout\s+to\s+(?:come|cum|jerk|masturbat)\w*\b/i.test(prefix)) return 'wanted';
  if(/\bneed(?:ed|s)?\s+to\s*$/i.test(prefix)) return 'wanted';
  if(/\b(?:orders?|ordered|asks?|asked|tells?|told)\s+(?:[\w'’-]+\s+){1,2}to\s*$/i.test(prefix.slice(-100))) return 'wanted';
  if(/\b(?:every night|each morning|habitually|usually|routinely)\b/i.test(prefix) && /\bwould\b/i.test(sentence)) return 'habitual';
  // "She had sodomized him with some regularity", "Swears some nights when he closes his eyes and fists his own cock": a habit, not one event.
  if(/\b(?:some|most|many|certain)\s+nights?\b|\bwith (?:some|great|considerable|any) regularity\b|\bregularly\b/i.test(sentence)) return 'habitual';
  // "Dean heard him jerking off in the shower last night", "Like his show this morning when he got himself off": an earlier occasion, mentioned.
  if(/\b(?:last night|yesterday|this morning|earlier today|the other (?:day|night))\b/i.test(sentence) && (/\b(?:heard|overheard|remember\w*|recall\w*)\b/i.test(sentence) || /^\W*(?:just )?like\b/i.test(sentence))) return 'history';
  // "He had masturbated furiously on the shirt": a past perfect looks back at an earlier occasion.
  if(/\bhad\s+(?:\w+ly\s+)?(?:masturbated|jerked(?: off)?|wanked|stroked himself)\b/i.test(sentence)) return 'history';
  // "if he knew a little more about the Alpha, he might stick his fingers inside himself": a conditional, not an act.
  if(/\b(?:if|unless)\b[^.!?]{0,80},\s*(?:he|she|they|[A-Z][\w'’-]+)\s+(?:might|could|would|may)\b[^.!?]{0,30}$/i.test(prefix)) return 'wanted';
  if(/\b(?:video|recording|film)\b[^.!?]{0,70}\b(?:shows?|showed|of)\s*$/i.test(prefix.slice(-130))) return 'recording';
  // An explicit retrospective dating sentence applies to the preceding description only.
  if(/^\s*That was (?:almost |nearly |over )?(?:\w+\s+){0,3}(?:days?|weeks?|months?|years?) ago\b/i.test(next) && /\b(?:had|hadn['’]t|earlier|since)\b/i.test(sentence)) return 'history';
  if(/^\s*(?:He|She|They|[A-Z][\w'’-]+)\s+(?:remembered|recalled)\b/i.test(previous) && !/\b(?:now|today|back to)\b/i.test(sentence) && /\bhad\b/i.test(sentence)) return 'history';
}

export function restraintOnlyHold(match:string,following:string):boolean {
  return /\b(?:grip|grab|hold|held|clutch|seiz)\w*\b/i.test(match) &&
    /\b(?:holds?|held|keep\w*|kept)\b[^.!?]{0,50}\b(?:steady|still|in place)\b/i.test(following.slice(0,170)) &&
    !/\b(?:strok|pump|jerk|rub|work)\w*\b/i.test(match+' '+following.slice(0,170));
}

/**
 * True when the text before a match says the finger or toy last used has been taken out or replaced, so a bare "pushed in" after it is a new act:
 * "pulled his fingers out, rolled on a condom and pushed in", "took the plug out, lined himself up and pushed inside".
 */
export function instrumentEnded(before:string):boolean {
  const last=[...before.matchAll(/\b(?:thumbs?|fingers?|digits?|knuckles?|plugs?|dildos?|vibrators?|toys?)\b/gi)].pop();
  if(!last) return false;
  const tail=before.slice(last.index!+last[0].length);
  return /\b(?:out|free|away|aside)\b/i.test(tail.slice(0,25)) || /\b(?:withdr[ae]w\w*|remov\w*|replac\w*|rolled?\s+on\s+(?:a|the)\s+condom|lin(?:ed|es|ing)\s+(?:him|her|them|it|himself|herself|themselves)\s*(?:self\s*)?up|slick(?:ed|s|ing)\s+(?:his|her|their)\s+(?:cock|dick|length))/i.test(tail);
}


/** Same finger is deliberately reinserted, without an intervening replacement instrument. */
export function reinsertedFinger(match:string,before:string):boolean {
  return /\b(?:press|push)\w*\s+in\s+again\b/i.test(match) &&
    /\b(?:draw|draws|drew|pull|pulls|pulled)\s+(?:his|her|their|the)\s+finger\s+out\s*$/i.test(before);
}
