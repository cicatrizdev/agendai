import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function applyToSource(source: string, oldString: string, newString: string): string {
  if (!oldString.trim()) throw new Error("trecho vazio");
  if (oldString === newString) throw new Error("patch vazio");
  const count = source.split(oldString).length - 1;
  if (count === 0) throw new Error("trecho não encontrado");
  if (count > 1) throw new Error("trecho ambíguo");
  return source.replace(oldString, newString);
}

export function isAllowedPath(relPath: string, prefixes: string[]): boolean {
  const normalized = relPath.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.includes("..")) return false;
  return prefixes.some((prefix) => normalized.startsWith(prefix));
}

export function applyPatch(
  root: string,
  relPath: string,
  oldString: string,
  newString: string,
  prefixes: string[],
): void {
  if (!isAllowedPath(relPath, prefixes)) throw new Error(`caminho fora do contrato: ${relPath}`);
  const path = resolve(root, relPath);
  writeFileSync(path, applyToSource(readFileSync(path, "utf8"), oldString, newString));
}
