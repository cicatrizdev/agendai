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
- **Decisão:** `packages/shared/src/ops.ts` define `Run`, `AgentEvent`, `EvalRun`, `Trial`, `Approval` e `Annotation`, espelhando o schema `ops`. Só tipos, sem comportamento. O `EventLog` é escrito no vídeo em que o harness nasce (2.1 na Versão B; decisão 18).

### 12. Schema `ops`: colunas extras
- `eval_runs.git_tag` e `eval_runs.is_baseline`: o placar mostra a tag de cada ponto e o relatório compara com a última baseline.
- `approvals.risk_level = 'high'` exige `tech_lead` (família `db`). A regra vive em `ops.can_decide()` e na policy de update.
- `ops.events` é append-only via trigger, que vale até para a service key.

### 13. Endpoints além da lista da seção 5.3
- `GET /me` (tenant e papel do usuário), `GET /staff` (lista de profissionais), `GET /agenda?date=` (reservas do dia com nomes) e `GET /business-hours` (abre e fecha de cada dia da semana). O front precisa deles para a agenda e o fluxo de reserva.

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

## Versão B — foco no loop

A ementa passou a abrir com quatro pilares numa função só e a tratar estados, parada, feedback e controle como o miolo do curso. O mapa vive em `docs/course-map.md`. As decisões abaixo existem para a gravação não prometer um efeito que o código não mostra.

### 18. Módulo 1 fora do harness
- **Contexto:** o 2.1 precisa de um corte visível entre "um arquivo" e "o produto".
- **Decisão:** o laboratório fica em `aulas/01-pilares/`, com `isOverlapping` e o teste dela, sem importar `apps/agent` e sem Supabase. A primeira correção plausível troca `<` por `<=` e o caso das 10h continua falhando, para o loop do 1.5 ter o que corrigir.
- **Descartada:** construir o laboratório dentro de `apps/agent`. O 2.1 deixaria de ser a entrada no produto.

### 19. O mesmo bug nas duas camadas
- **Contexto:** o `bug-001` do Agendaí é a mesma regra de intervalo semiaberto.
- **Decisão:** o 2.1 reapresenta esse bug de propósito. A frase do vídeo é que o bug não mudou, o harness mudou.
- **Descartada:** um bug didático diferente no laboratório. Perde o callback.

### 20. O placar não sobe em todo vídeo
- **Contexto:** a ementa mede o curso inteiro por taxa de sucesso, custo e iterações. Parte dos vídeos não muda desfecho.
- **Decisão:** o placar é o efeito de 1.5, 2.4, 2.5, 3.3, 3.5, 4.1 e 4.4. O 2.3 mede token e ida ao diretório errado. O 3.1 mostra o estado nomeado no trace de um run parado em "verificando".
- **Descartada:** exibir um delta de acerto em todo checkpoint.

### 21. Três jeitos de parar, em três vídeos
- **Contexto:** limite, `escalate` e circuit breaker dizem "parar" e, se caírem no mesmo vídeo, viram lista.
- **Decisão:** no 3.2 quem para é o harness (oráculo verde ou teto de iterações). No 3.5 quem para é o modelo, pela ferramenta `escalate`, com uma tarefa impossível na suíte. No 4.4 o teto deixa de ser contagem de voltas e passa a ser token, dólar, tempo e rodadas de verificação, lidos do `usage`. Cache de prompt é uma frase no 4.5, porque é o que se repete a cada volta.
- **Descartada:** um vídeo de `ModelRouter`. É feature, não conceito.

### 22. O sensor da volta não é o `pnpm verify`
- **Contexto:** `pnpm verify` faz typecheck, lint, Vitest e `supabase db reset`. Dentro do loop, cada volta leva minutos.
- **Decisão:** o sensor de parada roda o teste da tarefa. `pnpm verify` continua sendo o oráculo do repositório e do `check:tasks`. O 2.4 diz isso em uma frase.
- **Descartada:** chamar `pnpm verify` a cada iteração.

### 23. A janela é uma vista, o estado é o arquivo
- **Contexto:** o 4.5 juntava três estratégias de contexto e três implementações de `StateStore`.
- **Decisão:** só `FileStateStore` (JSON + `STATUS.md`). O vídeo mostra o histórico acumulado piorando e a volta seguinte recomeçando a janela a partir do arquivo. A prova é matar o processo e retomar. Compactar é mencionado e não é implementado.
- **Descartada:** SQLite e `SupabaseStateStore` como vídeos. Três estratégias com o mesmo peso.

### 24. A sala de controle não tem vídeo
- **Contexto:** o 1.1, gravado no repositório final, mostra a sala ao vivo. Durante o curso as páginas ligam quando o dado existe.
- **Decisão:** Placar no 2.5, Custos no 4.4, Execuções e Análise de erros no 5.1 (aí o trace passa a `ops.events`), Aprovações no 6.3. Até lá o console permanece o do M0.
- **Descartada:** ligar a timeline no 2.1. Esse vídeo já carrega o tour do Agendaí, o `break` e o `LLMProvider`.

### 25. Rótulos prontos, e o Checker precisa de um caso que o teste não vê
- **Contexto:** 20 casos no 4.2, 30 traces no 5.1 e 30 rótulos no 5.3 não cabem na gravação. Nos bugs mecânicos do catálogo o Checker só acrescenta custo.
- **Decisão:** os conjuntos vêm no repositório. O vídeo anota três e abre o relatório. O conjunto do Checker inclui casos que passam no teste e erram a issue.
- **Descartada:** rotular ao vivo.

