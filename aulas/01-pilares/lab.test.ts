import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyLab } from "./files";
import type { ToolReply } from "./model";
import { applyPatch } from "./patch";
import { runOneRound } from "./round";
import { runTests } from "./run-tests";
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
