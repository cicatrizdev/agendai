# O harness do AutoFix, arquivo por arquivo

`apps/agent` é o **objeto de estudo** do curso, não o produto. O produto é o Agendaí. Este documento é o mapa de leitura: o que cada vídeo abre, o que mostrar na tela e o que fica de fora.

## O caminho de uma tarefa

1. `pnpm break --bug=bug-001` injeta a falha (`bugs/bug-001.patch`) e registra o id em `.autofix/broken.json`.
2. `pnpm autofix run --task=bug-001` lê `evals/tasks/bug-001/task.yaml`, monta o prompt e chama o provider.
3. O modelo devolve uma tool call. O harness aplica o patch, roda **o teste da tarefa** e põe a saída no turno seguinte.
4. Para em `passou`, `teto` (três voltas) ou `escalado`.

O `pnpm verify` continua sendo o oráculo do **repositório**. O teste da tarefa é o sensor da **volta**.

## Mapa vídeo → arquivo

| Vídeo | Arquivo | O que mostrar |
|---|---|---|
| 2.1 | `src/prompt.ts` (`specificationPrompt`) e `src/model.ts` (`completeWithTools`) | a frase do cliente vira especificação; o provider é uma função |
| 2.2–2.3 | `AGENT.md` na raiz | as regras que a CLI lê em toda conversa; o arquivo do produto não muda |
| 3.1–3.2 | `src/stages.ts` (`roundPrompt`) | a janela de contexto: código, teste e o despejo como contraste |
| 4.1 | `src/tools.ts`, `src/patch.ts`, `src/cli.ts` | `apply_patch` com `old_string`/`new_string`; o caminho é do contrato |
| 4.2 | `src/stages.ts` (`runRound`) e `src/sensor.ts` | uma chamada, o patch e o teste; sem segunda chamada |
| 5.1 | `src/loop.ts` (`loopPrompt`) | a saída do teste entra no turno seguinte |
| 5.2 | `src/loop.ts` (`runLoop`) | o `while`, o teto de três voltas e os motivos de parada |
| 6.1 | `src/tools.ts` (`escalate`) e `src/loop.ts` (ramo `escalated`) | escalar não aplica patch, mesmo na mesma resposta |
| 6.2 | `src/patch.ts` (`isAllowedPath`) e `evals/tasks/security-001/task.yaml` | `.env` fica fora do contrato; a issue pede o segredo |
| extra (M3) | `src/issue.ts` e `inbox/` | a issue vem do tracker; o oráculo continua no eval |

Ordem de leitura para quem chega agora: `tasks.ts` → `stages.ts` → `sensor.ts` → `loop.ts` → `tools.ts` → `cli.ts`. `model.ts`/`grok.ts` são o provider; `patch.ts` e `issue.ts` são as bordas.

## De onde vem a tarefa

`src/tasks.ts` lê `evals/tasks/<id>/task.yaml`. Não existe catálogo paralelo: o mesmo arquivo que o `check:tasks` valida é o que a aula executa.

| Campo do `Task` | Campo do `task.yaml` |
|---|---|
| `report` | `report` (frase do cliente) |
| `prompt` | `prompt` (como a issue chega) |
| `bug` | `setup.bug` |
| `allowedPrefixes` | `contract.allowed_paths`, sem o `**` |
| `sensorRelPath` / `hiddenSource` | primeiro caminho de `fail_to_pass` |

Só as famílias `bug`, `security` e `escalate` rodam no harness de sala. `build`, `upgrade` e `db` são do `pnpm check:tasks`.

### Issue do tracker

O adapter aceita uma issue exportada com frontmatter. O `ticket:` é resolvido por `evals/linear-map.json` (AGE-1 → bug-001); `task:` funciona direto quando a issue não vem do Linear.

```md
---
ticket: AGE-1
origin: linear
---
Issue AGE-1: "Não consigo marcar às 10h se já tem alguém até as 10h."
```

```bash
pnpm autofix run --issue=inbox/age-1.md
```

A issue fornece **as palavras**; o eval fornece **o oráculo e o contrato**. Sem `task:` nem `ticket:` mapeado, o adapter recusa: uma issue sem tarefa não tem teste oculto nem gabarito.

O MCP do Linear fica no **chat** (módulo 3), não dentro do loop. O harness lê arquivo, sem rede e sem segredo.

## Providers

| Provider | Precisa de quê | Quando usar |
|---|---|---|
| `grok` (padrão) | CLI `grok` logada | aula ao vivo |
| `replay` | nada | testes e gravação |
| `anthropic` / `gemini` | chave no `.env` | opcional, fora do mapa |

```bash
pnpm autofix run --task=bug-001 --provider=replay
```

Toda execução imprime a origem:

```
# tarefa bug-001 (eval) · provider grok
# tarefa bug-001 (issue inbox/abc-1.md) · provider replay
```

O `replay` é um take gravado (`src/fixtures/bug-001.ts`), escolhido por trechos do prompt. É determinístico e serve para teste; não mede capacidade.

## Limites conhecidos

- O harness edita **um arquivo de domínio** (`apps/api/src/domain/overlap.ts`) e roda **uma tarefa por execução**. O `for` sobre várias issues é do operador/chat, não do loop.
- `security-001` herda `setup.bug: bug-003` do eval. O demo do 6.2 começa com `pnpm break --bug=bug-003`.
- `run` grava no arquivo de produto. Se passar, o `.autofix/broken.json` é apagado; para voltar o take use `git checkout -- apps/api/src/domain/overlap.ts`.

## Fora do mapa

Runner de evals com `pass@k`, sandbox, webhook, aprovações, Checker, juiz e cliente MCP dentro do harness. As pastas que sobraram de versões anteriores não são aula.

Exercício opcional do loop: [`exercicios/loop.md`](exercicios/loop.md).
Construir do zero: [`prompts/construir-autofix.md`](prompts/construir-autofix.md) e a tag `aula-4.1-inicio`.
