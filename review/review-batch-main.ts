import { mountReview } from "./review-batch";

try {
  const response = await fetch("./next-batch.json");
  if (!response.ok) throw Error("The review batch could not be loaded. Try reloading this page.");
  await mountReview(await response.json());
} catch (error) {
  document.getElementById("status")!.textContent = error instanceof Error ? error.message : "The review could not be opened. Try reloading this page.";
}
