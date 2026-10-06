import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { claim } from "../scripts/review-claims.mjs";
import { overrideOwnerAnswers } from "../scripts/spotcheck-apply.mjs";

describe("spot-check claims say which way round the engine means", () => {
  it("a hint that credits the receiver is worded for the receiver", () => {
    expect(claim({ a: "Dean Winchester", b: "Castiel", act: "blowjob", kind: "hypothetical", role: "bottom" })).toBe("Dean is giving Castiel a blowjob (read as a hypothetical, not something that happens)");
    expect(claim({ a: "Stiles", b: "Derek", act: "anal sex", kind: "wanted", role: "bottom" })).toMatch(/^Stiles is being fucked anally by Derek/);
  });
  it("the same act credited to the top, or a narrated act, keeps the doer's wording", () => {
    expect(claim({ a: "Cas", b: "Dean", act: "anal sex", kind: "act", role: "top" })).toMatch(/as the one penetrating/);
    expect(claim({ a: "Alex", b: "Henry", act: "blowjob", kind: "act" })).toBe("Alex is getting a blowjob from Henry");
  });
  it("every act label has a wording, none falls back to the vague form", () => {
    expect(claim({ a: "A B", b: "C D", act: "something new", kind: "act" })).toMatch(/first name is the one the engine credited/);
  });
});

describe("overriding an earlier owner answer", () => {
  const dir = mkdtempSync(join(tmpdir(), "rs-"));
  const base = { kind: "hint", card: "anal", pairing: "A/B", who: "A", role: "bottom", via: "x", h: "abc" };
  const write = (set: unknown) => writeFileSync(join(dir, "s.json"), JSON.stringify(set));
  const read = () => JSON.parse(readFileSync(join(dir, "s.json"), "utf8"));
  it("right → wrong retires the entry and keeps the owner's negative; wrong → right restores the entry", () => {
    mkdirSync(dir, { recursive: true });
    write({ fic: "f", entries: [{ ...base, marks: { right: 1, wrong: 0 }, seen: ["d"], source: "claude", weight: 0.85 }], negatives: [] });
    overrideOwnerAnswers([{ key: "x#abc", owner: "wrong" }], "2026-10-06", dir);
    let s = read();
    expect(s.entries[0].retired).toBeTruthy();
    expect(s.negatives[0]).toMatchObject({ source: "owner", misread: true });
    overrideOwnerAnswers([{ key: "x#abc", owner: "ok" }], "2026-10-07", dir);
    s = read();
    expect(s.entries[0].retired).toBeUndefined();
    expect(s.entries[0]).toMatchObject({ source: "owner" });
    expect(s.entries[0].marks.right).toBeGreaterThanOrEqual(2);
    expect(s.negatives[0].retired).toBeTruthy();
  });
});
