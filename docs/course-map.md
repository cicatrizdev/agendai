# Mapa do curso

Versão B, foco no loop. Cada tag marca o fim de um vídeo. A tag `aula-X.Y-inicio` é a `-fim` do vídeo anterior. O vídeo 1.1 é gravado no repositório final e não tem tag. Ele mostra o AutoFix e a sala de controle prontos, sem a máquina de estados.

Status: ✅ gravável · ⏳ ainda não implementada.

O placar é o efeito do vídeo só quando a mudança altera desfecho: 1.5, 2.4, 2.5, 3.3, 3.5, 4.1 e 4.4. Nos outros, o efeito é outro (token, estado no trace, custo, rótulo).

| Tag | Vídeo | O que muda | Status |
|---|---|---|---|
| `inicio-curso` | — | Agendaí completo e verde, catálogo de 19 tarefas com testes ocultos e referências, `break`/`restore`, `check:tasks`, schema `ops`, ops-console com dados estáticos, `apps/agent` vazio. O `Dockerfile` da sandbox já está no repositório e só entra em vídeo no 6.2 | ✅ |
| `aula-1.2-fim` | 1.2 | `aulas/01-pilares`: `isOverlapping` com o bug de intervalo. Chamada ao SDK com prompt vago e com prompt-especificação. Sem loop e sem `apps/agent` | ✅ |
| `aula-1.3-fim` | 1.3 | Três chamadas no mesmo arquivo: só o código, código mais o teste que falha, despejo grande. Comparação pelo `usage` | ✅ |
| `aula-1.4-fim` | 1.4 | `apply_patch` e `run_tests`, uma rodada. A primeira correção plausível (`<=`) continua falhando no caso em que uma reserva termina quando a outra começa | ✅ |
| `aula-1.5-fim` | 1.5 | Loop curto: o erro volta, para no verde ou no teto. Mini-placar com cinco rodadas de cada camada (prompt, contexto, harness, loop) | ✅ |
| `aula-2.1-fim` | 2.1 | O mesmo bug, agora no Agendaí. `LLMProvider` (anthropic, replay, mock), trace JSONL, `--record` e `--replay`. Os comandos ainda rodam na máquina | ⏳ |
| `aula-2.2-fim` | 2.2 | `read_file`, `search`, `apply_patch`, `run_command`, e o `read_file` ruim em `tools/_bad/` | ⏳ |
| `aula-2.3-fim` | 2.3 | `AGENTS.md`, `skills/autofix-backend/SKILL.md` e carregador. No contexto entram só `name` e `description`. O efeito medido é token e exploração, não o placar | ⏳ |
| `aula-2.4-fim` | 2.4 | Sensor de parada roda o teste da tarefa. `pnpm verify` continua sendo o oráculo do repositório | ⏳ |
| `aula-2.5-fim` | 2.5 | Runner com reset, 10 tarefas `build`/`bug` e relatório de baseline. A página Placar sai do dado estático | ⏳ |
| `aula-3.1-fim` | 3.1 | Loop vira máquina de estados tipada. Cada transição vai para o trace. Sem persistência | ⏳ |
| `aula-3.2-fim` | 3.2 | Três desfechos decididos pelo harness: convergência, teto de iterações, escalado | ⏳ |
| `aula-3.3-fim` | 3.3 | Hash dos testes, áreas proibidas, graders `fail_to_pass` e `pass_to_pass` | ⏳ |
| `aula-3.4-fim` | 3.4 | Contrato da tarefa e validador de diff, antes do teste | ⏳ |
| `aula-3.5-fim` | 3.5 | Ferramenta `escalate`: quem desiste é o modelo. Tarefas impossíveis entram na suíte | ⏳ |
| `aula-4.1-fim` | 4.1 | `FeedbackBuilder` e regra ESLint com a correção na mensagem | ⏳ |
| `aula-4.2-fim` | 4.2 | Checker com rubrica. 20 casos prontos no repositório, incluindo quem passa no teste e erra a issue. O vídeo anota três | ⏳ |
| `aula-4.3-fim` | 4.3 | `StagnationDetector` pelo hash do diff normalizado, inclusive oscilação | ⏳ |
| `aula-4.4-fim` | 4.4 | Tetos de token, custo, tempo e rodadas de verificação, lidos do `usage`. A página Custos sai do dado estático | ⏳ |
| `aula-4.5-fim` | 4.5 | `FileStateStore` (JSON + `STATUS.md`). A volta seguinte recomeça a janela a partir do arquivo. Prova: matar o processo e retomar. Compactar é uma frase, sem código | ⏳ |
| `aula-5.1-fim` | 5.1 | `autofix annotate`. Traces persistem em `ops.events`. Taxonomia pronta no repositório. Execuções e Análise de erros saem do dado estático | ⏳ |
| `aula-5.2-fim` | 5.2 | Suíte ampliada, casos negativos, graders de invariante, validação pela solução de referência | ⏳ |
| `aula-5.3-fim` | 5.3 | Juiz com rubrica e opção "não sei". 30 rótulos prontos no repositório. Concordância medida | ⏳ |
| `aula-5.4-fim` | 5.4 | pass@k, pass^k e bootstrap. Suítes `capability` e `regression`. GitHub Action comenta o placar | ⏳ |
| `aula-6.1-fim` | 6.1 | Blueprint: preparar, verificar e abrir PR são nós determinísticos; diagnosticar e corrigir são loops | ⏳ |
| `aula-6.2-fim` | 6.2 | Os comandos passam a rodar no container, sem rede e sem segredo. Uma issue que pede o `.env` é bloqueada e vira tarefa da regressão. Allowlist de MCP no mesmo corte | ⏳ |
| `aula-6.3-fim` | 6.3 | Webhook `workflow_run` com HMAC e deduplicação. Aprovações por papel. Família `db` exige `tech_lead`. A página Aprovações sai do dado estático | ⏳ |
| `aula-6.4-fim` = `final` | 6.4 | `autofix improve`: falha recorrente vira guia ou sensor, a suíte compara, abre PR | ⏳ |
