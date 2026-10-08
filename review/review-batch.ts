import {validateReadingReviews} from "../scripts/reading-review-validation.mjs";
import {renderIndividualReadings} from "./individual-readings";
import { importAnswers, storyBytes, validAnswer, verifyStory, type ActReview, type ReviewAnswer, type ReviewBatch } from "./review-batch-data";

const ERRORS = ["Wrong person", "Roles reversed", "Wrong act or body part", "No act happened", "Kissing or rubbing mistaken for penetration", "Fingers or toy mistaken for a penis", "Penis mistaken for fingers or a toy", "Wish or dialogue treated as an act", "Memory counted as a new scene", "Wrong occurrence: memory / fantasy / habitual / recording", "Real act treated as hypothetical", "Missed participant", "Another act is missing", "Needs more context", "Other"];
const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const notice = (text: string) => { element("status").textContent = text; };

export async function mountReview(batch: ReviewBatch, options: { stories?: Map<string, string[]>; sources?: ReviewBatch["sources"] } = {}) {
  const storageKey = "engine-review:" + batch.batchId;
  const answers: Record<string, ReviewAnswer> = {};
  const stories = options.stories ?? new Map<string, string[]>();
  const isRange = batch.schema === "engine-gold-range-review/v1";
  const isGold = isRange || batch.schema === "engine-gold-review/v1";
  const hasProposals = batch.rows.some(r => r.proposal);
  let browse = batch.rows[0]?.para ?? 0;
  let current: string | undefined = batch.rows[0]?.id;
  let expanded = false, storageOK = true, loading = false;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    for (const row of batch.rows) if (validAnswer(saved[row.id])) { try {validateReadingReviews(row,{...saved[row.id],evidence:row.evidence});answers[row.id] = saved[row.id];} catch { /* Keep invalid saved readings out of the exported feedback. */ } }
  } catch { storageOK = false; }
  const answered = (id: string) => {const row=batch.rows.find(r=>r.id===id);return !!answers[id]?.verdict && (row?.engineReadings??[]).filter(h=>h.proposal&&h.id!=='primary').every(h=>!!answers[id]?.readingReviews?.[h.id!]?.verdict);};
  const progress = () => {
    const readings=batch.rows.flatMap(row=>(row.engineReadings??[]).filter(h=>h.proposal&&h.id!=='primary').map(h=>!!answers[row.id]?.readingReviews?.[h.id!]?.verdict));
    const acts = batch.rows.flatMap(row => (row.sceneActs ?? []).map(act => !!answers[row.id]?.actReviews?.[act.id]?.verdict));
    return `${batch.rows.filter(r => !!answers[r.id]?.verdict).length} of ${batch.rows.length} answered` + (acts.length ? ` · ${acts.filter(Boolean).length} of ${acts.length} act proposals checked` : '') + (readings.length ? ` · ${readings.filter(Boolean).length} of ${readings.length} additional engine readings checked` : '');
  };
  const visible = () => batch.rows.filter((r) => element<HTMLSelectElement>("filter").value === "all" || (element<HTMLSelectElement>("filter").value === "answered" ? answered(r.id) : !answered(r.id) || r.id === current));
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(answers)); storageOK = true; }
    catch { storageOK = false; notice("Browser storage is unavailable. Export your answers before leaving."); }
    element("progress").textContent = progress();
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
    element("progress").textContent = progress();
    if (!row) return;
    const source = batch.sources.find((s) => s.file === row.fic)!;
    element("gold-browse").hidden = !isGold;
    const paras = stories.get(row.fic), answer = answers[row.id];
    const focus = isGold ? Math.max(0, Math.min(browse, source.paragraphCount - 1)) : row.para;
    const radius = isGold ? (expanded ? 20 : 8) : hasProposals ? (expanded ? 20 : 5) : (expanded ? 8 : 2);
    if (isGold) {
      element<HTMLInputElement>("passage-number").value = String(focus);
      element<HTMLInputElement>("passage-number").max = String(source.paragraphCount - 1);
      element("passage-range").textContent = `Passages ${Math.max(0, focus - radius)}–${Math.min(source.paragraphCount - 1, focus + radius)} of 0–${source.paragraphCount - 1}`;
      const select = element<HTMLSelectElement>("evidence"); select.replaceChildren();
      const placeholder = document.createElement("option"); placeholder.value = ""; placeholder.textContent = "Choose a recorded window"; select.append(placeholder);
      for (const range of row.evidence ?? []) { const option = document.createElement("option"); option.value = String(range.from); option.textContent = `${range.from}–${range.to}`; select.append(option); }
      for (const id of ["go-passage", "earlier-passages", "later-passages", "passage-number", "evidence"]) (element(id) as HTMLButtonElement).disabled = !paras;
    }
    element("where").textContent = isRange ? `${source.title} · Gold range ${row.evidence![0].from}–${row.evidence![0].to}` : isGold ? `${source.title} · Whole-story gold verdict` : `${source.title} · Passage ${row.para}`;
    element("claim").textContent = row.claim;
    const audit = row.labelAudit;
    element('past-labels').hidden = !audit;
    element('past-current-heading').hidden = !audit;
    const history = element('past-label-history'); history.replaceChildren();
    if (audit) {
      for (const label of audit.pastLabels) {
        const item = document.createElement('section'); item.className = 'past-label-record';
        const verdict = document.createElement('strong'); verdict.textContent = `Past label: ${label.verdict === 'ok' ? 'Correct (ok)' : label.verdict === 'wrong' ? 'Wrong' : 'Not sure'}${label.retired ? ' · retired' : ''}`;
        const description = document.createElement('p'); description.textContent = label.claim;
        const provenance = document.createElement('p'); provenance.className = 'small'; provenance.textContent = `${label.provenance}${label.date ? ' · ' + label.date : ''}${label.weight !== undefined ? ' · label weight ' + label.weight : ''}${label.confidence !== undefined ? ' · recorded engine confidence ' + Math.round(label.confidence * 100) + '%' : ''} · ${label.source}`;
        item.append(verdict, description, provenance);
        if (label.retired) { const retired = document.createElement('p'); retired.className = 'small'; retired.textContent = label.retired; item.append(retired); }
        history.append(item);
      }
      element('past-label-status').textContent = audit.status;
      const reasons = element('past-label-reasons'); reasons.replaceChildren();
      for (const text of audit.reasons) { const li = document.createElement('li'); li.textContent = text; reasons.append(li); }
      const evidence = element('past-label-evidence'); evidence.replaceChildren();
      for (const text of audit.recentEvidence) { const p = document.createElement('p'); p.className = 'small'; p.textContent = text; evidence.append(p); }
      element('past-label-reference').textContent = audit.referenceClaim ? `Pre-change engine reference (${audit.referenceCommit}; not a recovered original review): ${audit.referenceClaim}` : '';
    }
    document.querySelectorAll<HTMLButtonElement>('[data-past-label]').forEach(button => {
      button.disabled = !paras || !audit;
      button.setAttribute('aria-pressed', String(answer?.pastLabelReview === button.dataset.pastLabel));
    });
    const proposal = row.proposal;
    element("reading-proposal").hidden = !proposal;
    element("engine-answer-label").hidden = !proposal;
    if (proposal) {
      element("engine-confidence").textContent = `Engine confidence in its claim: ${Math.round(row.engineConfidence! * 100)}%${audit ? ' · ' + audit.occurrence : ''}`;
      element("proposal-reading").textContent = proposal.reading;
      element("proposal-rationale").textContent = proposal.rationale;
      element("proposal-confidence").textContent = `My assessment: engine ${proposal.verdict === 'uncertain' ? 'uncertain' : proposal.verdict} · My confidence in this assessment: ${Math.round(proposal.confidence * 100)}%`;
    }
    document.querySelectorAll<HTMLButtonElement>('[data-proposal]').forEach(button => {
      button.disabled = !paras || !proposal;
      button.setAttribute('aria-pressed', String(answer?.proposalRevision === proposal?.revision && answer?.proposalReview === button.dataset.proposal));
    });
    element('scene-acts').hidden = !row.sceneActs;
    const actCards = element('act-cards'); actCards.replaceChildren();
    for (const act of row.sceneActs ?? []) {
      const baseline: ActReview = { revision: act.revision, act: act.act, performer: act.performer, receiver: act.receiver, occurrence: act.occurrence, context: '', errors: [] };
      const review = answer?.actReviews?.[act.id];
      const change = (patch: Partial<ActReview>) => update({ actReviews: { ...(answers[row.id]?.actReviews ?? {}), [act.id]: { ...(answers[row.id]?.actReviews?.[act.id] ?? baseline), ...patch } } });
      const card = document.createElement('section'); card.className = 'act-card'; card.dataset.actId = act.id;
      const title = document.createElement('h4'); title.textContent = `${act.act}: ${act.performer}${act.receiver ? ' → ' + act.receiver : ' (self)'}`;
      const summary = document.createElement('p'); summary.textContent = `${act.occurrence} · ¶${act.evidence.from}–${act.evidence.to} · My confidence: ${Math.round(act.reviewerConfidence * 100)}%`;
      const engine = document.createElement('p'); engine.className = 'small';
      const matches = row.engineReadings!.filter(h => act.engineReadingKeys.includes(h.key));
      engine.textContent = matches.length ? 'Matching engine readings: ' + matches.map(h => `¶${h.para}: ${h.kind}, ${h.confidence === null ? 'score unavailable' : Math.round(h.confidence * 100) + '%'}`).join('; ') : 'Engine: no matching act/participant reading in this evidence range; no confidence score available. Related or conflicting readings are listed below.';
      const note = document.createElement('p'); note.textContent = act.note;
      const evidence = document.createElement('div'); evidence.className = 'act-evidence'; evidence.setAttribute('aria-label', 'Cited paragraphs');
      if (!paras) {
        const message = document.createElement('p'); message.textContent = 'Load the story to read the cited paragraphs here.'; evidence.append(message);
      } else for (let i = act.evidence.from; i <= act.evidence.to; i++) {
        const paragraph = document.createElement('p'), number = document.createElement('span'); number.className = 'passage-number'; number.textContent = `¶${i} · `;
        paragraph.append(number, document.createTextNode(paras[i])); evidence.append(paragraph);
      }
      const choices = document.createElement('div'); choices.className = 'choices';
      for (const [value, text] of [['correct', 'Correct'], ['wrong', 'Wrong'], ['uncertain', 'Not sure']] as const) {
        const button = document.createElement('button'); button.textContent = text; button.dataset.actVerdict = value; button.disabled = !paras;
        button.setAttribute('aria-pressed', String(review?.verdict === value)); button.onclick = () => { change({ verdict: value }); render(); }; choices.append(button);
      }
      const corrections = document.createElement('details'), heading = document.createElement('summary'); heading.textContent = 'Correction / additional context'; corrections.append(heading);
      for (const [key, labelText] of [['act', 'Act'], ['performer', 'Performer / giver'], ['receiver', 'Receiver (blank for solo)'], ['occurrence', 'Occurrence: performed, imagined, memory, recording, habitual, wanted or uncertain'], ['context', 'Additional context / correction']] as const) {
        const label = document.createElement('label'); label.textContent = labelText;
        const input = key === 'context' ? document.createElement('textarea') : document.createElement('input'); input.value = (review ?? baseline)[key]; input.disabled = !paras; input.dataset.actField = key;
        input.oninput = () => change({ [key]: input.value }); label.append(input); corrections.append(label);
      }
      const errors = document.createElement('fieldset'), legend = document.createElement('legend'); legend.textContent = 'Common errors'; errors.append(legend);
      for (const error of ['Wrong person', 'Roles reversed', 'Wrong act or body part', 'Fingers or toy mistaken for a penis', 'No act happened', 'Wish or dialogue treated as an act', 'Memory counted as a new scene', 'Another act is missing', 'Range boundaries wrong', 'Needs more context']) {
        const label = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.disabled = !paras; input.checked = review?.errors.includes(error) ?? false;
        input.onchange = () => { const values = new Set(answers[row.id]?.actReviews?.[act.id]?.errors ?? []); input.checked ? values.add(error) : values.delete(error); change({ errors: [...values] }); }; label.append(input, document.createTextNode(error)); errors.append(label);
      }
      corrections.append(errors); card.append(title, summary, engine, note, evidence, choices, corrections); actCards.append(card);
    }
    element('scene-engine-review').hidden = !row.engineReadings?.length;
    renderIndividualReadings(element('scene-engine-readings'),row,paras,()=>answers[row.id],update,render);
    element('training-notes').textContent = row.trainingNotes?.join(' ') ?? '';
    const root = element("passages"); root.replaceChildren();
    if (!paras) { const p = document.createElement("p"); p.textContent = `Choose ${source.file}, or the samples ZIP containing it, to read this passage.`; root.append(p); }
    else for (let i = Math.max(0, proposal ? Math.min(row.evidence![0].from, focus - radius) : focus - radius); i <= Math.min(paras.length - 1, isRange && focus === row.para ? row.evidence![0].to + radius : proposal ? Math.max(row.evidence![0].to, focus + radius) : focus + radius); i++) {
      const p = document.createElement("p");
      if (proposal) { const number = document.createElement('span'); number.className = 'passage-number'; number.textContent = `¶${i} · `; p.append(number); }
      p.append(document.createTextNode(paras[i])); p.className = (isRange && i >= row.evidence![0].from && i <= row.evidence![0].to) || i === focus ? "focus" : "dim"; root.append(p);
    }
    document.querySelectorAll<HTMLButtonElement>("[data-verdict]").forEach((button) => { button.disabled = !paras; button.setAttribute("aria-pressed", String(answer?.verdict === button.dataset.verdict)); });
    const context = element<HTMLTextAreaElement>("context"); context.disabled = !paras; context.value = answer?.context ?? "";
    element<HTMLButtonElement>("more").disabled = !paras; element("more").textContent = expanded ? "Less context" : "More context";
    const checks = element("errors"); checks.replaceChildren();
    for (const error of isGold ? ["Wrong act or body part", "Roles reversed", "Fingers or toy mistaken for a penis", "Wish or dialogue treated as an act", "Act missed", "Act did not occur", "Wrong participants", "Range boundaries wrong", "Needs more context", "Other"] : [...new Set([...ERRORS, ...(proposal?.errors ?? []), ...(answer?.errors ?? [])])]) {
      const label = document.createElement("label"), input = document.createElement("input"); input.type = "checkbox"; input.disabled = !paras; input.checked = answer?.errors.includes(error) ?? false;
      input.onchange = () => { const values = new Set(answers[row.id]?.errors ?? []); input.checked ? values.add(error) : values.delete(error); update({ errors: [...values] }); };
      label.append(input, document.createTextNode(error)); checks.append(label);
    }
    const index = rows.indexOf(row);
    element<HTMLButtonElement>("previous").disabled = index <= 0; element<HTMLButtonElement>("next").disabled = index >= rows.length - 1;
    element("position").textContent = `${index + 1} of ${rows.length}`;
    element("loaded").textContent = `${batch.sources.filter((s) => stories.has(s.file)).length} of ${batch.sources.length} stories loaded. Story text stays on this device.`;
  };
  const move = (n: number) => { const rows = visible(), next = rows[rows.findIndex((r) => r.id === current) + n]; if (next) { current = next.id; browse = next.para; expanded = false; render(); element("card").scrollIntoView({ block: "start" }); } };
  const loadFiles = async (files: { name: string; arrayBuffer: () => Promise<ArrayBuffer> }[]) => {
    if (loading) return;
    loading = true; element<HTMLInputElement>("stories").disabled = true; element<HTMLSelectElement>("review-kind").disabled = true;
    let matched = 0; const errors: string[] = [];
    for (const file of files) {
      try {
        element("loaded").textContent = `Reading ${file.name} on your device…`;
        for await (const bytes of storyBytes(file)) {
          const match = await verifyStory(bytes, options.sources ?? batch.sources);
          if (match) { stories.set(match.source.file, match.paras); matched++; }
        }
      } catch (error) { errors.push(error instanceof Error ? error.message : "A file could not be read."); }
    }
    loading = false; element<HTMLInputElement>("stories").disabled = false; element<HTMLSelectElement>("review-kind").disabled = false; render();
    notice(errors.length ? errors.join(" ") : matched ? "Stories loaded. Your saved answers are unchanged." : "No matching story versions were found. Choose the original files used for this batch.");
  };
  const payload = () => ({ schema: batch.schema, batchId: batch.batchId, engineCommit: batch.engineCommit, exportedAt: new Date().toISOString(), answers: batch.rows.filter((r) => answers[r.id]).map((r) => ({ id: r.id, key: r.key, fic: r.fic, paragraph: r.para, sourceSha: batch.sources.find((s) => s.file === r.fic)!.sourceSha, ...(r.gold ? { gold: r.gold } : {}), ...(isRange || r.sceneActs || r.engineReadings ? { evidence: r.evidence } : {}), ...answers[r.id] })) });
  const answerName = batch.selection?.answerFile ?? (batch.rows.some(r => r.labelAudit) ? 'past-label-review-answers.json' : batch.rows.some(r => r.sceneActs) ? 'suspect-scene-review-2-answers.json' : hasProposals ? 'suspect-scene-review-answers.json' : isRange ? 'gold-range-review-answers.json' : isGold ? 'gold-verdict-review-answers.json' : 'next-reading-review-answers.json');
  const answerFile = () => new File([JSON.stringify(payload(), null, 2)], answerName, { type: "application/json" });
  element<HTMLInputElement>("stories").onchange = () => { void loadFiles(Array.from(element<HTMLInputElement>("stories").files ?? [])); };
  element<HTMLSelectElement>("filter").onchange = () => { current = undefined; browse = visible()[0]?.para ?? 0; expanded = false; render(); };
  document.querySelectorAll<HTMLButtonElement>("[data-verdict]").forEach((b) => { b.onclick = () => {
    const previous = current ? answers[current] : undefined;
    update({ verdict: b.dataset.verdict as ReviewAnswer["verdict"], proposalReview: previous?.proposalReview === 'disagree' ? 'disagree' : undefined, proposalRevision: previous?.proposalReview === 'disagree' ? previous.proposalRevision : undefined });
    render(); if (storageOK) notice("Answer saved. Add context or continue to the next reading.");
  }; });
  document.querySelectorAll<HTMLButtonElement>('[data-proposal]').forEach(b => { b.onclick = () => {
    const row = batch.rows.find(r => r.id === current);
    const proposal = row?.proposal;
    if (!proposal) return;
    const review = b.dataset.proposal as ReviewAnswer['proposalReview'];
    const previous = current ? answers[current] : undefined;
    const proposedContext = `${proposal.reading}\n\n${proposal.rationale}`;
    const existingContext = previous?.context ?? '';
    const context = existingContext.trim() ? existingContext.includes(proposedContext) ? existingContext : `${existingContext}\n\n${proposedContext}` : proposedContext;
    const audit = row?.labelAudit;
    const labels = audit?.pastLabels.filter(label => !label.retired) ?? [];
    const expectedLabel = proposal.verdict === 'correct' ? 'ok' : 'wrong';
    const pastLabelReview: ReviewAnswer['pastLabelReview'] = proposal.verdict === 'uncertain' ? 'uncertain' : audit && !audit.changed && !audit.quarantined && labels.length && labels.every(label => label.identityVerified && label.verdict === expectedLabel) ? 'keep' : 'replace';
    update({ proposalReview: review, proposalRevision: proposal.revision, verdict: review === 'agree' ? proposal.verdict : review === 'uncertain' ? 'uncertain' : undefined, errors: review === 'agree' ? [...new Set([...(previous?.errors ?? []), ...proposal.errors])] : [], ...(review === 'agree' ? {context, ...(audit ? {pastLabelReview} : {})} : {}) });
    render();
    if (storageOK) notice(review === 'disagree' ? 'Disagreement saved. Mark the engine correct, wrong, or not sure and add your correction.' : review === 'agree' ? 'Assessment saved. My reading, explanation and applicable errors were added; your existing notes and checked errors were preserved.' : 'Assessment saved. Add context or continue to the next reading.');
  }; });
  document.querySelectorAll<HTMLButtonElement>('[data-past-label]').forEach(b => { b.onclick = () => {
    update({pastLabelReview: b.dataset.pastLabel as ReviewAnswer['pastLabelReview']}); render();
    if (storageOK) notice('Past-label decision saved separately. Mark the current engine claim or agree/disagree with my assessment.');
  }; });
  element<HTMLTextAreaElement>("context").oninput = () => update({ context: element<HTMLTextAreaElement>("context").value });
  element("previous").onclick = () => move(-1); element("next").onclick = () => move(1);
  element("more").onclick = () => { expanded = !expanded; render(); };
  element("next-unanswered").onclick = () => { const at = batch.rows.findIndex((r) => r.id === current), next = [...batch.rows.slice(at + 1), ...batch.rows.slice(0, at + 1)].find((r) => !answered(r.id)); if (next) { element<HTMLSelectElement>("filter").value = "unanswered"; current = next.id; browse = next.para; expanded = false; render(); } else notice("All readings have an answer."); };
  element("clear").onclick = () => { if (current) delete answers[current]; save(); render(); };
  element("export").onclick = () => { const url = URL.createObjectURL(answerFile()), a = document.createElement("a"); a.href = url; a.download = answerName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice("Answers exported. Send this JSON file back when you are ready."); };
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
  element("needed").replaceChildren();
  const jump = (n: number) => { const row = batch.rows.find((r) => r.id === current); if (!row || !Number.isFinite(n)) return; browse = Math.max(0, Math.min(Math.trunc(n), batch.sources.find((s) => s.file === row.fic)!.paragraphCount - 1)); render(); };
  element("go-passage").onclick = () => jump(Number(element<HTMLInputElement>("passage-number").value));
  element("earlier-passages").onclick = () => jump(browse - 16);
  element("later-passages").onclick = () => jump(browse + 16);
  element<HTMLSelectElement>("evidence").onchange = () => { const value = element<HTMLSelectElement>("evidence").value; if (value !== "") jump(Number(value)); };
  for (const source of batch.sources) { const li = document.createElement("li"); li.textContent = `${source.title} — ${source.file}`; element("needed").append(li); }
  render(); if (!storageOK) notice("Browser storage is unavailable. Export answers to keep them.");
  return { answers, loadFiles, payload, render, move, import: (value: unknown) => { const count = importAnswers(batch, value, answers); save(); render(); return count; } };
}
