import { mountReview } from "./review-batch";
import { validateSuspectBatch, type ReviewBatch } from "./review-batch-data";

try {
  const get = async (file: string): Promise<ReviewBatch> => {
    const response = await fetch(file);
    if (!response.ok) throw Error("The review batch could not be loaded. Try reloading this page.");
    return response.json();
  };
  const [readings, gold, suspect] = await Promise.all([get("./next-batch.json"), get("./gold-verdicts.json"), get("./suspect-scenes.json").then(validateSuspectBatch)]);
  const stories = new Map<string, string[]>();
  const sources = [...new Map([...readings.sources, ...gold.sources, ...suspect.sources].map((s) => [s.file, s])).values()];
  const select = document.getElementById("review-kind") as HTMLSelectElement;
  const requested = new URLSearchParams(location.search).get('review');
  if (requested && ['readings', 'gold', 'suspect'].includes(requested)) select.value = requested;
  const show = async () => {
    const batch = select.value === "gold" ? gold : select.value === 'suspect' ? suspect : readings;
    document.querySelector("h1")!.textContent = batch === gold ? "Check the gold ranges" : batch === suspect ? "Check 40 likely-error scenes" : "Check the next readings";
    (document.getElementById("filter") as HTMLSelectElement).value = "all";
    document.getElementById("review-explanation")!.textContent = batch === gold ? "Check each recorded range separately, including its act and participants. Belonging is excluded. Previous whole-story answers do not count as range answers." : batch === suspect ? "Fresh detections ranked by the model’s doubt, with limits on repeated patterns, stories, and nearby passages. Read my assessment, then agree or disagree. A likely-error selection may still be correct. Engine confidence is the model’s probability that this individual reading is right, not the whole-story verdict score." : "Check the sampled readings. Your existing reading answers are preserved; these scores remain hidden.";
    document.getElementById("status")!.textContent = "";
    await mountReview(batch, { stories, sources });
  };
  select.onchange = () => { void show(); };
  await show();
} catch (error) {
  document.getElementById("status")!.textContent = error instanceof Error ? error.message : "The review could not be opened. Try reloading this page.";
}
