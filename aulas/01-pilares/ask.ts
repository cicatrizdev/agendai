import { complete } from "./model";
import { promptWithCode, readFunction, specificationPrompt, vaguePrompt } from "./prompts";

const code = readFunction();
const calls = [
  ["vago", promptWithCode(vaguePrompt, code)],
  ["especificação", promptWithCode(specificationPrompt(), code)],
] as const;

for (const [name, prompt] of calls) {
  const reply = await complete(prompt);
  console.log(`\n# ${name}`);
  console.log(reply.text);
  console.log(`usage input=${reply.usage.inputTokens} output=${reply.usage.outputTokens}`);
}
