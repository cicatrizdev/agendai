/**
 * pnpm check:tasks [--task=<id>] [--skip-db] [--keep]
 *
 * Validates every eval task in a throwaway copy of the repository:
 *   - the bug (or missing feature) makes the task's graders fail;
 *   - the reference solution (reverse of the bug, or reference.patch) makes them pass;
 *   - bugs of the "bug" family are invisible to the existing suite (pass-to-pass stays green);
 *   - upgrades really break the build before the reference fixes are applied.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { EvalTask } from "@agendai/shared";
import { applyBug } from "./lib/bugs";
import { hasFlag, readFlag, runCapture, type RunResult } from "./lib/run";
import { gradersOf, hiddenCodeTests, hiddenDbTests, loadTasks, validateStructure, validateSuites, type LoadedTask } from "./lib/tasks";

interface VerifyStep {
  name: string;
  command: string;
  args: string[];
  needsDb: boolean;
}

/** Same oracle the old `pnpm verify` ran, in order. */
const VERIFY_STEPS: VerifyStep[] = [
  { name: "typecheck", command: "pnpm", args: ["typecheck"], needsDb: false },
  { name: "lint", command: "pnpm", args: ["lint"], needsDb: false },
  { name: "test", command: "pnpm", args: ["test"], needsDb: false },
  { name: "db reset", command: "supabase", args: ["db", "reset"], needsDb: true },
  { name: "db test", command: "supabase", args: ["test", "db"], needsDb: true },
];

const root = process.cwd();
const onlyTask = readFlag("task");
const skipDb = hasFlag("skip-db");
const keepCopy = hasFlag("keep");
const logDir = join(root, ".autofix", "check-tasks");

interface Check {
  name: string;
  expected: "pass" | "fail";
  actual: "pass" | "fail" | "skipped";
  log?: string;
}

// ---------------------------------------------------------------------------
// Throwaway copy of the repository

