import Anthropic from "@anthropic-ai/sdk";
import { replayText, replayTools } from "./fixtures/replies";
import { loadEnv } from "./env";
import type { LabTool } from "./tools";

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

export type Provider = "replay" | "anthropic" | "gemini";

function envValue(key: string): string {
  return process.env[key]?.trim() ?? "";
}

/** Replay unless the student opted into a live key. Empty provider is replay. */
export function resolveProvider(): Provider {
  loadEnv();
  const raw = envValue("AUTOFIX_PROVIDER") || "replay";
  if (raw === "replay") return "replay";
  if (raw === "anthropic") {
    if (!envValue("ANTHROPIC_API_KEY")) {
      throw new Error(
        "AUTOFIX_PROVIDER=anthropic exige ANTHROPIC_API_KEY. Veja aulas/01-pilares/ao-vivo.md ou volte para replay.",
      );
    }
    return "anthropic";
  }
  if (raw === "gemini") {
    if (!envValue("GEMINI_API_KEY")) {
      throw new Error(
        "AUTOFIX_PROVIDER=gemini exige GEMINI_API_KEY. Veja aulas/01-pilares/ao-vivo.md ou volte para replay.",
      );
    }
    return "gemini";
  }
  throw new Error(`AUTOFIX_PROVIDER inválido: ${raw}. Use replay, anthropic ou gemini.`);
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
      "ANTHROPIC_WORKSPACE_ID ausente no .env. Copie o ID em https://platform.claude.com/settings/workspaces ou crie uma chave já escopada a um workspace. Ou volte para AUTOFIX_PROVIDER=replay.",
    );
  }
  if (message.includes("credit balance is too low")) {
    throw new Error(
      "Saldo da Anthropic insuficiente. Compre créditos em https://platform.claude.com/settings/billing ou volte para AUTOFIX_PROVIDER=replay.",
    );
  }
  throw error;
}

async function completeAnthropic(prompt: string): Promise<Reply> {
  const apiKey = envValue("ANTHROPIC_API_KEY");
  const workspaceId = envValue("ANTHROPIC_WORKSPACE_ID");
  const client = new Anthropic({
    apiKey,
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });
  const message = await client.messages
    .create({
      model: requireModel(),
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })
    .catch(explainAnthropicError);
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

async function completeAnthropicWithTools(prompt: string, tools: LabTool[]): Promise<ToolReply> {
  const apiKey = envValue("ANTHROPIC_API_KEY");
  const workspaceId = envValue("ANTHROPIC_WORKSPACE_ID");
  const client = new Anthropic({
    apiKey,
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });
  const message = await client.messages
    .create({
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
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
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

async function geminiGenerate(prompt: string, tools?: LabTool[]): Promise<GeminiResponse> {
  const model = requireModel();
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  url.searchParams.set("key", envValue("GEMINI_API_KEY"));
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1024 },
  };
  if (tools && tools.length > 0) {
    body.tools = [
      {
        functionDeclarations: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        })),
      },
    ];
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    const message = payload.error?.message ?? `Gemini ${response.status}`;
    throw new Error(`${message} Volte para AUTOFIX_PROVIDER=replay. Veja aulas/01-pilares/ao-vivo.md.`);
  }
  return payload;
}

function geminiUsage(payload: GeminiResponse): Usage {
  return {
    inputTokens: payload.usageMetadata?.promptTokenCount ?? 1,
    outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 1,
  };
}

function geminiParts(payload: GeminiResponse): GeminiPart[] {
  return payload.candidates?.[0]?.content?.parts ?? [];
}

async function completeGemini(prompt: string): Promise<Reply> {
  const payload = await geminiGenerate(prompt);
  const text = geminiParts(payload)
    .map((part) => part.text ?? "")
    .join("");
  return { text, usage: geminiUsage(payload) };
}

async function completeGeminiWithTools(prompt: string, tools: LabTool[]): Promise<ToolReply> {
  const payload = await geminiGenerate(prompt, tools);
  const parts = geminiParts(payload);
  const text = parts.map((part) => part.text ?? "").join("");
  const calls = parts
    .filter((part) => part.functionCall?.name)
    .map((part) => ({
      name: part.functionCall?.name ?? "",
      input: part.functionCall?.args ?? {},
    }));
  return { text, calls, usage: geminiUsage(payload) };
}

/** One SDK call. No tools and no second turn: a prompt cannot run the test. */
export async function complete(prompt: string): Promise<Reply> {
  const provider = resolveProvider();
  if (provider === "replay") return replayText(prompt);
  if (provider === "gemini") return completeGemini(prompt);
  return completeAnthropic(prompt);
}

/** One model turn that may request tools. The caller decides whether to answer them. */
export async function completeWithTools(prompt: string, tools: LabTool[]): Promise<ToolReply> {
  const provider = resolveProvider();
  if (provider === "replay") return replayTools(prompt);
  if (provider === "gemini") return completeGeminiWithTools(prompt, tools);
  return completeAnthropicWithTools(prompt, tools);
}
