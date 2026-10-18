import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyLab, labDir, readLabFile } from "./files";
import { LOOP_CEILING, runLoop } from "./loop";
import { complete, completeWithTools, resolveProvider, type ToolReply } from "./model";
import { applyPatch, parseReplacement } from "./patch";
import { runOneRound } from "./round";
import { runTests } from "./run-tests";
import { gradeText, runScoreboard } from "./scoreboard";
import { tools } from "./tools";

const closed = "a.start <= b.end && b.start <= a.end";
const halfOpen = "a.start < b.end && b.start < a.end";

function fake(calls: ToolReply["calls"][]): (prompt: string, toolList: typeof tools) => Promise<ToolReply> {
  let index = 0;
  return async (_prompt, _toolList) => {
    const next = calls[index] ?? [];
    index += 1;
    return { text: "", usage: { inputTokens: 1, outputTokens: 1 }, calls: next };
  };
}

describe("harness de uma rodada", () => {
  it("a correção com <= ainda falha quando uma reserva termina às 10:00", () => {
    const lab = copyLab();
    try {
      const result = runTests(lab.dir);
      assert.equal(result.passed, false);
      assert.match(result.output, /10:00/);
    } finally {
      lab.cleanup();
    }
  });

  it("a comparação estrita < libera as 10:00", () => {
    const lab = copyLab();
    try {
      applyPatch(lab.dir, closed, halfOpen);
      assert.equal(runTests(lab.dir).passed, true);
    } finally {
      lab.cleanup();
    }
  });

  it("uma rodada para mesmo quando o patch continua com <=", async () => {
    const lab = copyLab();
    let calls = 0;
    const complete = fake([[{ name: "apply_patch", input: { old_string: "at least one instant", new_string: "at least one moment" } }]]);
    const wrapped: typeof complete = async (prompt, toolList) => {
      calls += 1;
      return complete(prompt, toolList);
    };
    try {
      const result = await runOneRound(lab.dir, wrapped);
      assert.equal(calls, 1);
      assert.equal(result.passed, false);
      assert.match(result.output, /10:00/);
    } finally {
      lab.cleanup();
    }
  });
});

const fixText = `OLD:\n${closed}\nNEW:\n${halfOpen}`;

