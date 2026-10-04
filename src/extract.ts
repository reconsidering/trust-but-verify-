// Turns an uploaded file (PDF, EPUB, HTML, TXT) into plain story text plus any AO3 metadata.

import { type Ao3Meta, countWords, emptyMeta, mergeMeta, parseAo3FromDom, parseAo3FromText } from "./ao3";
import { ao3StoryText } from "./text";

export interface ExtractedWork {
  format: "pdf" | "epub" | "html" | "txt";
  /** Full text sent for analysis (chapters, headings, notes). */
  text: string;
  meta: Ao3Meta;
  /** Our own count of story words, used when AO3 stats are missing. */
  countedWords: number;
}

const BLOCK_TAGS = new Set([
  "p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote",
  "dt", "dd", "tr", "hr", "section", "article", "pre",
]);

/** Element text with paragraph breaks preserved (textContent alone glues paragraphs together). */
export function elementText(root: Node): string {
  const out: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(node.textContent ?? "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as Element).tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "head") return;
    const block = BLOCK_TAGS.has(tag);
    if (block) out.push("\n");
    node.childNodes.forEach(walk);
    if (block) out.push("\n");
  };
  walk(root);
  return out
    .join("")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Story text from AO3's chapter container, excluding its notes block. */
function storyTextFromHtml(doc: Document): string | undefined {
  const chapters = doc.querySelector("#chapters");
  if (!chapters) return undefined;
  const copy = chapters.cloneNode(true) as Element;
  // Chapter summaries and notes go, but the "Chapter 2" headings stay: they mark where scenes are.
  copy.querySelectorAll(".meta").forEach((meta) => {
    const heading = meta.querySelector("h2, h3, .heading");
    if (heading) meta.replaceWith(heading);
    else meta.remove();
  });
  copy.querySelectorAll(".chapter .notes, .chapter_notes").forEach((el) => el.remove());
  return elementText(copy);
}

/** Positioned PDF text lets us distinguish paragraph gaps from ordinary line wraps. */
export interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
  height?: number;
  width?: number;
}

const LIGATURES: Record<string, string> = { "\uFB00": "ff", "\uFB01": "fi", "\uFB02": "fl", "\uFB03": "ffi", "\uFB04": "ffl", "\uFB05": "st", "\uFB06": "st" };

/** Characters a PDF font can hand back that no pattern would ever match: ligatures, soft hyphens, zero-width marks, no-break spaces. */
export function cleanPdfString(s: string): string {
  return s
    .replace(/[\uFB00-\uFB06]/g, (c) => LIGATURES[c])
    .replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[\u00A0\u2007\u202F]/g, " ");
}

export function joinPdfTextItems(items: PdfTextItem[]): string {
  let text = "";
  let previousLine: { y?: number; height?: number } | undefined;
  let prevEnd: number | undefined;
  let prevHeight: number | undefined;
  for (const raw of items) {
    const item = { ...raw, str: cleanPdfString(raw.str) };
    const x = item.transform?.[4];
    if (previousLine) {
      const y = item.transform?.[5];
      const gap = y !== undefined && previousLine.y !== undefined ? Math.abs(previousLine.y - y) : 0;
      const lineHeight = Math.max(1, ((previousLine.height ?? item.height ?? 10) + (item.height ?? previousLine.height ?? 10)) / 2);
      text += gap > Math.max(4, lineHeight * 1.55) ? "\n\n" : "\n";
    } else if (text && !/\s$/.test(text) && !/^\s/.test(item.str)) {
      // Two pieces on one printed line: a space between them unless they touch (a font change or ligature in the middle of a word).
      const touching = x !== undefined && prevEnd !== undefined && prevHeight !== undefined && x - prevEnd < Math.max(0.5, prevHeight * 0.12);
      if (!touching) text += " ";
    }

    text += item.str;
    prevEnd = x !== undefined && item.width !== undefined ? x + item.width : undefined;
    prevHeight = item.height;
    previousLine = item.hasEOL ? { y: item.transform?.[5], height: item.height } : undefined;
  }
  return text.trim();
}

/**
 * The pages of a PDF put back into one text: running headers, footers and page numbers are dropped (they would otherwise land in the middle of
 * a sentence), a word hyphenated at the end of a printed line is rejoined, and a paragraph that runs over a page break stays one paragraph.
 */
