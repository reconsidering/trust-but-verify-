import { describe, expect, it } from "vitest";
import { type Answer, type Cand, answeredRows, auc, fitLogistic, rank, train } from "../scripts/spotcheck-rank.mjs";

// Synthetic answers: the owner disagrees with Claude's "wrong" calls on narrated acts, and almost never otherwise.
const mk = (i: number, claude: "ok" | "wrong", kind: string, fic: string, via: string, disagree: boolean): Answer => ({ key: `${via}#${i}`, fic, via, kind, p: claude === "wrong" ? 0.9 : 0.5, claude, owner: disagree ? (claude === "ok" ? "wrong" : "ok") : claude });
function rounds1() {
  const answers: Answer[] = [];
  for (let i = 0; i < 60; i++) answers.push(mk(i, i % 3 === 0 ? "wrong" : "ok", i % 3 === 0 ? "act" : "touch", i % 2 ? "ficA" : "ficB", `pat${i % 6}`, i % 3 === 0 ? i % 9 !== 0 : i % 17 === 0));
  return [{ round: 1, date: "2026-10-05", answers }];
}
describe("spot-check ranking", () => {
  it("fits a logistic regression that separates the classes", () => {
    const X = [[1, 0], [1, 0.2], [1, 1], [1, 1.2], [1, 0.1], [1, 0.9]];
    const w = fitLogistic(X, [0, 0, 1, 1, 0, 1], 0.5);
    expect(w[1]).toBeGreaterThan(0);
    expect(auc([0.1, 0.2, 0.8, 0.9], [0, 0, 1, 1])).toBe(1);
  });
  it("learns that Claude's wrong calls on narrated acts are the likely mistakes, and predicts held-out answers", () => {
    const t = train(rounds1());
    expect(t.rows).toBe(60);
    expect(t.loo).toBeGreaterThan(0.7);
    const likely = t.score!({ claude: "wrong", kind: "act", fic: "ficA", via: "pat0", p: 0.9 });
    const unlikely = t.score!({ claude: "ok", kind: "touch", fic: "ficA", via: "pat1", p: 0.5 });
    expect(likely).toBeGreaterThan(unlikely);
  });
  it("leaves out anything already answered (including Not sure), caps one pattern, and mixes in random picks", () => {
    const rounds = rounds1();
    rounds[0].answers.push({ key: "patZ#1", fic: "ficA", via: "patZ", kind: "act", p: 0.9, claude: "wrong", owner: "unclear" });
    const cands: Cand[] = Array.from({ length: 80 }, (_, i) => ({ key: `new#${i}`, fic: "ficA", via: `pat${i % 4}~elided`, kind: i % 2 ? "act" : "touch", p: 0.8, claude: i % 3 ? ("wrong" as const) : ("ok" as const) }));
    cands.push({ key: "patZ#1", fic: "ficA", via: "patZ", kind: "act", p: 0.9, claude: "wrong" });
    const out = rank(cands, rounds, { n: 12, explore: 2, perPattern: 3 });
    expect(out.picked.length).toBe(12);
    expect(out.picked.some((c: { key: string }) => c.key === "patZ#1")).toBe(false);
    const counts = new Map<string, number>();
    for (const c of out.picked) counts.set(c.via.replace(/~elided$/, ""), (counts.get(c.via.replace(/~elided$/, "")) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
    expect(out.picked.filter((c: { picked: string }) => c.picked === "random").length).toBe(2);
  });
  it("still ranks (wrong calls first) before there are enough answers to learn from", () => {
    const out = rank([{ key: "a", fic: "f", via: "p1", kind: "act", p: 0.9, claude: "ok" }, { key: "b", fic: "f", via: "p2", kind: "act", p: 0.9, claude: "wrong" }], [{ round: 1, date: "d", answers: [] }], { n: 2, explore: 0 });
    expect(out.model.score).toBeNull();
    expect(out.picked.length).toBe(2);
    expect(answeredRows([{ round: 1, date: "d", answers: [] }]).length).toBe(0);
  });
});
