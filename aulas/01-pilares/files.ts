import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const labDir = dirname(fileURLToPath(import.meta.url));

/** A scratch copy of the buggy function and its test. */
export function copyLab(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "pilares-"));
  copyFileSync(resolve(labDir, "is-overlapping.ts"), resolve(dir, "is-overlapping.ts"));
  copyFileSync(resolve(labDir, "is-overlapping.test.ts"), resolve(dir, "is-overlapping.test.ts"));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

export function readLabFile(dir: string, name: string): string {
  return readFileSync(resolve(dir, name), "utf8");
}
