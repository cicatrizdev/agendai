import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { completeWithTools, type ToolReply } from "./model";
import { specificationPrompt } from "./prompt";
import { runTaskTest, type TestResult } from "./sensor";
import type { Task } from "./tasks";
import { executeTool, tools } from "./tools";
import { overlapPath } from "./fixtures/bug-001";

type CompleteTools = (prompt: string, toolList: typeof tools) => Promise<ToolReply>;

export interface RoundResult extends TestResult {
  text: string;
  toolOutput: string[];
}

export function readOverlap(root: string): string {
  return readFileSync(resolve(root, overlapPath), "utf8");
}

export function readHiddenTest(root: string, task: Task): string {
  if (!task.hiddenSource) throw new Error(`a tarefa ${task.id} não tem teste oculto`);
  return readFileSync(resolve(root, task.hiddenSource), "utf8");
}

function roundPrompt(task: Task, source: string, testSource: string): string {
  return [
    specificationPrompt(task.report),
    task.prompt,
    "Use apply_patch. Esta rodada não chama o modelo de novo.",
    `Arquivo apps/api/src/domain/overlap.ts:\n\n${source}`,
    testSource ? `Teste que falha, overlap-boundary.test.ts:\n\n${testSource}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** M4. One model call, then the sensor. No second call. */
export async function runRound(
  root: string,
  task: Task,
  deps: { complete?: CompleteTools; readOverlap?: () => string; sensor?: () => TestResult; testSource?: string },
): Promise<RoundResult> {
  const complete = deps.complete ?? completeWithTools;
  const source = deps.readOverlap?.() ?? readOverlap(root);
  const testSource = deps.testSource ?? (task.hiddenSource ? readHiddenTest(root, task) : "");
  const reply = await complete(roundPrompt(task, source, testSource), tools);
  const toolOutput = reply.calls.map(
    (call) => `${call.name}: ${executeTool(root, task, call.name, call.input)}`,
  );
  const result = deps.sensor
    ? deps.sensor()
    : task.sensorRelPath
      ? runTaskTest(root, task)
      : { passed: false, output: toolOutput.join("\n") };
  return { text: reply.text, toolOutput, passed: result.passed, output: result.output };
}
