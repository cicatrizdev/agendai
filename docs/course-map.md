# Mapa do curso

Versão C: seis módulos na vitrine, **um harness**. Cada módulo muda uma variável do mesmo loop. A fábrica AutoFix (sala de controle ao vivo, webhook, `improve`, máquina de estados, Checker, juiz, `FileStateStore`) não se constrói.

Cada tag marca o fim de um vídeo. A tag `aula-X.Y-inicio` é a `-fim` do vídeo anterior. O vídeo 1.1 é gravado no repositório do ato e não tem tag: tour do Agendaí e o placar do lab (`pnpm lab:scoreboard`). Não mostra console operacional nem agente pronto.

Status: ✅ gravável · ⏳ ainda não implementada.

O placar é o efeito do vídeo só quando a variável do módulo muda desfecho: 1.5, 2.3, 4.1, 4.2, 5.2 e 6.1.

| Tag | Vídeo | Módulo / variável | O que muda | Status |
|---|---|---|---|---|
| `inicio-curso` | — | — | Agendaí completo e verde, catálogo de tarefas, `break`/`restore`, `check:tasks`, `apps/agent` vazio. Schema `ops` e ops-console estático ficam no M0 e não entram em aula | ✅ |
| `aula-1.2-fim` | 1.2 | M1 pilares | `aulas/01-pilares`: `isOverlapping` com o bug de intervalo. Prompt vago e prompt-especificação em replay. Ao vivo é opcional ([ao-vivo.md](../aulas/01-pilares/ao-vivo.md)). Sem loop e sem `apps/agent` | ✅ |
| `aula-1.3-fim` | 1.3 | M1 pilares | Três chamadas no mesmo arquivo: só o código, código mais o teste que falha, despejo grande. Comparação pelo `usage` | ✅ |
| `aula-1.4-fim` | 1.4 | M1 pilares | `apply_patch` e `run_tests`, uma rodada. A primeira correção plausível (`<=`) continua falhando no caso em que uma reserva termina quando a outra começa | ✅ |
| `aula-1.5-fim` | 1.5 | M1 pilares | Loop curto: o erro volta, para no verde ou no teto. Mini-placar com cinco rodadas de cada camada (prompt, contexto, harness, loop) | ✅ |
| `aula-2.1-fim` | 2.1 | M2 mundo | O mesmo bug, agora no Agendaí (`bug-001`, `overlaps` em `apps/api`). `pnpm break --bug=bug-001`. O harness fino em `apps/agent` nasce aqui. Replay no padrão | ⏳ |
| `aula-2.2-fim` | 2.2 | M2 mundo | Ferramentas: `apply_patch` e o teste da tarefa. Sem `search`, `run_command`, `_bad/`, `AGENTS.md` ou skills | ⏳ |
| `aula-2.3-fim` | 2.3 | M2 mundo | Mini-placar do `bug-001` no produto. A frase do vídeo: o bug não mudou, o arquivo mudou | ⏳ |
| `aula-3.1-fim` | 3.1 | M3 sensor | A volta corre o teste da tarefa (o que o `task.yaml` aponta). `pnpm verify` continua sendo o oráculo do repositório, dito numa frase | ⏳ |
| `aula-3.2-fim` | 3.2 | M3 sensor | Com o bug aplicado, a suíte existente fica verde e o teste oculto falha. O sensor é o oculto | ⏳ |
| `aula-4.1-fim` | 4.1 | M4 parada | Dois desfechos no mesmo loop, decididos pelo harness: passou ou teto de iterações | ⏳ |
| `aula-4.2-fim` | 4.2 | M4 parada | Ferramenta `escalate` e fixture `escalate-001`. Quem desiste é o modelo. Não é produto de governança | ⏳ |
| `aula-5.1-fim` | 5.1 | M5 custo | `usage` da fixture e [config/pricing.json](../config/pricing.json). Sem página Custos | ⏳ |
| `aula-5.2-fim` | 5.2 | M5 custo | Teto lido do `usage`: a volta para quando o token (ou o dólar da tabela) estoura | ⏳ |
| `aula-6.1-fim` | 6.1 | M6 escala | O mesmo binário em quatro ou cinco tarefas (`bug-001`, um `build`, um `upgrade`, `security-001`). Relatório de taxa | ⏳ |
| `aula-6.2-fim` = `final` | 6.2 | M6 escala | `security-001`: o loop não lê `.env`. Sem container, webhook, PR ou `improve` | ⏳ |

Fora do mapa (Versão B, não se implementa): máquina de estados, `FileStateStore`, Checker, juiz, pass@k, sandbox Docker, webhook HMAC, aprovações, `autofix improve`, páginas do ops-console saindo do estático.
