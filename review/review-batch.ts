import { importAnswers, storyBytes, validAnswer, verifyStory, type ReviewAnswer, type ReviewBatch } from "./review-batch-data";

const ERRORS = ["Wrong person", "Roles reversed", "Wrong act or body part", "No act happened", "Kissing or rubbing mistaken for penetration", "Fingers or toy mistaken for a penis", "Wish or dialogue treated as an act", "Real act treated as hypothetical", "Missed participant", "Another act is missing", "Needs more context", "Other"];
const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const notice = (text: string) => { element("status").textContent = text; };

export async function mountReview(batch: ReviewBatch) {
  const storageKey = "engine-review:" + batch.batchId;
  const answers: Record<string, ReviewAnswer> = {};
  const stories = new Map<string, string[]>();
  let current: string | undefined = batch.rows[0]?.id;
  let expanded = false, storageOK = true, loading = false;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    for (const row of batch.rows) if (validAnswer(saved[row.id])) answers[row.id] = saved[row.id];
  } catch { storageOK = false; }
  const answered = (id: string) => !!answers[id]?.verdict;
  const visible = () => batch.rows.filter((r) => element<HTMLSelectElement>("filter").value === "all" || (element<HTMLSelectElement>("filter").value === "answered" ? answered(r.id) : !answered(r.id) || r.id === current));
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(answers)); storageOK = true; }
    catch { storageOK = false; notice("Browser storage is unavailable. Export your answers before leaving."); }
    element("progress").textContent = `${batch.rows.filter((r) => answered(r.id)).length} of ${batch.rows.length} answered`;
  };
  const update = (patch: Partial<ReviewAnswer>) => {
    const row = batch.rows.find((r) => r.id === current);
    if (!row || !stories.has(row.fic)) return;
    answers[row.id] = { ...(answers[row.id] ?? { errors: [], context: "" }), ...patch, updatedAt: new Date().toISOString() };
    save();
  };
  const render = () => {
    const rows = visible();
    if (!rows.some((r) => r.id === current)) current = rows[0]?.id;
    const row = rows.find((r) => r.id === current);
    element("card").hidden = !row; element("empty").hidden = !!row;
    element("progress").textContent = `${batch.rows.filter((r) => answered(r.id)).length} of ${batch.rows.length} answered`;
    if (!row) return;
    const source = batch.sources.find((s) => s.file === row.fic)!;
    const paras = stories.get(row.fic), answer = answers[row.id];
    element("where").textContent = `${source.title} · Passage ${row.para}`;
    element("claim").textContent = row.claim;
    const root = element("passages"); root.replaceChildren();
    if (!paras) { const p = document.createElement("p"); p.textContent = `Choose ${source.file}, or the samples ZIP containing it, to read this passage.`; root.append(p); }
    else for (let i = Math.max(0, row.para - (expanded ? 8 : 2)); i <= Math.min(paras.length - 1, row.para + (expanded ? 8 : 2)); i++) {
      const p = document.createElement("p"); p.textContent = paras[i]; p.className = i === row.para ? "focus" : "dim"; root.append(p);
    }
    document.querySelectorAll<HTMLButtonElement>("[data-verdict]").forEach((button) => { button.disabled = !paras; button.setAttribute("aria-pressed", String(answer?.verdict === button.dataset.verdict)); });
    const context = element<HTMLTextAreaElement>("context"); context.disabled = !paras; context.value = answer?.context ?? "";
    element<HTMLButtonElement>("more").disabled = !paras; element("more").textContent = expanded ? "Less context" : "More context";
    const checks = element("errors"); checks.replaceChildren();
    for (const error of ERRORS) {
      const label = document.createElement("label"), input = document.createElement("input"); input.type = "checkbox"; input.disabled = !paras; input.checked = answer?.errors.includes(error) ?? false;
      input.onchange = () => { const values = new Set(answers[row.id]?.errors ?? []); input.checked ? values.add(error) : values.delete(error); update({ errors: [...values] }); };
      label.append(input, document.createTextNode(error)); checks.append(label);
    }
    const index = rows.indexOf(row);
    element<HTMLButtonElement>("previous").disabled = index <= 0; element<HTMLButtonElement>("next").disabled = index >= rows.length - 1;
    element("position").textContent = `${index + 1} of ${rows.length}`;
    element("loaded").textContent = `${stories.size} of ${batch.sources.length} stories loaded. Story text stays on this device.`;
  };
  const move = (n: number) => { const rows = visible(), next = rows[rows.findIndex((r) => r.id === current) + n]; if (next) { current = next.id; expanded = false; render(); element("card").scrollIntoView({ block: "start" }); } };
  const loadFiles = async (files: { name: string; arrayBuffer: () => Promise<ArrayBuffer> }[]) => {
    if (loading) return;
    loading = true; element<HTMLInputElement>("stories").disabled = true;
    let matched = 0; const errors: string[] = [];
    for (const file of files) {
      try {
        element("loaded").textContent = `Reading ${file.name} on your device…`;
        for await (const bytes of storyBytes(file)) {
          const match = await verifyStory(bytes, batch.sources);
          if (match) { stories.set(match.source.file, match.paras); matched++; }
        }
      } catch (error) { errors.push(error instanceof Error ? error.message : "A file could not be read."); }
    }
    loading = false; element<HTMLInputElement>("stories").disabled = false; render();
    notice(errors.length ? errors.join(" ") : matched ? "Stories loaded. Your saved answers are unchanged." : "No matching story versions were found. Choose the original files used for this batch.");
  };
  const payload = () => ({ schema: batch.schema, batchId: batch.batchId, engineCommit: batch.engineCommit, exportedAt: new Date().toISOString(), answers: batch.rows.filter((r) => answers[r.id]).map((r) => ({ id: r.id, key: r.key, fic: r.fic, paragraph: r.para, sourceSha: batch.sources.find((s) => s.file === r.fic)!.sourceSha, ...answers[r.id] })) });
  const answerFile = () => new File([JSON.stringify(payload(), null, 2)], "next-reading-review-answers.json", { type: "application/json" });
  element<HTMLInputElement>("stories").onchange = () => { void loadFiles(Array.from(element<HTMLInputElement>("stories").files ?? [])); };
  element<HTMLSelectElement>("filter").onchange = () => { current = undefined; expanded = false; render(); };
  document.querySelectorAll<HTMLButtonElement>("[data-verdict]").forEach((b) => { b.onclick = () => { update({ verdict: b.dataset.verdict as ReviewAnswer["verdict"] }); render(); if (storageOK) notice("Answer saved. Add context or continue to the next reading."); }; });
  element<HTMLTextAreaElement>("context").oninput = () => update({ context: element<HTMLTextAreaElement>("context").value });
  element("previous").onclick = () => move(-1); element("next").onclick = () => move(1);
  element("more").onclick = () => { expanded = !expanded; render(); };
  element("next-unanswered").onclick = () => { const at = batch.rows.findIndex((r) => r.id === current), next = [...batch.rows.slice(at + 1), ...batch.rows.slice(0, at + 1)].find((r) => !answered(r.id)); if (next) { element<HTMLSelectElement>("filter").value = "unanswered"; current = next.id; expanded = false; render(); } else notice("All readings have an answer."); };
  element("clear").onclick = () => { if (current) delete answers[current]; save(); render(); };
  element("export").onclick = () => { const url = URL.createObjectURL(answerFile()), a = document.createElement("a"); a.href = url; a.download = "next-reading-review-answers.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice("Answers exported. Send this JSON file back when you are ready."); };
  if (navigator.share && navigator.canShare) {
    element("share").hidden = false;
    element("share").onclick = async () => { const file = answerFile(); if (!navigator.canShare({ files: [file] })) { notice("Use Export my answers to save the file."); return; } try { await navigator.share({ files: [file], title: "My reading review" }); } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) notice("Sharing is unavailable. Use Export my answers."); } };
  }
  element<HTMLInputElement>("answers-file").onchange = async () => {
    const file = element<HTMLInputElement>("answers-file").files?.[0]; if (!file) return;
    try { const count = importAnswers(batch, JSON.parse(await file.text()), answers); save(); render(); notice(`${count} answers imported; newer saved answers were preserved.`); }
    catch (e) { notice(e instanceof Error ? e.message : "The answers could not be imported."); }
    element<HTMLInputElement>("answers-file").value = "";
  };
  for (const source of batch.sources) { const li = document.createElement("li"); li.textContent = `${source.title} — ${source.file}`; element("needed").append(li); }
  render(); if (!storageOK) notice("Browser storage is unavailable. Export answers to keep them.");
  return { answers, loadFiles, payload, render, move, import: (value: unknown) => { const count = importAnswers(batch, value, answers); save(); render(); return count; } };
}
