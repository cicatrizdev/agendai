import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "./env";
import { loadIssue } from "./issue";
import { defaultComplete, runLoop, type LoopResult } from "./loop";
import { resolveProvider, type Provider } from "./model";
import { installSensor } from "./sensor";
import { readOverlap, runRound } from "./stages";
import { loadTask, type Task } from "./tasks";

function flag(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = argv.find((arg) => arg.startsWith(prefix));
  return hit?.slice(prefix.length);
}

function printResult(result: LoopResult, hasTest = true): void {
  for (const [index, round] of result.rounds.entries()) {
    console.log(`\n# volta ${index + 1}`);
    console.log(round.text);
    for (const line of round.toolOutput) console.log(`\n# ${line}`);
    if (hasTest) console.log(`\n# teste\n${round.passed ? "passou" : "falhou"}`);
  }
  console.log(`\n# parada\n${result.stop}`);
}

function overlapPath(root: string): string {
  return resolve(root, "apps/api/src/domain/overlap.ts");
}

/** `pnpm break` records the injected bug; the source string is not the state. */
function assertBugApplied(root: string, task: Task): void {
  if (!task.bug) return;
  const state = resolve(root, ".autofix/broken.json");
  const applied = existsSync(state) ? (JSON.parse(readFileSync(state, "utf8")) as string[]) : [];
  if (!applied.includes(task.bug)) {
    throw new Error(`O bug ${task.bug} não está aplicado. Rode: pnpm break --bug=${task.bug}`);
  }
}

function resolveTask(root: string, taskId: string, issueFile?: string): Task {
  return issueFile ? loadIssue(issueFile, root).task : loadTask(taskId, root);
}

function announce(task: Task, provider: Provider, issueFile?: string): void {
  const source = issueFile ? `issue ${issueFile}` : "eval";
  console.log(`# tarefa ${task.id} (${source}) · provider ${provider}`);
}

async function runOnce(root: string, task: Task): Promise<LoopResult> {
  assertBugApplied(root, task);
  const uninstall = task.sensorRelPath ? installSensor(root, task) : () => {};
  try {
    return await runLoop(root, task, {
      complete: defaultComplete(),
      readOverlap: () => readOverlap(root),
    });
  } finally {
    uninstall();
  }
}

const RUNS = 5;

async function scoreboard(root: string, task: Task): Promise<void> {
  if (!task.sensorRelPath) throw new Error(`a tarefa ${task.id} não tem teste; o placar não se aplica`);
  assertBugApplied(root, task);
  const original = readFileSync(overlapPath(root), "utf8");
  const uninstall = installSensor(root, task);
  let passed = 0;
  try {
    for (let trial = 0; trial < RUNS; trial += 1) {
      writeFileSync(overlapPath(root), original);
      const result = await runLoop(root, task, {
        complete: defaultComplete(),
        readOverlap: () => readFileSync(overlapPath(root), "utf8"),
      });
      if (result.passed) passed += 1;
    }
  } finally {
    writeFileSync(overlapPath(root), original);
    uninstall();
  }
  console.log(`\n# mini-placar\n${task.id.padEnd(10)} ${passed}/${RUNS}`);
  console.log("o bug não mudou; o arquivo é o do produto. a taxa é a desta execução.");
}

function usage(): never {
  console.error(
    [
      "Uso: pnpm autofix round --task=bug-001 [--provider=replay]",
      "     pnpm autofix run --task=bug-001 [--provider=replay]",
      "     pnpm autofix run --issue=inbox/abc-1.md",
      "     pnpm autofix run --task=escalate-001",
      "     pnpm autofix round --task=security-001",
      "     pnpm autofix scoreboard --task=bug-001",
    ].join("\n"),
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((arg) => arg !== "--");
  const command = argv[0];
  const root = repoRoot();
  if (!existsSync(resolve(root, "pnpm-workspace.yaml"))) {
    throw new Error("rode o autofix na raiz do repositório");
  }
  if (command !== "round" && command !== "run" && command !== "scoreboard") usage();

  const provider = flag(argv, "provider");
  if (provider) process.env.AUTOFIX_PROVIDER = provider;
  const issueFile = flag(argv, "issue");
  const task = resolveTask(root, flag(argv, "task") ?? "bug-001", issueFile);
  announce(task, resolveProvider(), issueFile);

  if (command === "round") {
    assertBugApplied(root, task);
    const uninstall = task.sensorRelPath ? installSensor(root, task) : () => {};
    try {
      const result = await runRound(root, task, { readOverlap: () => readOverlap(root) });
      console.log(`\n# modelo\n${result.text}`);
      for (const line of result.toolOutput) console.log(`\n# ${line}`);
      console.log(`\n# teste\n${result.passed ? "passou" : "falhou"}\n${result.output}`);
      console.log("\n# parada\numa volta. sem segunda chamada.");
    } finally {
      uninstall();
    }
    return;
  }
  if (command === "run") {
    const result = await runOnce(root, task);
    printResult(result, Boolean(task.sensorRelPath));
    if (result.passed) {
      rmSync(resolve(root, ".autofix/broken.json"), { force: true });
      console.log(
        "\n# working tree\noverlap.ts no produto foi corrigido. git checkout -- apps/api/src/domain/overlap.ts devolve o take.",
      );
    }
    return;
  }
  await scoreboard(root, task);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  await main();
}
