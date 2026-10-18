import { pathToFileURL } from "node:url";
import { contextCodeAndTest } from "./contexts";
import { labDir } from "./files";
import { completeWithTools, type ToolReply } from "./model";
import { specificationPrompt } from "./prompts";
import { runTests, type TestResult } from "./run-tests";
import { executeTool, tools } from "./tools";

/** Stop after this many model turns. */
export const LOOP_CEILING = 3;

type Complete = (prompt: string, toolList: typeof tools) => Promise<ToolReply>;

export interface LoopRound extends TestResult {
  text: string;
  toolOutput: string[];
}

export interface LoopResult extends TestResult {
  stop: "passou" | "teto";
  rounds: LoopRound[];
}

function loopPrompt(dir: string, failure: string, toolsNote: string): string {
  const parts = [
    specificationPrompt(),
    "O teste ainda falha. Use apply_patch. Se continuar falhando, a saída volta no próximo prompt.",
    contextCodeAndTest("", dir),
  ];
  if (toolsNote) parts.push(`Resultado das ferramentas:\n${toolsNote}`);
  parts.push(`Saída do teste:\n${failure}`);
  return parts.join("\n\n");
}

/** Repeats a round until the tests pass or the ceiling is hit. Each turn sees the last failure. */
export async function runLoop(dir: string, complete: Complete): Promise<LoopResult> {
  let result = runTests(dir);
  const rounds: LoopRound[] = [];
  let toolsNote = "";
  while (!result.passed && rounds.length < LOOP_CEILING) {
    const reply = await complete(loopPrompt(dir, result.output, toolsNote), tools);
    const toolOutput = reply.calls.map((call) => `${call.name}: ${executeTool(dir, call.name, call.input)}`);
    result = runTests(dir);
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

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const result = await runLoop(labDir, completeWithTools);
  for (const [index, round] of result.rounds.entries()) {
    console.log(`\n# volta ${index + 1}`);
    console.log(round.text);
    for (const line of round.toolOutput) console.log(`\n# ${line}`);
    console.log(`\n# teste\n${round.passed ? "passou" : "falhou"}\n${round.output}`);
  }
  console.log(`\n# parada\n${result.stop}`);
}
