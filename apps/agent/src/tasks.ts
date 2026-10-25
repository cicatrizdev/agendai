import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { repoRoot } from "./env";

export const TASKS_DIR = "evals/tasks";

export interface Task {
  id: string;
  /** Customer sentence. The M2 specification is built from this. */
  report: string;
  prompt: string;
  bug: string;
  allowedPrefixes: string[];
  hiddenSource: string;
  sensorRelPath: string;
  /** Where the issue text came from. The oracle always comes from the eval. */
  origin: "eval" | "issue";
}

/** The class harness edits the API domain and reads code tests, so only these families run here. */
const CLASS_FAMILIES = new Set(["bug", "security", "escalate"]);

interface TaskFile {
  id: string;
  family: string;
  prompt?: string;
  report?: string;
  setup?: { bug?: string };
  contract?: { allowed_paths?: string[] };
  graders?: Array<{ type: string; tests?: string[] }>;
}

function firstLine(text: string): string {
  return text.split("\n").find((line) => line.trim())?.trim() ?? "";
}

/** "apps/api/src/domain/**" is a contract glob; the patch tool compares prefixes. */
function prefixOf(entry: string): string {
  return entry.replace(/\*+$/, "");
}

/**
 * Reads one task from evals/tasks/<id>/task.yaml. The eval owns the prompt,
 * the bug, the contract and the hidden test; the harness only executes it.
 */
export function loadTask(id: string, root = repoRoot()): Task {
  const file = join(root, TASKS_DIR, id, "task.yaml");
  if (!existsSync(file)) {
    throw new Error(`tarefa desconhecida: ${id} (${TASKS_DIR}/${id}/task.yaml não existe)`);
  }
  const parsed = parse(readFileSync(file, "utf8")) as TaskFile;
  if (!parsed.id || !parsed.prompt) {
    throw new Error(`task.yaml inválido: ${TASKS_DIR}/${id}/task.yaml precisa de id e prompt`);
  }
  if (!CLASS_FAMILIES.has(parsed.family)) {
    throw new Error(
      `a tarefa ${id} é da família "${parsed.family}" e não roda no harness de sala; use pnpm check:tasks`,
    );
  }
  const test =
    parsed.graders?.find((grader) => grader.type === "fail_to_pass")?.tests?.[0] ?? "";
  return {
    id: parsed.id,
    report: parsed.report?.trim() || firstLine(parsed.prompt),
    prompt: parsed.prompt.trim(),
    bug: parsed.setup?.bug ?? "",
    allowedPrefixes: (parsed.contract?.allowed_paths ?? []).map(prefixOf),
    hiddenSource: test ? `${TASKS_DIR}/${id}/hidden-tests/${test}` : "",
    sensorRelPath: test,
    origin: "eval",
  };
}
