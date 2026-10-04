// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta, parseAo3FromDom } from "../src/ao3";
import { type AuditHit, analyzeWithPatterns } from "../src/heuristic";
import { noteContext } from "../src/heuristic/notes";

describe("reading the summary, notes and end notes", () => {
  it("AO3 HTML keeps summary, notes, end notes and chapter notes as context", () => {
    const html = `<div id="preface"><div class="meta"><dl class="tags"><dt>Rating:</dt><dd>Explicit</dd></dl>
      <p>Summary</p><blockquote class="userstuff"><p>Steve is the sub in this one.</p></blockquote>
      <p>Notes</p><blockquote class="userstuff"><p>Please mind the tags.</p></blockquote></div></div>
      <div id="chapters"><div class="meta"><p>Chapter Notes</p><blockquote class="userstuff"><p>Eddie is a total top.</p></blockquote></div></div>
      <div id="afterword"><div class="meta"><p>End Notes</p><blockquote class="userstuff"><p>Thanks for reading.</p></blockquote></div></div>`;
    const m = parseAo3FromDom(new DOMParser().parseFromString(html, "text/html"));
    expect(m.summary).toContain("Steve is the sub");
    expect(m.notes).toContain("mind the tags");
    expect(m.endNotes).toContain("Thanks for reading");
    expect(m.chapterNotes?.[0]).toContain("total top");
  });
  it("explicit statements become tag-like strings; vague ones do not", () => {
    const c = noteContext({ summary: "Top Eddie and Bottom!Steve, with Dean in a cock cage. Steve is the sub. Collared Cas.", notes: "Sometimes the top shelf is tall." });
    expect(c.tags).toEqual(expect.arrayContaining(["Top Eddie", "Bottom Steve", "Dean in a cock cage", "Steve is a sub", "Collared Cas"]));
    expect(c.tags.some((t) => /shelf|Sometimes/.test(t))).toBe(false);
  });
  it("cage and collar words switch the scans on, unless the notes say there are none", () => {
    expect(noteContext({ notes: "Warning: chastity and a collar." })).toMatchObject({ cage: true, collar: true });
    expect(noteContext({ notes: "No chastity, no collars, just sex." })).toMatchObject({ cage: false, collar: false });
    expect(noteContext({ notes: "He kissed along her collarbone." }).collar).toBe(false);
  });
});

const META = (extra: Partial<Ao3Meta> = {}, freeforms: string[] = []): Ao3Meta => ({ ...emptyMeta(), rating: "Explicit", categories: ["M/M"], fandoms: ["Original Work"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms, ...extra });
const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(6) + "\n\n";
const run = (t: string, meta: Ao3Meta) => { const hits: AuditHit[] = []; analyzeWithPatterns(lead + t, meta, { quiet: true, audit: (h) => hits.push(h) }); return hits; };
const by = (hits: AuditHit[], prefix: string) => hits.filter((h) => h.via.replace(/~elided$/, "").startsWith(prefix)).map((h) => `${h.via.replace(/~elided$/, "")}:${h.a.split(" ")[0]}`);

describe("notes feed the analysis", () => {
  it("a note naming the cage wearer works like the tag, with no cage tag at all", () => {
    const hits = run("His cock throbbed against the cage as Eddie touched him, wanting Eddie’s mouth and his fingers in his ass.", META({ summary: "Steve spends the whole story in a cock cage." }));
    expect(by(hits, "chastity-wearer")).toContain("chastity-wearer:Steve");
  });
  it("without notes or tags there is no cage reading", () => {
    expect(by(run("His cock throbbed against the cage as Eddie touched him.", META()), "chastity-wearer")).toHaveLength(0);
  });
  it("a collar mentioned only in the notes turns the collar scan on", () => {
    const hits = run("Steve wore the collar all day, the leather snug at his neck.", META({ endNotes: "Steve gets collared. Steve is the sub." }));
    expect(by(hits, "collar-wearer")).toContain("collar-wearer:Steve");
  });
});

describe("a named outsider in an act", () => {
  const talk = "Kleon laughed at the door. Kleon wiped the table. Kleon smiled at the guards. Kleon waved at Steve.\n\n";
  it("‘Kleon’s mouth wrapped around Steve’s cock’ tells us about Steve, not about a second cast member", () => {
    const hits = run(`${talk}Kleon’s mouth wrapped around Steve’s cock and Steve moaned, naked and hard.`, META());
    const one = hits.filter((h) => h.via.endsWith("~one-sided") && h.cat === "oral");
    expect(one.map((h) => h.a.split(" ")[0])).toEqual(["Steve"]);
    expect(hits.filter((h) => h.kind === "act" && h.cat === "oral" && /Eddie/.test(h.a + (h.b ?? "")))).toHaveLength(0);
  });
});
