#!/usr/bin/env node
// Finds orgasm passages in anal scenes across the sample fics, for the owner to say which were hands-free (about 15 minutes; the engine reads every fic).
//   npm run hands-free-harvest -- [out dir=ao3-samples/.hands-free/pool] [--skip name,name]
// Then: node scripts/build-hands-free-page.mjs   (see docs/TESTING.md, "Is the hands-free detector finding them?")
// The four fics the age screen left out are skipped by default; pass --skip to change the list.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const i = args.indexOf("--skip");
const skip = i >= 0 ? args[i + 1] : "play-the-game,slipfast,strawberry-mama,self-mythology";
const out = args.find((a, k) => !a.startsWith("--") && args[k - 1] !== "--skip") ?? "ao3-samples/.hands-free/pool";
const r = spawnSync("npx", ["vitest", "run", "tests/hands-free-harvest.test.ts", "--testTimeout=2400000", "--reporter=verbose"], {
  env: { ...process.env, HF_OUT: out, HF_SKIP: skip }, stdio: "inherit",
});
process.exit(r.status ?? 1);
