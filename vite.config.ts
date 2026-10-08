import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the build works on GitHub Pages under /<repo>/ as well as at a domain root.
  base: "./",
  // Classic, self-contained worker: no module imports for the browser to fail on (Safari: "Importing a module script failed").
  worker: { format: "iife" },
  build: { rollupOptions: { input: { app: "index.html", review: "review/next-batch.html", missed: "review/missed-scenes.html", driven: "review/review-driven-error-check.html", negotiation: "review/negotiation.html", belonging: "review/belonging.html" } } },
  test: {
    environment: "jsdom",
    // GitHub's runners are about twice as slow as a developer machine; the engine tests that scan many sentences
    // finish in 3 to 5 seconds locally and hit the 5 second default there.
    testTimeout: 30_000,
  },
});
