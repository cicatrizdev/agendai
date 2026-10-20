import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

const SKIP = new Set(["node_modules", "dist", "coverage", ".git"]);
const MAX_DUMP = 60_000;

/** M3. Same ticket, three windows. Nothing here writes to disk. */
export function contextCode(spec: string, source: string): string {
  return `${spec}\n\nArquivo apps/api/src/domain/overlap.ts:\n\n${source}`;
}

export function contextCodeAndTest(spec: string, source: string, testSource: string): string {
  return `${contextCode(spec, source)}\n\nTeste que falha, overlap-boundary.test.ts:\n\n${testSource}`;
}

export function contextDump(spec: string, dump: string): string {
  return `${spec}\n\nDespejo do repositório:\n\n${dump}`;
}

/** A bounded slice of the product tree. Skips dependencies and env files. */
export function readDump(root: string): string {
  const chunks: string[] = [];
  let size = 0;
  const walk = (dir: string) => {
    if (size >= MAX_DUMP) return;
    for (const entry of readdirSync(dir)) {
      if (size >= MAX_DUMP || SKIP.has(entry) || entry.startsWith(".env")) continue;
      const path = resolve(dir, entry);
      const info = statSync(path);
      if (info.isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(ts|tsx|md)$/.test(entry) || info.size > 40_000) continue;
      const block = `\n\n# ${relative(root, path)}\n\n${readFileSync(path, "utf8")}`;
      chunks.push(block);
      size += block.length;
    }
  };
  walk(resolve(root, "apps/api/src"));
  walk(resolve(root, "apps/web/src"));
  return chunks.join("").slice(0, MAX_DUMP);
}
