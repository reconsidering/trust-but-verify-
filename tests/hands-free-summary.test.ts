import { describe, expect, it } from "vitest";
import { summarise } from "../scripts/hands-free-summary.mjs";

// Made-up passages: n, whether the detector flagged it, whether a hand was nearby, and the weight a sampled unflagged passage stands for.
const row = (n: number, detected: boolean, manualNearby = false, stratumWeight: number | null = null) => ({ n, key: `k${n}`, detected, manualNearby, stratumWeight });
describe("hands-free summary", () => {
  it("measures precision on flagged passages and estimates recall from the weighted unflagged sample", () => {
    const picked = [row(1, true), row(2, true), row(3, true), row(4, true), row(5, false, false, 10), row(6, false, false, 10), row(7, false, false, 30), row(8, false, true)];
    const s = summarise(picked, { 1: "yes", 2: "yes", 3: "touched", 4: "other", 5: "yes", 6: "touched", 7: "touched", 8: "touched" });
    expect(s.precision).toBeCloseTo(2 / 4);
    expect(s.estimatedMissed).toBeCloseTo(10); // one "yes" standing for 10 passages
    expect(s.recall).toBeCloseTo(2 / 12); // 2 found, about 10 missed
    expect(s.missedKeys).toEqual(["k5"]);
    expect(s.manual.touched).toBe(1);
  });
  it("leaves unsure answers out and scales to the weight that was answered", () => {
    const picked = [row(1, true), row(2, false, false, 10), row(3, false, false, 10)];
    const s = summarise(picked, { 1: "yes", 2: "yes", 3: "unsure" });
    expect(s.estimatedMissed).toBeCloseTo(20); // 10 answered with one "yes", scaled from weight 10 to 20
    expect(s.clear.unsure).toBe(1);
  });
  it("says nothing it cannot support", () => {
    const s = summarise([row(1, true), row(2, false, false, 10)], {});
    expect(s.precision).toBeNull();
    expect(s.recall).toBeNull();
    expect(s.flagged.unanswered).toBe(1);
  });
});
