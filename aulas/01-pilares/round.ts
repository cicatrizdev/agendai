import { pathToFileURL } from "node:url";
import { contextCodeAndTest } from "./contexts";
import { labDir } from "./files";
import { completeWithTools, type ToolReply } from "./model";
import { specificationPrompt } from "./prompts";
import { runTests, type TestResult } from "./run-tests";
import { executeTool, tools } from "./tools";

export interface RoundResult extends TestResult {
  text: string;
  toolOutput: string[];
}

type Complete = (prompt: string, toolList: typeof tools) => Promise<ToolReply>;

/** One turn: the model may patch, the harness runs the test, and then it stops. */
export async function runOneRound(dir: string, complete: Complete): Promise<RoundResult> {
  const prompt = [
    specificationPrompt(),
    "Use apply_patch. Esta rodada não chama o modelo de novo.",
    contextCodeAndTest("", dir),
  ].join("\n\n");
  const reply = await complete(prompt, tools);
  const toolOutput = reply.calls.map((call) => `${call.name}: ${executeTool(dir, call.name, call.input)}`);
  const result = runTests(dir);
  return { ...result, text: reply.text, toolOutput };
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const result = await runOneRound(labDir, completeWithTools);
  console.log(`\n# modelo\n${result.text}`);
  for (const line of result.toolOutput) console.log(`\n# ${line}`);
  console.log(`\n# teste\n${result.passed ? "passou" : "falhou"}\n${result.output}`);
}
