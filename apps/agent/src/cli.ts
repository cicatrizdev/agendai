import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "./env";
import { defaultComplete, runLoop, type LoopResult } from "./loop";
import { installSensor } from "./sensor";
import { productDump, readHiddenTest, readOverlap, runAsk, runContexts, runRound } from "./stages";
import { loadTask } from "./tasks";

function flag(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = argv.find((arg) => arg.startsWith(prefix));
  return hit?.slice(prefix.length);
}

function printResult(result: LoopResult): void {
  for (const [index, round] of result.rounds.entries()) {
    console.log(`\n# volta ${index + 1}`);
    console.log(round.text);
    for (const line of round.toolOutput) console.log(`\n# ${line}`);
    console.log(`\n# teste\n${round.passed ? "passou" : "falhou"}`);
  }
  console.log(`\n# parada\n${result.stop}`);
}

function overlapPath(root: string): string {
  return resolve(root, "apps/api/src/domain/overlap.ts");
}

function assertBugApplied(root: string, bugId: string): void {
  const source = readFileSync(overlapPath(root), "utf8");
  if (!source.includes("a.start <= b.end")) {
    throw new Error(`O bug ${bugId} não está no working tree. Rode: pnpm break --bug=${bugId}`);
  }
}

async function runOnce(root: string, taskId: string): Promise<LoopResult> {
  const task = loadTask(taskId);
  if (task.bug) assertBugApplied(root, task.bug);
  const uninstall = task.sensorRelPath ? installSensor(root, task) : () => {};
  try {
    return await runLoop(root, task, {
      complete: defaultComplete(),
      readOverlap: () => readFileSync(overlapPath(root), "utf8"),
    });
  } finally {
    uninstall();
  }
}

const RUNS = 5;

async function scoreboard(root: string, taskId: string): Promise<void> {
  const task = loadTask(taskId);
  assertBugApplied(root, task.bug);
  const original = readFileSync(overlapPath(root), "utf8");
  const uninstall = installSensor(root, task);
  let passed = 0;
  try {
    for (let trial = 0; trial < RUNS; trial += 1) {
      writeOriginal(root, original);
      const result = await runLoop(root, task, {
        complete: defaultComplete(),
        readOverlap: () => readFileSync(overlapPath(root), "utf8"),
      });
      if (result.passed) passed += 1;
    }
  } finally {
    writeOriginal(root, original);
    uninstall();
  }
  console.log(`\n# mini-placar\n${taskId.padEnd(10)} ${passed}/${RUNS}`);
  console.log("o bug não mudou; o arquivo é o do produto. a taxa é a desta execução.");
}

function writeOriginal(root: string, contents: string): void {
  writeFileSync(overlapPath(root), contents);
}

function usage(): never {
  console.error(
    [
      "Uso: pnpm autofix ask --task=bug-001",
      "     pnpm autofix contexts --task=bug-001",
      "     pnpm autofix round --task=bug-001",
      "     pnpm autofix run --task=bug-001",
      "     pnpm autofix run --task=escalate-001",
      "     pnpm autofix round --task=security-001",
    ].join("\n"),
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((arg) => arg !== "--");
  const command = argv[0];
  const taskId = flag(argv, "task") ?? "bug-001";
  const root = repoRoot();
  if (!existsSync(resolve(root, "pnpm-workspace.yaml"))) {
    throw new Error("rode o autofix na raiz do repositório");
  }
  if (command === "ask") {
    const task = loadTask(taskId);
    const before = readOverlap(root);
    const result = await runAsk(task, before);
    console.log(`\n# especificação\n${result.prompt}`);
    console.log(`\n# resposta\n${result.text}`);
    console.log(`usage input=${result.inputTokens} output=${result.outputTokens}`);
    const after = readOverlap(root);
    console.log(`\n# arquivo\n${after === before ? "overlap.ts não foi alterado." : "overlap.ts mudou."}`);
    return;
  }
  if (command === "contexts") {
    const task = loadTask(taskId);
    const before = readOverlap(root);
    const calls = await runContexts(task, before, readHiddenTest(root, task), productDump(root));
    for (const call of calls) {
      console.log(`\n# ${call.label}`);
      console.log(`chars=${call.prompt.length} usage input=${call.inputTokens} output=${call.outputTokens}`);
      console.log(call.text);
    }
    console.log(`\n# arquivo\n${readOverlap(root) === before ? "overlap.ts não foi alterado." : "overlap.ts mudou."}`);
    return;
  }
  if (command === "round") {
    const task = loadTask(taskId);
    if (task.bug) assertBugApplied(root, task.bug);
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
    const result = await runOnce(root, taskId);
    printResult(result);
    if (result.passed) {
      rmSync(resolve(root, ".autofix/broken.json"), { force: true });
      console.log(
        "\n# working tree\noverlap.ts no produto foi corrigido. git checkout -- apps/api/src/domain/overlap.ts devolve o take.",
      );
    }
    return;
  }
  if (command === "scoreboard") {
    await scoreboard(root, taskId);
    return;
  }
  usage();
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  await main();
}
