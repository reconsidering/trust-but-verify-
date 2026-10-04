// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GRADE_OPTIONS, GRADE_PROFILES, extractEngine, gradeText, resetEngineCache, summarize, textForGrading } from "../src/grade";

const ENGINE = `/*GRADER-START*/
const Grader = (() => {
  function analyze(text, opts = {}) {
    if (opts.onProgress) opts.onProgress(1);
    const words = (text.match(/\\w+/g) || []).length;
    return { overall: words > 3 ? 88.4 : 20, letter: words > 3 ? "B+" : "F", profile: opts.profile + "/" + opts.dlgMode + "/" + opts.voice,
      cats: [{ id: "words", name: "Word choice & variety", score: 90 }, { id: "dialogue", name: "Dialogue", score: null }] };
  }
  return { analyze };
})();
/*GRADER-END*/`;
const PAGE = `<html><body><script>\n${ENGINE}\n</script></body></html>`;

afterEach(() => {
  resetEngineCache();
  vi.unstubAllGlobals();
});

describe("Novel Grader engine", () => {
  it("cuts the engine out between its markers", () => {
    expect(extractEngine(PAGE)).toBe(ENGINE);
    expect(extractEngine("<html>no markers here</html>")).toBeUndefined();
  });

  it("keeps only what the page shows from a result", () => {
    expect(summarize({ overall: 71.2, letter: "C", profile: "Romance", cats: [{ id: "a", name: "A", score: 50, metrics: [1] }, { id: "b", name: "B" }], flags: [1, 2] })).toEqual({
      overall: 71.2,
      letter: "C",
      profile: "Romance",
      categories: [{ id: "a", name: "A", score: 50 }, { id: "b", name: "B", score: null }],
    });
  });

  it("drops this app’s own note markers before grading", () => {
    expect(textForGrading("a [[AO3_UNCERTAIN_NOTE_START]]note[[AO3_UNCERTAIN_NOTE_END]] b")).toBe("a  note  b");
  });

  it("fetches the grader page once and grades the text", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => PAGE }));
    vi.stubGlobal("fetch", fetchMock);
    const progress: number[] = [];
    const g = await gradeText("One two three four five six.", { onProgress: (p) => progress.push(p) });
    expect(g.letter).toBe("B+");
    expect(g.overall).toBeCloseTo(88.4);
    expect(g.categories[0]).toEqual({ id: "words", name: "Word choice & variety", score: 90 });
    expect(progress).toEqual([1]);
    expect((await gradeText("tiny")).letter).toBe("F");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes the chosen profile, speech and narration settings to the engine; romance is the default", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => PAGE })));
    expect(DEFAULT_GRADE_OPTIONS.profile).toBe("romance");
    expect(GRADE_PROFILES[0][0]).toBe("romance");
    expect((await gradeText("One two three four five.", { ...DEFAULT_GRADE_OPTIONS })).profile).toBe("romance/reduce/standard");
    expect((await gradeText("One two three four five.", { profile: "fantasy", dlgMode: "ignore", voice: "stylized" })).profile).toBe("fantasy/ignore/stylized");
  });

  it("explains when the markers have moved or the page won’t load", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => "<html></html>" })));
    await expect(gradeText("text here")).rejects.toThrow(/markers/);
    resetEngineCache();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, text: async () => "" })));
    await expect(gradeText("text here")).rejects.toThrow(/404/);
  });
});
