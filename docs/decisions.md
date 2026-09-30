# Decisões

Uma entrada curta por decisão: contexto, decisão, alternativa descartada.

## M0 — Repositório inicial

### 1. Versões de runtime e ferramentas
- **Contexto:** a especificação pede Node LTS ativo e TypeScript `strict`.
- **Decisão:** Node 24 (LTS ativo em set/2026), pnpm 10.34 via Corepack, TypeScript 6.0, ESLint 10, Vite 8, Vitest 5, React 19.
- **Descartada:** TypeScript 7 (versão nativa em Go). O `typescript-eslint` 8.71 só suporta `typescript <6.1`.

### 2. Versões iniciais das tarefas de upgrade e quebras verificadas
Cada upgrade foi executado de verdade numa cópia do repositório (é o que o `check:tasks` repete) e as quebras abaixo foram observadas, conferidas nos guias oficiais de migração de cada biblioteca.

| Tarefa | De → Para | Quebras que o upgrade provoca |
|---|---|---|
| `upgrade-001` | `zod` 3.25.76 → 4.x (monorepo inteiro) | **Compilação:** o parâmetro `required_error` deixou de existir (usar `error`); `ZodError.errors` foi removido (usar `.issues`). **Runtime:** `z.string().uuid()` passou a validar a RFC 9562 estritamente e rejeita os ids do seed (ex.: `d0000000-0000-0000-0000-000000000001`), quebrando um teste do `shared`; a correção é `z.guid()`. |
| `upgrade-002` | `@tanstack/react-query` 4.44 → 5.x (`apps/web`) | **Compilação:** fim das assinaturas posicionais (`useQuery(key, fn, opts)`, `useMutation(fn, opts)`, `invalidateQueries(key)`), `isLoading` → `isPending` em mutações, `keepPreviousData` → `placeholderData: keepPreviousData`, `isPreviousData` → `isPlaceholderData`, `cacheTime` → `gcTime`. |
| `upgrade-003` | `react-router-dom` 6.30 → 7.x (`apps/web`) | **Compilação e runtime:** `json` foi removido (usar `data`), e o teste de login falha com `json is not a function`. **Compilação:** o `RouterProvider` não aceita mais a prop `future`, e as flags `v7_*` viraram o comportamento padrão. |

