import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runSession } from "./runner";
import { installSensor, runTaskTest, type TestResult } from "./sensor";
import { loadTask, repoRoot, type Task } from "./tasks";

const argv = process.argv.slice(2).filter((arg) => arg !== "--");

function usage(): never {
  console.error("Uso: pnpm autofix round --task=bug-001");
  console.error("     pnpm autofix run --task=bug-001");
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
  const id = readFlag("task");
  if (!id) usage();

  const root = repoRoot();
  const task = loadTask(id, root);
  requireBroken(root, task.bug);

  console.log("# modelo");
  runSession(root, task);
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

function run(): void {
  const id = readFlag("task");
  if (!id) usage();

  const root = repoRoot();
  const task = loadTask(id, root);
  requireBroken(root, task.bug);

  let volta = 0;
  let extra = "";
  let test: TestResult = { passed: false, output: "" };

  while (!test.passed && volta < TETO) {
    volta += 1;
    console.log(`# volta ${volta}`);
    runSession(root, task, extra);
    test = runSensor(root, task);
    printTeste(gitDiffStat(root), task, test);
    extra = `Saída do teste:\n${test.output}`;
  }

  console.log("# parada");
  console.log(test.passed ? "passou" : "teto");
}

try {
  if (argv[0] === "round") round();
  else if (argv[0] === "run") run();
  else usage();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
