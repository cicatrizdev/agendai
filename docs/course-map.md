# Mapa do curso

Versão D. Seis módulos. O módulo 1 mostrou os quatro pilares numa função. Do 2 ao 5 cada pilar vira código no Agendaí, em cima do `bug-001`. O módulo 6 é a review antes de deixar o agente mexer no repositório.

Cada tag marca o fim de um vídeo. A tag `aula-X.Y-inicio` é a `-fim` do vídeo anterior. O vídeo 1.1 é gravado no repositório do ato e não tem tag: tour do Agendaí e o placar do laboratório. Não mostra console nem agente pronto.

Status: ✅ gravável · ⏳ ainda não fatiada para a câmera.

A referência que os comandos executam está na árvore: `apps/agent/src/prompt.ts`, `contexts.ts`, `stages.ts`, `tools.ts`, `loop.ts` e `cli.ts`. O teste que prova cada etapa é `apps/agent/test/stages.test.ts`. A colinha diz o que entra em cada aula. A tag ainda não está cortada, então o status abaixo continua ⏳. O laboratório do módulo 1 não se mexe.

| Tag | Vídeo | Módulo | O que a aula faz | Status |
|---|---|---|---|---|
| `inicio-curso` | — | — | Agendaí completo e verde, catálogo de tarefas, `break`/`restore`, `check:tasks`, `apps/agent` vazio no corte inicial. Schema `ops` e ops-console estático ficam no repositório e não entram em aula | ✅ |
| `aula-1.2-fim` | 1.2 | M1 pilares | `aulas/01-pilares`: prompt vago e prompt-especificação em replay. Ao vivo é opcional ([ao-vivo.md](../aulas/01-pilares/ao-vivo.md)). Sem loop e sem `apps/agent` | ✅ |
| `aula-1.3-fim` | 1.3 | M1 pilares | Três contextos no mesmo arquivo: só o código, código mais o teste que falha, despejo. Comparação pelo tamanho da entrada | ✅ |
| `aula-1.4-fim` | 1.4 | M1 pilares | `apply_patch` e o teste, uma rodada. A correção do comentário continua falhando nas 10:00 | ✅ |
| `aula-1.5-fim` | 1.5 | M1 pilares | O erro volta. Mini-placar das quatro camadas | ✅ |
| `aula-2.1-fim` | 2.1 | M2 prompt | `pnpm break --bug=bug-001`. O relato das 10:00 vira especificação (papel, objetivo, restrição, formato, exemplo), ao lado de `overlaps` | ⏳ |
| `aula-2.2-fim` | 2.2 | M2 prompt | `pnpm autofix ask --task=bug-001`. A resposta aparece. O arquivo não muda | ⏳ |
| `aula-3.1-fim` | 3.1 | M3 contexto | O que entra no prompt: `overlap.ts` e o teste que falha nas 10:00. O despejo do repositório é o contraexemplo | ⏳ |
| `aula-3.2-fim` | 3.2 | M3 contexto | Três chamadas, nada é aplicado. Só o arquivo erra. Arquivo mais teste aponta o `<`. O despejo custa mais e não escolhe | ⏳ |
| `aula-4.1-fim` | 4.1 | M4 ferramenta | `apply_patch` com caminho, `old_string` e `new_string`. O `OLD:` / `NEW:` do laboratório vira chamada | ⏳ |
| `aula-4.2-fim` | 4.2 | M4 ferramenta | Uma volta. O comentário muda, o `<=` fica, as 10:00 seguem vermelhas. Sem segunda chamada | ⏳ |
| `aula-5.1-fim` | 5.1 | M5 loop | A saída do teste entra no prompt seguinte | ⏳ |
| `aula-5.2-fim` | 5.2 | M5 loop | A segunda chamada troca `<=` por `<`. A parada é `passou` | ⏳ |
| `aula-6.1-fim` | 6.1 | M6 governança | Três motivos para parar: o teste passou, estouraram as três voltas, ou `escalate` na issue da taxa de cancelamento, sem editar arquivo | ⏳ |
| `aula-6.2-fim` = `final` | 6.2 | M6 governança | `apply_patch` só nos caminhos da tarefa. `security-001` pede o `.env` e o patch não aplica. Uma frase: a volta também corta quando o token passa do limite | ⏳ |

Fora do mapa: sala de controle, webhook, máquina de estados, `FileStateStore`, Checker, juiz, pass@k, sandbox, pull request, `autofix improve`, página de custos.
