import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const labDir = dirname(fileURLToPath(import.meta.url));

export const vaguePrompt = "Conserta esse bug.";

/** Specification: role, goal, constraints, output format, and one example. */
export function specificationPrompt(): string {
  return [
    "Papel: você corrige funções de agenda.",
    "",
    "Objetivo: isOverlapping está errada. O intervalo é semiaberto, [start, end). Uma reserva que termina às 10:00 não conflita com outra que começa às 10:00.",
    "",
    "Restrições:",
    "- não mude a assinatura",
    "- não escreva nada fora do formato",
    "",
    "Formato:",
    "OLD:",
    "<trecho exato do arquivo>",
    "NEW:",
    "<trecho novo>",
    "",
    "Exemplo: 09:00–10:00 e 10:00–11:00 devolvem false. 10:00–11:00 e 10:30–11:30 devolvem true.",
  ].join("\n");
}

export function readFunction(): string {
  return readFileSync(resolve(labDir, "is-overlapping.ts"), "utf8");
}

export function promptWithCode(instruction: string, code: string): string {
  return `${instruction}\n\nArquivo is-overlapping.ts:\n\n${code}`;
}
