import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";

const META = (freeforms: string[]): Ao3Meta => ({ ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms });
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(6) + "\n\n";
const run = (t: string, freeforms: string[]) => { const hits: AuditHit[] = []; analyzeWithPatterns(lead + t, META(freeforms), { quiet: true, audit: (h) => hits.push(h) }); return hits; };
const by = (hits: AuditHit[], prefix: string) => hits.filter((h) => h.via.replace(/~elided$/, "").startsWith(prefix)).map((h) => `${h.via.replace(/~elided$/, "")}:${h.a.split(" ")[0]}`);

describe("collars and leashes", () => {
  const TAGS = ["Collars", "Sub Steve Harrington", "Dom Eddie Munson"];
  it("the collared one reads as the bottom and the one who leads or tugs as the top", () => {
    expect(by(run("Steve wore the collar all day, the leather snug at his neck.", TAGS), "collar")).toContain("collar-wearer:Steve");
    expect(by(run("Eddie tugged the leash and Steve stumbled forward.", TAGS), "collar")).toContain("collar-holder:Eddie");
    expect(by(run("Eddie unlocked the chain from the collar on Steve’s neck.", TAGS), "collar")).toContain("collar-holder:Eddie");
  });
  it("a shirt collar, a collarbone and a wished-for collar are not the device", () => {
    expect(by(run("Steve grabbed Eddie by the collar of his shirt and kissed him.", TAGS), "collar")).toHaveLength(0);
    expect(by(run("Eddie kissed along Steve’s collarbone, his cock hard.", TAGS), "collar")).toHaveLength(0);
    expect(by(run("Eddie thought about getting Steve a collar with a bell on it someday.", TAGS), "collar")).toHaveLength(0);
  });
  it("nothing without a collar tag or a recurring collar in the text", () => {
    expect(by(run("Steve wore the collar all day, the leather snug at his neck.", ["Sub Steve Harrington"]), "collar")).toHaveLength(0);
  });
  it("a lone ‘Bottom X’ tag names the wearer", () => {
    expect(by(run("Eddie buckled the collar around Steve’s neck, then clipped on the leash.", ["Collars", "Bottom Steve Harrington"]), "collar-wearer").length + by(run("Steve wore the collar all day, the leather snug at his neck.", ["Collars", "Bottom Steve Harrington"]), "collar-wearer").length).toBeGreaterThan(0);
  });
});

describe("who wears the cage when no tag says", () => {
  it("a lone ‘Bottom X’ tag", () => {
    const h = run("His cock throbbed against the cage as Eddie touched him.", ["Cock Cages", "Bottom Steve Harrington"]);
    expect(by(h, "chastity-wearer")).toContain("chastity-wearer:Steve");
  });
  it("the one the cage is attached to in the text, when it keeps coming up", () => {
    const talk = ["Eddie tapped the cage on Steve’s cock.", "Steve’s cock strained against the cage.", "The cage pinched Steve’s balls.", "He whined, the cage tight around Steve’s erection.", "Eddie rubbed the cage over Steve’s cock again."].join(" ") + "\n\n";
    const hits = run(talk + "His cock throbbed against the cage.", ["Cock Cages"]);
    expect(by(hits, "chastity-wearer")).toContain("chastity-wearer:Steve");
    expect(by(hits, "chastity-wearer").some((x) => x.endsWith(":Eddie"))).toBe(false);
  });
  it("‘He’s in a cage!’ after a sentence about a cock counts", () => {
    const h = run("She stared at Steve’s cock. “He’s in a cage!”", ["Cock Cages", "Sub Steve Harrington"]);
    expect(by(h, "chastity-wearer")).toContain("chastity-wearer:Steve");
  });
});

describe("toys and thrusts that were missed", () => {
  const anal = (t: string) => run(t, []).filter((h) => h.kind === "act" || h.via.startsWith("toy") || h.via === "extra-thrusts").map((h) => `${h.via.replace(/~elided$/, "")}:${h.a.split(" ")[0]}`);
  it("‘Eddie’s hands working a vibe into his hole’", () => {
    expect(anal("That was how Steve ended up on his back with Eddie’s hands working a vibe into his hole.")).toContain("toy-hands-working:Eddie");
  });
  it("‘pressed the vibe in fully’ and ‘shoving the plug back in’, but not a toy used on himself", () => {
    expect(anal("Eddie finally pressed the vibe in fully, and Steve moaned, naked and hard.")).toContain("toy-in-bare:Eddie");
    expect(anal("Eddie finished by shoving the plug back in, Steve moaning, naked and hard.")).toContain("toy-in-bare:Eddie");
    expect(anal("Steve eased the dildo inside himself, naked and hard.").some((x) => x.startsWith("toy-in-bare"))).toBe(false);
  });
  it("‘the vibe inside him would kick up’ is a toy inside Steve", () => {
    expect(run("Steve squirmed as the vibe inside him kicked up in intensity.", ["Sub Steve Harrington"]).some((h) => h.via.startsWith("toy-inside-him") || h.via === "plug-worn")).toBe(true);
  });
  it("‘thrust forward to create a bulge in his cheek’, ‘had to ride his cock’, ‘a couple extra thrusts’", () => {
    expect(anal("Eddie’s hips lazily thrust forward to create a bulge in Steve’s cheek, Steve moaning, naked and hard.")).toContain("thrust-bulge-cheek:Eddie");
    expect(anal("It was only Eddie’s cock Steve had to ride, naked and sweating.")).toContain("ride-cock-had-to:Eddie");
    expect(anal("Eddie gave a couple extra thrusts after he finished, naked and sweating.")).toContain("extra-thrusts:Eddie");
  });
});
