// Types that mirror the "ops" schema (the control room) and the agent's event log.

export type TaskFamily = "build" | "bug" | "upgrade" | "db" | "escalate" | "security";
export type RunMode = "local" | "github" | "replay";
export type RunStatus = "running" | "awaiting_approval" | "succeeded" | "failed" | "escalated" | "cancelled";
export type OperatorRole = "developer" | "tech_lead";
export type RiskLevel = "low" | "medium" | "high";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export interface Run {
  id: string;
  taskId: string;
  family: TaskFamily;
  mode: RunMode;
  status: RunStatus;
  modelConfig: Record<string, unknown>;
  startedAt: string;
  finishedAt: string | null;
  outcome: { summary: string; costUsd: number; iterations: number } | null;
}

interface EventBase {
  runId: string;
  seq: number;
  at: string;
}

/** Everything that matters for the course becomes one of these events. */
export type AgentEvent =
  | (EventBase & { type: "run_started"; taskId: string; family: TaskFamily; mode: RunMode })
  | (EventBase & { type: "model_called"; model: string; usage: TokenUsage; costUsd: number; stopReason: string })
  | (EventBase & { type: "tool_called"; tool: string; input: unknown })
  | (EventBase & { type: "tool_result"; tool: string; isError: boolean; output: string })
  | (EventBase & { type: "sensor_result"; sensor: string; passed: boolean; feedback: string })
  | (EventBase & { type: "state_saved"; summary: string })
  | (EventBase & { type: "breaker_tripped"; breaker: string; limit: number; value: number })
  | (EventBase & { type: "escalated"; reason: string })
  | (EventBase & { type: "approval_requested"; approvalId: string; action: string; riskLevel: RiskLevel })
  | (EventBase & { type: "approval_decided"; approvalId: string; decision: "approved" | "rejected"; decidedBy: string })
  | (EventBase & { type: "run_finished"; status: RunStatus; summary: string });

export type AgentEventType = AgentEvent["type"];

export interface EvalRun {
  id: string;
  suite: string;
  gitSha: string;
  gitTag: string | null;
  harnessConfig: Record<string, unknown>;
  isBaseline: boolean;
  startedAt: string;
}

export interface Trial {
  id: string;
  evalRunId: string;
  taskId: string;
  trialIndex: number;
  runId: string | null;
  passed: boolean;
  score: number;
  costUsd: number;
  iterations: number;
  tokens: number;
}

export interface Approval {
  id: string;
  runId: string;
  action: string;
  riskLevel: RiskLevel;
  requestedAt: string;
  decidedBy: string | null;
  decision: "approved" | "rejected" | null;
  decidedAt: string | null;
}

export interface Annotation {
  id: string;
  runId: string;
  note: string;
  category: string | null;
  author: string;
  createdAt: string;
}