export function joinPdfPages(pages: string[]): string {
  const lines = pages.map((p) => p.split("\n"));
  const norm = (l: string) => l.trim().replace(/\d+/g, "#").toLowerCase();
  const edge = new Map<string, number>();
  for (const ls of lines) {
    const nonEmpty = ls.filter((l) => l.trim());
    const seen = new Set([...nonEmpty.slice(0, 2), ...nonEmpty.slice(-2)].map(norm));
    for (const k of seen) if (k) edge.set(k, (edge.get(k) ?? 0) + 1);
  }
  const repeated = (l: string) => pages.length >= 4 && (edge.get(norm(l)) ?? 0) >= Math.max(3, pages.length * 0.3) && l.trim().length < 120;
  const pageNumber = /^\s*(?:page\s+)?\d{1,4}(?:\s*(?:\/|of)\s*\d{1,4})?\s*$/i;
  const cleaned = lines.map((ls) => {
    const out = [...ls];
    const first = out.findIndex((l) => l.trim());
    for (let i = first; i >= 0 && i < Math.min(out.length, first + 2); i++) if (out[i].trim() && (repeated(out[i]) || pageNumber.test(out[i]))) out[i] = "";
    let last = out.length - 1;
    while (last >= 0 && !out[last].trim()) last--;
    for (let i = last; i >= 0 && i > last - 2; i--) if (out[i].trim() && (repeated(out[i]) || pageNumber.test(out[i]))) out[i] = "";
    return out.join("\n").trim();
  });
  let text = "";
  for (const page of cleaned) {
    if (!page) continue;
    if (!text) { text = page; continue; }
    // A page that ends mid-sentence and a next page that starts lower-case: one paragraph.
    text += !/[.!?:;"”’)\]*—-]\s*$/.test(text) && /^[a-z]/.test(page) ? "\n" : "\n\n";
    text += page;
  }
  return unwrapLines(text.replace(/([A-Za-z])-\n(?=[a-z])/g, "$1"));
}

/**
 * Printed lines wrapped inside a sentence ("…pressing him against\nthe wall") are joined back with a space, so a phrase or a quotation is not cut
 * in two. A line break after the end of a sentence stays only when that line stops well short of the usual line length, which is how a
 * paragraph ends in a PDF with no blank lines between paragraphs; a full line that happens to end on a full stop is just a wrap.
 */
export function unwrapLines(text: string): string {
  const lens = text.split("\n").map((l) => l.length).filter((n) => n > 20).sort((x, y) => x - y);
  const usual = lens.length ? lens[Math.floor(lens.length * 0.9)] : 0;
  return text.replace(/([^\n]*[^\n])\n(?=[^\n])/g, (m, line: string, offset: number) => {
    const next = text[offset + m.length] ?? "";
    const last = line[line.length - 1];
    const endsSentence = /[.!?…"”’)\]*—:]/.test(last);
    const short = usual > 0 && line.length < usual * 0.8;
    return !endsSentence || /[a-z]/.test(next) || !short ? `${line} ` : m;
  });
}
/**
 * A PDF whose fonts have no text map comes out as private-use characters, "(cid:12)" codes, or words run together. Reading such text finds almost
 * nothing, so say so rather than showing an empty result. Returns a short description of the problem, or undefined when the text looks fine.
 */
export function pdfTextProblem(text: string): string | undefined {
  const sample = text.slice(0, 200000);
  const tokens = sample.split(/\s+/).filter(Boolean);
  if (tokens.length < 50) return undefined;
  const odd = (sample.match(/[\uE000-\uF8FF\uFFFD]|\(cid:\d+\)/g) ?? []).length;
  if (odd / sample.length > 0.01) return "its fonts don't map back to letters";
  const long = tokens.filter((t) => t.replace(/[^\p{L}]/gu, "").length > 22).length;
  if (long / tokens.length > 0.04) return "its words are run together without spaces";
  const common = tokens.filter((t) => /^(?:the|and|to|of|a|in|he|his|was|it|you|that|with|him|her|she)$/i.test(t)).length;
  if (common / tokens.length < 0.08) return "it doesn't look like English prose";
  return undefined;
}

/** Story text from AO3's chapter containers, skipping summaries and author notes. */
function storyWordCount(roots: ParentNode[]): number | undefined {
  // Summaries and notes are blockquote.userstuff. Multi-chapter works nest div.userstuff inside
  // #chapters.userstuff, so keep only the innermost containers to avoid double counting.
  const STORY = "div.userstuff, section.userstuff, article.userstuff";
  const parts = roots.flatMap((r) =>
    Array.from(r.querySelectorAll(STORY)).filter((el) => !el.closest("blockquote") && !el.querySelector(STORY)),
  );
  if (!parts.length) return undefined;
  return parts.reduce((n, el) => n + countWords(elementText(el)), 0);
}

/**
 * A book saved as HTML by pdf2htmlEX: one absolutely positioned div per printed line, so the usual block-by-block reading cuts every sentence at
 * the end of a printed line. The lines are joined back up here, and a new paragraph starts where a line is indented further than the page's
 * usual left edge (the first line of a paragraph) or is a chapter heading.
 */
export function textFromPdf2htmlEx(doc: Document): string | undefined {
  const pages = doc.querySelectorAll(".pf");
  if (pages.length < 3 || !doc.querySelector(".pf .t")) return undefined;
  const css = [...doc.querySelectorAll("style")].map((el) => el.textContent ?? "").join("\n");
  const left = new Map<string, number>();
  for (const m of css.matchAll(/\.(x[0-9a-f]+)\{left:(-?[\d.]+)px;?\}/g)) left.set(m[1], parseFloat(m[2]));
  const lines: { text: string; x: number; edge: number }[] = [];
  pages.forEach((page) => {
    const here: { text: string; x: number }[] = [];
    page.querySelectorAll(".t").forEach((el) => {
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!text || /^OceanofPDF\s*\.com$/i.test(text)) return;
      const cls = [...el.classList].find((c) => /^x[0-9a-f]+$/.test(c));
      here.push({ text, x: cls ? left.get(cls) ?? 0 : 0 });
    });
    // The page's usual left edge is its most common one (odd and even pages differ a little).
    const counts = new Map<number, number>();
    for (const l of here) counts.set(Math.round(l.x), (counts.get(Math.round(l.x)) ?? 0) + 1);
    const edge = here.length ? [...counts].sort((a, b) => b[1] - a[1])[0][0] : 0;
    for (const l of here) lines.push({ ...l, edge });
  });
  if (lines.length < 50) return undefined;
  const heading = /^(?:chapter|prologue|epilogue|part)\b.{0,30}$/i;
  const out: string[] = [];
  let cur = "";
  const flush = () => { if (cur) out.push(cur); cur = ""; };
  for (const l of lines) {
    if (heading.test(l.text)) { flush(); out.push(l.text); continue; }
    if (cur && l.x > l.edge + 8) flush();
    cur = cur ? `${cur} ${l.text}` : l.text;
  }
  flush();
  return out.join("\n\n").replace(/ +([’'])\s?(?=s\b)/g, "$1");
}

export function extractFromHtml(html: string): ExtractedWork {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = mergeMeta(parseAo3FromDom(doc), parseAo3FromText(elementText(doc.body)));
  const chapters = doc.querySelector("#chapters");
  const text = chapters ? storyTextFromHtml(doc)! : textFromPdf2htmlEx(doc) ?? elementText(doc.body);
  return {
    format: "html",
    text,
    meta,
    countedWords: storyWordCount([doc]) ?? countWords(text),
  };
}

export function extractFromText(text: string): ExtractedWork {
  const meta = parseAo3FromText(text);
  // AO3 PDFs start with the work title on its own line.
  if (meta.url || meta.fandoms.length) {
    const first = text.trim().split("\n")[0]?.trim();
    if (first && first.length < 200 && !/:/.test(first)) meta.title = first;
  }
  // AO3 metadata remains in `meta`; author notes must not be scanned as story events.
  const hasAo3Header = !!(meta.url || meta.fandoms.length || meta.words !== undefined);
  const story = hasAo3Header ? ao3StoryText(text) : text.trim();
  return { format: "txt", text: story, meta, countedWords: countWords(story) };
}

/** Lazy chunks can fail after a redeploy (the page still points at old file names) or on a flaky connection: retry once. */
async function loadChunk<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch {
    await new Promise((r) => setTimeout(r, 400));
    try {
      return await load();
    } catch {
      throw new Error("The PDF reader couldn't load (the site may have just been updated). Reload the page and try again, or use the EPUB or HTML download.");
    }
  }
}

async function extractFromPdf(data: ArrayBuffer): Promise<ExtractedWork> {
  // The legacy build includes polyfills; the modern one needs very new browsers (Math.sumPrecise etc.).
  await loadChunk(() => import("./pdf/polyfill"));
  const pdfjs = await loadChunk(() => import("pdfjs-dist/legacy/build/pdf.mjs"));
  // Bundled by Vite as a classic .js worker, so hosts that serve .mjs with the wrong MIME type still work.
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    const { default: PdfWorker } = await loadChunk(() => import("./pdf/worker?worker"));
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
  }
  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data }).promise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/password/i.test(msg)) throw new Error("This PDF is password-protected. Try the EPUB or HTML download instead.");
    throw new Error(`Couldn't read this PDF (${msg}). Try the EPUB or HTML download from AO3 instead.`);
  }
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // Read the text stream directly rather than via getTextContent(), which needs stream async iteration.
    const reader = page.streamTextContent().getReader();
    const items: unknown[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      items.push(...(value as { items: unknown[] }).items);
    }
    const textItems = items.filter(
      (item): item is PdfTextItem => typeof item === "object" && item !== null && "str" in item,
    );
    pages.push(joinPdfTextItems(textItems));
  }
  const work = extractFromText(joinPdfPages(pages));
  return { ...work, format: "pdf" };
}

