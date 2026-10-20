import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contextCode, contextCodeAndTest, contextDump, readDump } from "./contexts";
import { completeWithTools, type Reply, type ToolReply } from "./model";
import { specificationPrompt } from "./prompt";
import { runTaskTest, type TestResult } from "./sensor";
import type { Task } from "./tasks";
import { executeTool, tools } from "./tools";
import { overlapPath } from "./fixtures/bug-001";

type CompleteText = (prompt: string) => Promise<Reply>;
type CompleteTools = (prompt: string, toolList: typeof tools) => Promise<ToolReply>;

export interface AskResult {
  prompt: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ContextCall extends AskResult {
  label: string;
}

export interface RoundResult extends TestResult {
  text: string;
  toolOutput: string[];
}

function textComplete(): CompleteText {
  return async (prompt) => completeWithTools(prompt, []);
}

export function readOverlap(root: string): string {
  return readFileSync(resolve(root, overlapPath), "utf8");
}

export function readHiddenTest(root: string, task: Task): string {
  return readFileSync(resolve(root, task.hiddenSource), "utf8");
}

/** M2. One reply. The product file stays as it was. */
export async function runAsk(task: Task, source: string, complete: CompleteText = textComplete()): Promise<AskResult> {
  const prompt = `${specificationPrompt(task.report)}\n\nArquivo apps/api/src/domain/overlap.ts:\n\n${source}`;
  const reply = await complete(prompt);
  return {
    prompt,
    text: reply.text,
    inputTokens: reply.usage.inputTokens,
    outputTokens: reply.usage.outputTokens,
  };
}

/** M3. Three windows, zero patches. */
export async function runContexts(
  task: Task,
  source: string,
  testSource: string,
  dump: string,
  complete: CompleteText = textComplete(),
): Promise<ContextCall[]> {
  const spec = specificationPrompt(task.report);
  const windows = [
    ["código", contextCode(spec, source)],
    ["código + teste", contextCodeAndTest(spec, source, testSource)],
    ["despejo", contextDump(spec, dump)],
  ] as const;
  const calls: ContextCall[] = [];
  for (const [label, prompt] of windows) {
    const reply = await complete(prompt);
    calls.push({
      label,
      prompt,
      text: reply.text,
      inputTokens: reply.usage.inputTokens,
      outputTokens: reply.usage.outputTokens,
    });
  }
  return calls;
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

export function productDump(root: string): string {
  return readDump(root);
}
