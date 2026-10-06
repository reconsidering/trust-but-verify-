import { createHash, webcrypto } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { TextDecoder, TextEncoder } from "node:util";
import JSZip from "jszip";
import { afterEach, expect, it, vi } from "vitest";
import { importAnswers, reviewParagraphs, storyBytes, verifyStory, type ReviewBatch } from "../review/review-batch-data";
import { mountReview } from "../review/review-batch";

const fixture = '<div id="chapters"><h2>Chapter 1</h2><p>Morgan gives Rowan a cup.</p><p>Rowan thanks Morgan.</p></div>';
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const batch: ReviewBatch = { schema: "engine-review-batch/v1", batchId: "synthetic", engineCommit: "test", sources: [{ file: "synthetic.html", title: "Invented adult review", sourceSha: sha(fixture), paragraphSha: sha(["Chapter 1", "Morgan gives Rowan a cup.", "Rowan thanks Morgan."].join("\n")), paragraphCount: 3 }], rows: [{ id: "B1", key: "cup#synthetic", fic: "synthetic.html", para: 1, pattern: "cup", a: "Morgan", b: "Rowan", act: "passes a cup", kind: "act", claim: "Morgan passes Rowan a cup." }] };
const arrayBuffer = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;
const answer = (updatedAt = "2026-10-06T00:00:00Z") => ({ id: "B1", key: "cup#synthetic", fic: "synthetic.html", paragraph: 1, sourceSha: batch.sources[0].sourceSha, verdict: "correct" as const, errors: [], context: "The cup is passed.", updatedAt });

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); document.body.replaceChildren(); });
const setup = () => { vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("TextEncoder", TextEncoder); vi.stubGlobal("TextDecoder", TextDecoder); };

it("verifies the exact local story and its paragraph layout, even when it arrives in a ZIP", async () => {
  setup();
  expect(reviewParagraphs(fixture)).toHaveLength(3);
  expect(await verifyStory(new TextEncoder().encode("Wrong edition"), batch.sources)).toBeUndefined();
  await expect(verifyStory(new TextEncoder().encode(fixture), [{ ...batch.sources[0], paragraphSha: "wrong" }])).rejects.toThrow("paragraphs");
  const zip = new JSZip().file("folder/synthetic.html", fixture).file("readme.txt", "Ignored data");
  const bytes = await zip.generateAsync({ type: "arraybuffer" });
  const found = [];
  for await (const entry of storyBytes({ name: "samples.zip", arrayBuffer: async () => bytes })) found.push(await verifyStory(entry, batch.sources));
  expect(found).toHaveLength(1);
  expect(found[0]?.paras[1]).toBe("Morgan gives Rowan a cup.");
});

it("rejects mismatched feedback atomically and preserves newer local answers", () => {
  const current = { B1: { ...answer("2026-10-06T12:00:00Z") } };
  expect(importAnswers(batch, { schema: batch.schema, batchId: batch.batchId, engineCommit: batch.engineCommit, answers: [answer()] }, current)).toBe(0);
  expect(current.B1.updatedAt).toBe("2026-10-06T12:00:00Z");
  expect(() => importAnswers(batch, { schema: batch.schema, batchId: "other", engineCommit: batch.engineCommit, answers: [answer()] }, current)).toThrow("different");
  expect(() => importAnswers(batch, { schema: batch.schema, batchId: batch.batchId, engineCommit: batch.engineCommit, answers: [answer("2026-10-07T00:00:00Z"), { ...answer(), id: "unknown" }] }, current)).toThrow("match");
  expect(() => importAnswers(batch, { schema: batch.schema, batchId: batch.batchId, engineCommit: batch.engineCommit, answers: [answer(), answer()] }, current)).toThrow("match");
  expect(current.B1.updatedAt).toBe("2026-10-06T12:00:00Z");
});

it("publishes only reading metadata, with diverse sources and unique answer identities", () => {
  const published = JSON.parse(readFileSync("public/review/next-batch.json", "utf8")) as ReviewBatch;
  expect(published.engineCommit).toMatch(/^[a-f0-9]{40}$/);
  expect(published.rows).toHaveLength(40);
  expect(published.sources.length).toBeGreaterThanOrEqual(8);
  expect(new Set(published.rows.map((r) => r.id)).size).toBe(40);
  expect(new Set(published.rows.map((r) => r.key)).size).toBe(40);
  for (const source of published.sources) {
    expect(Object.keys(source).sort()).toEqual(["file", "paragraphCount", "paragraphSha", "sourceSha", "title"]);
    expect(source.sourceSha).toMatch(/^[a-f0-9]{64}$/);
    expect(source.paragraphSha).toMatch(/^[a-f0-9]{64}$/);
    expect(published.rows.filter((r) => r.fic === source.file).length).toBeLessThanOrEqual(5);
  }
  for (const row of published.rows) {
    expect(Object.keys(row).every((k) => ["id", "key", "fic", "para", "pattern", "a", "b", "act", "kind", "role", "claim"].includes(k))).toBe(true);
    expect(row.para).toBeGreaterThanOrEqual(0);
    expect(row.para).toBeLessThan(published.sources.find((s) => s.file === row.fic)!.paragraphCount);
  }
});

