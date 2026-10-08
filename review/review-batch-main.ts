import { mountReview } from "./review-batch";
import { validatePastLabelBatch, validateSuspectBatch, type ReviewBatch } from "./review-batch-data";

try {
  const get = async (file: string): Promise<ReviewBatch> => {
    const response = await fetch(file);
    if (!response.ok) throw Error("The review batch could not be loaded. Try reloading this page.");
    return response.json();
  };
  const [readings, gold, suspect, suspect2, past, suspect3] = await Promise.all([get("./next-batch.json"), get("./gold-verdicts.json"), get("./suspect-scenes.json").then(b => validateSuspectBatch(b)), get("./suspect-scenes-2.json").then(b => validateSuspectBatch(b)), get('./past-labels.json').then(validatePastLabelBatch), get('./suspect-scenes-3.json').then(b => validateSuspectBatch(b, 50))]);
  const stories = new Map<string, string[]>();
  const sources = [...new Map([...readings.sources, ...gold.sources, ...suspect.sources, ...suspect2.sources, ...past.sources, ...suspect3.sources].map((s) => [s.file, s])).values()];
  const select = document.getElementById("review-kind") as HTMLSelectElement;
  const requested = new URLSearchParams(location.search).get('review');
  if (requested && ['readings', 'gold', 'suspect', 'suspect2', 'past', 'suspect3'].includes(requested)) select.value = requested;
  const show = async () => {
    const batch = select.value === 'suspect3' ? suspect3 : select.value === 'past' ? past : select.value === 'suspect2' ? suspect2 : select.value === "gold" ? gold : select.value === 'suspect' ? suspect : readings;
    document.querySelector("h1")!.textContent = batch === gold ? "Check the gold ranges" : batch === suspect ? "Check 40 likely-error scenes" : "Check the next readings";
    if (batch === suspect2) document.querySelector('h1')!.textContent = 'Check 40 new likely-error scenes';
    if (batch === past) document.querySelector('h1')!.textContent = 'Recheck 50 past labels';
    if (batch === suspect3) document.querySelector('h1')!.textContent = 'Check 50 new likely-error scenes';
    (document.getElementById("filter") as HTMLSelectElement).value = "all";
    document.getElementById("review-explanation")!.textContent = batch === gold ? "Check each recorded range separately, including its act and participants. Belonging is excluded. Previous whole-story answers do not count as range answers." : batch === suspect ? "Fresh detections ranked by the model’s doubt, with limits on repeated patterns, stories, and nearby passages. Read my assessment, then agree or disagree. A likely-error selection may still be correct. Engine confidence is the model’s probability that this individual reading is right, not the whole-story verdict score." : "Check the sampled readings. Your existing reading answers are preserved; these scores remain hidden.";
    if (batch === suspect2) document.getElementById('review-explanation')!.textContent = 'Batch 2: new encounters, excluding previous review scenes. Review the main claim and each additional act separately. Engine scores rate individual readings; my scores are subjective. Missing detections have no engine score. Actual acts, memories, fantasies and hints stay distinct; unmarked hints never become negative labels.';
    if (batch === past) document.getElementById('review-explanation')!.textContent = 'Older labels most in need of rechecking after your recent reviews and engine changes. Compare the saved label and claim with today’s reading, then check my call. A corrected claim can need a new label without making your earlier judgment wrong. Engine scores use the current trained model, not a held-out test; my confidence is subjective. Hints stay distinct from performed acts. Your past answers are preserved.';
    if (batch === suspect3) document.getElementById('review-explanation')!.textContent = 'Batch 3: 50 new passages selected using your latest past-label answers and earlier reviews. Previous review windows and nearby passages are excluded. Agree / Disagree refers to my assessment, not the engine. Check each proposed act separately. Engine confidence rates the current individual reading; my confidence is subjective. Missing detections have no engine score. Acts, memories, habits, fantasies and hints stay distinct. Unmarked hints never become negative labels.';
    document.getElementById("status")!.textContent = "";
    await mountReview(batch, { stories, sources });
  };
  select.onchange = () => { void show(); };
  await show();
} catch (error) {
  document.getElementById("status")!.textContent = error instanceof Error ? error.message : "The review could not be opened. Try reloading this page.";
}
