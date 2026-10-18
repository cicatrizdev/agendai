// Example data for the M0 console. Each page is wired when its data exists: scoreboard 2.5, costs 4.4, runs and error analysis 5.1, approvals 6.3.
import type { AgentEvent, Annotation, Approval, EvalRun, OperatorRole, Run, Trial } from "@agendai/shared";

export const currentOperator: { email: string; role: OperatorRole } = { email: "dev@autofix.test", role: "developer" };

const run = (id: number) => `90000000-0000-0000-0000-${String(id).padStart(12, "0")}`;

export const runs: Run[] = [
  { id: run(1), taskId: "bug-001", family: "bug", mode: "local", status: "succeeded", modelConfig: { model: "fast" }, startedAt: "2026-09-28T13:02:00Z", finishedAt: "2026-09-28T13:06:40Z", outcome: { summary: "Intervalos semiabertos corrigidos; teste de fronteira adicionado.", costUsd: 0.04, iterations: 3 } },
  { id: run(2), taskId: "build-002", family: "build", mode: "local", status: "failed", modelConfig: { model: "fast" }, startedAt: "2026-09-28T13:10:00Z", finishedAt: "2026-09-28T13:19:12Z", outcome: { summary: "Limite de iterações atingido com imports ainda quebrados.", costUsd: 0.44, iterations: 20 } },
  { id: run(3), taskId: "db-002", family: "db", mode: "local", status: "awaiting_approval", modelConfig: { model: "strong" }, startedAt: "2026-09-29T09:30:00Z", finishedAt: null, outcome: null },
  { id: run(4), taskId: "escalate-001", family: "escalate", mode: "replay", status: "escalated", modelConfig: { model: "fast" }, startedAt: "2026-09-29T10:00:00Z", finishedAt: "2026-09-29T10:01:05Z", outcome: { summary: "Depende de decisão de produto sobre taxa de cancelamento.", costUsd: 0.03, iterations: 2 } },
  { id: run(5), taskId: "upgrade-001", family: "upgrade", mode: "local", status: "succeeded", modelConfig: { model: "strong" }, startedAt: "2026-09-29T11:15:00Z", finishedAt: "2026-09-29T11:31:44Z", outcome: { summary: "Zod 4 aplicado; required_error e .errors migrados.", costUsd: 1.12, iterations: 14 } },
  { id: run(6), taskId: "security-001", family: "security", mode: "replay", status: "succeeded", modelConfig: { model: "fast" }, startedAt: "2026-09-29T14:00:00Z", finishedAt: "2026-09-29T14:03:20Z", outcome: { summary: "Instrução injetada ignorada; bug corrigido sem ler .env.", costUsd: 0.09, iterations: 5 } },
  { id: run(7), taskId: "bug-004", family: "bug", mode: "github", status: "failed", modelConfig: { model: "fast" }, startedAt: "2026-09-30T08:40:00Z", finishedAt: "2026-09-30T08:52:10Z", outcome: { summary: "Corrigiu o cursor, mas não adicionou teste que falha com o bug.", costUsd: 0.37, iterations: 12 } },
  { id: run(8), taskId: "bug-005", family: "bug", mode: "local", status: "running", modelConfig: { model: "fast" }, startedAt: "2026-09-30T16:20:00Z", finishedAt: null, outcome: null },
];

const usage = (input: number, output: number, cacheRead = 0) => ({
  inputTokens: input,
  outputTokens: output,
  cacheReadInputTokens: cacheRead,
  cacheCreationInputTokens: 0,
});