it("imports accepted owner labels without copying private context and rejects altered reading keys before writing", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-import-")), batchPath = join(dir, "batch.json"), feedbackPath = join(dir, "answers.json"), out = join(dir, "labels.json");
  writeFileSync(batchPath, JSON.stringify(batch));
  const payload = { schema: batch.schema, batchId: batch.batchId, engineCommit: batch.engineCommit, answers: [{ ...answer(), context: "DO_NOT_PUBLISH_PRIVATE_CONTEXT" }] };
  writeFileSync(feedbackPath, JSON.stringify(payload));
  expect(spawnSync("node", ["scripts/import-review-batch.mjs", batchPath, feedbackPath, out]).status).toBe(0);
  const saved = readFileSync(out, "utf8");
  expect(JSON.parse(saved).labels).toEqual({ "cup#synthetic": "ok" });
  expect(saved).not.toContain("DO_NOT_PUBLISH_PRIVATE_CONTEXT");
  payload.answers[0].key = "different#key";
  writeFileSync(feedbackPath, JSON.stringify(payload));
  expect(spawnSync("node", ["scripts/import-review-batch.mjs", batchPath, feedbackPath, out]).status).not.toBe(0);
  expect(readFileSync(out, "utf8")).toBe(saved);
});

it("gates answering on the matching story, saves reasons safely, and restores answers without retaining story text", async () => {
  setup();
  document.body.innerHTML = readFileSync("review/next-batch.html", "utf8");
  const fetchSpy = vi.fn(); vi.stubGlobal("fetch", fetchSpy);
  const api = await mountReview(batch);
  expect(document.querySelector<HTMLButtonElement>('[data-verdict="wrong"]')!.disabled).toBe(true);
  await api.loadFiles([{ name: "synthetic.html", arrayBuffer: async () => arrayBuffer(fixture) }]);
  expect(document.getElementById("passages")!.textContent).toContain("Morgan gives Rowan");
  document.querySelector<HTMLButtonElement>('[data-verdict="wrong"]')!.click();
  document.querySelector<HTMLInputElement>("#errors input")!.click();
  const textarea = document.getElementById("context") as HTMLTextAreaElement;
  textarea.value = '<img src=x onerror="alert(1)"> The cup is moving.'; textarea.dispatchEvent(new Event("input"));
  expect(api.answers.B1.errors).toEqual(["Wrong person"]);
  expect(api.payload().answers[0].context).toBe(textarea.value);
  expect(document.querySelector("#context img")).toBeNull();
  const saved = localStorage.getItem("engine-review:synthetic")!;
  expect(saved).not.toContain(fixture); expect(fetchSpy).not.toHaveBeenCalled();
  document.body.innerHTML = readFileSync("review/next-batch.html", "utf8");
  const reopened = await mountReview(batch);
  expect(reopened.answers.B1.verdict).toBe("wrong");
  expect(document.querySelector<HTMLButtonElement>('[data-verdict="correct"]')!.disabled).toBe(true);
});

it("rechecks gold verdicts separately, browses the whole story, and preserves reading answers", async () => {
  setup();
  document.body.innerHTML = readFileSync("review/next-batch.html", "utf8");
  const stories = new Map<string,string[]>();
  const reading = await mountReview(batch, { stories });
  await reading.loadFiles([{ name: "synthetic.html", arrayBuffer: async () => arrayBuffer(fixture) }]);
  document.querySelector<HTMLButtonElement>('[data-verdict="correct"]')!.click();
  const gold: ReviewBatch = { ...batch, schema: "engine-gold-review/v1", batchId: "synthetic-gold", rows: [{ ...batch.rows[0], id:"G1", key:"gold:synthetic:0#hash", kind:"gold-verdict", gold:{file:"synthetic.json", hash:"hash", pairing:"Morgan/Rowan",act:"cup",verdict:"one_way"}, evidence:[{from:1,to:2}] }] };
  const verdicts = await mountReview(gold, { stories });
  expect(document.getElementById("gold-browse")!.hidden).toBe(false);
  expect(document.querySelector<HTMLButtonElement>('[data-verdict="wrong"]')!.disabled).toBe(false);
  document.querySelector<HTMLButtonElement>('[data-verdict="wrong"]')!.click();
  document.getElementById("later-passages")!.click();
  expect((document.getElementById("passage-number") as HTMLInputElement).value).toBe("2");
  expect(verdicts.payload().schema).toBe("engine-gold-review/v1");
  expect(verdicts.payload().answers[0].gold?.pairing).toBe("Morgan/Rowan");
  expect(() => importAnswers(batch, verdicts.payload(), reading.answers)).toThrow("different");
  const reopened = await mountReview(batch, { stories });
  expect(reopened.answers.B1.verdict).toBe("correct");
  expect(document.getElementById("gold-browse")!.hidden).toBe(true);
  expect(document.getElementById("needed")!.children).toHaveLength(1);
});

