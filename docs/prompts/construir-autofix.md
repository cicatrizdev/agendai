# Construir o autofix do zero

Duas peças, não uma:

1. **um estado inicial** onde `apps/agent/src` tem só o `cli.ts` de uso (tag `aula-4.1-inicio`);
2. **o prompt** abaixo, colado no chat.

Prompt sozinho não resolve: dentro do repositório final o agente lê `apps/agent/src` e copia. A tag é o que faz o "não leia" ser verdade.

## O estado inicial

```bash
git switch -c meu-autofix aula-4.1-inicio
```

O que existe nessa tag: o Agendaí, o eval, os bugs, o `package.json` do agent com o script `autofix`, e um `cli.ts` que só imprime o uso. Nada de harness.

A forma inicial é a do **4.2**: uma volta. Monta o prompt, chama o provider, aplica no máximo um patch, roda o teste, imprime. **Sem loop.** O `while` nasce no 5.2; se ele vier agora, o 5.1 não tem o que ensinar.

## O prompt da forma inicial

````md
Papel: você constrói o harness do curso, não uma biblioteca. O aluno vai ler este código na tela.

Objetivo: criar o `pnpm autofix` na forma inicial — uma volta.
Uma volta = montar o prompt, chamar o provider, aplicar no máximo um patch, rodar o teste da tarefa, imprimir o resultado. Sem loop, sem retry.

Contexto — leia só estes arquivos:
- evals/tasks/bug-001/task.yaml
- evals/tasks/bug-001/hidden-tests/apps/api/test/hidden/overlap-boundary.test.ts
- apps/api/src/domain/overlap.ts
- apps/api/package.json
- apps/agent/package.json (só os scripts)

Não leia apps/agent/src/** nem o histórico. A solução de referência está fora do seu contexto de propósito.

Crie em apps/agent/src, um conceito por arquivo:
- tasks.ts   — lê o task.yaml: report, prompt, bug, allowed_paths, teste oculto
- patch.ts   — applyToSource e isAllowedPath; recusa `..`, caminho absoluto e prefixo fora do contrato
- sensor.ts  — copia o teste oculto para apps/api/test/hidden/, roda só ele com
               `pnpm exec vitest run` em apps/api, remove depois
- tools.ts   — só `apply_patch` (path, old_string, new_string). Nada de bash, nada de write genérico
- model.ts   — `complete(prompt, tools): Promise<{ text, usage, calls }>`; provider `grok` via spawnSync
               com `--max-turns 1`, `--no-subagents`, `--permission-mode dontAsk`, cwd temporário
- stages.ts  — `runRound`: prompt + uma chamada + tool calls + sensor
- cli.ts     — `pnpm autofix round --task=bug-001`

Restrições:
- Nenhuma dependência nova. Nenhum framework de agente.
- O patch só toca apps/api/src/domain/ e apps/api/test/.
  `.env` tem que sair com `caminho fora do contrato: .env`.
- O sensor roda o teste da tarefa, nunca `pnpm verify`.
- Não edite teste, não edite o produto, não altere evals/.
- Não implemente: loop, retry, teto, escalate, replay, MCP, estado, config, sandbox.
  Isso é 5.x e 6.x.
- Código em inglês, mensagens de tela em português. Funções curtas, fluxo linear.

Formato da resposta: os arquivos completos, um bloco por arquivo, e o diff de package.json.

Critério de parada (pare no primeiro verde):
1. `pnpm --filter @autofix/agent typecheck`
2. `pnpm break --bug=bug-001`
   `pnpm autofix round --task=bug-001`
   → imprime `# modelo`, `# apply_patch` e `# teste` falhando nas 10:00
3. `git diff --stat` só mostra apps/agent/ e package.json
````

O critério 2 é o ponto da aula: a primeira correção plausível fecha o intervalo e **continua errada**. Se o teste ficar verde, o 5.1 perde o material.

## A escada

Um degrau por vídeo. Se o prompt pedir dois de uma vez, o aluno perde o fio.

| Vídeo | O que pedir | Prova |
|---|---|---|
| 5.1 | "adicione `run`: duas voltas fixas. A saída do teste entra no prompt seguinte. Não mude mais nada." | duas chamadas; o segundo prompt contém a falha |
| 5.2 | "troque as duas voltas por `while` até passar ou três. Devolva o motivo da parada." | `run` termina em `passou`; modelo que não corrige termina em `teto` |
| 6.1 | "adicione a tool `escalate`. Se a resposta trouxer `escalate`, não aplique nenhum patch dela." | `run --task=escalate-001` → `escalado`; `git status` limpo |
| 6.2 | "o caminho do patch tem que estar em `contract.allowed_paths`. `.env` é recusado." | `round --task=security-001` → `caminho fora do contrato: .env` |

Comandos de cada prova:

```bash
# 5.1 e 5.2
pnpm break --bug=bug-001
pnpm autofix run --task=bug-001

# 6.1
pnpm autofix run --task=escalate-001

# 6.2
pnpm break --bug=bug-003
pnpm autofix round --task=security-001
```

O 6.2 herda `setup.bug: bug-003` do eval. Sem esse `break`, o teste de cancelamento já está verde e a recusa não prova nada.

## O que não entra

Replay, `--provider`, `--issue`, MCP, sandbox, Checker, `check:tasks`. Cada um é uma frase no curso, não um degrau desta escada. O `--issue` e o `replay` existem na referência porque a aula extra do Linear e o aluno sem CLI precisam deles; não os antecipe.

## Conferência

Só depois de fechar o último degrau:

```bash
git diff aula-4.1-inicio..checkpoint/modulo-4 -- apps/agent
```

Esse diff é a referência. Antes de terminar, ele é a resposta da prova.
