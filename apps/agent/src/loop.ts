import { completeWithTools, type ToolReply } from "./model";
import { specificationPrompt } from "./prompt";
import { runTaskTest, type TestResult } from "./sensor";
import type { Task } from "./tasks";
import { executeTool, tools } from "./tools";

export const LOOP_CEILING = 3;

type Complete = (prompt: string, toolList: typeof tools) => Promise<ToolReply>;

export interface LoopRound extends TestResult {
  text: string;
  toolOutput: string[];
}

export interface LoopResult extends TestResult {
  stop: "passou" | "teto" | "escalado";
  rounds: LoopRound[];
}

function loopPrompt(task: Task, overlapSource: string, failure: string, toolsNote: string): string {
  const parts = [
    specificationPrompt(task.report),
    "O teste da tarefa ainda falha. Use apply_patch no arquivo do domínio.",
    `Arquivo apps/api/src/domain/overlap.ts:\n\n${overlapSource}`,
  ];
  if (toolsNote) parts.push(`Resultado das ferramentas:\n${toolsNote}`);
  parts.push(`Saída do teste:\n${failure}`);
  return parts.join("\n\n");
}

export interface LoopDeps {
  complete: Complete;
  readOverlap: () => string;
  sensor?: () => TestResult;
}

/** Patch, run the task test, repeat until green or the ceiling. */
export async function runLoop(root: string, task: Task, deps: LoopDeps): Promise<LoopResult> {
  const sense =
    deps.sensor ??
    (task.sensorRelPath
      ? () => runTaskTest(root, task)
      : () => ({ passed: false, output: "sem teste: a tarefa não é uma correção" }));
  let result = sense();
  const rounds: LoopRound[] = [];
  let toolsNote = "";
  while (!result.passed && rounds.length < LOOP_CEILING) {
    const reply = await deps.complete(
      loopPrompt(task, deps.readOverlap(), result.output, toolsNote),
      tools,
    );
    const escalated = reply.calls.some((call) => call.name === "escalate");
    const calls = escalated ? reply.calls.filter((call) => call.name === "escalate") : reply.calls;
    const toolOutput = calls.map((call) =>
      `${call.name}: ${executeTool(root, task, call.name, call.input)}`,
    );
    if (escalated) {
      rounds.push({ text: reply.text, toolOutput, passed: false, output: result.output });
      return { stop: "escalado", rounds, passed: false, output: result.output };
    }
    result = sense();
    toolsNote = toolOutput.join("\n");
    rounds.push({ text: reply.text, toolOutput, passed: result.passed, output: result.output });
  }
  return {
    stop: result.passed ? "passou" : "teto",
    rounds,
    passed: result.passed,
    output: result.output,
  };
}

export function defaultComplete(): Complete {
  return completeWithTools;
}