### 26. No 6.2, cortar uma perna
- **Contexto:** sandbox, MCP e injeção de prompt não cabem em dez minutos.
- **Decisão:** a issue pede o `.env`, uma camada bloqueia, e o ataque vira tarefa da regressão. É neste vídeo que os comandos saem da máquina e entram no container sem rede e sem segredo. A allowlist de MCP é o mesmo corte, dito em seguida. O `Dockerfile` já está no M0 e não é depurado ao vivo.
- **Descartada:** um vídeo só de MCP, e depurar rede de container na gravação.

### 27. Módulo 1 em replay; ao vivo é opcional
- **Contexto:** o laboratório dos vídeos 1.2–1.5 é demonstração, não exercício. Uma chave com billing não pode ser pré-requisito do curso. A Anthropic passou a exigir workspace e crédito em chaves novas.
- **Decisão:** `AUTOFIX_PROVIDER` default é `replay`. As respostas do take ficam em `aulas/01-pilares/fixtures/`. Anthropic e Gemini existem como ramo opcional; a sessão [ao-vivo.md](../aulas/01-pilares/ao-vivo.md) avisa que o texto ao vivo é semelhante, não igual. O 2.1 herda replay default / live opcional.
- **Descartada:** Gemini (ou qualquer cota grátis) como pré-requisito do aluno. O curso não depende de cadastro de modelo.

## Versão C — seis módulos, um loop

A vitrine da Alura continua com seis módulos. O que sai é a fábrica. O mapa vive em `docs/course-map.md`. As decisões 18, 19, 22 e 27 continuam válidas. As de 20, 21 e 23–26 descrevem a Versão B e não se implementam.

### 28. Um harness, uma variável por módulo
- **Contexto:** o AutoFix completo (console, webhook, `improve`, máquina de estados, Checker, juiz) é canhão para ensinar o loop. O módulo 1 já fecha o conceito. A ementa vendida pede seis módulos.
- **Decisão:** o mesmo harness do lab sobe para `apps/agent` no 2.1 e não ganha subsystem novo. M1 pilares, M2 mundo (`bug-001` no Agendaí), M3 sensor (teste da tarefa, não `verify`), M4 parada (teto e `escalate`), M5 custo (`usage`), M6 escala (poucas tarefas + `security-001` não lê `.env`). Replay no padrão. 1.1 mostra o Agendaí e o placar do lab, não um console operacional.
- **Descartada:** construir a sala de controle, persistir em `ops.events`, sandbox Docker, HMAC, pass@k, e tratar cada pasta-esqueleto de `apps/agent/src` como aula.
- **Substituída pela 29.** O corte de módulos da Versão C não se grava.

## Versão D — um pilar por módulo, no Agendaí

O mapa vive em `docs/course-map.md`. As decisões 18, 19 e 27 continuam válidas: o laboratório fica fora do harness, o bug das 10:00 é o mesmo nas duas camadas, replay é o padrão. A fábrica da decisão 28 continua de fora.

### 29. Dois a cinco constroem o pilar. Seis é a review
- **Contexto:** sensor, teto, dólar e placar soam como camada interna. Quem desenvolve escreve o ticket, escolhe o arquivo, dá a ferramenta de edição e deixa a falha voltar.
- **Decisão:** M2 prompt, M3 contexto, M4 ferramenta, M5 loop, M6 governança (motivo da parada, caminho permitido, issue que pede o `.env`). Custo é uma frase no 6.2, sem página. O `apps/agent` atual já contém o loop inteiro e precisa ser fatiado antes do 2.1. O módulo 1 não se regrava.
- **Descartada:** manter o módulo 2 como "o mesmo loop, outro arquivo", com ferramenta e `while` já prontos na primeira aula.

### 30. O módulo 2 começa no grok
- **Contexto:** o único laboratório é o módulo 1. Do 2 em diante a resposta tem de ser a CLI já autenticada, senão a aula volta a ser um take.
- **Decisão:** o provider padrão de `apps/agent` é `grok` (`grok --prompt-file`, `--max-turns 1`, `--verbatim`, diretório temporário, sem ferramenta de escrita). A aula 2.1 liga isso e faz o primeiro `ask`. `AUTOFIX_PROVIDER=replay` fica para os testes e para quem não tem a CLI. O laboratório em `aulas/01-pilares` não muda.
- **Descartada:** abrir o módulo 2 com um `ask` em replay e só depois trocar o provider. Dar à CLI a ferramenta de editar o repositório.
- **O corte do módulo 2 foi substituído pela 31.** O provider `grok` continua valendo a partir do módulo 4, quando o script existe.

### 31. Até o módulo 3 é chat. O script nasce no 4
- **Contexto:** `pnpm autofix` aparecia antes da pessoa saber o que o script é. O instrutor e o estudante travavam na mesma pergunta: de onde vem esse comando.
- **Decisão:** módulo 1 é o único laboratório, e já foi gravado. A pasta `aulas/` saiu do repositório. Módulos 2 e 3 são um chat com a CLI e um `AGENTS.md` (prompt, depois contexto). MCP é nomeado como fonte que não é arquivo. Não se cria servidor. O `apps/agent` e o nome `pnpm autofix` entram no módulo 4. M5 é o loop desse script. M6 é a governança.
- **Descartada:** começar o módulo 2 rodando `pnpm autofix ask`. Construir um servidor MCP na aula.
