import Anthropic from "@anthropic-ai/sdk";
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

export type Provider = "replay" | "grok" | "anthropic" | "gemini";

function envValue(key: string): string {
  return process.env[key]?.trim() ?? "";
}

export function resolveProvider(): Provider {
  loadEnv();
  const raw = envValue("AUTOFIX_PROVIDER") || "grok";
  if (raw === "replay") return "replay";
  if (raw === "grok") return "grok";
  if (raw === "anthropic") {
    if (!envValue("ANTHROPIC_API_KEY")) {
      throw new Error(
        "AUTOFIX_PROVIDER=anthropic exige ANTHROPIC_API_KEY. Volte para AUTOFIX_PROVIDER=replay.",
      );
    }
    return "anthropic";
  }
  if (raw === "gemini") {
    if (!envValue("GEMINI_API_KEY")) {
      throw new Error(
        "AUTOFIX_PROVIDER=gemini exige GEMINI_API_KEY. Volte para AUTOFIX_PROVIDER=replay.",
      );
    }
    return "gemini";
  }
  throw new Error(`AUTOFIX_PROVIDER inválido: ${raw}. Use replay, grok, anthropic ou gemini.`);
}

function requireModel(): string {
  const model = envValue("AUTOFIX_MODEL_FAST");
  if (!model) throw new Error("AUTOFIX_MODEL_FAST ausente no .env");
  return model;
}

function explainAnthropicError(error: unknown): never {
  if (!(error instanceof Anthropic.BadRequestError)) throw error;
  const message = String(error.message);
  if (message.includes("anthropic-workspace-id")) {
    throw new Error(
      "ANTHROPIC_WORKSPACE_ID ausente no .env. Volte para AUTOFIX_PROVIDER=replay.",
    );
  }
  if (message.includes("credit balance is too low")) {
    throw new Error(
      "Saldo da Anthropic insuficiente. Volte para AUTOFIX_PROVIDER=replay.",
    );
  }
  throw error;
}

function anthropicClient(): Anthropic {
  const workspaceId = envValue("ANTHROPIC_WORKSPACE_ID");
  return new Anthropic({
    apiKey: envValue("ANTHROPIC_API_KEY"),
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });
}

async function completeAnthropicWithTools(prompt: string, tools: AgentTool[]): Promise<ToolReply> {
  const message = await anthropicClient()
    .messages.create({
      model: requireModel(),
      max_tokens: 1024,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      })),
      messages: [{ role: "user", content: prompt }],
    })
    .catch(explainAnthropicError);
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  const calls = message.content
    .filter((block) => block.type === "tool_use")
    .map((block) => ({ name: block.name, input: block.input }));
  return {
    text,
    calls,
    usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
  };
}

interface GeminiPart {
  text?: string;
  functionCall?: { name?: string; args?: unknown };
}

interface GeminiResponse {
  error?: { message?: string };
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

async function completeGeminiWithTools(prompt: string, tools: AgentTool[]): Promise<ToolReply> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${requireModel()}:generateContent`,
  );
  url.searchParams.set("key", envValue("GEMINI_API_KEY"));
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024 },
      tools: [
        {
          functionDeclarations: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
          })),
        },
      ],
    }),
  });
  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    const message = payload.error?.message ?? `Gemini ${response.status}`;
    throw new Error(`${message} Volte para AUTOFIX_PROVIDER=replay.`);
  }
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return {
    text: parts.map((part) => part.text ?? "").join(""),
    calls: parts
      .filter((part) => part.functionCall?.name)
      .map((part) => ({
        name: part.functionCall?.name ?? "",
        input: part.functionCall?.args ?? {},
      })),
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount ?? 1,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 1,
    },
  };
}

export async function completeWithTools(prompt: string, tools: AgentTool[]): Promise<ToolReply> {
  const provider = resolveProvider();
  if (provider === "replay") return replayBug001(prompt);
  if (provider === "grok") return completeWithGrok(prompt, tools);
  if (provider === "gemini") return completeGeminiWithTools(prompt, tools);
  return completeAnthropicWithTools(prompt, tools);
}
