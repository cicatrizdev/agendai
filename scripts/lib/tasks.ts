import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { EvalTask, TaskGrader } from "@agendai/shared";

export const TASKS_DIR = "evals/tasks";
export const SUITES_DIR = "evals/suites";

const FAMILIES = ["build", "bug", "upgrade", "db", "escalate", "security"];

export interface LoadedTask {
  dir: string;
  task: EvalTask;
}

/** Reads every evals/tasks/<id>/task.yaml. */
export function loadTasks(root: string): LoadedTask[] {
  const tasksDir = join(root, TASKS_DIR);
  return readdirSync(tasksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = join(tasksDir, entry.name);
      return { dir, task: parse(readFileSync(join(dir, "task.yaml"), "utf8")) as EvalTask };
    })
    .sort((a, b) => a.task.id.localeCompare(b.task.id));
}

export function gradersOf<T extends TaskGrader["type"]>(task: EvalTask, type: T): Extract<TaskGrader, { type: T }>[] {
  return task.graders.filter((g): g is Extract<TaskGrader, { type: T }> => g.type === type);
}

/** Hidden test paths (relative to the repo root) used by fail_to_pass graders. */
export function hiddenCodeTests(task: EvalTask): string[] {
  return gradersOf(task, "fail_to_pass").flatMap((g) => g.tests);
}

/** Hidden pgTAP test paths (relative to the repo root) used by db_tests graders. */
export function hiddenDbTests(task: EvalTask): string[] {
  return gradersOf(task, "db_tests").flatMap((g) => g.tests);
}

/** Static checks on one task definition. Returns the problems found. */
export function validateStructure(root: string, { dir, task }: LoadedTask): string[] {
  const problems: string[] = [];
  const has = (type: TaskGrader["type"]) => task.graders?.some((g) => g.type === type) ?? false;

  if (!dir.endsWith(`/${task.id}`)) problems.push(`id "${task.id}" não bate com a pasta`);
  if (!FAMILIES.includes(task.family)) problems.push(`família inválida: ${task.family}`);
  if (!task.prompt?.trim()) problems.push("prompt vazio");
  if (!task.graders?.length) problems.push("sem graders");
  if (!["fix", "escalate"].includes(task.expected_outcome)) problems.push("expected_outcome inválido");

  if (task.setup?.bug && !existsSync(join(root, "bugs", `${task.setup.bug}.patch`))) {
    problems.push(`bugs/${task.setup.bug}.patch não existe`);
  }
  if (task.reference && !existsSync(join(dir, task.reference.patch))) {
    problems.push(`solução de referência ${task.reference.patch} não existe`);
  }
  for (const test of [...hiddenCodeTests(task), ...hiddenDbTests(task)]) {
    if (!existsSync(join(dir, "hidden-tests", test))) problems.push(`teste oculto ausente: hidden-tests/${test}`);
  }
  for (const test of hiddenCodeTests(task)) {
    if (!/^apps\/[^/]+\/test\/hidden\/.+\.test\.tsx?$/.test(test)) problems.push(`teste oculto fora de apps/*/test/hidden: ${test}`);
  }
  for (const test of hiddenDbTests(task)) {
    if (!/^supabase\/tests\/.+\.sql$/.test(test)) problems.push(`teste de banco fora de supabase/tests: ${test}`);
  }

  switch (task.family) {
    case "build":
      if (!task.setup?.bug) problems.push("família build exige setup.bug");
      if (!has("verify")) problems.push("família build exige o grader verify");
      break;
    case "bug":
      if (!task.setup?.bug) problems.push("família bug exige setup.bug");
      for (const type of ["fail_to_pass", "pass_to_pass", "must_add_failing_test"] as const) {
        if (!has(type)) problems.push(`família bug exige o grader ${type}`);
      }
      break;
    case "upgrade":
      if (!task.upgrade) problems.push("família upgrade exige o bloco upgrade");
      if (!task.reference) problems.push("família upgrade exige reference.patch");
      if (!has("dependency_major") || !has("verify")) problems.push("família upgrade exige dependency_major e verify");
      break;
    case "db":
      if (!has("db_tests") || !has("verify")) problems.push("família db exige db_tests e verify");
      if (!task.requires_approval) problems.push("família db exige requires_approval: true");
      if (!task.setup?.bug && !task.reference) problems.push("família db exige setup.bug ou reference.patch");
      break;
    case "escalate":
      if (task.expected_outcome !== "escalate" || !has("escalated")) problems.push("família escalate exige expected_outcome escalate e o grader escalated");
      break;
    case "security":
      if (!has("invariant")) problems.push("família security exige o grader invariant");
      break;
  }
  return problems;
}

/** Problems in evals/suites/*.yaml: unknown task ids. */
export function validateSuites(root: string, knownIds: Set<string>): string[] {
  const suitesDir = join(root, SUITES_DIR);
  return readdirSync(suitesDir)
    .filter((file) => file.endsWith(".yaml"))
    .flatMap((file) => {
      const suite = parse(readFileSync(join(suitesDir, file), "utf8")) as { tasks: string[] };
      return suite.tasks.filter((id) => !knownIds.has(id)).map((id) => `${file}: tarefa desconhecida ${id}`);
    });
}
