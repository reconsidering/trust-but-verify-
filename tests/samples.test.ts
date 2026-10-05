import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs script
import { pack, unpack } from "../scripts/samples.mjs";

const tmp = mkdtempSync(join(tmpdir(), "samples-test-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("scripts/samples.mjs: the encrypted copy of the sample fics", () => {
  it("round-trips the html files and nothing else, and refuses a wrong passphrase", () => {
    process.env.SAMPLES_KEY = "correct horse";
    const src = join(tmp, "src"), dst = join(tmp, "dst");
    mkdirSync(join(src, ".eval"), { recursive: true });
    writeFileSync(join(src, "a-fic.html"), "<html>one</html>");
    writeFileSync(join(src, "b-fic.html"), "<html>two</html>");
    writeFileSync(join(src, "REPORT.md"), "not a fic");
    writeFileSync(join(src, ".eval", "x.json"), "{}");
    const enc = join(tmp, "s.enc");
    expect(pack(src, enc)).toBe(2);
    expect(readFileSync(enc).toString("latin1")).not.toContain("one");
    expect(unpack(enc, dst)).toBe(2);
    expect(readFileSync(join(dst, "a-fic.html"), "utf8")).toBe("<html>one</html>");
    expect(existsSync(join(dst, "REPORT.md"))).toBe(false);
    process.env.SAMPLES_KEY = "wrong";
    expect(() => unpack(enc, join(tmp, "dst2"))).toThrow(/wrong passphrase/);
  });
});
