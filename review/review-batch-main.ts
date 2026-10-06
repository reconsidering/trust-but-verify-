import { mountReview } from "./review-batch";
import type { ReviewBatch } from "./review-batch-data";

try {
  const get = async (file: string): Promise<ReviewBatch> => {
    const response = await fetch(file);
    if (!response.ok) throw Error("The review batch could not be loaded. Try reloading this page.");
    return response.json();
  };
  const [readings, gold] = await Promise.all([get("./next-batch.json"), get("./gold-verdicts.json")]);
  const stories = new Map<string, string[]>();
  const sources = [...new Map([...readings.sources, ...gold.sources].map((s) => [s.file, s])).values()];
  const select = document.getElementById("review-kind") as HTMLSelectElement;
  const show = async () => {
    const batch = select.value === "gold" ? gold : readings;
    document.querySelector("h1")!.textContent = batch === gold ? "Check the gold ranges" : "Check the next readings";
    (document.getElementById("filter") as HTMLSelectElement).value = "all";
    document.getElementById("review-explanation")!.textContent = batch === gold ? "Check each recorded range separately, including its act and participants. Belonging is excluded. Previous whole-story answers do not count as range answers." : "Check the sampled readings. Your existing reading answers are preserved.";
    document.getElementById("status")!.textContent = "";
    await mountReview(batch, { stories, sources });
  };
  select.onchange = () => { void show(); };
  await show();
} catch (error) {
  document.getElementById("status")!.textContent = error instanceof Error ? error.message : "The review could not be opened. Try reloading this page.";
}
