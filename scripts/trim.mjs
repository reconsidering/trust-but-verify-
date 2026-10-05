// Which paragraphs of a fic does a scene-listing helper need to read? The helper's job is an independent list of every sex scene; most of a fic is plot, and
// reading all of it costs tokens and attention. This keeps a paragraph when ANY of these holds, and cuts the rest (numbers stay the same):
//   1. explicit wording: two or more paragraphs with explicit words within 8 paragraphs either side;
//   2. build-up / fade-to-black cues: three or more paragraphs with soft cues (undressing, bed, "made love", "afterwards", "the next morning", sore, sheets…)
//      or explicit words within 5 paragraphs either side. Writing that cuts away from the act is still sex, and it is the build-up and the morning after
//      that give it away;
//   3. near the engine: within 2 paragraphs of a reading the engine made or of a candidate in the missed-paragraph pack.
// Falls back to reading everything when the tags say the fic is fade-to-black / implied sex, when the cut would keep under 25% of the text (the vocabulary is
// not catching this fic), or when it would keep over 85% (nothing to save).
// The word lists are deliberately plain searches that do not use the engine, so the list the helper makes stays independent of it.
export const EXPLICIT = /\b(?:cock|dick|prick|erection|hard-?on|balls|hole|rim|entrance|ass|arse|prostate|thrust\w*|fuck\w*|knot\w*|lube\w*|slick\w*|condom|orgasm\w*|cum|come|came|coming|moan\w*|blowjob|suck\w*|swallow\w*|lick\w*|tongue|nipples?|naked|straddl\w*|ride|riding|grind\w*|stroke\w*|jerk\w*|spread|inside him|inside me|fingers?|bite|bit|scent|sweat\w*|gasp\w*|pant\w*)\b/i;
export const SOFT = new RegExp(
  "\\b(?:" + [
    // undressing, touching, getting to bed
    "undress\\w*", "strip\\w*", "unbutton\\w*", "unzip\\w*", "shirtless", "bare|bared", "nude", "bed", "bedroom", "sheets", "mattress",
    "kiss\\w*", "thighs?", "bulge", "hardness", "arous\\w*",
    "pull\\w* (?:him|her|them) (?:closer|down|onto|into)", "pushed? (?:him|her|them) (?:onto|against|down)", "pinned", "lap", "straddl\\w*", "on (?:top|his back|his knees)",
    "(?:lights?|candles?) (?:out|off)", "door (?:closed|locked|shut)", "locked the door", "took (?:him|her|them)", "entered", "entering", "mated?|mating",
    // euphemism and cutting away
    "made love", "make love", "making love", "slept together", "sleep together", "had sex", "having sex", "intimate\\w*", "intimacy", "consummat\\w*", "together that night",
    "pleasure\\w*", "ecstasy", "climax\\w*", "shudder\\w*", "whimper\\w*", "groan\\w*", "breathless",
    // the morning after
    "afterglow", "aftermath", "the next morning", "next morning", "sore", "tangled", "clean(?:ed|ing) (?:him|her|them|up)", "sated", "bruis\\w*", "bitemark\\w*", "hickeys?",
  ].join("|") + ")\\b", "i");
export const FADE_TAGS = /fade[- ]to[- ]black|implied sex|off-?screen sex|non-?explicit|sex (?:is )?implied|referenced sex|mentioned sex|sex mentioned|closed door/i;

/** paras: the fic's paragraphs; flagged: paragraph numbers the engine read or listed as candidates; freeforms: the fic's additional tags. */
export function trim(paras, flagged = [], freeforms = []) {
  const n = paras.length;
  const hard = paras.map((p) => EXPLICIT.test(p));
  const soft = paras.map((p, i) => hard[i] || SOFT.test(p));
  const prefix = (a) => { const s = [0]; for (const x of a) s.push(s[s.length - 1] + (x ? 1 : 0)); return s; };
  const ph = prefix(hard), ps = prefix(soft);
  const within = (pre, i, k) => pre[Math.min(n, i + k + 1)] - pre[Math.max(0, i - k)];
  const keep = new Array(n).fill(false);
  for (let i = 0; i < n; i++) keep[i] = within(ph, i, 8) >= 2 || within(ps, i, 5) >= 3;
  for (const f of flagged) for (let j = Math.max(0, f - 2); j <= Math.min(n - 1, f + 2); j++) keep[j] = true;
  const chars = paras.reduce((a, p) => a + p.length, 0) || 1;
  const kept = paras.reduce((a, p, i) => a + (keep[i] ? p.length : 0), 0);
  const share = kept / chars;
  let mode = "trimmed", why = `keeps ${(share * 100).toFixed(0)}% of the text`;
  if (freeforms.some((t) => FADE_TAGS.test(t))) { mode = "full"; why = "tags say fade-to-black or implied sex"; }
  else if (share < 0.25) { mode = "full"; why = `the cut would keep only ${(share * 100).toFixed(0)}% of the text: the word lists are not catching this fic`; }
  else if (share > 0.85) { mode = "full"; why = `the cut would keep ${(share * 100).toFixed(0)}% of the text: nothing to save`; }
  return { keep, share, mode, why };
}

/** The text the helper reads: kept paragraphs numbered as in the fic, with a marker where paragraphs were left out. */
export function trimmedText(paras, keep, offset = 0) {
  const out = [];
  let gap = null;
  paras.forEach((p, i) => {
    if (keep[i]) {
      if (gap) { out.push(`[paragraphs ${gap[0] + offset}–${gap[1] + offset} left out: nothing sexual or leading up to it]`); gap = null; }
      out.push(`[${i + offset}] ${p}`);
    } else gap = gap ? [gap[0], i] : [i, i];
  });
  if (gap) out.push(`[paragraphs ${gap[0] + offset}–${gap[1] + offset} left out: nothing sexual or leading up to it]`);
  return out.join("\n");
}
