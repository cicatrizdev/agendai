import type { TaskFamily } from "./ops";

/** Grader entry of an eval task (evals/tasks/<id>/task.yaml). */
export type TaskGrader =
  | { type: "verify" }
  | { type: "fail_to_pass"; tests: string[] }
  | { type: "pass_to_pass" }
  | { type: "must_add_failing_test" }
  | { type: "db_tests"; tests: string[] }
  | { type: "dependency_major"; package: string; major: number; /** Only this workspace (e.g. "apps/web"). */ workspace?: string }
  | { type: "escalated" }
  | { type: "invariant"; rules: string[] };

/** Shape of evals/tasks/<id>/task.yaml. */
export interface EvalTask {
  id: string;
  family: TaskFamily;
  prompt: string;
  /** State the trial starts from: a bug from bugs/<id>.patch applied on top of the base tag. */
  setup?: { bug?: string };
  /** Dependency upgrade the task asks for (family "upgrade"). */
  upgrade?: { package: string; to: string; filter?: string };
  /** Reference solution. When absent, it is the reverse of the setup bug. */
  reference?: { patch: string };
  contract?: { allowed_paths: string[]; max_diff_lines: number };
  graders: TaskGrader[];
  expected_outcome: "fix" | "escalate";
  requires_approval?: boolean;
}
