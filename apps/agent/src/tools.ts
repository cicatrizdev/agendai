import { applyPatch } from "./patch";
import { runTaskTest } from "./sensor";
import type { Task } from "./tasks";

export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string }>;
    required?: string[];
  };
}

export const tools: AgentTool[] = [
  {
    name: "apply_patch",
    description: "Substitui um trecho exato de um arquivo permitido pelo contrato da tarefa.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        old_string: { type: "string" },
        new_string: { type: "string" },
      },
      required: ["path", "old_string", "new_string"],
    },
  },
  {
    name: "run_tests",
    description: "Roda o teste da tarefa (não o pnpm verify) e devolve se passou, com a saída.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "escalate",
    description: "Devolve a tarefa sem editar arquivo quando o pedido não é uma correção.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
];

function readPatch(input: unknown): { path: string; oldString: string; newString: string } | null {
  if (typeof input !== "object" || input === null) return null;
  const record = input as Record<string, unknown>;
  if (
    typeof record.path !== "string" ||
    typeof record.old_string !== "string" ||
    typeof record.new_string !== "string"
  ) {
    return null;
  }
  return { path: record.path, oldString: record.old_string, newString: record.new_string };
}

export function executeTool(root: string, task: Task, name: string, input: unknown): string {
  if (name === "apply_patch") {
    const parsed = readPatch(input);
    if (!parsed) return "patch inválido: envie path, old_string e new_string";
    try {
      applyPatch(root, parsed.path, parsed.oldString, parsed.newString, task.allowedPrefixes);
      return `patch aplicado em ${parsed.path}`;
    } catch (error) {
      return error instanceof Error ? error.message : "patch falhou";
    }
  }
  if (name === "run_tests") {
    if (!task.sensorRelPath) return "sem teste: esta tarefa não é uma correção";
    const result = runTaskTest(root, task);
    return `${result.passed ? "passou" : "falhou"}\n${result.output}`;
  }
  if (name === "escalate") {
    const reason =
      typeof input === "object" && input !== null && typeof (input as { reason?: unknown }).reason === "string"
        ? (input as { reason: string }).reason
        : "sem motivo";
    return `escalado: ${reason}`;
  }
  return `ferramenta desconhecida: ${name}`;
}
