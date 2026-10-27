# O harness do AutoFix, arquivo por arquivo

`apps/agent` é o **objeto de estudo** do curso, não o produto. O produto é o Agendaí. O grok é o agente. Este programa é o harness em volta dele. Mapa de aulas: [`course-map.md`](course-map.md). Prompt de construção: [`prompts/construir-autofix.md`](prompts/construir-autofix.md).

O código em `apps/agent` no `master` ainda é a forma antiga (grok de mãos atadas + `apply_patch`). A forma da Versão F nasce da tag `aula-4.1-inicio` com o prompt de construção. Este documento descreve o caminho da aula, não o tree atual.

## O caminho de uma tarefa

1. `pnpm break --bug=bug-001` injeta a falha (`bugs/bug-001.patch`) e registra o id em `.autofix/broken.json`.
2. `pnpm autofix run --task=bug-001` lê `evals/tasks/bug-001/task.yaml` e chama o grok no repositório, com as ferramentas dele.
3. O sensor copia o teste oculto, roda só ele, remove. Se falhou, a saída entra na sessão seguinte.
4. Para em `passou`, `teto` (três sessões), `escalado` ou `recusado`.

O `pnpm verify` continua sendo o oráculo do **repositório**. O teste da tarefa é o sensor da **volta**.

## Mapa vídeo → o que abrir

| Vídeo | Abrir | O que mostrar |
|---|---|---|
| 2.1–2.3 | `AGENT.md` na raiz | as regras que a CLI lê; o arquivo do produto não muda |
| 3.1–3.2 | `AGENT.md` + o teste oculto | a janela de contexto contra o despejo |
| 3.3 | `evals/linear-map.json` e `inbox/` | o ticket dá as palavras; o eval dá o oráculo |
| 4.1 | o chat, `overlap.ts` | o grok edita, com as ferramentas dele |
| 4.2 | `evals/tasks/bug-001/` | yaml, teste oculto, `pnpm break` |
| 4.3 | `src/tasks.ts`, `src/runner.ts`, `src/cli.ts` | uma sessão unattended; o grok grava |
| 4.4 | `src/sensor.ts` | o teste da tarefa julga; `# teste` |
| 5.1 | `src/loop.ts` | a saída do teste entra na sessão seguinte |
| 5.2 | `src/loop.ts` (`while`) | teto de três; `passou` ou `teto` |
| 5.3 | `evals/tasks/bug-002/` | o mesmo comando, outra task |
| 5.4 | `evals/tasks/`, `evals/suites/`, `scripts/check-tasks.ts` | o catálogo é o experimento |
| 6.1 | `evals/tasks/escalate-001/` | devolver a issue; diff vazio |
| 6.2 | `evals/tasks/security-001/` e o contrato da task | `.env` recusado |
| 6.3 | a linha `# parada` | passou, teto, escalado, recusado |
| 6.4 | `src/issue.ts` e `inbox/` | `--issue`; o oráculo continua no eval |

Ordem de leitura para quem constrói na Versão F: `tasks.ts` → `runner.ts` → `sensor.ts` → `loop.ts` → `cli.ts`. `issue.ts` entra no 6.4.

## De onde vem a tarefa

`src/tasks.ts` lê `evals/tasks/<id>/task.yaml`. Não existe catálogo paralelo: o mesmo arquivo que o `check:tasks` valida é o que a aula executa.

| Campo do `Task` | Campo do `task.yaml` |
|---|---|
| `report` | `report` (frase do cliente) |
| `prompt` | `prompt` (como a issue chega) |
| `bug` | `setup.bug` |
| `allowedPrefixes` | `contract.allowed_paths`, sem o `**` |
| `sensorRelPath` / `hiddenSource` | primeiro caminho de `fail_to_pass` |

Só as famílias `bug`, `security` e `escalate` rodam no harness de sala. `build`, `upgrade` e `db` são do `pnpm check:tasks` (aula 5.4).

### Issue do tracker

O adapter aceita uma issue exportada com frontmatter. O `ticket:` é resolvido por `evals/linear-map.json` (AGE-1 → bug-001); `task:` funciona direto quando a issue não vem do Linear. Entra na aula 6.4.

```md
---
ticket: AGE-1
origin: linear
---
Issue AGE-1: "Não consigo marcar às 10h se já tem alguém até as 10h."
```

```bash
pnpm autofix run --issue=inbox/AGE-1.md
```

A issue fornece **as palavras**; o eval fornece **o oráculo e o contrato**. Sem `task:` nem `ticket:` mapeado, o adapter recusa: uma issue sem tarefa não tem teste oculto nem gabarito.

O MCP do Linear fica no **chat** (módulo 3), não dentro do loop. O harness lê arquivo, sem rede e sem segredo.

## Providers

| Provider | Precisa de quê | Quando usar |
|---|---|---|
| `grok` (padrão) | CLI `grok` logada | aula ao vivo |
| `replay` | nada | testes e quem grava sem CLI |

```bash
pnpm autofix run --task=bug-001 --provider=replay
```

Toda execução imprime a origem:

```
# tarefa bug-001 (eval) · provider grok
# tarefa bug-001 (issue inbox/AGE-1.md) · provider grok
```

O `replay` é um take gravado, escolhido por trechos do prompt. É determinístico e serve para teste; não mede capacidade. Na Versão F ele não é o caminho pedagógico.

## Limites conhecidos

- Uma execução, uma tarefa. O `for` sobre o catálogo é o `check:tasks` (aula 5.4), não o loop.
- O grok da sessão usa as ferramentas dele. O harness não oferece `apply_patch`.
- Nenhum caminho de produto hardcoded: a 5.3 (`bug-002`) quebra o runner se ele só conhece `overlap.ts`.
- `security-001` herda `setup.bug: bug-003` do eval. O demo do 6.2 começa com `pnpm break --bug=bug-003`.
- `run` grava no arquivo de produto. Se passar, o `.autofix/broken.json` é apagado; para voltar o take use `git checkout` no arquivo que a task tocou.

## Fora do mapa

Runner de evals com `pass@k`, sandbox, webhook, aprovações, Checker, juiz, `apply_patch` nosso e cliente MCP dentro do harness.

Exercício opcional do loop: [`exercicios/loop.md`](exercicios/loop.md).
Construir do zero: [`prompts/construir-autofix.md`](prompts/construir-autofix.md) e a tag `aula-4.1-inicio`.
