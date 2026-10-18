import { describe, expect, it } from "vitest";
import type { AgentEvent, EvalRun, Trial } from "@agendai/shared";
import { canDecide, cumulativeCost, summarizeEvalRun, sumBy } from "../src/lib/metrics";

const evalRun: EvalRun = { id: "e1", suite: "capability", gitSha: "abc1234", gitTag: "aula-2.5-fim", harnessConfig: {}, isBaseline: true, startedAt: "2026-09-01T00:00:00Z" };

function trial(taskId: string, trialIndex: number, passed: boolean, costUsd = 0.1): Trial {
  return { id: `${taskId}-${trialIndex}`, evalRunId: "e1", taskId, trialIndex, runId: null, passed, score: passed ? 1 : 0, costUsd, iterations: 4, tokens: 1000 };
}

describe("summarizeEvalRun", () => {
  const trials = [trial("a", 0, true), trial("a", 1, true), trial("b", 0, true), trial("b", 1, false)];

  it("computes success rate over trials and pass^k over tasks", () => {
    const summary = summarizeEvalRun(evalRun, trials);
    expect(summary.successRate).toBe(0.75);
    expect(summary.passHatK).toBe(0.5);
    expect(summary.label).toBe("aula-2.5-fim");
  });

  it("divides total cost by solved trials", () => {
    expect(summarizeEvalRun(evalRun, trials).costPerSolvedTask).toBeCloseTo(0.4 / 3);
  });

  it("has no cost per solved task when nothing was solved", () => {
    expect(summarizeEvalRun(evalRun, [trial("a", 0, false)]).costPerSolvedTask).toBeNull();
  });
});

describe("cumulativeCost", () => {
  it("accumulates only model calls", () => {
    const usage = { inputTokens: 1, outputTokens: 1, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 };
    const events: AgentEvent[] = [
      { runId: "r", seq: 1, at: "", type: "model_called", model: "fast", usage, costUsd: 0.1, stopReason: "tool_use" },
      { runId: "r", seq: 2, at: "", type: "tool_called", tool: "search", input: {} },
      { runId: "r", seq: 3, at: "", type: "model_called", model: "fast", usage, costUsd: 0.2, stopReason: "end_turn" },
    ];
    expect(cumulativeCost(events).map((v) => Number(v.toFixed(2)))).toEqual([0.1, 0.1, 0.3]);
  });
});

describe("sumBy", () => {
  it("sums by key, largest first", () => {
    expect(sumBy([{ k: "a", v: 1 }, { k: "b", v: 5 }, { k: "a", v: 2 }], (x) => x.k, (x) => x.v)).toEqual([
      { key: "b", total: 5 },
      { key: "a", total: 3 },
    ]);
  });
});

describe("canDecide", () => {
  it("requires a tech lead for high risk", () => {
    expect(canDecide("developer", "high")).toBe(false);
    expect(canDecide("tech_lead", "high")).toBe(true);
    expect(canDecide("developer", "medium")).toBe(true);
  });
});
