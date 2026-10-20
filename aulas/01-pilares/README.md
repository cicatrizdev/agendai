# Módulo 1 — Pilares

Laboratório isolado dos vídeos 1.2 a 1.5. É **demonstração**, não exercício para replicar. Não importa `apps/agent` e não precisa de Supabase nem de chave de modelo.

O arquivo é o `isOverlapping` do Agendaí, com o mesmo bug de intervalo do `bug-001`. No vídeo 2.1 esse bug volta dentro do produto. O que muda é o harness.

O padrão é `AUTOFIX_PROVIDER=replay`: `pnpm lab:ask` e os outros comandos devolvem as fixtures do take. Quem quiser ver um modelo ao vivo configura a chave e lê [ao-vivo.md](ao-vivo.md). A resposta ao vivo é semelhante à do vídeo, não idêntica.

| Vídeo | O que entra nesta pasta |
|---|---|
| 1.2 | Prompt vago e prompt-especificação |
| 1.3 | Três contextos, medidos pelo `usage` |
| 1.4 | `apply_patch` e `run_tests`, uma rodada. A correção `<=` ainda falha no caso das 10h |
| 1.5 | Loop curto e mini-placar com cinco rodadas de cada camada |

O vídeo 1.2 compara os dois prompts com `pnpm lab:ask`. Nenhum dos dois roda o teste. O vídeo 1.3 mede três contextos com `pnpm lab:contexts`: só o código, o código com o teste que falha, e um despejo do repositório. A comparação é o `usage`. O vídeo 1.4 roda uma rodada com `pnpm lab:round`: `apply_patch` e `run_tests`, sem segunda chamada. Um patch que continua com `<=` ainda falha nas 10:00.

O vídeo 1.5 fecha o loop com `pnpm lab:loop`. A saída do teste volta no prompt seguinte. Para no verde ou no teto de três voltas. Esse comando escreve em `is-overlapping.ts`. Para devolver o bug:

```bash
git checkout -- aulas/01-pilares/is-overlapping.ts
```

O mini-placar é `pnpm lab:scoreboard`: cinco rodadas de cada camada (prompt, contexto, harness, loop), cada uma numa cópia temporária. A taxa é o que voltar nesta execução. Em replay o número não oscila. Ao vivo, é outra execução.

O `pnpm verify` não executa o teste desta pasta: o bug das 10:00 fica vermelho de propósito, e o oráculo do repositório continua verde.

Do módulo 2 em diante o mesmo bug segue no Agendaí, um pilar por módulo. O mapa está em `docs/course-map.md`.
