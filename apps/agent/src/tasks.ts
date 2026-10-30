import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";

export const TASKS_DIR = "evals/tasks";

export interface Task {
  id: string;
  report: string;
  prompt: string;
  bug: string;
  allowedPrefixes: string[];
  hiddenSource: string;
  sensorRelPath: string;
  expectedOutcome: "fix" | "escalate";
  origin: "eval" | "issue";
}

interface TaskFile {
  id: string;
  family?: string;
  prompt?: string;
  report?: string;
  setup?: { bug?: string };
  contract?: { allowed_paths?: string[] };
  expected_outcome?: string;
  graders?: Array<{ type: string; tests?: string[] }>;
}

const CLASS_FAMILIES = new Set(["bug", "security", "escalate"]);

export function repoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function firstLine(text: string): string {
  return text.split("\n").find((line) => line.trim())?.trim() ?? "";
}

function prefixOf(glob: string): string {
  return glob.replace(/\*+$/, "");
}

export function loadTask(id: string, root = repoRoot()): Task {
  const file = join(root, TASKS_DIR, id, "task.yaml");
  if (!existsSync(file)) {
    throw new Error(`tarefa desconhecida: ${id} (${TASKS_DIR}/${id}/task.yaml não existe)`);
  }

  const parsed = parse(readFileSync(file, "utf8")) as TaskFile;
  if (!parsed.id || !parsed.prompt) {
    throw new Error(`task.yaml inválido: ${TASKS_DIR}/${id}/task.yaml precisa de id e prompt`);
  }
  if (parsed.family && !CLASS_FAMILIES.has(parsed.family)) {
    throw new Error(
      `a tarefa ${id} é da família "${parsed.family}" e não roda no harness de sala`,
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
    expectedOutcome: parsed.expected_outcome === "escalate" ? "escalate" : "fix",
    origin: "eval",
  };
}
