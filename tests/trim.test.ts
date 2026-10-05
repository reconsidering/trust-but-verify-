import { describe, expect, it } from "vitest";
import { trim, trimmedText } from "../scripts/trim.mjs";

// Paraphrased filler, not from any fic.
const plain = (n: number) => Array.from({ length: n }, (_, i) => `They talked about the weather and the errands for day number ${i}.`);
const explicit = "He thrust into him, cock deep in his ass, and moaned.";

describe("trim: which paragraphs a scene-listing helper reads", () => {
  it("keeps an explicit stretch with its surroundings and cuts distant plot", () => {
    const paras = [...plain(30), explicit, explicit, explicit, ...plain(30)];
    const r = trim(paras);
    expect(r.keep[31]).toBe(true);
    expect(r.keep[25]).toBe(true); // within 8 of the stretch
    expect(r.keep[5]).toBe(false);
    expect(r.keep[paras.length - 3]).toBe(false);
    expect(r.mode).toBe("trimmed");
  });
  it("keeps build-up and morning-after cues so a fade-to-black scene is not cut", () => {
    const paras = [...plain(60), "He unbuttoned his shirt and kissed him toward the bed.", "The sheets were tangled and warm.", "Afterwards they lay there, sated.", ...plain(30), ...plain(10), ...plain(60)];
    const r = trim(paras);
    expect(r.keep[60] && r.keep[61] && r.keep[62]).toBe(true);
  });
  it("keeps paragraphs next to what the engine flagged", () => {
    const paras = plain(200);
    const r = trim(paras, [100]);
    expect(r.keep.slice(98, 103)).toEqual([true, true, true, true, true]);
    expect(r.keep[50]).toBe(false);
  });
  it("falls back to the whole fic when tags say fade-to-black, or when the cut saves nothing or catches too little", () => {
    const paras = [...plain(60), explicit, explicit, explicit, ...plain(60)];
    expect(trim(paras, [], ["Fade to Black"]).mode).toBe("full");
    expect(trim(plain(200)).mode).toBe("full"); // keeps under 25%: the word lists are not catching this fic
    expect(trim(Array.from({ length: 80 }, () => explicit)).mode).toBe("full"); // keeps everything
  });
  it("numbers the text as in the fic and marks what was left out", () => {
    const paras = [...plain(30), explicit, explicit, explicit, ...plain(30)];
    const r = trim(paras);
    const text = trimmedText(paras.slice(10, 60), r.keep.slice(10, 60), 10);
    expect(text).toMatch(/^\[paragraphs 10–\d+ left out/);
    expect(text).toContain("[31] He thrust");
  });
});
