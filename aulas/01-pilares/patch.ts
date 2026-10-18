import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** Replaces one exact snippet. Refuses an empty, ambiguous, or no-op edit. */
export function applyToSource(source: string, oldString: string, newString: string): string {
  if (!oldString.trim()) throw new Error("trecho vazio");
  if (oldString === newString) throw new Error("patch vazio");
  const count = source.split(oldString).length - 1;
  if (count === 0) throw new Error("trecho não encontrado");
  if (count > 1) throw new Error("trecho ambíguo");
  return source.replace(oldString, newString);
}

export function applyPatch(dir: string, oldString: string, newString: string): void {
  const path = resolve(dir, "is-overlapping.ts");
  writeFileSync(path, applyToSource(readFileSync(path, "utf8"), oldString, newString));
}
