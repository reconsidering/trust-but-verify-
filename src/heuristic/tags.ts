// Reads role and act information from AO3 "Additional Tags" (e.g. "Bottom Harry Potter", "Switching", "Rimming").

import type { Cast, Character } from "./characters";

export interface TagRole {
  char: Character;
  role: "top" | "bottom" | "switch";
  tag: string;
  /** "Power Bottom" bosses the bed, "Service Top" aims to please, "Pillow Prince" lies back and receives. */
  style?: "power" | "service" | "pillow";
}

/** "Dominant Dean", "Submissive Cas", "Dom!Dean": a dynamic, which leans top or bottom but isn't the same thing. */
export interface TagDynamic {
  char: Character;
  lean: "top" | "bottom";
  tag: string;
}

export interface TagInfo {
  roles: TagRole[];
  dynamics: TagDynamic[];
  /** Tags about the pair's power dynamic or praise without saying who ("Dom/sub", "Praise Kink", "Daddy Kink"). */
  dynamicTags: string[];
  switching: string[];
  /** Tags saying an act happens, by category. */
  anal: string[];
  oral: string[];
  rimming: string[];
  blowjobs: string[];
}

const ROLE_PATTERNS: { re: RegExp; role: TagRole["role"] }[] = [
  // "Bottom Harry Potter", "Bottom!Harry", "Power Bottom Harry", "Bottom Harry (mostly)"
  { re: /^(?:power |service |pillow |dom |sub |dominant |submissive |brat |bratty |soft |needy |eager |greedy |reluctant |rough |gentle )?(bottoming|topping|bottom|top|switch|vers(?:atile)?)(?:\s*!\s*|\s+)(.+)$/i, role: "top" },
  // "Harry Potter Bottoms", "Harry is a bottom", "Harry Tops", "Harry Is A Switch"
  { re: /^(.+?)\s+(?:(?:is|as|=)\s+(?:the |a |an )?(?:total |power |service |pillow )?)?(bottoming|topping|bottoms?|tops?|switch(?:es)?|vers(?:atile)?)$/i, role: "top" },
];

function normalizeRole(word: string): TagRole["role"] {
  const w = word.toLowerCase();
  if (w.startsWith("bottom")) return "bottom";
  if (w.startsWith("top")) return "top";
  return "switch";
}


/** Words that name a leading (top-leaning) or following (bottom-leaning) side of a power dynamic. */
const DYN_TOP = ["dominant", "domme", "dommy", "dom", "daddy", "mommy", "master", "mistress", "sir", "owner", "handler", "caregiver", "keyholder", "key holder", "trainer", "controlling"];
const DYN_BOTTOM = ["submissive", "subby", "sub", "brat", "bratty", "little", "pet", "puppy", "pup", "kitten", "slave", "good boy", "good girl", "princess", "baby boy", "baby girl"];
const DYN_ALL = [...DYN_TOP, ...DYN_BOTTOM].sort((a, b) => b.length - a.length).join("|");
const DYN_BEFORE = new RegExp(`^(${DYN_ALL})(?:\\s*!\\s*|\\s+)(.+)$`, "i");
const DYN_AFTER = new RegExp(`^(.+?)\\s+(?:is (?:a |an |the )?)?(${DYN_ALL})$`, "i");
/** Words common enough in other tags ("Little Spoon", "Pet Names") that only an exact character name after them counts. */
const DYN_STRICT = new Set(["little", "pet", "puppy", "pup", "kitten", "slave", "princess", "good boy", "good girl", "baby boy", "baby girl", "owner", "handler", "trainer", "controlling", "sir", "keyholder", "key holder"]);
const dynLean = (word: string): "top" | "bottom" | undefined => (DYN_TOP.includes(word.toLowerCase()) ? "top" : DYN_BOTTOM.includes(word.toLowerCase()) ? "bottom" : undefined);

