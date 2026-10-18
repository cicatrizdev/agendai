import type Anthropic from "@anthropic-ai/sdk";
import { applyPatch } from "./patch";
import { runTests } from "./run-tests";

export const tools: Anthropic.Tool[] = [
  {
    name: "apply_patch",
    description: "Substitui um trecho exato de is-overlapping.ts.",
    input_schema: {
      type: "object",
      properties: {
        old_string: { type: "string" },
        new_string: { type: "string" },
      },
      required: ["old_string", "new_string"],
    },
  },
  {
    name: "run_tests",
    description: "Roda o teste de isOverlapping e devolve se passou, com a saída.",
    input_schema: { type: "object", properties: {} },
  },
];

interface PatchInput {
  oldString: string;
  newString: string;
}

function readPatch(input: unknown): PatchInput | null {
  if (typeof input !== "object" || input === null) return null;
  const record = input as Record<string, unknown>;
  if (typeof record.old_string !== "string" || typeof record.new_string !== "string") return null;
  return { oldString: record.old_string, newString: record.new_string };
}

export function executeTool(dir: string, name: string, input: unknown): string {
  if (name === "apply_patch") {
    const parsed = readPatch(input);
    if (!parsed) return "patch inválido: envie old_string e new_string";
    try {
      applyPatch(dir, parsed.oldString, parsed.newString);
      return "patch aplicado";
    } catch (error) {
      return error instanceof Error ? error.message : "patch falhou";
    }
  }
  if (name === "run_tests") {
    const result = runTests(dir);
    return `${result.passed ? "passou" : "falhou"}\n${result.output}`;
  }
  return `ferramenta desconhecida: ${name}`;
}
