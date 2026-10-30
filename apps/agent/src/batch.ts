export interface TaskStop {
  id: string;
  stop: string;
}

export interface RunSummary {
  overall: "passou" | "não passou";
  failed: TaskStop[];
}

export function parseTaskIds(raw: string): string[] {
  const ids = raw.split(",").map((id) => id.trim());
  if (ids.length === 0 || ids.some((id) => !id)) {
    throw new Error("tarefa vazia na lista. Use --task=bug-001 ou --task=bug-001,bug-002");
  }
  return ids;
}

/** The batch passed only when every task passed. Failed tasks carry their own stop. */
export function summarizeRun(results: TaskStop[]): RunSummary {
  const failed = results.filter((result) => result.stop !== "passou");
  return {
    overall: failed.length === 0 ? "passou" : "não passou",
    failed,
  };
}
