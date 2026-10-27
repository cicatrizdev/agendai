# Construir o autofix do zero

Duas peças, não uma:

1. **um estado inicial** onde `apps/agent/src` tem só o `cli.ts` de uso (tag `aula-4.1-inicio`);
2. **o prompt** abaixo, colado no chat, a partir da aula **4.3**.

As aulas 4.1 e 4.2 não constroem código: 4.1 libera o chat; 4.2 abre a tarefa versionada.

Prompt sozinho não resolve: dentro do repositório final o agente lê `apps/agent/src` e copia. A tag é o que faz o "não leia" ser verdade.

O grok é o agente. Este programa é o harness: lê a tarefa, chama o grok no repo, julga com o teste oculto, devolve um motivo de parada.

## O estado inicial

```bash
git switch -c meu-autofix aula-4.1-inicio
```

O que existe nessa tag: o Agendaí, o eval, os bugs, o `package.json` do agent com o script `autofix`, e um `cli.ts` que só imprime o uso. Nada de harness.

A forma inicial é a do **4.3**: uma sessão unattended. Lê a task, chama o grok no cwd do repositório (ferramentas dele ligadas), imprime o que ele fez, para. **Sem sensor, sem retry, sem while.** O julgamento nasce no 4.4; o `while` nasce no 5.2.

## O prompt da forma inicial (aula 4.3)

````md
Papel: você constrói o harness do curso, não uma biblioteca. O aluno vai ler este código na tela.

Objetivo: criar o `pnpm autofix round` na forma inicial — uma sessão unattended.
Uma sessão = ler a tarefa, chamar o grok no repositório real, imprimir a saída e o diff, parar.
Sem loop, sem retry, sem copiar teste oculto ainda.

O grok é o agente. Este programa não oferece ferramenta de edição. Não invente apply_patch. Não desligue as ferramentas do grok. Não use cwd temporário para esconder o repo.

Contexto — leia só estes arquivos:
- evals/tasks/bug-001/task.yaml
- evals/tasks/bug-002/task.yaml
- apps/api/package.json
- apps/agent/package.json (só os scripts)

Não leia apps/agent/src/** nem o histórico. A solução de referência está fora do seu contexto de propósito.

Crie em apps/agent/src, um conceito por arquivo:
- tasks.ts   — lê o task.yaml: id, report, prompt, bug, allowed_paths, caminho do teste oculto
- runner.ts  — spawna a CLI `grok` com spawnSync no cwd do repo, `--permission-mode dontAsk`,
               teto baixo de turns (o suficiente para uma sessão), prompt = report + prompt da task.
               Devolve o texto da sessão.
- cli.ts     — `pnpm autofix round --task=bug-001`
               imprime `# modelo`, o diff (`git diff --stat`), `# parada` = `uma sessão. sem segunda chamada.`
               Recusa se o bug da task não estiver em `.autofix/broken.json`.

Restrições:
- Nenhuma dependência nova. Nenhum framework de agente.
- Nenhum caminho de arquivo de produto hardcoded. A task é que aponta o bug e o teste.
- Não edite o produto, não altere evals/, não edite teste.
- Não implemente: sensor, loop, retry, teto, escalate, replay, MCP, estado, sandbox, allowed_paths depois do diff.
  Isso é 4.4, 5.x e 6.x.
- Código em inglês, mensagens de tela em português. Funções curtas, fluxo linear.

Formato da resposta: os arquivos completos, um bloco por arquivo, e o diff de package.json se precisar.

Critério de parada (pare no primeiro verde):
1. `pnpm --filter @autofix/agent typecheck`
2. `pnpm break --bug=bug-001`
   `pnpm autofix round --task=bug-001`
   → imprime `# modelo` e `# parada` uma sessão
3. `git diff --stat` só mostra apps/agent/ e, se o grok editou, o arquivo de domínio da task
````

O critério 2 é o ponto da aula: o grok rodou sozinho. Se o teste das 10:00 já ficou verde, o 4.4 ainda tem o que ensinar — o programa é que imprime `# teste`.

## A escada

Um degrau por vídeo. Se o prompt pedir dois de uma vez, o aluno perde o fio.

| Vídeo | O que pedir | Prova |
|---|---|---|
| 4.4 | "adicione o sensor: copie o teste oculto da task para o caminho espelhado, rode só ele com `pnpm exec vitest run` em apps/api, remova depois. Imprima `# teste` e a saída. Não chame o modelo de novo." | `round --task=bug-001` imprime `# teste` passou ou falhou; o arquivo em `apps/api/test/hidden/` some no `finally` |
| 5.1 | "adicione `run`: duas sessões fixas. A saída do teste entra no prompt seguinte. Não mude mais nada." | duas chamadas quando a primeira falha; o segundo prompt contém `Saída do teste:` |
| 5.2 | "troque as duas sessões por `while` até passar ou três. Devolva o motivo da parada: `passou` ou `teto`." | `run` termina em `passou` ou `teto` |
| 5.3 | (sem prompt de construção) `break --bug=bug-002` e `run --task=bug-002`. Se o runner hardcoded `overlap.ts`, corrija para ler a task. | o mesmo comando, outra pasta em `evals/tasks/` |
| 5.4 | (sem prompt de construção) abra o catálogo e o cabeçalho de `scripts/check-tasks.ts`. | o aluno sai com `pnpm check:tasks --task=bug-001 --skip-db` |
| 6.1 | "se a task tem `expected_outcome: escalate`, ou se o grok devolver a issue sem correção, não mantenha diff. Parada `escalado`." | `run --task=escalate-001` → `escalado`; `git status` limpo |
| 6.2 | "depois da sessão, o diff tem que estar em `contract.allowed_paths`. `.env` é recusado. Parada `recusado`, arquivo devolvido." | `break --bug=bug-003` e `round --task=security-001` → `caminho fora do contrato` se o diff sair do prefixo |
| 6.3 | (sem prompt de construção) nomeie na tela os quatro finais. | `# parada` é `passou`, `teto`, `escalado` ou `recusado` |
| 6.4 | "aceite `--issue=inbox/AGE-1.md`. Resolva `ticket:` por `evals/linear-map.json`. Sem mapa, recuse. O oráculo continua a task." | `run --issue=inbox/AGE-1.md` imprime `# tarefa bug-001 (issue …)` |

Comandos de cada prova:

```bash
# 4.3 e 4.4
pnpm break --bug=bug-001
pnpm autofix round --task=bug-001

# 5.1 e 5.2
pnpm break --bug=bug-001
pnpm autofix run --task=bug-001

# 5.3
pnpm restore
pnpm break --bug=bug-002
pnpm autofix run --task=bug-002

# 6.1
pnpm restore
pnpm autofix run --task=escalate-001

# 6.2
pnpm break --bug=bug-003
pnpm autofix round --task=security-001

# 6.4
pnpm break --bug=bug-001
pnpm autofix run --issue=inbox/AGE-1.md
```

O 6.2 herda `setup.bug: bug-003` do eval. Sem esse `break`, o teste de cancelamento já está verde e a recusa não prova nada.

## O que não entra

Replay, `--provider`, MCP dentro do loop, sandbox, Checker, `apply_patch` nosso, cwd temporário para o grok. Cada um é uma frase no curso, não um degrau desta escada. O `--issue` entra no 6.4. O `replay` existe na referência para o teste do loop e para quem não tem CLI; não o antecipe.

## Conferência

Só depois de fechar o último degrau:

```bash
git diff aula-4.1-inicio..checkpoint/modulo-4 -- apps/agent
```

Esse diff é a referência. Antes de terminar, ele é a resposta da prova.
