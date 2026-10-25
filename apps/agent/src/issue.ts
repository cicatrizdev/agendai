import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { repoRoot } from "./env";
import { loadTask, type Task } from "./tasks";

export interface Issue {
  /** Issue file, relative to the repository root. */
  file: string;
  task: Task;
}

function frontmatter(text: string): { meta: Map<string, string>; body: string } {
  const normalized = text.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) return { meta: new Map(), body: normalized.trim() };
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) return { meta: new Map(), body: normalized.trim() };
  const meta = new Map<string, string>();
  for (const line of normalized.slice(4, end).split("\n")) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const value = line
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    meta.set(line.slice(0, colon).trim(), value);
  }
  return { meta, body: normalized.slice(end + 4).trim() };
}

/**
 * Resolves an exported tracker issue (Linear, GitHub, inbox) to a catalog task.
 * The issue supplies the words; the eval supplies the oracle and the contract.
 */
export function loadIssue(file: string, root = repoRoot()): Issue {
  const path = resolve(root, file);
  if (!existsSync(path)) throw new Error(`issue não encontrada: ${file}`);
  const { meta, body } = frontmatter(readFileSync(path, "utf8"));
  const id = meta.get("task") ?? "";
  if (!id) {
    throw new Error(`a issue ${file} não declara "task:" no frontmatter. Sem task não há oráculo.`);
  }
  if (!body) throw new Error(`a issue ${file} está vazia.`);
  const task = loadTask(id, root);
  return { file: relative(root, path), task: { ...task, prompt: body, origin: "issue" } };
}
