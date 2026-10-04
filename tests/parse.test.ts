import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { countWords, romanticPairings } from "../src/ao3";
import { excerptExplicit } from "../src/analyze";
import { extractFromHtml, extractFromText, joinPdfPages, joinPdfTextItems, pdfTextProblem, unwrapLines } from "../src/extract";

const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

describe("AO3 HTML download", () => {
  const work = extractFromHtml(fixture("ao3-sample.html"));

  it("reads fandom, relationships, and stats", () => {
    expect(work.meta.fandoms).toEqual(["Harry Potter - J. K. Rowling"]);
    expect(work.meta.relationships).toEqual([
      "Sirius Black/Remus Lupin",
      "James Potter & Sirius Black",
      "James Potter/Lily Evans Potter",
    ]);
    expect(romanticPairings(work.meta)).toEqual(["Sirius Black/Remus Lupin", "James Potter/Lily Evans Potter"]);
    expect(work.meta.words).toBe(12345);
    expect(work.meta.chapters).toBe("2/2");
    expect(work.meta.rating).toBe("Explicit");
    expect(work.meta.author).toBe("sample_author");
    expect(work.meta.title).toBe("A Sample Work");
    expect(work.meta.url).toBe("https://archiveofourown.org/works/123456");
  });

  it("counts only chapter text, not notes or summary", () => {
    expect(work.countedWords).toBe(12);
  });

  it("keeps paragraph breaks in the text sent for analysis", () => {
    expect(work.text).toContain("One two three four five.\n");
    expect(work.text).not.toContain("Afterword");
    expect(work.text).not.toContain("Author note words here");
    expect(work.text).not.toContain("Notes:");
  });
});

describe("AO3 PDF-style text", () => {
  const work = extractFromText(fixture("ao3-pdf-text.txt"));

  it("reads plural labels and multiple fandoms", () => {
    expect(work.meta.fandoms).toEqual(["Teen Wolf (TV)", "Supernatural"]);
    expect(work.meta.relationships).toEqual(["Derek Hale/Stiles Stilinski", "Scott McCall & Stiles Stilinski"]);
    expect(work.meta.characters).toEqual(["Derek Hale", "Stiles Stilinski", "Scott McCall"]);
    expect(work.meta.words).toBe(45210);
    expect(work.meta.chapters).toBe("3/?");
    expect(work.meta.url).toBe("http://archiveofourown.org/works/987654");
  });

  it("handles labels flattened onto one line, as PDF extraction often does", () => {
    const flat = fixture("ao3-pdf-text.txt").replace(/\n/g, " ");
    const meta = extractFromText(flat).meta;
    expect(meta.fandoms).toEqual(["Teen Wolf (TV)", "Supernatural"]);
    expect(meta.relationships[0]).toBe("Derek Hale/Stiles Stilinski");
    expect(meta.words).toBe(45210);
  });

  it("returns empty metadata for non-AO3 text", () => {
    const work = extractFromText("Just a story.\n\nNothing else here.");
    expect(work.meta.fandoms).toEqual([]);
    expect(work.meta.words).toBeUndefined();
    expect(work.countedWords).toBe(6);
  });

  it("keeps only AO3 story chapters and removes labeled notes", () => {
    const source = `A Sample Work\nRating: Explicit\nFandom: Harry Potter - J. K. Rowling\nRelationships: Draco Malfoy/Harry Potter\nCharacters: Draco Malfoy, Harry Potter\nAdditional Tags: Bottom Harry Potter, Top Draco Malfoy\nStats: Words: 100 Chapters: 2/2\n\nSummary\nA preface mentioning Draco entered Harry.\n\nChapter 1\nHarry smiled at Draco.\n\nChapter Notes\nA note fantasizes Draco fucking Harry.\nSee the end of the chapter for more notes\n\nDraco's cock slid into Harry's hole.\n\nChapter End Notes\nThe notes describe Harry sucking Draco off.\n\nChapter 2\nDraco walked Harry home.`;
    const work = extractFromText(source);
    expect(work.text).toContain("Harry smiled at Draco.");
    expect(work.text).toContain("Draco's cock slid into Harry's hole.");
    expect(work.text).toContain("Draco walked Harry home.");
    expect(work.text).not.toContain("A preface");
    expect(work.text).not.toContain("note fantasizes");
    expect(work.text).not.toContain("notes describe");
  });

  it("preserves chapter content if a PDF has no clear preface/body note separator", () => {
    const source = `AO3 work\nFandom: Example\nRelationships: Alex/Blake\nStats: Words: 20 Chapters: 1/1\n\nChapter 1\nChapter Notes\nA short content note.\nThe actual chapter begins here.`;
    const work = extractFromText(source);
    expect(work.text).toContain("The actual chapter begins here.");
    expect(work.text).toContain("[[AO3_UNCERTAIN_NOTE_START]]");
    expect(work.text).toContain("[[AO3_UNCERTAIN_NOTE_END]]");
  });
});

describe("PDF text layout", () => {
  it("joins visual line wraps and restores paragraph gaps from positioned text", () => {
    const item = (str: string, y: number, hasEOL: boolean) => ({ str, hasEOL, transform: [1, 0, 0, 1, 0, y], height: 10 });
    expect(joinPdfTextItems([
      item("This paragraph wraps", 700, true),
      item("onto a second line.", 686, true),
      item("A new paragraph starts here.", 660, true),
    ])).toBe("This paragraph wraps\nonto a second line.\n\nA new paragraph starts here.");
  });
});

