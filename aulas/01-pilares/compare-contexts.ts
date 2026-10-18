import { contextCode, contextCodeAndTest, contextDump } from "./contexts";
import { complete } from "./model";
import { specificationPrompt } from "./prompts";

const spec = specificationPrompt();
const calls = [
  ["código", contextCode(spec)],
  ["código + teste", contextCodeAndTest(spec)],
  ["despejo", contextDump(spec)],
] as const;

for (const [name, prompt] of calls) {
  const reply = await complete(prompt);
  console.log(`\n# ${name}`);
  console.log(`chars=${prompt.length} usage input=${reply.usage.inputTokens} output=${reply.usage.outputTokens}`);
  console.log(reply.text);
}