export function readTags(freeforms: string[], cast: Cast): TagInfo {
  const info: TagInfo = { roles: [], dynamics: [], dynamicTags: [], switching: [], anal: [], oral: [], rimming: [], blowjobs: [] };
  const findExact = (name: string): Character | undefined => {
    const n = name.replace(/\([^)]*\)/g, "").replace(/[!]/g, " ").trim().toLowerCase();
    return n ? cast.chars.find((c) => c.name.toLowerCase() === n || c.aliases.some((al) => al.toLowerCase() === n)) : undefined;
  };
  const findChar = (name: string): Character | undefined => {
    const n = name.replace(/\([^)]*\)/g, "").replace(/[!]/g, " ").trim();
    if (!n) return undefined;
    const lower = n.toLowerCase();
    return (
      cast.chars.find((c) => c.name.toLowerCase() === lower) ??
      cast.chars.find((c) => c.aliases.some((a) => a.toLowerCase() === lower)) ??
      cast.chars.find((c) => n.split(/\s+/).some((p) => c.aliases.includes(p)))
    );
  };

  for (const raw of freeforms) {
    const tag = raw.trim();
    const t = tag.toLowerCase();

    if (/^(?:(?:(?:both|all|they|everyone)\s+(?:are\s+)?)?(?:switch(?:es|ing)?|vers(?:atile)?|verse)(?:\s+(?:roles?|dynamics?|top|bottom|tops?\/bottoms?|pair|couple|relationship|boys|characters|both))?|(?:switch(?:ing)?|versatile|vers)\s+(?:top|bottom)(?:\s*\/\s*(?:top|bottom))?|(?:switch(?:ing)?|versatile)\s*\/\s*(?:switch(?:ing)?|versatile)|vers\s*\/\s*vers|top\/bottom switch(?:ing)?|top\s*\/\s*bottom\s+(?:switching|versatile)|role\s*switch(?:ing)?|bottoming from the top|topping from the bottom)$/.test(t)) {
      if (!/from the/.test(t) || /^(?:bottoming|topping)/.test(t)) info.switching.push(tag);
      continue;
    }
    // "Versatile Steve/Eddie", "Switch Steve/Eddie": the word applies to both names.
    {
      const vm = tag.match(/^(switch(?:ing)?|vers(?:atile)?)\s*!?\s+(.+?)\s*\/\s*(.+)$/i);
      if (vm) {
        const cs = [findChar(vm[2]), findChar(vm[3])].filter((c): c is Character => !!c);
        if (cs.length) { for (const char of cs) info.roles.push({ char, role: "switch", tag }); continue; }
      }
    }
    // "Top Castiel/Bottom Dean Winchester" is two role tags in one.
    const parts = /^(?:power |service |pillow |dom |sub |dominant |submissive )?(?:bottoming|topping|bottom|top|switch|vers)\b.*\/\s*(?:power |service |pillow |dom |sub |dominant |submissive )?(?:bottoming|topping|bottom|top|switch|vers)\b/i.test(tag)
      ? tag.split("/").map((x) => x.trim())
      : [tag];
    for (const part of parts) {
      for (const { re } of ROLE_PATTERNS) {
        const m = part.match(re);
        if (!m) continue;
        const [roleWord, name] = re === ROLE_PATTERNS[0].re ? [m[1], m[2]] : [m[2], m[1]];
        const char = findChar(name);
        if (char) {
          const style = /^(power|service|pillow)\b/i.exec(part)?.[1]?.toLowerCase() as TagRole["style"] | undefined;
          info.roles.push({ char, role: normalizeRole(roleWord), tag, style });
          break;
        }
      }
    }

    // "Pillow Prince Dean", "Size Queen Cas": the one who lies back and receives.
    {
      const pm = tag.match(/^(?:pillow (?:prince|princess|queen)|size queen)\s*!?\s*(.+)$/i);
      const pc = pm && findChar(pm[1]);
      if (pc) info.roles.push({ char: pc, role: "bottom", tag, style: "pillow" });
    }
    // "Dominant Dean", "Dom!Cas", "Daddy Eddie", "Brat Steve", "Cas Is A Sub", "Steve Is The Brat": a dynamic, top-leaning or bottom-leaning.
    for (const part of tag.split("/").map((x) => x.trim())) {
      const dm = part.match(DYN_BEFORE);
      const dm2 = dm ? undefined : part.match(DYN_AFTER);
      const [word, name] = dm ? [dm[1], dm[2]] : dm2 ? [dm2[2], dm2[1]] : ["", ""];
      const dc = word && (DYN_STRICT.has(word.toLowerCase()) ? findExact(name) : findChar(name));
      const lean = word ? dynLean(word) : undefined;
      if (dc && lean) info.dynamics.push({ char: dc, lean, tag });
    }
    // Omegaverse: "Alpha Dean", "Omega!Cas", "Cas Is An Omega". Alphas lean toward leading, omegas toward following.
    {
      const am = tag.match(/^(alpha|omega)\s*!?\s+(.+)$/i) ?? tag.match(/^(.+?)\s+(?:is (?:an? )?)(alpha|omega)$/i);
      const [word, name] = am ? (/^(?:alpha|omega)$/i.test(am[1]) ? [am[1], am[2]] : [am[2], am[1]]) : ["", ""];
      const ac = word && findChar(name);
      if (ac) info.dynamics.push({ char: ac, lean: /^alpha/i.test(word) ? "top" : "bottom", tag });
    }
    if (/dom\/sub|dominant\/submissive|\bd\/s\b|praise kink|good boy|good girl|daddy kink|degradation|power (?:dynamics?|imbalance|play)|bdsm|master\/pet|owner\/pet|caregiver|littlespace|little space|brat(?:ty| taming| tamer)?|service submission|subspace|topspace|sub ?drop|dom ?drop|power exchange|mommy kink|daddy dom|collars?|leash(?:es)?|pet play|puppy play|pup play|kitten play|humiliation|discipline|punishment|obedience|ownership|dom\/switch|sub\/switch|d\/s dynamics?|femdom|maledom|bondage|denial|orgasm control|tease and denial|pet names?|chastity|cock[- ]?cage|key ?holder|primal play|sir kink|master\/slave|service top|submissive|dominant|\bdom\b|\bsub\b/.test(t) && !info.dynamics.some((d) => d.tag === tag)) info.dynamicTags.push(tag);

    if (/\brim(?:ming|med|s)?\b|\brim ?jobs?|ass eating|eating ass|ass licking|anal?ingus|tongue[- ]?fuck|ass worship|butt worship|eating (?:his |her |their )?ass/.test(t)) info.rimming.push(tag);
    if (/blow ?jobs?|fellatio|deep ?throat|face[- ]fuck|cock ?sucking|oral fixation|cock ?warming|throat ?fuck|mouth ?fuck|cock worship|sucking (?:cock|dick)|spit-?roast|swallowing|cum ?swallow|\bsixty-?nine\b|\b69\b/.test(t)) info.blowjobs.push(tag);
    if (/\boral\b|blow ?jobs?|rim(?:ming)?\b|rim ?jobs?|cunnilingus|deep ?throat|face[- ]fuck|cock ?sucking|cock ?warming|throat ?fuck|mouth ?fuck|eating (?:out|ass|her out|him out)|spit-?roast|\bsixty-?nine\b|\b69\b|face ?sitting/.test(t)) info.oral.push(tag);
    if (/\banal\b|first time bottoming|bottoming|riding|anal sex|barebacking|knotting|pegging|prostate|butt ?plugs?|fisting|gaping|dildos?|sex toys?|strap-?on|double penetration|stretching|spit-?roast|anal (?:play|fingering|training|beads)|fingering/.test(t)) info.anal.push(tag);
  }
  return info;
}