it("includes each remaining gold range separately and publishes no story passages", () => {
  const gold = JSON.parse(readFileSync("public/review/gold-verdicts.json","utf8")) as ReviewBatch;
  expect(gold.schema).toBe("engine-gold-range-review/v1");
  expect(gold.rows).toHaveLength(51);
  expect(new Set(gold.rows.map(r => r.key)).size).toBe(51);
  expect(gold.rows.some(r => r.fic === "belonging.html")).toBe(false);
  for (const row of gold.rows) {
    const bytes = readFileSync("tests/gold/" + row.gold!.file);
    const original = JSON.parse(bytes.toString());
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(row.gold!.hash);
    expect(original.verdicts.some((v: {pairing:string;act:string;verdict:string}) => v.pairing === row.gold!.pairing && v.act === row.act && v.verdict === row.gold!.verdict)).toBe(true);
    expect(row.evidence).toHaveLength(1);
    expect(original.scenes.some((s: {from:number;to:number;top:string;bottom:string;act:string}) => s.from === row.para && s.to === row.evidence![0].to && s.top === row.a && s.bottom === row.b && s.act === row.act)).toBe(true);
    expect(Object.keys(row).every((key) => ["id","key","fic","para","pattern","a","b","act","kind","claim","gold","evidence"].includes(key))).toBe(true);
    const source = gold.sources.find((s) => s.file === row.fic)!;
    for (const range of row.evidence ?? []) { expect(range.from).toBeGreaterThanOrEqual(0); expect(range.to).toBeLessThan(source.paragraphCount); }
  }
});


it("keeps range answers independent, shows the entire range, and rejects old verdict answers", async () => {
  setup(); document.body.innerHTML = readFileSync("review/next-batch.html", "utf8");
  const gold: ReviewBatch = {...batch, schema:"engine-gold-range-review/v1",batchId:"ranges",rows:[1,2].map((n) => ({...batch.rows[0],id:"G"+n,key:"range"+n,para:n,evidence:[{from:n,to:n}]}))};
  const api = await mountReview(gold,{stories:new Map([["synthetic.html",reviewParagraphs(fixture)]])});
  document.querySelector<HTMLButtonElement>('[data-verdict="wrong"]')!.click();
  document.getElementById("card")!.scrollIntoView = vi.fn();
  api.move(1); expect(api.answers.G2).toBeUndefined();
  document.querySelector<HTMLButtonElement>('[data-verdict="correct"]')!.click();
  expect(api.payload().answers.map(a => a.verdict)).toEqual(["wrong","correct"]);
  expect(api.payload().answers[1].evidence).toEqual([{from:2,to:2}]);
  expect(document.getElementById("where")!.textContent).toContain("Gold range 2–2");
  expect(() => api.import({...api.payload(),schema:"engine-gold-review/v1"})).toThrow("different");
  const altered = api.payload(); altered.answers[0].evidence = [{from:0,to:2}];
  expect(() => api.import(altered)).toThrow("gold range");
});

it("incorporates only the five non-Belonging answers and preserves unresolved feedback", () => {
  const accepted = JSON.parse(readFileSync("tests/gold-review/owner-2026-10-06.json","utf8"));
  expect(accepted.answers).toHaveLength(5);
  expect(accepted.answers.some((a: {fic:string}) => a.fic === "belonging.html")).toBe(false);
  expect(accepted.answers.every((a: object) => !("context" in a))).toBe(true);
  expect(accepted.decisions.find((d: {id:string}) => d.id === "G2").status).toBe("unresolved");
  const angel = JSON.parse(readFileSync("tests/gold/angel-without-a-god.json","utf8"));
  expect(angel.scenes.some((s: {act:string;from:number}) => s.act === "anal" && s.from === 4270)).toBe(false);
  expect(angel.scenes.some((s: {act:string;from:number}) => s.act === "anal" && s.from === 4302)).toBe(true);
});


it("shows a complete gold range even when it extends past the normal context window", async () => {
  setup(); document.body.innerHTML = readFileSync("review/next-batch.html", "utf8");
  const paras = Array.from({length:25},(_,n) => `Invented adult passage ${n}.`);
  const gold: ReviewBatch = {...batch,schema:"engine-gold-range-review/v1",batchId:"long-range",sources:[{...batch.sources[0],paragraphCount:25}],rows:[{...batch.rows[0],para:1,evidence:[{from:1,to:20}]}]};
  await mountReview(gold,{stories:new Map([["synthetic.html",paras]])});
  const highlights = document.querySelectorAll("#passages .focus");
  expect(highlights).toHaveLength(20);
  expect(highlights[19].textContent).toBe(paras[20]);
});
