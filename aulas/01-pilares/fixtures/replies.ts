import type { Reply, ToolCall, ToolReply } from "../model";

export const closedInterval = "a.start <= b.end && b.start <= a.end";
export const halfOpenInterval = "a.start < b.end && b.start < a.end";

/** 1.2 vago: sem formato, não dá para aplicar. */
export const vagueText =
  "O intervalo parece fechado demais. Eu trocaria o comparador, ou somaria um milissegundo no fim. Sem olhar o teste, qualquer um dos dois serve.";

/** 1.2 especificação / 1.3 código / placar prompt: tem OLD/NEW, não corrige as 10h. */
export const formattedButWrongText = [
  "OLD:",
  "/** True when the two ranges share at least one instant. */",
  "NEW:",
  "/** True when the two ranges share at least one moment. */",
].join("\n");

/** 1.3 código+teste / placar contexto: o teste das 10h pede o semiaberto. */
export const formattedFixText = ["OLD:", closedInterval, "NEW:", halfOpenInterval].join("\n");

export const dumpText =
  "Há arquivos demais neste despejo. O comparador em isOverlapping continua sendo o ponto, mas o ruído em volta não ajuda a escolher entre <= e <.";

export const plausibleCall: ToolCall = {
  name: "apply_patch",
  input: { old_string: "at least one instant", new_string: "at least one moment" },
};

export const fixCall: ToolCall = {
  name: "apply_patch",
  input: { old_string: closedInterval, new_string: halfOpenInterval },
};

export const roundText =
  "A primeira correção plausível fecha o intervalo nos dois lados. apply_patch troca o comentário; o comparador permanece <=.";

export const loopFixText =
  "A saída do teste mostra as 10:00. O intervalo é semiaberto: o fim de uma reserva não ocupa o começo da seguinte.";

export function usageFor(prompt: string, outputTokens: number): Reply["usage"] {
  return { inputTokens: Math.max(1, Math.ceil(prompt.length / 4)), outputTokens };
}

export function textReply(prompt: string, text: string, outputTokens: number): Reply {
  return { text, usage: usageFor(prompt, outputTokens) };
}

export function toolReply(
  prompt: string,
  text: string,
  calls: ToolCall[],
  outputTokens: number,
): ToolReply {
  return { text, calls, usage: usageFor(prompt, outputTokens) };
}

/** Picks the recorded 1.2 / 1.3 reply from distinctive strings already in the prompts. */
export function replayText(prompt: string): Reply {
  if (prompt.includes("Conserta esse bug.")) return textReply(prompt, vagueText, 48);
  if (prompt.includes("Teste que falha")) return textReply(prompt, formattedFixText, 24);
  if (prompt.includes("Despejo do repositório")) return textReply(prompt, dumpText, 56);
  return textReply(prompt, formattedButWrongText, 32);
}

/** 1.4: uma rodada com <=. 1.5: a segunda volta vê o erro e aplica <. */
export function replayTools(prompt: string): ToolReply {
  if (prompt.includes("Resultado das ferramentas")) {
    return toolReply(prompt, loopFixText, [fixCall], 40);
  }
  return toolReply(prompt, roundText, [plausibleCall], 36);
}
