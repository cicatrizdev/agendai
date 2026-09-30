import type { AgentEvent, EvalRun, OperatorRole, RiskLevel, Trial } from "@agendai/shared";

export interface EvalRunSummary {
  evalRunId: string;
  label: string;
  successRate: number;
  /** Share of tasks whose every trial passed. */
  passHatK: number;
  costPerSolvedTask: number | null;
  averageIterations: number;
}

/** Aggregates the trials of one eval run into the scoreboard metrics. */
export function summarizeEvalRun(evalRun: EvalRun, allTrials: Trial[]): EvalRunSummary {
  const trials = allTrials.filter((t) => t.evalRunId === evalRun.id);
  const byTask = groupBy(trials, (t) => t.taskId);
  const tasks = Object.values(byTask);
  const solvedTrials = trials.filter((t) => t.passed).length;
  const totalCost = trials.reduce((sum, t) => sum + t.costUsd, 0);

  return {
    evalRunId: evalRun.id,
    label: evalRun.gitTag ?? evalRun.gitSha,
    successRate: trials.length ? solvedTrials / trials.length : 0,
    passHatK: tasks.length ? tasks.filter((ts) => ts.every((t) => t.passed)).length / tasks.length : 0,
    costPerSolvedTask: solvedTrials ? totalCost / solvedTrials : null,
    averageIterations: trials.length ? trials.reduce((sum, t) => sum + t.iterations, 0) / trials.length : 0,
  };
}

/** Running total of model spend along a run's events. */
export function cumulativeCost(events: AgentEvent[]): number[] {
  let total = 0;
  return events.map((event) => {
    if (event.type === "model_called") total += event.costUsd;
    return total;
  });
}

/** Sums `value` by the key returned by `keyOf`, largest first. */
export function sumBy<T>(items: T[], keyOf: (item: T) => string, value: (item: T) => number) {
  const totals = new Map<string, number>();
  for (const item of items) totals.set(keyOf(item), (totals.get(keyOf(item)) ?? 0) + value(item));
  return [...totals.entries()].map(([key, total]) => ({ key, total })).sort((a, b) => b.total - a.total);
}

/** High-risk actions (family "db") need a tech lead; the rest accept any operator. */
export function canDecide(role: OperatorRole, risk: RiskLevel): boolean {
  return risk !== "high" || role === "tech_lead";
}

export function groupBy<T>(items: T[], keyOf: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) (groups[keyOf(item)] ??= []).push(item);
  return groups;
}
