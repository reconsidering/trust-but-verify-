// @vitest-environment jsdom
import { createHash, webcrypto } from "node:crypto";
import { Blob as NodeBlob } from "node:buffer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import { afterEach, expect, it, vi } from "vitest";

const html = readFileSync(resolve("public/review/found-in-the-upside-down.html"), "utf8");
const metadata = JSON.parse(readFileSync(resolve("public/review/found-in-the-upside-down.json"), "utf8"));
const checksum = (text: string) => createHash("sha256").update(text).digest("hex");
const fixture = '<div id="chapters"><div class="meta"><h2>Chapter 1: Synthetic</h2><p>Author note removed.</p></div><p>Morgan passes Rowan a cup.</p><p>Rowan thanks Morgan.</p></div>';
const paragraphs = ["Chapter 1: Synthetic", "Morgan passes Rowan a cup.", "Rowan thanks Morgan."];
const bytes = (text: string) => {
  const buffer = Buffer.from(text);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.body.replaceChildren();
});

it("keeps story text out of published metadata and checks review references", () => {
  expect(metadata.paras).toBeUndefined();
  expect(metadata.paragraphCount).toBe(3050);
  expect(metadata.items.filter((row: { type: string }) => row.type === "detection")).toHaveLength(110);
  expect(metadata.items).toHaveLength(144);
  const ids = new Set(metadata.items.map((row: { id: string }) => row.id));
  expect(ids.size).toBe(metadata.items.length);
  expect(metadata.suggested).toHaveLength(20);
  for (const id of metadata.suggested) expect(ids.has(id)).toBe(true);
  for (const row of metadata.items) {
    expect(row.para).toBeGreaterThanOrEqual(0);
    expect(row.to).toBeLessThan(metadata.paragraphCount);
  }
  expect(html).not.toMatch(/<script[^>]+src=|<iframe|<link[^>]+href=/i);
});

it("loads only a matching local story, saves answers, safely adds issues, and exports/imports feedback", async () => {
  const data = {
    ...metadata,
    sourceSha: checksum(fixture),
    paragraphSha: checksum(paragraphs.join("\n")),
    paragraphCount: 3,
    omittedParagraphs: [],
    chapters: [1, 1, 1],
    items: ["detection", "missing", "scope"].map((type, index) => ({
      id: `F${index + 1}`, type, para: 1, to: 1, chapter: 1,
      claim: "Morgan passes a cup to Rowan.", explanation: "Synthetic review claim.",
      assessment: "correct", reason: "The action is directly stated.", kind: "scene",
    })),
    suggested: ["F1", "F2", "F3"],
  };
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(data) })));
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("TextEncoder", TextEncoder);
  vi.stubGlobal("TextDecoder", TextDecoder);
  vi.stubGlobal("Blob", NodeBlob);
  let exported: NodeBlob | undefined;
  vi.stubGlobal("URL", { createObjectURL: (blob: NodeBlob) => { exported = blob; return "blob:test"; }, revokeObjectURL: () => {} });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  HTMLElement.prototype.scrollIntoView = vi.fn();
  document.body.innerHTML = html;
  const script = document.querySelector('script[type="module"]')!.textContent!;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction(script)();
  const api = (window as unknown as { reviewAPI: {
    loadStoryFile: (file: { arrayBuffer: () => Promise<ArrayBuffer> }) => Promise<boolean>;
    state: { answers: Record<string, { verdict?: string; errors: string[]; context: string }>; custom: unknown[] };
    visible: () => { id: string; type: string }[];
    move: (direction: number) => void;
  } }).reviewAPI;

  expect(document.querySelector<HTMLButtonElement>('[data-v="correct"]')!.disabled).toBe(true);
  expect(await api.loadStoryFile({ arrayBuffer: async () => bytes("Different story") })).toBe(false);
  expect(Object.keys(api.state.answers)).toHaveLength(0);
  expect(await api.loadStoryFile({ arrayBuffer: async () => bytes(fixture) })).toBe(true);
  expect(document.querySelector(".passage")!.textContent).toContain(paragraphs[1]);
  expect(fetch).toHaveBeenCalledTimes(1); // Only public review metadata, never the selected story.

  document.querySelector<HTMLButtonElement>('[data-v="wrong"]')!.click();
  expect(api.state.answers.F1.verdict).toBe("wrong");
  document.querySelector<HTMLInputElement>(".checks input")!.click();
  const context = document.getElementById("context") as HTMLTextAreaElement;
  context.value = "The cup is being passed, not held indefinitely.";
  context.dispatchEvent(new Event("input"));
  expect(api.state.answers.F1.errors).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem("fic-review-v2:" + data.sourceSha)!).answers.F1.context).toBe(context.value);

  const filter = document.getElementById("filter") as HTMLSelectElement;
  filter.value = "unanswered";
  filter.dispatchEvent(new Event("change"));
  document.querySelector<HTMLButtonElement>('[data-v="correct"]')!.click();
  expect(document.querySelector(".meta")!.textContent).toContain("F2"); // Stay on this item to add context.
  api.move(1);
  expect(document.querySelector(".meta")!.textContent).toContain("F3");

  (document.getElementById("custom-para") as HTMLInputElement).value = "1";
  (document.getElementById("custom-claim") as HTMLTextAreaElement).value = '<img src=x onerror="window.reviewInjected=true"> custom note';
  document.getElementById("custom-add")!.click();
  expect(api.state.custom).toHaveLength(1);
  expect(document.querySelector(".claim")!.textContent).toContain("<img");
  expect(document.querySelector(".claim img")).toBeNull();

  document.getElementById("export")!.click();
  const payload = JSON.parse(await exported!.text());
  expect(payload.answers).toHaveLength(2);
  expect(payload.paras).toBeUndefined();
  expect(JSON.stringify(payload)).not.toContain(paragraphs[2]);
  const before = JSON.stringify(api.state);
  const input = document.getElementById("import-file") as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [{ text: async () => JSON.stringify({ ...payload, sourceSha: "wrong" }) }] });
  await input.onchange!.call(input, new Event("change"));
  expect(JSON.stringify(api.state)).toBe(before);
  expect(document.getElementById("status")!.textContent).toContain("Import failed");

  Object.defineProperty(input, "files", { configurable: true, value: [{ text: async () => JSON.stringify({ ...payload, answers: payload.answers.map((answer: object) => ({ ...answer, context: "Imported correction", updatedAt: "2099-01-01T00:00:00Z" })) }) }] });
  await input.onchange!.call(input, new Event("change"));
  expect(api.state.answers.F1.context).toBe("Imported correction");
});
