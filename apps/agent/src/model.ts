import { loadEnv } from "./env";
import { replayBug001 } from "./fixtures/bug-001";
import { completeWithGrok } from "./grok";
import type { AgentTool } from "./tools";

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface Reply {
  text: string;
  usage: Usage;
}

export interface ToolCall {
  name: string;
  input: unknown;
}

export interface ToolReply extends Reply {
  calls: ToolCall[];
}

export type Provider = "replay" | "grok";

function envValue(key: string): string {
  return process.env[key]?.trim() ?? "";
}

export function resolveProvider(): Provider {
  loadEnv();
  const raw = envValue("AUTOFIX_PROVIDER") || "grok";
  if (raw === "replay") return "replay";
  if (raw === "grok") return "grok";
  throw new Error(`AUTOFIX_PROVIDER inválido: ${raw}. Use replay ou grok.`);
}

export async function completeWithTools(prompt: string, tools: AgentTool[]): Promise<ToolReply> {
  const provider = resolveProvider();
  if (provider === "replay") return replayBug001(prompt);
  return completeWithGrok(prompt, tools);
}
