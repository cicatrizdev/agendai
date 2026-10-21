import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ToolCall, ToolReply } from "./model";
import type { AgentTool } from "./tools";

const SYSTEM = [
  "Você responde um único turno para um harness.",
  "Não edite arquivo, não rode comando e não use ferramenta própria.",
  "Responda só no JSON pedido.",
  "Se o schema tiver calls e a correção couber em apply_patch, preencha path, old_string e new_string.",
  "Se o pedido não for uma correção, use escalate com reason, ou deixe calls vazio.",
].join(" ");

interface GrokCall {
  name?: string;
  path?: string;
  old_string?: string;
  new_string?: string;
  reason?: string;
}

interface GrokEnvelope {
  text?: string;
  structuredOutput?: { text?: string; calls?: GrokCall[] };
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** Ask has no tools, so the schema cannot invent a patch. Round and loop can. */
export function grokSchema(tools: AgentTool[]): Record<string, unknown> {
  const text = { type: "string" };
  if (tools.length === 0) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["text"],
      properties: { text },
    };
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ["text", "calls"],
    properties: {
      text,
      calls: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "path", "old_string", "new_string", "reason"],
          properties: {
            name: { type: "string" },
            path: { type: "string" },
            old_string: { type: "string" },
            new_string: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  };
}

export function grokArgs(promptFile: string, schema: unknown, cwd: string): string[] {
  return [
    "--cwd",
    cwd,
    "--verbatim",
    "--max-turns",
    "1",
    "--no-subagents",
    "--permission-mode",
    "dontAsk",
    "--system-prompt-override",
    SYSTEM,
    "--json-schema",
    JSON.stringify(schema),
    "--output-format",
    "json",
    "--prompt-file",
    promptFile,
  ];
}

function replyText(envelope: GrokEnvelope): string {
  if (typeof envelope.structuredOutput?.text === "string") return envelope.structuredOutput.text;
  if (!envelope.text) return "";
  try {
    const parsed = JSON.parse(envelope.text) as { text?: string };
    if (typeof parsed.text === "string") return parsed.text;
  } catch {
    // Plain text, no schema wrapper.
  }
  return envelope.text;
}

function toCall(call: GrokCall): ToolCall | null {
  if (!call.name) return null;
  if (call.name === "apply_patch") {
    return {
      name: "apply_patch",
      input: {
        path: call.path ?? "",
        old_string: call.old_string ?? "",
        new_string: call.new_string ?? "",
      },
    };
  }
  if (call.name === "escalate") return { name: "escalate", input: { reason: call.reason ?? "" } };
  return { name: call.name, input: {} };
}

export function parseGrokStdout(stdout: string): ToolReply {
  const envelope = JSON.parse(stdout) as GrokEnvelope;
  const calls = (envelope.structuredOutput?.calls ?? [])
    .map(toCall)
    .filter((call): call is ToolCall => call !== null);
  return {
    text: replyText(envelope),
    calls,
    usage: {
      inputTokens: envelope.usage?.input_tokens ?? 1,
      outputTokens: envelope.usage?.output_tokens ?? 1,
    },
  };
}

/** One chat turn. The CLI has no tool that can write the repo. */
export function completeWithGrok(prompt: string, tools: AgentTool[]): ToolReply {
  const cwd = mkdtempSync(join(tmpdir(), "autofix-grok-"));
  const promptFile = join(cwd, "prompt.txt");
  writeFileSync(promptFile, prompt);
  try {
    const result = spawnSync("grok", grokArgs(promptFile, grokSchema(tools), cwd), {
      encoding: "utf8",
      cwd,
    });
    if (result.error && (result.error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("grok não está no PATH. Instale a CLI ou use AUTOFIX_PROVIDER=replay.");
    }
    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "").trim();
      throw new Error(`grok falhou: ${detail || "sem saída"}`);
    }
    return parseGrokStdout(result.stdout);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}