describe("loop curto", () => {
  it("lê o bloco OLD/NEW e ignora texto depois de uma linha em branco", () => {
    const parsed = parseReplacement(`${fixText}\n\nExplicação que não entra no arquivo.`);
    assert.deepEqual(parsed, { oldString: closed, newString: halfOpen });
    assert.equal(parseReplacement("sem formato"), null);
  });

  it("o acerto é o teste passar, não a presença do bloco", () => {
    const lab = copyLab();
    try {
      assert.equal(gradeText(lab.dir, fixText), true);
    } finally {
      lab.cleanup();
    }
    const stillClosed = copyLab();
    try {
      const comment = "OLD:\nat least one instant\nNEW:\nat least one moment";
      assert.equal(gradeText(stillClosed.dir, comment), false);
      assert.equal(gradeText(stillClosed.dir, "sem formato"), false);
    } finally {
      stillClosed.cleanup();
    }
  });

  it("para no verde na primeira volta e não chama de novo", async () => {
    const lab = copyLab();
    let calls = 0;
    const complete = fake([[{ name: "apply_patch", input: { old_string: closed, new_string: halfOpen } }]]);
    try {
      const result = await runLoop(lab.dir, async (prompt, toolList) => {
        calls += 1;
        return complete(prompt, toolList);
      });
      assert.equal(calls, 1);
      assert.equal(result.stop, "passou");
      assert.equal(result.rounds.length, 1);
      assert.equal(result.passed, true);
    } finally {
      lab.cleanup();
    }
  });

  it("devolve o erro do teste e para quando a correção chega na segunda volta", async () => {
    const lab = copyLab();
    const prompts: string[] = [];
    const complete = fake([
      [{ name: "apply_patch", input: { old_string: "at least one instant", new_string: "at least one moment" } }],
      [{ name: "apply_patch", input: { old_string: closed, new_string: halfOpen } }],
      [{ name: "apply_patch", input: { old_string: closed, new_string: "não deve rodar" } }],
    ]);
    try {
      const result = await runLoop(lab.dir, async (prompt, toolList) => {
        prompts.push(prompt);
        return complete(prompt, toolList);
      });
      assert.equal(prompts.length, 2);
      assert.match(prompts[0] ?? "", /Saída do teste:/);
      assert.doesNotMatch(prompts[0] ?? "", /Resultado das ferramentas/);
      assert.match(prompts[1] ?? "", /Resultado das ferramentas/);
      assert.match(prompts[1] ?? "", /AssertionError/);
      assert.match(prompts[1] ?? "", /at least one moment/);
      assert.equal(result.stop, "passou");
      assert.equal(result.passed, true);
    } finally {
      lab.cleanup();
    }
  });

  it("para no teto depois de três voltas sem verde", async () => {
    const lab = copyLab();
    let calls = 0;
    const complete = fake([]);
    try {
      const result = await runLoop(lab.dir, async (prompt, toolList) => {
        calls += 1;
        return complete(prompt, toolList);
      });
      assert.equal(calls, LOOP_CEILING);
      assert.equal(result.stop, "teto");
      assert.equal(result.passed, false);
      assert.match(result.output, /10:00/);
    } finally {
      lab.cleanup();
    }
  });

  it("conta o que cada camada realmente acerta e deixa o arquivo commitado intacto", async () => {
    const before = readLabFile(labDir, "is-overlapping.ts");
    const fix = {
      text: "",
      usage: { inputTokens: 1, outputTokens: 1 },
      calls: [{ name: "apply_patch", input: { old_string: closed, new_string: halfOpen } }],
    };
    const scores = await runScoreboard(
      async (prompt) => ({
        text: prompt.includes("Teste que falha") ? fixText : "sem formato",
        usage: { inputTokens: 1, outputTokens: 1 },
      }),
      async () => fix,
      1,
    );
    assert.deepEqual(
      scores.map((score) => [score.layer, score.passed, score.runs]),
      [
        ["prompt", 0, 1],
        ["contexto", 1, 1],
        ["harness", 1, 1],
        ["loop", 1, 1],
      ],
    );
    assert.equal(readLabFile(labDir, "is-overlapping.ts"), before);
    assert.match(before, /<=/);
  });

  it("replay: prompt e uma rodada falham; contexto e loop acertam", async () => {
    const previous = process.env.AUTOFIX_PROVIDER;
    process.env.AUTOFIX_PROVIDER = "replay";
    const before = readLabFile(labDir, "is-overlapping.ts");
    try {
      const scores = await runScoreboard(complete, completeWithTools, 1);
      assert.deepEqual(
        scores.map((score) => [score.layer, score.passed, score.runs]),
        [
          ["prompt", 0, 1],
          ["contexto", 1, 1],
          ["harness", 0, 1],
          ["loop", 1, 1],
        ],
      );
      assert.equal(readLabFile(labDir, "is-overlapping.ts"), before);
    } finally {
      if (previous === undefined) delete process.env.AUTOFIX_PROVIDER;
      else process.env.AUTOFIX_PROVIDER = previous;
    }
  });

  it("uma falha da API não vira zero no placar", async () => {
    await assert.rejects(
      () => runScoreboard(async () => { throw new Error("falha da api"); }, fake([]), 1),
      /falha da api/,
    );
  });
});

describe("provedor", () => {
  it("replay é o padrão e não exige chave", () => {
    const previous = process.env.AUTOFIX_PROVIDER;
    process.env.AUTOFIX_PROVIDER = "";
    try {
      assert.equal(resolveProvider(), "replay");
    } finally {
      if (previous === undefined) delete process.env.AUTOFIX_PROVIDER;
      else process.env.AUTOFIX_PROVIDER = previous;
    }
  });

  it("anthropic sem chave aponta para a sessão ao vivo", () => {
    const previous = process.env.AUTOFIX_PROVIDER;
    const previousKey = process.env.ANTHROPIC_API_KEY;
    process.env.AUTOFIX_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "";
    try {
      assert.throws(() => resolveProvider(), /ao-vivo\.md/);
    } finally {
      if (previous === undefined) delete process.env.AUTOFIX_PROVIDER;
      else process.env.AUTOFIX_PROVIDER = previous;
      if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });
});