describe("PDF clean-up", () => {
  const item = (str: string, x: number, y: number, width: number, hasEOL = false) => ({ str, hasEOL, transform: [1, 0, 0, 1, x, y], height: 10, width });
  it("turns ligatures and soft hyphens back into plain letters", () => {
    expect(joinPdfTextItems([item("his \uFB01ngers sl\u00ADid \uFB02at", 10, 700, 100, true)])).toBe("his fingers slid flat");
  });
  it("does not put a space inside a word split across two pieces", () => {
    expect(joinPdfTextItems([item("Derek’s ", 10, 700, 40), item("\uFB01", 50, 700, 5), item("ngers", 55, 700, 25, true)])).toBe("Derek’s fingers");
    expect(joinPdfTextItems([item("Derek", 10, 700, 30), item("thrusts", 50, 700, 35, true)])).toBe("Derek thrusts");
  });
  it("drops running headers, footers and page numbers", () => {
    const pages = Array.from({ length: 6 }, (_, i) => `Sugar Alpha\n${["Derek grinned","Stiles laughed","Isaac frowned","Peter waited","The club hummed","Rain fell"][i]} at the door.\nA ${["red","blue","green","grey","gold","pink"][i]} light came on.\n${i + 1}`);
    const out = joinPdfPages(pages);
    expect(out).not.toContain("Sugar Alpha");
    expect(out).toContain("Peter waited at the door.");
    expect(out).not.toMatch(/\n\d\n|\n\d$/);
  });
  it("rejoins a word hyphenated at a line end and a sentence split over a page break", () => {
    expect(joinPdfPages(["He thrust into the pleasure-\nable heat and Stiles", "gasped for him.\n\nThen it was over."])).toBe("He thrust into the pleasureable heat and Stiles gasped for him.\n\nThen it was over.");
  });
});

describe("pdfTextProblem", () => {
  const prose = "He said that it was the best thing she had seen, and she told him to go to the door with his hat in the rain. ".repeat(20);
  it("accepts ordinary prose", () => {
    expect(pdfTextProblem(prose)).toBeUndefined();
  });
  it("flags unmapped fonts, run-together words and non-prose", () => {
    expect(pdfTextProblem(prose.replace(/e/g, "\uE012"))).toMatch(/fonts/);
    expect(pdfTextProblem(prose.repeat(4).replace(/ /g, "").replace(/(.{40})/g, "$1 "))).toMatch(/run together/);
    expect(pdfTextProblem("zx qv kj ".repeat(100))).toMatch(/English prose/);
  });
});

describe("unwrapLines", () => {
  it("joins lines wrapped inside a sentence or a quotation", () => {
    expect(unwrapLines("Derek pressed him against\nthe wall and “fuck\nme,” Stiles said.")).toBe("Derek pressed him against the wall and “fuck me,” Stiles said.");
  });
  it("joins a full line that happens to end on a full stop", () => {
    const text = "A long first line that runs right across the page and stops here.\nThen the same sentence group goes on across the page for a good while yet.\nShort end.";
    expect(unwrapLines(text)).toBe("A long first line that runs right across the page and stops here. Then the same sentence group goes on across the page for a good while yet. Short end.");
  });
  it("keeps a break after a short last line of a paragraph and blank lines", () => {
    const body = "A long first line that runs right across the page and carries on to the end\n";
    expect(unwrapLines(`${body}${body}Short end.\nNext paragraph starts here and runs a good way\n\nNew one.`)).toBe(`${body.trim()} ${body.trim()} Short end.\nNext paragraph starts here and runs a good way\n\nNew one.`);
  });
});

describe("countWords", () => {
  it("ignores bare punctuation", () => {
    expect(countWords("Hello — world ... it's 3 o'clock")).toBe(5);
  });
});

describe("excerptExplicit", () => {
  it("keeps the opening and flagged scenes, dropping the rest", () => {
    const filler = Array.from({ length: 400 }, (_, i) => `Filler paragraph number ${i} about the weather and tea.`);
    filler[300] = "Chapter 9";
    filler[350] = "He slicked his fingers with lube.";
    const { text } = excerptExplicit(filler.join("\n\n"), 1);
    expect(text).toContain("Filler paragraph number 0 ");
    expect(text).toContain("Chapter 9");
    expect(text).toContain("lube");
    expect(text).toContain("Filler paragraph number 349 ");
    expect(text).not.toContain("Filler paragraph number 330 ");
    expect(text).toContain("[…]");
  });

  it("keeps soft-wrapped lines in the same context block", () => {
    const prelude = Array.from({ length: 1500 }, () => "word").join(" ");
    const { text } = excerptExplicit(`${prelude}\nThe lead-in identifies both people.\nHe fucked him slowly.\n\nDiscarded filler.`, 0);
    expect(text).toContain("The lead-in identifies both people.");
    expect(text).toContain("He fucked him slowly.");
    expect(text).not.toContain("Discarded filler.");
  });

  it("omits ambiguous AO3 note text from excerpts while marking the gap", () => {
    const source = `Chapter 1\n[[AO3_UNCERTAIN_NOTE_START]]\nAn author note says he fucked him.\n[[AO3_UNCERTAIN_NOTE_END]]\n\nThe story opens here.`;
    const { text } = excerptExplicit(source, 0);
    expect(text).not.toContain("An author note says");
    expect(text).toContain("[[AO3_NOTE_BOUNDARY_UNCLEAR_OMITTED]]");
  });
});
