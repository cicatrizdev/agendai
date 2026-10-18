import Anthropic from "@anthropic-ai/sdk";
import { loadEnv } from "./env";

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface Reply {
  text: string;
  usage: Usage;
}

/** One SDK call. No tools and no second turn: a prompt cannot run the test. */
export async function complete(prompt: string): Promise<Reply> {
  loadEnv();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.AUTOFIX_MODEL_FAST;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ausente no .env");
  if (!model) throw new Error("AUTOFIX_MODEL_FAST ausente no .env");

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  return {
    text,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  };
}
