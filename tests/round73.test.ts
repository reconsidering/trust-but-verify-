// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Ao3Meta, emptyMeta } from "../src/ao3";
import { extractFromHtml } from "../src/extract";
import { analyzeWithPatterns } from "../src/heuristic";

/** A book saved as HTML by pdf2htmlEX: one positioned div per printed line, paragraphs marked by a first-line indent. */
function pdf2htmlEx(paragraphs: string[], lineLen = 60): string {
  const css = ".x1{left:100.0px;}.x2{left:120.0px;}";
  let page = "";
  const pages: string[] = [];
  let n = 0;
  for (const p of paragraphs) {
    const words = p.split(" ");
    let line = "";
    let first = true;
    const push = () => {
      page += `<div class="t m0 ${first ? "x2" : "x1"} h1 y${n++} ff1 fs1">${line.trim()}</div>`;
      first = false;
      line = "";
      if (n % 10 === 0) { pages.push(page); page = ""; }
    };
    for (const w of words) { if ((line + w).length > lineLen) push(); line += `${w} `; }
    if (line) push();
  }
  if (page) pages.push(page);
  return `<html><head><style>${css}</style></head><body><div id="page-container">${pages.map((pg, i) => `<div id="pf${i}" class="pf w0 h0"><div class="pc">${pg}</div></div>`).join("")}</div></body></html>`;
}

describe("round 73: a book saved by pdf2htmlEX", () => {
  const story = Array.from({ length: 24 }, (_, i) => `Steve and Eddie sat on the couch and talked about number ${i}, which went on and on for a good while as they laughed together.`);
  story.splice(6, 0, "Eddie leaned in, wrapping his hand around the base of Steve’s dick and licked the head, and Steve groaned.");
  const html = pdf2htmlEx(story);
  it("joins printed lines back into paragraphs at the indents", () => {
    const w = extractFromHtml(html);
    const paras = w.text.split("\n\n");
    expect(paras).toHaveLength(story.length);
    expect(paras[6]).toBe(story[6]);
  });
});

describe("round 73: “never would’ve dreamed” is not a dream", () => {
  const META: Ao3Meta = { ...emptyMeta(), rating: "Explicit", categories: ["M/M"], relationships: ["Steve Harrington/Eddie Munson"], characters: ["Steve Harrington", "Eddie Munson"], freeforms: [] };
  const lead = "Steve and Eddie were in bed, naked and kissing, hard and aching. Eddie kissed Steve. Steve kissed Eddie back, moaning. ".repeat(5) + "\n\n";
  it("an idiom of surprise does not turn the next scene into a fantasy", () => {
    const a = analyzeWithPatterns(`${lead}Never would’ve dreamed that was hot, either, but Steve was slowly redefining what hot was.\n\n“I’m so close,” Steve warned, breath heaving, but Eddie didn’t listen. He leaned in, wrapping his hand around the base of Steve’s dick and licked the head.`, META, { quiet: true });
    expect(a.pairings[0].blowjob.instances.length).toBeGreaterThan(0);
  });
});
