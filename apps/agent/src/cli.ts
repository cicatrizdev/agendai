import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTaskIds, summarizeRun } from "./batch";
import { discardDiff, enforceContract, runSession, snapshotSecrets } from "./runner";
import { installSensor, runTaskTest, type TestResult } from "./sensor";
import { loadTask, repoRoot, type Task } from "./tasks";

const argv = process.argv.slice(2).filter((arg) => arg !== "--");

function usage(): never {
  console.error("Uso: pnpm autofix round --task=bug-001");
  console.error("     pnpm autofix run --task=bug-001");
  console.error("     pnpm autofix run --task=bug-001,bug-002,bug-003");
  process.exit(1);
}

function readFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0) return argv[index + 1];
  return undefined;
}

function readBroken(root: string): string[] {
  const file = join(root, ".autofix", "broken.json");
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")) as string[];
}

function requireBroken(root: string, bug: string): void {
  if (!bug) return;
  if (!readBroken(root).includes(bug)) {
    throw new Error(`O bug ${bug} não está aplicado. Rode: pnpm break --bug=${bug}`);
  }
}

function gitDiffStat(root: string): string {
  const result = spawnSync("git", ["diff", "--stat"], {
    cwd: root,
    encoding: "utf8",
  });
  return (result.stdout ?? "").trim();
}

function printRefused(paths: string[]): void {
  for (const path of paths) console.log(`caminho fora do contrato: ${path}`);
}

function runSensor(root: string, task: Task): TestResult {
  if (!task.sensorRelPath) return { passed: false, output: "" };
  const uninstall = installSensor(root, task);
  try {
    return runTaskTest(root, task);
  } finally {
    uninstall();
  }
}

function round(): void {
  const raw = readFlag("task");
  if (!raw) usage();
  const ids = parseTaskIds(raw);
  const id = ids[0];
  if (!id || ids.length !== 1) {
    throw new Error("round aceita uma tarefa. Use run --task=bug-001,bug-002 para várias.");
  }

  const root = repoRoot();
  const task = loadTask(id, root);
  requireBroken(root, task.bug);

  console.log("# modelo");
  const secrets = snapshotSecrets(root);
  runSession(root, task);
  const refused = enforceContract(root, task, secrets);
  if (refused.length > 0) {
    printRefused(refused);
    console.log("# parada");
    console.log("recusado");
    return;
  }
  const diff = gitDiffStat(root);
  const test = runSensor(root, task);

  if (diff) console.log(diff);
  console.log("# teste");
  if (task.sensorRelPath) {
    console.log(test.passed ? "passou" : "falhou");
    if (test.output) console.log(test.output);
  }
  console.log("# parada");
  console.log("uma sessão. sem segunda chamada.");
}

function printTeste(diff: string, task: Task, test: TestResult): void {
  if (diff) console.log(diff);
  console.log("# teste");
  if (task.sensorRelPath) {
    console.log(test.passed ? "passou" : "falhou");
    if (test.output) console.log(test.output);
  }
}

const TETO = 3;

function runOneTask(root: string, task: Task): string {
  if (task.expectedOutcome === "escalate") {
    console.log("# volta 1");
    runSession(root, task, "");
    const diff = gitDiffStat(root);
    if (diff) console.log(diff);
    discardDiff(root);
    return "escalado";
  }

  let volta = 0;
  let extra = "";
  let test: TestResult = { passed: false, output: "" };

  while (!test.passed && volta < TETO) {
    volta += 1;
    console.log(`# volta ${volta}`);
    const secrets = snapshotSecrets(root);
    runSession(root, task, extra);
    const refused = enforceContract(root, task, secrets);
    if (refused.length > 0) {
      printRefused(refused);
      return "recusado";
    }
    test = runSensor(root, task);
    printTeste(gitDiffStat(root), task, test);
    extra = `Saída do teste:\n${test.output}`;
  }

  return test.passed ? "passou" : "teto";
}

function run(): void {
  const raw = readFlag("task");
  if (!raw) usage();
  const ids = parseTaskIds(raw);
  const root = repoRoot();
  const tasks = ids.map((id) => loadTask(id, root));
  for (const task of tasks) requireBroken(root, task.bug);

  const many = tasks.length > 1;
  const results: { id: string; stop: string }[] = [];

  for (const task of tasks) {
    if (many) console.log(`# tarefa ${task.id}`);
    const stop = runOneTask(root, task);
    console.log("# parada");
    console.log(stop);
    results.push({ id: task.id, stop });
  }

  if (many) {
    const summary = summarizeRun(results);
    console.log("# geral");
    console.log(summary.overall);
    for (const item of summary.failed) console.log(`${item.id} ${item.stop}`);
  }
}

try {
  if (argv[0] === "round") round();
  else if (argv[0] === "run") run();
  else usage();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