function createCopy(): string {
  const copy = mkdtempSync(join(tmpdir(), "agendai-check-"));
  const files = runCapture("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], root);
  for (const file of files.output.split("\0").filter(Boolean)) {
    if (!existsSync(join(root, file))) continue;
    mkdirSync(dirname(join(copy, file)), { recursive: true });
    cpSync(join(root, file), join(copy, file));
  }
  mustRun("git", ["init", "-q"], copy);
  mustRun("git", ["add", "-A"], copy);
  mustRun("git", ["-c", "user.name=check-tasks", "-c", "user.email=check@autofix.test", "commit", "-qm", "base"], copy);
  mustRun("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], copy);
  return copy;
}

function resetCopy(copy: string): void {
  const dependenciesChanged = runCapture("git", ["diff", "--quiet", "HEAD", "--", "pnpm-lock.yaml"], copy).code !== 0;
  mustRun("git", ["reset", "--hard", "-q"], copy);
  mustRun("git", ["clean", "-fdq"], copy);
  if (dependenciesChanged) mustRun("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], copy);
}

function mustRun(command: string, args: string[], cwd: string): RunResult {
  const result = runCapture(command, args, cwd);
  if (result.code !== 0) throw new Error(`${command} ${args.join(" ")} falhou:\n${result.output}`);
  return result;
}

// ---------------------------------------------------------------------------
// Oracles

function verify(copy: string): RunResult {
  let output = "";
  for (const step of VERIFY_STEPS) {
    if (step.needsDb && skipDb) continue;
    const result = runCapture(step.command, step.args, copy);
    output += `\n▶ ${step.name}\n${result.output}`;
    if (result.code !== 0) return { code: result.code, output };
  }
  return { code: 0, output };
}

function copyHiddenTests(dir: string, copy: string): void {
  cpSync(join(dir, "hidden-tests"), copy, { recursive: true });
}

/** Runs hidden Vitest files, grouped by the package that owns them (apps/<name>). */
function runHiddenCodeTests(loaded: LoadedTask, copy: string): RunResult {
  copyHiddenTests(loaded.dir, copy);
  const byPackage = new Map<string, string[]>();
  for (const test of hiddenCodeTests(loaded.task)) {
    const [apps, name, ...rest] = test.split("/");
    const packageDir = `${apps}/${name}`;
    byPackage.set(packageDir, [...(byPackage.get(packageDir) ?? []), rest.join("/")]);
  }
  let output = "";
  for (const [packageDir, tests] of byPackage) {
    const result = runCapture("pnpm", ["exec", "vitest", "run", ...tests], join(copy, packageDir));
    output += result.output;
    if (result.code !== 0) return { code: result.code, output };
  }
  return { code: 0, output };
}

function runHiddenDbTests(loaded: LoadedTask, copy: string): RunResult {
  copyHiddenTests(loaded.dir, copy);
  const reset = runCapture("supabase", ["db", "reset"], copy);
  if (reset.code !== 0) return reset;
  return runCapture("supabase", ["test", "db", ...hiddenDbTests(loaded.task)], copy);
}

function dependencyMajorOk(task: EvalTask, copy: string): RunResult {
  const grader = gradersOf(task, "dependency_major")[0];
  if (!grader) return { code: 1, output: "sem grader dependency_major" };
  const manifests = grader.workspace
    ? [`${grader.workspace}/package.json`]
    : runCapture("git", ["ls-files", "package.json", "**/package.json"], copy).output.split("\n").filter(Boolean);
  const specs = manifests.flatMap((file) => {
    const manifest = JSON.parse(readFileSync(join(copy, file), "utf8")) as Record<string, Record<string, string> | undefined>;
    const spec = manifest.dependencies?.[grader.package] ?? manifest.devDependencies?.[grader.package];
    return spec ? [{ file, spec }] : [];
  });
  const wrong = specs.filter(({ spec }) => Number(/(\d+)/.exec(spec)?.[1]) !== grader.major);
  const output = specs.map(({ file, spec }) => `${file}: ${grader.package}@${spec}`).join("\n");
  return { code: specs.length > 0 && wrong.length === 0 ? 0 : 1, output };
}

function bumpDependency(task: EvalTask, copy: string): void {
  if (!task.upgrade) throw new Error("tarefa sem bloco upgrade");
  const target = `${task.upgrade.package}@${task.upgrade.to}`;
  const args = task.upgrade.filter ? ["--filter", task.upgrade.filter, "up", target] : ["up", "-r", target];
  mustRun("pnpm", args, copy);
}

function applyPatchFile(copy: string, patch: string): void {
  mustRun("git", ["apply", patch], copy);
}

function setupTask(loaded: LoadedTask, copy: string): void {
  if (!loaded.task.setup?.bug) return;
  const result = applyBug(copy, loaded.task.setup.bug);
  if (!result.ok) throw new Error(result.error);
}

/** Puts the copy in the "solved" state: base code, or base + reference.patch. */
function applyReference(loaded: LoadedTask, copy: string): void {
  if (loaded.task.upgrade) bumpDependency(loaded.task, copy);
  if (loaded.task.reference) applyPatchFile(copy, join(loaded.dir, loaded.task.reference.patch));
}

// ---------------------------------------------------------------------------
// Per-family scenarios

function check(name: string, expected: "pass" | "fail", run: () => RunResult): Check {
  const result = run();
  return { name, expected, actual: result.code === 0 ? "pass" : "fail", log: result.output };
}

function skipped(name: string, expected: "pass" | "fail"): Check {
  return { name, expected, actual: "skipped" };
}

/** Runs `fn` on a clean copy and resets it afterwards. */
function scenario(copy: string, fn: () => Check[]): Check[] {
  try {
    return fn();
  } finally {
    resetCopy(copy);
  }
}

function checkTask(loaded: LoadedTask, copy: string, baseVerify: Check): Check[] {
  const { task } = loaded;
  const codeTests = hiddenCodeTests(task).length > 0;
  const dbTests = hiddenDbTests(task).length > 0;
  const dbCheck = (name: string, expected: "pass" | "fail") =>
    skipDb ? skipped(name, expected) : check(name, expected, () => runHiddenDbTests(loaded, copy));
  const referenceIsBase = !task.reference && !task.upgrade;

  const broken = scenario(copy, () => {
    setupTask(loaded, copy);
    const checks: Check[] = [];
    switch (task.family) {
      case "build":
        checks.push(check("com o bug, verify falha", "fail", () => verify(copy)));
        break;
      case "bug":
      case "db":
        if (task.setup?.bug) checks.push(check("com o bug, a suíte existente continua verde (pass-to-pass)", "pass", () => verify(copy)));
        break;
      case "upgrade":
        checks.push(check("antes do upgrade, a versão major não é a pedida", "fail", () => dependencyMajorOk(task, copy)));
        break;
    }
    if (codeTests) checks.push(check("com o bug, os testes ocultos falham", "fail", () => runHiddenCodeTests(loaded, copy)));
    if (dbTests) checks.push(dbCheck("sem a correção, os testes ocultos de banco falham", "fail"));
    return checks;
  });

  const upgradeOnly = task.upgrade
    ? scenario(copy, () => {
        bumpDependency(task, copy);
        return [check("só subir a versão quebra o verify", "fail", () => verify(copy))];
      })
    : [];

  const solved = scenario(copy, () => {
    applyReference(loaded, copy);
    const checks: Check[] = [];
    checks.push(referenceIsBase ? { ...baseVerify, name: "com a referência, verify passa" } : check("com a referência, verify passa", "pass", () => verify(copy)));
    if (task.upgrade) checks.push(check("com a referência, a versão major é a pedida", "pass", () => dependencyMajorOk(task, copy)));
    if (codeTests) checks.push(check("com a referência, os testes ocultos passam", "pass", () => runHiddenCodeTests(loaded, copy)));
    if (dbTests) checks.push(dbCheck("com a referência, os testes ocultos de banco passam", "pass"));
    return checks;
  });

  return [...broken, ...upgradeOnly, ...solved];
}

// ---------------------------------------------------------------------------
// Main

function saveLog(taskId: string, checkName: string, log: string | undefined): string {
  mkdirSync(logDir, { recursive: true });
  const file = join(logDir, `${taskId}--${checkName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.log`);
  writeFileSync(file, log ?? "");
  return file;
}

const loaded = loadTasks(root).filter((t) => !onlyTask || t.task.id === onlyTask);
if (loaded.length === 0) {
  console.error(onlyTask ? `Tarefa ${onlyTask} não encontrada.` : "Nenhuma tarefa em evals/tasks.");
  process.exit(1);
}

const structuralProblems = [
  ...loaded.flatMap((t) => validateStructure(root, t).map((p) => `${t.task.id}: ${p}`)),
  ...(onlyTask ? [] : validateSuites(root, new Set(loaded.map((t) => t.task.id)))),
];
if (structuralProblems.length > 0) {
  console.error("✖ Problemas de estrutura:\n" + structuralProblems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`✔ Estrutura de ${loaded.length} tarefa(s) ok${skipDb ? " (banco pulado: --skip-db)" : ""}`);

rmSync(logDir, { recursive: true, force: true });
console.log("Preparando cópia descartável do repositório...");
const copy = createCopy();
let failures = 0;

try {
  const baseVerify = check("base verde", "pass", () => verify(copy));
  if (baseVerify.actual !== "pass") {
    console.error(`✖ O repositório base não passa no verify. Log: ${saveLog("base", "verify", baseVerify.log)}`);
    process.exit(1);
  }
  console.log("✔ Base verde\n");

  for (const item of loaded) {
    const started = Date.now();
    const checks = checkTask(item, copy, baseVerify);
    const wrong = checks.filter((c) => c.actual !== "skipped" && c.actual !== c.expected);
    const skippedCount = checks.filter((c) => c.actual === "skipped").length;
    const seconds = ((Date.now() - started) / 1000).toFixed(0);
    const suffix = skippedCount ? `, ${skippedCount} pulada(s)` : "";

    if (wrong.length === 0) {
      console.log(`✔ ${item.task.id.padEnd(13)} ${checks.length - skippedCount} checagem(ns) ok${suffix} (${seconds}s)`);
      continue;
    }
    failures += 1;
    console.log(`✖ ${item.task.id.padEnd(13)} (${seconds}s)`);
    for (const c of wrong) {
      const verb = c.expected === "pass" ? "passar" : "falhar";
      console.log(`    - esperado ${verb}: ${c.name}. Log: ${saveLog(item.task.id, c.name, c.log)}`);
    }
  }
} finally {
  if (keepCopy) console.log(`\nCópia mantida em ${copy}`);
  else rmSync(copy, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✖ ${failures} tarefa(s) inconsistente(s).`);
  process.exit(1);
}
console.log(`\n✔ check:tasks: ${loaded.length} tarefa(s) consistentes com suas soluções de referência.`);