- Fontes conferidas: guia de migração do Zod 4 (https://zod.dev/v4/changelog), guia de migração do TanStack Query v5 (https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5) e o CHANGELOG do React Router 7.0.0 ("Remove the deprecated `json` utility", "Remove `future.v7_startTransition` flag").
- O `apps/ops-console` também usa React Router 6, mas fica fora do `upgrade-003`: a tarefa é só no `apps/web`, e o grader `dependency_major` recebe `workspace: apps/web`.
- As soluções de referência de upgrade (`reference.patch`) contêm só código. O `check:tasks` sobe a versão com `pnpm up` e depois aplica o patch, o que evita versionar diffs de lockfile que envelhecem rápido.

### 3. Ids do seed não são UUIDs RFC válidos
- **Contexto:** ids legíveis (`a000…01` para usuários, `b000…` para tenants etc.) facilitam os vídeos.
- **Decisão:** manter os ids legíveis. O banco aceita (o tipo `uuid` do Postgres não valida variante), e isso vira uma quebra real e didática no `upgrade-001`.
- **Descartada:** gerar UUIDs v4 aleatórios, que ficam ilegíveis na tela.

### 4. O `pnpm verify` reseta o banco local
- **Contexto:** o oráculo precisa testar as migrações *da árvore atual*. O `supabase test db` sozinho testa o que já estiver aplicado.
- **Decisão:** o passo de banco roda `supabase db reset` seguido de `supabase test db`. Os dados locais voltam ao seed a cada `verify`.
- **Descartada:** só `supabase test db`, que deixaria bugs de migração passarem despercebidos.

### 5. Testes da API rodam em UTC
- **Contexto:** o `bug-002` (horário comercial no fuso do servidor) depende do fuso do processo.
- **Decisão:** o `vitest.config.ts` da API fixa `TZ=UTC`, como um servidor de produção. Os testes existentes de horário usam Lisboa no inverno (UTC+0), onde o bug não aparece. A lacuna é intencional; o teste oculto usa Lisboa no verão e São Paulo.
- **Descartada:** depender do fuso da máquina, que faria o resultado variar entre o notebook e o container.

### 6. Bugs da família `bug` são invisíveis para a suíte existente
- **Contexto:** a tarefa exige que o agente escreva um teste que reproduz o bug.
- **Decisão:** os testes existentes não cobrem os casos-limite dos bugs (intervalos que se tocam, reserva cancelada na disponibilidade, empate no cursor etc.). O `check:tasks` prova isso: com o bug aplicado, o `verify` continua verde (pass-to-pass) e os testes ocultos falham.

### 7. Testes ocultos espelham os caminhos do repositório
- **Decisão:** `evals/tasks/<id>/hidden-tests/` tem a mesma estrutura da raiz (ex.: `hidden-tests/apps/api/test/hidden/x.test.ts`). O grader copia a árvore para o worktree depois do trial, sem regra de destino implícita. Os testes Vitest ficam em `apps/*/test/hidden/`; os pgTAP, em `supabase/tests/9xx_hidden_*.sql`.

### 8. Tarefas de banco: bug, feature e o status `no_show`
- **Contexto:** o domínio da seção 5.1 já tem `no_show`, mas o `db-003` pede para adicioná-lo. E o `db-001` é uma feature nova, sem patch reverso.
- **Decisão:** a `main` tem `no_show` com a regra "só owner marca" (via policy `with check`). O `bugs/db-003.patch` remove os dois, então o mecanismo continua uniforme (solução = patch reverso). O `db-001` usa `reference.patch` com migração e teste pgTAP. O seed não tem reservas `no_show`, para o `db-003` não quebrar o `db reset`.

### 9. `check:tasks` roda numa cópia descartável, não num git worktree
- **Contexto:** `git worktree` só enxerga o que está commitado.
- **Decisão:** o script copia os arquivos rastreados e não ignorados para um diretório temporário, faz `git init` e um commit, roda `pnpm install --prefer-offline` e reseta com `git reset --hard && git clean -fd` entre cenários. Dá para validar mudanças antes do commit, sem tocar na árvore de trabalho.
- **Flag `--skip-db`:** pula os passos que precisam do Supabase local e reporta as checagens de banco como "puladas". Serve para iterar rápido; o critério de aceite é a execução completa.

### 10. Trials da família `db` rodam em série
- **Contexto:** há uma única instância Supabase local (um `project_id`).
- **Decisão:** trials e checagens de banco rodam em série. É mais lento, mas evita um reset de banco apagar os dados de outro trial no meio da execução.
- **Descartada:** um Supabase por trial (portas e containers dinâmicos), caro demais para rodar localmente.

### 11. Tipos do schema `ops` e `AgentEvent` já no M0
- **Contexto:** o console do M0 tem dados estáticos, que precisam de forma.
- **Decisão:** `packages/shared/src/ops.ts` define `Run`, `AgentEvent`, `EvalRun`, `Trial`, `Approval` e `Annotation`, espelhando o schema `ops`. Só tipos, sem comportamento, então o vídeo 1.2 continua escrevendo o `EventLog`.

### 12. Schema `ops`: colunas extras
- `eval_runs.git_tag` e `eval_runs.is_baseline`: o placar mostra a tag de cada ponto e o relatório compara com a última baseline.
- `approvals.risk_level = 'high'` exige `tech_lead` (família `db`). A regra vive em `ops.can_decide()` e na policy de update.
- `ops.events` é append-only via trigger, que vale até para a service key.

### 13. Endpoints além da lista da seção 5.3
- `GET /me` (tenant e papel do usuário), `GET /staff` (lista de profissionais) e `GET /agenda?date=` (reservas do dia com nomes). O front precisa deles para a agenda e o fluxo de reserva.

### 14. Integridade no banco
- FKs compostas `(id, tenant_id)` garantem que serviço, profissional e cliente de uma reserva são do mesmo tenant.
- A constraint `exclude using gist` com `tstzrange(..., '[)')` impede sobreposição de reservas `confirmed` mesmo com requisições concorrentes, com o mesmo intervalo semiaberto do domínio.

### 15. Regras ESLint importadas com extensão `.ts`
- **Contexto:** o `eslint.config.js` importa o plugin direto do código-fonte e o Node 24 remove os tipos nativamente.
- **Decisão:** só `packages/eslint-rules` usa imports com `.ts`. O resto do monorepo usa imports sem extensão (resolvidos por Vite/tsx).

### 16. Guarda contra "corrigir o teste" no `build-004`
- A tarefa é de build (oráculo `verify`), mas tem um teste oculto que fixa a regra de produto (passo de 15 min). Assim, trocar o teste para 30 min não resolve a tarefa.

### 17. Pré-requisito: Docker ≥ 20.10.10
- O perfil seccomp do Docker 20.10.8 bloqueia syscalls usadas pelas imagens atuais do Supabase (o Postgres falha com `Operation not permitted` no `initdb`). Documentado no README.
