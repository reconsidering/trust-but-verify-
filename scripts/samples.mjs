#!/usr/bin/env node
// Pack the local sample fics (ao3-samples/*.html) into ONE encrypted file, and unpack it again. The fics are other people's work and stay out of the
// repo; this lets you keep an encrypted copy somewhere private so the regen workflow can replay them in CI.
//   SAMPLES_KEY=<passphrase> npm run samples -- pack   [dir=ao3-samples] [--out ao3-samples.enc]
//   SAMPLES_KEY=<passphrase> npm run samples -- unpack <file.enc> [dir=ao3-samples]
// Format: "TBVS1" + 16-byte salt + 12-byte IV + 16-byte tag + AES-256-GCM(tar.gz of the *.html files); the key is scrypt(passphrase, salt).
// Only the .html files are packed (not the .eval/.dive/.check work folders or reports). Needs `tar` on the PATH.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const MAGIC = Buffer.from("TBVS1");
const keyOf = (salt) => {
  const pass = process.env.SAMPLES_KEY;
  if (!pass) { console.error("Set SAMPLES_KEY to the passphrase."); process.exit(2); }
  return scryptSync(pass, salt, 32);
};
const tar = (args, cwd) => {
  const r = spawnSync("tar", args, { cwd, stdio: ["ignore", "ignore", "inherit"] });
  if (r.status) { console.error("tar failed"); process.exit(1); }
};

export function pack(dir, outFile) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
  if (!files.length) throw new Error(`no .html files in ${dir}`);
  const tmp = mkdtempSync(join(tmpdir(), "samples-"));
  try {
    const tgz = join(tmp, "s.tgz");
    tar(["-czf", tgz, ...files], dir);
    const salt = randomBytes(16), iv = randomBytes(12);
    const c = createCipheriv("aes-256-gcm", keyOf(salt), iv);
    const body = Buffer.concat([c.update(readFileSync(tgz)), c.final()]);
    writeFileSync(outFile, Buffer.concat([MAGIC, salt, iv, c.getAuthTag(), body]));
    return files.length;
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

export function unpack(file, dir) {
  const b = readFileSync(file);
  if (!b.subarray(0, 5).equals(MAGIC)) throw new Error("not a samples file");
  const salt = b.subarray(5, 21), iv = b.subarray(21, 33), tag = b.subarray(33, 49), body = b.subarray(49);
  const d = createDecipheriv("aes-256-gcm", keyOf(salt), iv);
  d.setAuthTag(tag);
  let plain;
  try { plain = Buffer.concat([d.update(body), d.final()]); } catch { throw new Error("wrong passphrase, or the file is damaged"); }
  mkdirSync(dir, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "samples-"));
  try {
    const tgz = join(tmp, "s.tgz");
    writeFileSync(tgz, plain);
    tar(["-xzf", tgz], dir);
    return readdirSync(dir).filter((f) => f.endsWith(".html")).length;
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...rest] = process.argv.slice(2);
  const pos = rest.filter((a, i) => !a.startsWith("--") && rest[i - 1] !== "--out");
  try {
    if (cmd === "pack") {
      const dir = resolve(pos[0] ?? "ao3-samples"), out = resolve(rest.includes("--out") ? rest[rest.indexOf("--out") + 1] : "ao3-samples.enc");
      console.log(`packed ${pack(dir, out)} fics into ${out}`);
    } else if (cmd === "unpack") {
      if (!pos[0]) throw new Error("usage: samples unpack <file.enc> [dir]");
      const dir = resolve(pos[1] ?? "ao3-samples");
      console.log(`unpacked ${unpack(resolve(pos[0]), dir)} fics into ${dir}`);
    } else { console.error("usage: npm run samples -- pack [dir] [--out file] | unpack <file> [dir]"); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
