import { spawnSync } from "node:child_process";
import type { Task } from "./tasks";

/** Enough agent turns for one unattended session. Not a harness retry loop. */
const SESSION_TURNS = 16;

export function runSession(root: string, task: Task): string {
  const prompt = [task.report, task.prompt].filter(Boolean).join("\n\n");
  const result = spawnSync(
    "grok",
    [
      "-p",
      prompt,
      "--permission-mode",
      "dontAsk",
      "--max-turns",
      String(SESSION_TURNS),
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  if (result.error) {
    throw new Error(`não foi possível executar o grok: ${result.error.message}`);
  }

  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
}
