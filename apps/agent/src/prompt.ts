/** M2. The customer report becomes a specification. No tool, no test. */
export function specificationPrompt(report: string): string {
  return [
    "Papel: você corrige a regra de horário do Agendaí.",
    `Objetivo: ${report}`,
    "O intervalo é semiaberto, [start, end). Uma reserva que termina às 10:00 não bloqueia outra que começa às 10:00.",
    "Restrição: não mude a assinatura de overlaps. Não escreva fora do formato.",
    "Formato:",
    "OLD:",
    "<trecho atual>",
    "NEW:",
    "<trecho corrigido>",
    "Exemplo: 09:00–10:00 com 10:00–11:00 devolve false. 10:00–11:00 com 10:30–11:30 devolve true.",
  ].join("\n");
}
