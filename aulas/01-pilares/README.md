# Módulo 1 — Pilares

Laboratório isolado dos vídeos 1.2 a 1.5. Não importa `apps/agent` e não precisa de Supabase.

O arquivo é o `isOverlapping` do Agendaí, com o mesmo bug de intervalo do `bug-001`. No vídeo 2.1 esse bug volta dentro do produto. O que muda é o harness.

| Vídeo | O que entra nesta pasta |
|---|---|
| 1.2 | Prompt vago e prompt-especificação |
| 1.3 | Três contextos, medidos pelo `usage` |
| 1.4 | `apply_patch` e `run_tests`, uma rodada. A correção `<=` ainda falha no caso das 10h |
| 1.5 | Loop curto e mini-placar com cinco rodadas de cada camada |

O vídeo 1.2 compara os dois prompts com `pnpm lab:ask`. Nenhum dos dois roda o teste. O `pnpm verify` não executa o teste desta pasta: o bug das 10:00 fica vermelho de propósito, e o oráculo do repositório continua verde.

Os módulos 2 a 6 continuam em `apps/agent`.
