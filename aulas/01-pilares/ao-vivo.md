# Ao vivo (opcional)

O curso fecha em replay. Esta sessão é para quem quer ver um modelo responder de verdade. Não é exercício avaliado.

O modelo **não devolve o mesmo texto duas vezes**. Compare a camada, não o parágrafo. Se a API recusar (saldo, 429, workspace), volte para `AUTOFIX_PROVIDER=replay`.

## Onde configurar

1. Copie `.env.example` para `.env` se ainda não tiver o arquivo.
2. Escolha o provedor e a chave. IDs de modelo ficam só no `.env`.

```bash
AUTOFIX_PROVIDER=anthropic   # ou gemini
AUTOFIX_MODEL_FAST=
AUTOFIX_MODEL_STRONG=
```

### Anthropic

- Chave: [API keys](https://platform.claude.com/settings/keys)
- Se a chave não estiver ligada a um workspace: copie o ID em [Workspaces](https://platform.claude.com/settings/workspaces) para `ANTHROPIC_WORKSPACE_ID`, ou crie uma chave já escopada.
- Se a conta exigir crédito: [Plans & Billing](https://platform.claude.com/settings/billing)

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_WORKSPACE_ID=
```

### Gemini

Cota grátis no [Google AI Studio](https://aistudio.google.com/app/apikey), sem cartão.

```bash
AUTOFIX_PROVIDER=gemini
GEMINI_API_KEY=
```

## O que rodar

Os mesmos comandos do vídeo:

```bash
pnpm lab:ask
pnpm lab:contexts
pnpm lab:round
pnpm lab:loop
pnpm lab:scoreboard
```

`lab:loop` escreve em `is-overlapping.ts`. Para devolver o bug:

```bash
git checkout -- aulas/01-pilares/is-overlapping.ts
```

## Semelhante, não igual

| Vídeo | O que permanece | O que muda |
|---|---|---|
| 1.2 | O prompt vago continua mais frouxo que a especificação. O formato `OLD:`/`NEW:` pode aparecer ou não. | O texto de cada resposta. |
| 1.3 | O `usage` de input cresce do código para o despejo. | Os números não vão bater com o vídeo. |
| 1.4 | A primeira correção plausível ainda pode deixar as 10h vermelhas. | O modelo pode acertar o `<` de primeira. |
| 1.5 | O placar desta execução é desta execução. | `0/5` no prompt do vídeo não é meta. |

O replay grava uma história estável para o take. Ao vivo, a história é outra rodada do mesmo experimento.
