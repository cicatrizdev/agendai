# AutoFix Agent Ops

Repositório do curso Alura **"Engenharia de Loops: Arquitetando Agentes de IA Autônomos"**.

- **Agendaí** (`apps/web`, `apps/api`, `supabase/`): SaaS multi-tenant de agendamentos. É o mundo onde o loop trabalha.
- **Loop:** módulo 1 no laboratório. Módulos 2 e 3 no chat, com `AGENTS.md`. O script `pnpm autofix` nasce no módulo 4. Módulos 5 e 6 são o loop e a governança desse script. Não se constrói uma sala de controle.

O vídeo 1.1 mostra o Agendaí e o placar do laboratório. O ops-console do M0 permanece estático e não é o produto do curso.

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
| dev@autofix.test | developer | Sala de controle |
| lead@autofix.test | tech lead | Sala de controle |

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm verify` | typecheck → ESLint → Vitest → `supabase db reset` + `supabase test db`, parando na primeira falha. **Reseta o banco local para o seed.** |
| `pnpm break --bug=<id>` | Injeta um bug do catálogo (`bugs/<id>.patch`) |
| `pnpm restore` | Desfaz o bug injetado |
| `pnpm check:tasks` | Valida todas as tarefas: o bug faz os graders falharem e a solução de referência faz passar. `--task=<id>` roda uma só; `--skip-db` pula o banco |
| `pnpm autofix ask --task=bug-001` | Módulo 4 em diante. Especificação ao grok. Não grava no arquivo |
| `pnpm autofix contexts --task=bug-001` | Módulo 4 em diante. Três contextos. Não grava no arquivo |
| `pnpm autofix round --task=bug-001` | Módulo 4. Uma volta no grok, depois o teste da tarefa. Antes: `pnpm break --bug=bug-001` |
| `pnpm autofix run --task=bug-001` | M5. O grok em loop até o teste passar ou o teto. Antes: `pnpm break --bug=bug-001` |
| `pnpm autofix run --task=escalate-001` | M6. Devolve a issue da taxa sem editar arquivo |
| `pnpm autofix round --task=security-001` | M6. O patch em `.env` é recusado |

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
apps/agent          programa do harness, a partir do módulo 4 (`pnpm autofix`)
apps/ops-console    leftover do M0, dados estáticos; não entra em aula
packages/shared     tipos, schemas Zod, Result, eventos do agente
packages/eslint-rules  regras ESLint customizadas
supabase/           migrações (schemas public e ops), seed e testes pgTAP
bugs/               patches que injetam bugs
evals/              tarefas, suítes e cassetes
infra/sandbox       leftover do M0; não entra em aula
scripts/            verify, break, restore, check:tasks
docs/               decisões e mapa do curso
```

O módulo 1 já foi gravado. O código desse laboratório não está mais no repositório.

Decisões de projeto: [`docs/decisions.md`](docs/decisions.md). Mapa Versão E: [`docs/course-map.md`](docs/course-map.md).
