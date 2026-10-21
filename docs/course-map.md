# Mapa do curso

Versão E. Seis módulos. O módulo 1 é o único laboratório. Do 2 ao 3 a pessoa fala com a CLI, como num chat, e escreve o arquivo que ela lê. O programa `pnpm autofix` nasce no módulo 4, quando o chat sozinho não segura a ferramenta.

Cada tag marca o fim de um vídeo. A tag `aula-X.Y-inicio` é a `-fim` do vídeo anterior. O vídeo 1.1 é gravado no repositório do ato e não tem tag: tour do Agendaí e o placar do laboratório.

Status: ✅ gravável · ⏳ ainda não fatiada para a câmera.

| Tag | Vídeo | Módulo | O que a aula faz | Status |
|---|---|---|---|---|
| `inicio-curso` | — | — | Agendaí verde, catálogo de tarefas, `break`/`restore`. Sem `AGENTS.md`. O código de `apps/agent` fica fora da câmera até o módulo 4 | ✅ |
| `aula-1.2-fim` | 1.2 | M1 pilares | Prompt vago e especificação, em replay | ✅ |
| `aula-1.3-fim` | 1.3 | M1 pilares | Três contextos. Comparação pelo tamanho da entrada | ✅ |
| `aula-1.4-fim` | 1.4 | M1 pilares | Uma rodada de ferramenta. As 10:00 continuam vermelhas | ✅ |
| `aula-1.5-fim` | 1.5 | M1 pilares | O erro volta. Mini-placar das quatro camadas | ✅ |
| `aula-2.1-fim` | 2.1 | M2 prompt | Skill contra `AGENTS.md`. A skill só entra quando a tarefa combina. O `AGENTS.md` entra em toda conversa do repositório. A aula fica com o `AGENTS.md` | ⏳ |
| `aula-2.2-fim` | 2.2 | M2 prompt | Cria `AGENTS.md` com papel, objetivo, restrição, formato e o exemplo das 10:00. No chat: leia esse arquivo e o `overlap.ts`. Não edite | ⏳ |
| `aula-2.3-fim` | 2.3 | M2 prompt | A resposta do chat. O arquivo do produto não muda. A pessoa lê os cinco blocos que a CLI obedeceu | ⏳ |
| `aula-3.1-fim` | 3.1 | M3 contexto | O `AGENTS.md` ganha a lista do que ler: `overlap.ts` e o teste das 10:00. O repositório inteiro fica de fora | ⏳ |
| `aula-3.2-fim` | 3.2 | M3 contexto | Duas perguntas no chat: com o teste, e pedindo o repositório inteiro. Um MCP é nomeado como fonte que não é arquivo. Não se cria servidor | ⏳ |
| `aula-4.1-fim` | 4.1 | M4 harness | O chat edita sozinho. Nasce `apps/agent`: `apply_patch` e o teste da tarefa. A CLI não escreve no repo. O nome do script é `pnpm autofix` | ⏳ |
| `aula-4.2-fim` | 4.2 | M4 harness | `pnpm autofix round --task=bug-001`. Uma volta. O harness grava o patch e roda o teste. Sem segunda chamada | ⏳ |
| `aula-5.1-fim` | 5.1 | M5 loop | A saída do teste entra no próximo turno | ⏳ |
| `aula-5.2-fim` | 5.2 | M5 loop | `pnpm autofix run --task=bug-001`. Até o teste passar ou três voltas | ⏳ |
| `aula-6.1-fim` | 6.1 | M6 governança | Passou, três voltas, ou `escalate` na taxa de cancelamento, sem editar | ⏳ |
| `aula-6.2-fim` = `final` | 6.2 | M6 governança | Caminho fora da tarefa não aplica. A issue que pede o `.env` não é lida | ⏳ |

Fora do mapa: sala de controle, webhook, máquina de estados, Checker, juiz, pass@k, sandbox, pull request, `improve`, página de custos, servidor MCP criado na aula.