/** "OEBPS/" + "../text/ch1.xhtml" → "text/ch1.xhtml". */
function resolveZipPath(baseDir: string, href: string): string {
  const out: string[] = [];
  for (const part of (href.startsWith("/") ? href.slice(1) : baseDir + href).split("/")) {
    if (part === "..") out.pop();
    else if (part && part !== ".") out.push(part);
  }
  return out.join("/");
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function extractFromEpub(data: ArrayBuffer): Promise<ExtractedWork> {
  const JSZip = (await loadChunk(() => import("jszip"))).default;
  let zip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new Error("Couldn't open this EPUB (it isn't a valid zip file). Try the HTML download from AO3 instead.");
  }
  const parser = new DOMParser();

  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  const opfText = opfPath ? await zip.file(opfPath)?.async("string") : undefined;
  if (!opfPath || !opfText) throw new Error("This EPUB is missing its package file (content.opf).");
  const opf = parser.parseFromString(opfText, "application/xml");
  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const manifest = new Map<string, string>();
  opf.querySelectorAll("manifest > item").forEach((item) => {
    manifest.set(item.getAttribute("id") ?? "", item.getAttribute("href") ?? "");
  });
  const hrefs = Array.from(opf.querySelectorAll("spine > itemref"))
    .map((ref) => manifest.get(ref.getAttribute("idref") ?? ""))
    .filter((h): h is string => !!h);

  let meta = emptyMeta();
  const docs: Document[] = [];
  const texts: string[] = [];
  for (const href of hrefs) {
    const path = resolveZipPath(baseDir, safeDecode(href.split("#")[0]));
    const src = await (zip.file(path) ?? zip.file(path.replace(/^\/+/, "")))?.async("string");
    if (!src) continue;
    const doc = parser.parseFromString(src, "text/html");
    const docMeta = parseAo3FromDom(doc);
    const isPreface = docMeta.fandoms.length > 0 || docMeta.words !== undefined;
    meta = mergeMeta(meta, docMeta);
    if (isPreface) continue;
    docs.push(doc);
    texts.push(elementText(doc.body));
  }

  // Fall back to the OPF's Dublin Core metadata for title/author.
  meta.title ??= opf.getElementsByTagName("dc:title")[0]?.textContent?.trim() || undefined;
  meta.author ??= opf.getElementsByTagName("dc:creator")[0]?.textContent?.trim() || undefined;

  const text = texts.join("\n\n").trim();
  return { format: "epub", text, meta, countedWords: storyWordCount(docs) ?? countWords(text) };
}

export async function extractFile(file: File): Promise<ExtractedWork> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || file.type === "application/pdf") return extractFromPdf(await file.arrayBuffer());
  if (ext === "epub" || file.type === "application/epub+zip") return extractFromEpub(await file.arrayBuffer());
  if (ext === "html" || ext === "htm" || ext === "xhtml" || file.type === "text/html") {
    return extractFromHtml(await file.text());
  }
  if (ext === "txt" || ext === "md" || file.type.startsWith("text/")) return extractFromText(await file.text());
  throw new Error(`Unsupported file type ".${ext}". Use a PDF, EPUB, HTML, or TXT file.`);
}
