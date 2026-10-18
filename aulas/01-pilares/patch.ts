import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Replacement {
  oldString: string;
  newString: string;
}

function takeBlock(value: string): string {
  const text = value.replace(/\s+$/, "");
  const fenced = text.match(/^```[a-z]*\r?\n([\s\S]*?)\r?\n```$/);
  const body = fenced?.[1] ?? text;
  const [head] = body.split(/\r?\n\s*\r?\n/);
  return (head ?? "").replace(/\s+$/, "");
}

/** Reads the OLD:/NEW: block from a text reply. Returns null when it is missing or empty. */
export function parseReplacement(text: string): Replacement | null {
  const match = text.match(/(?:^|\n)OLD:\r?\n([\s\S]*?)\r?\nNEW:\r?\n([\s\S]*)$/);
  const oldRaw = match?.[1];
  const newRaw = match?.[2];
  if (oldRaw === undefined || newRaw === undefined) return null;
  const oldString = takeBlock(oldRaw);
  const newString = takeBlock(newRaw);
  if (!oldString.trim() || !newString.trim()) return null;
  return { oldString, newString };
}

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