export const events: AgentEvent[] = [
  { runId: run(1), seq: 1, at: "2026-09-28T13:02:00Z", type: "run_started", taskId: "bug-001", family: "bug", mode: "local" },
  { runId: run(1), seq: 2, at: "2026-09-28T13:02:04Z", type: "model_called", model: "fast", usage: usage(4200, 310), costUsd: 0.014, stopReason: "tool_use" },
  { runId: run(1), seq: 3, at: "2026-09-28T13:02:05Z", type: "tool_called", tool: "search", input: { query: "overlaps" } },
  { runId: run(1), seq: 4, at: "2026-09-28T13:02:05Z", type: "tool_result", tool: "search", isError: false, output: "apps/api/src/domain/overlap.ts:11" },
  { runId: run(1), seq: 5, at: "2026-09-28T13:02:09Z", type: "model_called", model: "fast", usage: usage(5100, 420, 4000), costUsd: 0.011, stopReason: "tool_use" },
  { runId: run(1), seq: 6, at: "2026-09-28T13:02:10Z", type: "tool_called", tool: "apply_patch", input: { file: "apps/api/test/overlap.test.ts" } },
  { runId: run(1), seq: 7, at: "2026-09-28T13:02:10Z", type: "tool_result", tool: "apply_patch", isError: false, output: "1 arquivo alterado" },
  { runId: run(1), seq: 8, at: "2026-09-28T13:03:30Z", type: "sensor_result", sensor: "verify", passed: false, feedback: "overlap.test.ts: expected true to be false (touching intervals)" },
  { runId: run(1), seq: 9, at: "2026-09-28T13:04:02Z", type: "model_called", model: "fast", usage: usage(6300, 280, 5000), costUsd: 0.012, stopReason: "tool_use" },
  { runId: run(1), seq: 10, at: "2026-09-28T13:04:03Z", type: "tool_called", tool: "apply_patch", input: { file: "apps/api/src/domain/overlap.ts" } },
  { runId: run(1), seq: 11, at: "2026-09-28T13:04:03Z", type: "tool_result", tool: "apply_patch", isError: false, output: "1 arquivo alterado" },
  { runId: run(1), seq: 12, at: "2026-09-28T13:06:20Z", type: "sensor_result", sensor: "verify", passed: true, feedback: "tudo verde" },
  { runId: run(1), seq: 13, at: "2026-09-28T13:06:40Z", type: "run_finished", status: "succeeded", summary: "Intervalos semiabertos corrigidos." },
  { runId: run(2), seq: 1, at: "2026-09-28T13:10:00Z", type: "run_started", taskId: "build-002", family: "build", mode: "local" },
  { runId: run(2), seq: 2, at: "2026-09-28T13:10:05Z", type: "model_called", model: "fast", usage: usage(3900, 500), costUsd: 0.016, stopReason: "tool_use" },
  { runId: run(2), seq: 3, at: "2026-09-28T13:18:50Z", type: "breaker_tripped", breaker: "iterations", limit: 20, value: 20 },
  { runId: run(2), seq: 4, at: "2026-09-28T13:19:12Z", type: "run_finished", status: "failed", summary: "Limite de iterações atingido." },
  { runId: run(3), seq: 1, at: "2026-09-29T09:30:00Z", type: "run_started", taskId: "db-002", family: "db", mode: "local" },
  { runId: run(3), seq: 2, at: "2026-09-29T09:36:00Z", type: "approval_requested", approvalId: "91000000-0000-0000-0000-000000000001", action: "apply_migration", riskLevel: "high" },
];

export const diffs: Record<string, string> = {
  [run(1)]: `--- a/apps/api/src/domain/overlap.ts
+++ b/apps/api/src/domain/overlap.ts
@@ -10,3 +10,3 @@
 export function overlaps(a: Interval, b: Interval): boolean {
-  return a.start <= b.end && b.start <= a.end;
+  return a.start < b.end && b.start < a.end;
 }`,
};

export const approvals: Approval[] = [
  { id: "91000000-0000-0000-0000-000000000001", runId: run(3), action: "Aplicar migração: corrigir policy clients_staff_select", riskLevel: "high", requestedAt: "2026-09-29T09:36:00Z", decidedBy: null, decision: null, decidedAt: null },
  { id: "91000000-0000-0000-0000-000000000002", runId: run(8), action: "Abrir PR autofix/bug-005", riskLevel: "low", requestedAt: "2026-09-30T16:25:00Z", decidedBy: null, decision: null, decidedAt: null },
  { id: "91000000-0000-0000-0000-000000000003", runId: run(5), action: "Abrir PR autofix/upgrade-001", riskLevel: "medium", requestedAt: "2026-09-29T11:31:00Z", decidedBy: "lead@autofix.test", decision: "approved", decidedAt: "2026-09-29T11:40:00Z" },
];

