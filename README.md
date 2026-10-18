# AutoFix Agent Ops

Repositório do curso Alura **"Engenharia de Loops: Arquitetando Agentes de IA Autônomos"**.

- **Agendaí** (`apps/web`, `apps/api`, `supabase/`): SaaS multi-tenant de agendamentos. É o "mundo" onde o agente trabalha.
- **AutoFix Agent Ops** (`apps/agent`, `apps/ops-console`): o agente que mantém o Agendaí e a sala de controle para operá-lo. É construído ao longo do curso.

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
pnpm dev:console                # Sala de controle em http://localhost:5174
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
| `pnpm autofix` | CLI do agente (construída a partir do vídeo 2.1) |

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
apps/agent          harness do AutoFix (vazio no início do curso)
aulas/01-pilares    laboratório do módulo 1 (vazio até o vídeo 1.2)
apps/ops-console    sala de controle (React + Recharts; dados estáticos no início)
packages/shared     tipos, schemas Zod, Result, eventos do agente
packages/eslint-rules  regras ESLint customizadas
supabase/           migrações (schemas public e ops), seed e testes pgTAP
bugs/               patches que injetam bugs
evals/              tarefas, suítes e cassetes
infra/sandbox       imagem Docker onde o agente executa comandos
scripts/            verify, break, restore, check:tasks
docs/               decisões e mapa do curso
```

Decisões de projeto: [`docs/decisions.md`](docs/decisions.md). Tags e vídeos: [`docs/course-map.md`](docs/course-map.md).
