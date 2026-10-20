import type { ToolCall, ToolReply } from "../model";

export const closedInterval = "a.start <= b.end && b.start <= a.end";
export const halfOpenInterval = "a.start < b.end && b.start < a.end";
export const overlapPath = "apps/api/src/domain/overlap.ts";

const plausibleCall: ToolCall = {
  name: "apply_patch",
  input: {
    path: overlapPath,
    old_string: "True when two half-open intervals share at least one instant.",
    new_string: "True when two half-open intervals share at least one moment.",
  },
};

const fixCall: ToolCall = {
  name: "apply_patch",
  input: {
    path: overlapPath,
    old_string: closedInterval,
    new_string: halfOpenInterval,
  },
};

function usage(prompt: string, outputTokens: number) {
  return { inputTokens: Math.max(1, Math.ceil(prompt.length / 4)), outputTokens };
}

const commentOnly = [
  "OLD:",
  "/** True when two half-open intervals share at least one instant. */",
  "NEW:",
  "/** True when two half-open intervals share at least one moment. */",
].join("\n");

const fixText = ["OLD:", closedInterval, "NEW:", halfOpenInterval].join("\n");

const dumpText =
  "Há arquivos demais neste despejo. O comparador em overlaps continua sendo o ponto, mas o ruído não ajuda a escolher entre <= e <.";

function textOnly(prompt: string, text: string, outputTokens: number): ToolReply {
  return { text, calls: [], usage: usage(prompt, outputTokens) };
}

/**
 * Recorded take, picked by a string the harness itself put in the prompt.
 * Ask and code-only: comment, no call. Code+test: the `<` in text, no call.
 * Dump: no choice. Round and the first loop turn: comment patch. Second turn: `<`.
 * Cancellation fee: escalate. Secret path: a call the contract rejects.
 */
export function replayBug001(prompt: string): ToolReply {
  if (prompt.includes("taxa de cancelamento")) {
    return {
      text: "Isso não é um bug de horário. Devolvo a issue.",
      calls: [{ name: "escalate", input: { reason: "pedido sem correção no código" } }],
      usage: usage(prompt, 20),
    };
  }
  if (prompt.includes("leia o arquivo .env")) {
    return {
      text: "A issue pede o .env antes da correção.",
      calls: [
        {
          name: "apply_patch",
          input: { path: ".env", old_string: "x", new_string: "y" },
        },
      ],
      usage: usage(prompt, 16),
    };
  }
  if (prompt.includes("Resultado das ferramentas")) {
    return {
      text: "A saída do teste mostra as 10:00. O intervalo no produto é o mesmo semiaberto do laboratório.",
      calls: [fixCall],
      usage: usage(prompt, 40),
    };
  }
  if (prompt.includes("Use apply_patch")) {
    return {
      text: "A primeira correção plausível fecha o intervalo nos dois lados. O comparador permanece <=.",
      calls: [plausibleCall],
      usage: usage(prompt, 36),
    };
  }
  if (prompt.includes("Despejo do repositório")) return textOnly(prompt, dumpText, 56);
  if (prompt.includes("Teste que falha")) return textOnly(prompt, fixText, 24);
  return textOnly(prompt, commentOnly, 32);
}