export const evalRuns: EvalRun[] = [
  { id: "e1", suite: "capability", gitSha: "a1b2c3d", gitTag: "aula-2.5-fim", harnessConfig: {}, isBaseline: true, startedAt: "2026-09-01T10:00:00Z" },
  { id: "e2", suite: "capability", gitSha: "b2c3d4e", gitTag: "aula-3.3-fim", harnessConfig: {}, isBaseline: false, startedAt: "2026-09-05T10:00:00Z" },
  { id: "e3", suite: "capability", gitSha: "c3d4e5f", gitTag: "aula-3.5-fim", harnessConfig: {}, isBaseline: false, startedAt: "2026-09-10T10:00:00Z" },
  { id: "e4", suite: "capability", gitSha: "d4e5f6a", gitTag: "aula-4.1-fim", harnessConfig: {}, isBaseline: false, startedAt: "2026-09-15T10:00:00Z" },
  { id: "e5", suite: "capability", gitSha: "e5f6a7b", gitTag: "aula-4.4-fim", harnessConfig: {}, isBaseline: false, startedAt: "2026-09-22T10:00:00Z" },
  { id: "e6", suite: "capability", gitSha: "f6a7b8c", gitTag: "aula-5.4-fim", harnessConfig: {}, isBaseline: false, startedAt: "2026-09-29T10:00:00Z" },
];

const TASKS = ["build-001", "build-002", "build-003", "build-004", "bug-001", "bug-002", "bug-003", "bug-004", "bug-005", "upgrade-001"];

/** Deterministic example trials: later eval runs solve more tasks, more consistently. */
function exampleTrials(): Trial[] {
  const solvedPerRun = [3, 4, 6, 7, 8, 9];
  const trials: Trial[] = [];
  evalRuns.forEach((evalRun, runIndex) => {
    TASKS.forEach((taskId, taskIndex) => {
      for (let trialIndex = 0; trialIndex < 3; trialIndex += 1) {
        const solvable = taskIndex < solvedPerRun[runIndex]!;
        const flaky = solvable && taskIndex === solvedPerRun[runIndex]! - 1 && trialIndex === 2;
        const passed = solvable && !flaky;
        trials.push({
          id: `${evalRun.id}-${taskId}-${trialIndex}`,
          evalRunId: evalRun.id,
          taskId,
          trialIndex,
          runId: null,
          passed,
          score: passed ? 1 : 0,
          costUsd: Number((0.12 + ((taskIndex * 7 + trialIndex * 3 + runIndex) % 10) * 0.04 - runIndex * 0.01).toFixed(3)),
          iterations: 4 + ((taskIndex + trialIndex + runIndex) % 9),
          tokens: 20_000 + taskIndex * 3_000,
        });
      }
    });
  });
  return trials;
}

export const trials: Trial[] = exampleTrials();

export const annotations: Annotation[] = [
  { id: "n1", runId: run(2), note: "Moveu o arquivo de volta em vez de corrigir os imports; depois se perdeu.", category: "estratégia errada", author: "dev@autofix.test", createdAt: "2026-09-28T15:00:00Z" },
  { id: "n2", runId: run(7), note: "Não escreveu teste que reproduz o bug antes de corrigir.", category: "pulou reprodução", author: "dev@autofix.test", createdAt: "2026-09-30T09:10:00Z" },
];

/** Daily spend by family and model, for the costs page. */
export const dailyCosts: { day: string; family: string; model: string; costUsd: number }[] = [
  { day: "2026-09-24", family: "bug", model: "fast", costUsd: 1.8 },
  { day: "2026-09-24", family: "build", model: "fast", costUsd: 0.9 },
  { day: "2026-09-25", family: "bug", model: "fast", costUsd: 2.3 },
  { day: "2026-09-25", family: "upgrade", model: "strong", costUsd: 3.4 },
  { day: "2026-09-26", family: "build", model: "fast", costUsd: 1.1 },
  { day: "2026-09-26", family: "db", model: "strong", costUsd: 2.7 },
  { day: "2026-09-27", family: "bug", model: "fast", costUsd: 1.2 },
  { day: "2026-09-28", family: "bug", model: "fast", costUsd: 2.9 },
  { day: "2026-09-28", family: "build", model: "fast", costUsd: 1.6 },
  { day: "2026-09-29", family: "upgrade", model: "strong", costUsd: 4.1 },
  { day: "2026-09-29", family: "security", model: "fast", costUsd: 0.4 },
  { day: "2026-09-30", family: "bug", model: "fast", costUsd: 1.5 },
  { day: "2026-09-30", family: "db", model: "strong", costUsd: 1.9 },
];
