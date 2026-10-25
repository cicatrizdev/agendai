# Exercício: os três buracos do loop

O harness é construído no módulo 4. Este exercício é o aprofundamento do 5.2: você reconstrói o miolo do loop e o teste diz se acertou.

**Oráculo:** `apps/agent/test/loop.test.ts`. Não edite o teste.

## Antes de começar

```bash
git status          # limpo, sem bug aplicado
```

O exercício não precisa de `pnpm break`: os testes usam um sandbox temporário e um provider falso.

## 1. Abrir os buracos

```bash
git apply docs/exercicios/loop-holes.patch
pnpm --filter @autofix/agent test
```

Quatro testes falham. Todos no `runLoop`.

## 2. Fechar os buracos

Abra `apps/agent/src/loop.ts`. Faltam três coisas:

1. **A condição do `while`** — quando o loop continua. Ele precisa parar quando o teste passa e quando bate o teto.
2. **O erro no próximo turno** — `loopPrompt` monta o prompt. A saída do teste tem que entrar nele, senão o modelo não sabe o que falhou.
3. **O motivo da parada** — o `return` final devolve `passou` ou `teto`.

Rode só o teste do loop enquanto itera:

```bash
pnpm --filter @autofix/agent exec vitest run test/loop.test.ts
```

## 3. Critério de pronto

```bash
pnpm --filter @autofix/agent test     # 24 passed
pnpm --filter @autofix/agent typecheck
```

Se quiser comparar com a referência:

```bash
git diff apps/agent/src/loop.ts
```

## 4. Ver o loop rodando sem gastar chamada

```bash
pnpm break --bug=bug-001
pnpm autofix run --task=bug-001 --provider=replay
git checkout -- apps/api/src/domain/overlap.ts
rm -f .autofix/broken.json
```

O replay aplica a correção plausível na primeira volta e a certa na segunda. O `# parada` deve dizer `passou`.

## Desfazer

```bash
git checkout -- apps/agent/src/loop.ts
```
