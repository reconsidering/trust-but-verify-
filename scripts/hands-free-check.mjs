#!/usr/bin/env node
// Re-runs the detector on the passages the owner answered (tests/hands-free/*.json) and says what it still finds, loses or newly flags. About 15 minutes; needs the fics.
//   npm run hands-free-check
import { spawnSync } from "node:child_process";
const r = spawnSync("npx", ["vitest", "run", "tests/hands-free-record.test.ts", "--testTimeout=2400000", "--reporter=verbose"], { env: { ...process.env, HF_CHECK: "1" }, stdio: "inherit" });
process.exit(r.status ?? 1);
