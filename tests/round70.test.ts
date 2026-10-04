import { describe, expect, it } from "vitest";
import { emptyMeta } from "../src/ao3";
import { noteContext } from "../src/heuristic/notes";
import { readTags } from "../src/heuristic/tags";
import { checkTags } from "../src/heuristic/tagcheck";

describe("wider notes vocabulary", () => {
  it("reads bottoming/topping verbs and extra role words, but not idioms", () => {
    const c = noteContext({ summary: "Steve bottoms and Eddie tops. Daddy Bucky. Power Bottom Sam. The cake tops the list." });
    expect(c.tags).toEqual(expect.arrayContaining(["Steve is a bottom", "Eddie is a top", "Daddy Bucky", "Power Bottom Sam"]));
    expect(c.tags.some((t) => /list|cake/i.test(t))).toBe(false);
  });
  it("turns POV statements and kink keywords into tags", () => {
    const c = noteContext({ notes: "Told from Steve's POV, with some power dynamics and praise kink. Alternating POV later." });
    expect(c.tags).toEqual(expect.arrayContaining(["Steve POV", "Alternating POV", "Power Dynamics", "Praise Kink"]));
    expect(noteContext({ notes: "No degradation here." }).tags).not.toContain("Degradation");
  });
  it("wider cage and collar words switch the scans on", () => {
    expect(noteContext({ notes: "Features male chastity and keyholding." }).cage).toBe(true);
    expect(noteContext({ notes: "Some puppy play." }).collar).toBe(true);
  });
});

describe("wider tag vocabulary", () => {
  const tags = (...f: string[]) => readTags(f, { byAlias: new Map(), aliasPattern: "", chars: [] } as never);
  it("a chastity device tag is a cage, not orgasm denial", () => {
    const paras = ["Steve felt the cage tighten on his cock.", "Eddie held the key and smirked; the cage stayed on.", "Chastity was the rule."];
    const out = checkTags(["Chastity Device"], tags("Chastity Device"), [], paras, () => "ch1");
    const c = out.find((x) => x.tag === "Chastity Device");
    expect(c?.status).toBe("supported");
    expect(c?.note).not.toMatch(/denial/i);
  });
  it("more kink spellings are recognised", () => {
    const out = checkTags(["Spreader Bar", "Puppy Play"], tags("Spreader Bar", "Puppy Play"), [], ["He was restrained with a spreader bar.", "The leash clipped to his collar."], () => "ch1");
    expect(out.map((c) => c.tag)).toEqual(expect.arrayContaining(["Spreader Bar", "Puppy Play"]));
  });
});

describe("vers / versatile / switch in tags and notes", () => {
  const cast = (() => {
    const steve = { name: "Steve Harrington", aliases: ["Steve"] }, eddie = { name: "Eddie Munson", aliases: ["Eddie"] };
    const byAlias = new Map<string, unknown>([["Steve", steve], ["Steve Harrington", steve], ["Eddie", eddie], ["Eddie Munson", eddie]]);
    return { byAlias, aliasPattern: "Steve Harrington|Eddie Munson|Steve|Eddie", chars: [steve, eddie] } as never;
  })();
  it("generic switching tags in many spellings", () => {
    for (const t of ["Switch", "Versatile", "Vers", "Both Switch", "Switching Dynamic", "Versatile Top/Bottom", "Vers/Vers", "Top/Bottom Switching", "Switch Top/Bottom"])
      expect(readTags([t], cast).switching, t).toEqual([t]);
  });
  it("named forms, including one word for a pair", () => {
    expect(readTags(["Switch Steve", "Vers!Eddie"], cast).roles.map((r) => r.role)).toEqual(["switch", "switch"]);
    expect(readTags(["Versatile Steve/Eddie"], cast).roles).toHaveLength(2);
    expect(readTags(["Steve is vers"], cast).roles[0]?.role).toBe("switch");
  });
  it("notes: generic and named", () => {
    expect(noteContext({ summary: "Both of them are versatile." }).tags).toContain("Switching");
    expect(noteContext({ summary: "They switch roles a lot." }).tags).toContain("Switching");
    expect(noteContext({ summary: "Bucky switches. Vers Sam." }).tags).toEqual(expect.arrayContaining(["Bucky is a switch", "Vers Sam"]));
    expect(noteContext({ summary: "Not versatile, no switching roles." }).tags).not.toContain("Switching");
  });
});
