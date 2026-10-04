// Grades the writing with the Novel Grader's engine (https://reconsidering.github.io/novelgrading/).
// The grader is one static page whose scoring engine sits between /*GRADER-START*/ and /*GRADER-END*/. That text is fetched here and run in a
// background worker on this page, so the story never leaves the browser.

export const GRADER_URL = "https://reconsidering.github.io/novelgrading/";
const START = "/*GRADER-START*/";
const END = "/*GRADER-END*/";

export const GRADE_PROFILES: [string, string][] = [
  ["romance", "Romance"],
  ["general", "General fiction"],
  ["literary", "Literary"],
  ["thriller", "Thriller / mystery / crime"],
  ["horror", "Horror"],
  ["fantasy", "Fantasy / science fiction"],
  ["historical", "Historical"],
  ["ya", "Young adult"],
  ["mg", "Middle grade"],
];
export const DIALOGUE_MODES: [string, string][] = [["reduce", "Count lightly"], ["full", "Count fully"], ["ignore", "Don’t count"]];
export const VOICES: [string, string][] = [["standard", "Standard"], ["stylized", "Stylized voice or first person"]];
export const DEFAULT_GRADE_OPTIONS = { profile: "romance", dlgMode: "reduce", voice: "standard" };

export interface GradeCategory {
  id: string;
  name: string;
  score: number | null;
}

export interface GradeSummary {
  overall: number | null;
  letter: string;
  categories: GradeCategory[];
  profile: string;
}

/** The engine's code, cut out of the grader page; undefined when the markers are gone. */
export function extractEngine(html: string): string | undefined {
  const a = html.indexOf(START);
  const b = html.indexOf(END, a + START.length);
  return a >= 0 && b > a ? html.slice(a, b + END.length) : undefined;
}

/** What the page needs from a full grading result (which also holds every flagged passage and metric). */
export function summarize(res: unknown): GradeSummary {
  const r = res as { overall?: number | null; letter?: string; profile?: string; cats?: { id: string; name: string; score?: number | null }[] };
  return {
    overall: typeof r.overall === "number" && isFinite(r.overall) ? r.overall : null,
    letter: r.letter ?? "",
    profile: r.profile ?? "",
    categories: (r.cats ?? []).map((c) => ({ id: c.id, name: c.name, score: typeof c.score === "number" && isFinite(c.score) ? c.score : null })),
  };
}

/** Story text without this app's own extraction markers. */
export function textForGrading(text: string): string {
  return text.replace(/\[\[AO3_[A-Z_]+\]\]/g, " ");
}

let enginePromise: Promise<string> | undefined;

export function loadEngine(url: string = GRADER_URL): Promise<string> {
  enginePromise ??= (async () => {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`The grader page didn't load (${res.status}).`);
    const code = extractEngine(await res.text());
    if (!code) throw new Error("The grader's engine wasn't found on its page (its START/END markers have moved).");
    return code;
  })();
  enginePromise.catch(() => { enginePromise = undefined; });
  return enginePromise;
}

export function resetEngineCache() {
  enginePromise = undefined;
}

export interface GradeOptions {
  profile?: string;
  dlgMode?: string;
  english?: string;
  voice?: string;
  names?: string;
  onProgress?: (fraction: number) => void;
  engineUrl?: string;
}

/** Grades `text`. Runs in a Worker when the browser allows one, otherwise on the page. */
export async function gradeText(text: string, options: GradeOptions = {}): Promise<GradeSummary> {
  const code = await loadEngine(options.engineUrl);
  const { onProgress, engineUrl: _ignored, ...opts } = options;
  void _ignored;
  const clean = textForGrading(text);
  if (typeof Worker !== "undefined" && typeof Blob !== "undefined" && typeof URL?.createObjectURL === "function") {
    try {
      return await runInWorker(code, clean, opts, onProgress);
    } catch (err) {
      if (!(err instanceof WorkerUnavailable)) throw err;
    }
  }
  const Grader = new Function(`${code}\nreturn Grader;`)() as { analyze: (t: string, o: object) => unknown };
  return summarize(Grader.analyze(clean, { ...opts, onProgress }));
}

class WorkerUnavailable extends Error {}

function runInWorker(code: string, text: string, opts: object, onProgress?: (f: number) => void): Promise<GradeSummary> {
  return new Promise((resolve, reject) => {
    let url: string | undefined;
    let worker: Worker;
    try {
      const body = `${code}
self.onmessage = e => { const { text, opts } = e.data;
  try { const res = Grader.analyze(text, Object.assign({}, opts, { onProgress: p => self.postMessage({ p }) })); self.postMessage({ res }); }
  catch (err) { self.postMessage({ err: String((err && err.message) || err) }); } };`;
      url = URL.createObjectURL(new Blob([body], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch {
      reject(new WorkerUnavailable());
      return;
    }
    const done = () => {
      worker.terminate();
      if (url) URL.revokeObjectURL(url);
    };
    worker.onmessage = (e: MessageEvent<{ p?: number; res?: unknown; err?: string }>) => {
      if (e.data.p !== undefined) return onProgress?.(e.data.p);
      done();
      if (e.data.err) reject(new Error(e.data.err));
      else resolve(summarize(e.data.res));
    };
    worker.onerror = (e) => {
      e.preventDefault();
      done();
      reject(new WorkerUnavailable());
    };
    worker.postMessage({ text, opts });
  });
}
