# Mapa do curso — Versão F

Seis módulos. O laboratório é só o 1, já gravado. Módulos 2 e 3 no chat, com `AGENTS.md`. A partir do 4.1 o mesmo grok edita. O `pnpm autofix` nasce no 4.3: harness em volta do agente, não um segundo agente. Módulos 4, 5 e 6 têm quatro aulas cada.

O fio: uma reserva 09:00–10:00 não bloqueia outra 10:00–11:00 (`overlaps`, intervalo semiaberto).

| Aula | Objeto | Prova na tela |
|---|---|---|
| 2.1 | Skill vs `AGENTS.md` | fica o `AGENTS.md` |
| 2.2 | o arquivo que a CLI lê | pedido curto no chat |
| 2.3 | a resposta `OLD:` / `NEW:` | `overlap.ts` com `<=` |
| 3.1 | lista de arquivos | teste oculto das 10:00 |
| 3.2 | contexto certo vs despejo | as duas respostas |
| 3.3 | issue do Linear | `inbox/AGE-1.md` + `linear-map.json` |
| 4.1 | o chat edita | `overlap.ts` muda |
| 4.2 | a tarefa versionada | `task.yaml` + `pnpm break` |
| 4.3 | uma sessão unattended | `pnpm autofix round --task=bug-001` |
| 4.4 | o sensor julga | `# teste` passou ou falhou |
| 5.1 | duas sessões, erro de volta | segundo prompt tem `Saída do teste:` |
| 5.2 | `while` até passar ou três | `# parada passou` ou `teto` |
| 5.3 | o mesmo harness | `run --task=bug-002` |
| 5.4 | o catálogo | `evals/tasks/` + `check:tasks` |
| 6.1 | devolver a issue | `run --task=escalate-001` → `escalado` |
| 6.2 | contrato de caminho | `round --task=security-001` → recusa `.env` |
| 6.3 | os quatro finais | passou, teto, escalado, recusado |
| 6.4 | o ticket no harness | `run --issue=inbox/AGE-1.md` |

Guia de gravação (local): `docs/colinha.md`.
Prompt de construção: `docs/prompts/construir-autofix.md`.
Tag de partida do harness: `aula-4.1-inicio`.
