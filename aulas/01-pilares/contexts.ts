import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { repoRoot } from "./env";
import { labDir, readLabFile } from "./files";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", ".playwright-mcp"]);
const MAX_FILE = 100_000;
const MAX_DUMP = 80_000;
const SECRET = /sk-ant-|github_pat_|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;

export function contextCode(instruction: string, dir = labDir): string {
  return `${instruction}\n\nArquivo is-overlapping.ts:\n\n${readLabFile(dir, "is-overlapping.ts")}`;
}

export function contextCodeAndTest(instruction: string, dir = labDir): string {
  return `${contextCode(instruction, dir)}\n\nTeste que falha, is-overlapping.test.ts:\n\n${readLabFile(dir, "is-overlapping.test.ts")}`;
}

/** A large slice of the repo. Skips secrets, dependencies, and the env file. */
export function contextDump(instruction: string, root = repoRoot()): string {
  const chunks: string[] = [];
  let size = 0;
  let truncated = false;

  const walk = (dir: string) => {
    if (truncated) return;
    for (const entry of readdirSync(dir)) {
      if (truncated || SKIP_DIRS.has(entry) || entry.startsWith(".env")) continue;
      const path = resolve(dir, entry);
      const info = statSync(path);
      if (info.isDirectory()) {
        walk(path);
        continue;
      }
      if (info.size > MAX_FILE) continue;
      if (!/\.(ts|tsx|md|sql)$/.test(entry)) continue;
      const text = readFileSync(path, "utf8");
      if (SECRET.test(text)) continue;
      const block = `\n\n# ${relative(root, path)}\n\n${text}`;
      if (size + block.length > MAX_DUMP) {
        truncated = true;
        return;
      }
      chunks.push(block);
      size += block.length;
    }
  };

  walk(root);
  const note = truncated ? "\n\n[despejo cortado]\n" : "";
  return `${instruction}\n\nDespejo do repositório:${chunks.join("")}${note}`;
}
