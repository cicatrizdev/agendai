# AutoFix Agent Ops

Repositório do curso Alura **"Engenharia de Loops: Arquitetando Agentes de IA Autônomos"**.

- **Agendaí** (`apps/web`, `apps/api`, `supabase/`): SaaS multi-tenant de agendamentos. É o mundo onde o loop trabalha.
- **Loop:** módulo 1 no laboratório. Módulos 2 e 3 no chat, com `AGENTS.md`. A partir do 4.1 o mesmo grok edita. O script `pnpm autofix` nasce no 4.3: harness em volta do agente. Módulos 4, 5 e 6 têm quatro aulas cada. Não se constrói uma sala de controle.

O vídeo 1.1 mostra o Agendaí.

## Pré-requisitos

- Node 24 (`.nvmrc`) e Corepack
- Docker **20.10.10 ou mais novo** (versões anteriores bloqueiam o Postgres do Supabase via seccomp)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

## Setup do zero

```bash
nvm install && nvm use          # Node 24
corepack enable                 # pnpm na versão fixada em package.json
pnpm install
supabase start                  # Postgres, Auth, REST e Realtime locais
cp .env.example .env            # preencha as chaves com a saída de `supabase status`
pnpm verify                     # o oráculo: tem que terminar verde
pnpm dev:api                    # API em http://localhost:3333
pnpm dev:web                    # Agendaí em http://localhost:5173
```

Usuários do seed (senha `agendai123`):

| E-mail | Papel | Estabelecimento |
|---|---|---|
| ana@belavista.test | owner | Salão Bela Vista (São Paulo) |
| bruno@belavista.test | staff | Salão Bela Vista (São Paulo) |
| carla@alfama.test | owner | Estúdio Alfama (Lisboa) |
| diogo@alfama.test | staff | Estúdio Alfama (Lisboa) |

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm verify` | typecheck → ESLint → Vitest → `supabase db reset` + `supabase test db`, parando na primeira falha. **Reseta o banco local para o seed.** |
| `pnpm break --bug=<id>` | Injeta um bug do catálogo (`bugs/<id>.patch`) |
| `pnpm restore` | Desfaz o bug injetado |
| `pnpm check:tasks` | Valida todas as tarefas: o bug faz os graders falharem e a solução de referência faz passar. `--task=<id>` roda uma só; `--skip-db` pula o banco |
| `pnpm autofix round --task=bug-001` | 4.3/4.4. Uma sessão unattended no grok, depois o teste da tarefa. Antes: `pnpm break --bug=bug-001` |
| `pnpm autofix run --task=bug-001` | 5.1/5.2. Sessões até o teste passar ou o teto. Antes: `pnpm break --bug=bug-001` |
| `pnpm autofix run --task=bug-002` | 5.3. O mesmo harness, outra tarefa |
| `pnpm autofix run --issue=inbox/AGE-1.md` | 6.4. A issue mapeia para uma tarefa; o eval continua sendo o oráculo |
| `pnpm autofix run --task=escalate-001` | 6.1. Devolve a issue da taxa sem editar arquivo |
| `pnpm autofix round --task=security-001` | 6.2. Diff em `.env` é recusado. Antes: `pnpm break --bug=bug-003` |
| `--provider=replay` | Em qualquer `autofix`: roda sem CLI logada |

O mapa vídeo → arquivo está em [`docs/agent.md`](docs/agent.md).

## Construir o harness do zero

A tag `aula-4.1-inicio` tem só o `cli.ts` de uso. O guia [`docs/prompts/construir-autofix.md`](docs/prompts/construir-autofix.md) traz o prompt da forma inicial (uma sessão unattended, sem sensor e sem loop) e a escada dos vídeos 4.4 a 6.4. A implementação de referência fica em `checkpoint/modulo-4`.

```bash
git switch -c meu-autofix aula-4.1-inicio
```

Exercício opcional depois do 5.2: [`docs/exercicios/loop.md`](docs/exercicios/loop.md).

## Catálogo de tarefas

Cada tarefa fica em `evals/tasks/<id>/`: `task.yaml`, testes ocultos em `hidden-tests/` (espelhando os caminhos do repositório) e, quando não é o patch reverso de um bug, `reference.patch`.

| Família | Tarefas | Oráculo |
|---|---|---|
| `build` | build-001 a build-004 | `pnpm verify` |
| `bug` | bug-001 a bug-005 | testes ocultos (fail-to-pass) + suíte existente (pass-to-pass) |
| `upgrade` | upgrade-001 (Zod), 002 (TanStack Query), 003 (React Router) | `pnpm verify` + versão major |
| `db` | db-001 a db-003 | pgTAP ocultos + `pnpm verify`; exige aprovação de tech lead |
| `escalate` | escalate-001, escalate-002 | o agente escala sem alterar código |
| `security` | security-001, security-002 | nenhuma ação proibida |

Suítes em `evals/suites/`: `capability`, `regression` e `security`.

## Estrutura

```
apps/web            Agendaí (React + Vite + TanStack Query + React Router)
apps/api            Agendaí API (Fastify; regras de negócio puras em src/domain)
apps/agent          harness, a partir do módulo 4 (`pnpm autofix`)
packages/shared     tipos, schemas Zod, Result
packages/eslint-rules  regras ESLint customizadas
supabase/           migrações (schema public), seed e testes pgTAP
bugs/               patches que injetam bugs
evals/              tarefas e suítes
scripts/            verify, break, restore, check:tasks
docs/               decisões e mapa do curso
```

O módulo 1 já foi gravado. O código desse laboratório não está mais no repositório.

Decisões de projeto: [`docs/decisions.md`](docs/decisions.md). Mapa Versão F: [`docs/course-map.md`](docs/course-map.md).
