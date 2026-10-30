import { spawnSync } from "node:child_process";
import type { Task } from "./tasks";

/** Enough agent turns for one unattended session. Not a harness retry loop. */
const SESSION_TURNS = 16;

export function runSession(root: string, task: Task, extra = ""): string {
  const prompt = [task.report, task.prompt, extra].filter(Boolean).join("\n\n");
  const result = spawnSync(
    "grok",
    [
      "-p",
      prompt,
      "--permission-mode",
      "dontAsk",
      "--max-turns",
      String(SESSION_TURNS),
      "--no-alt-screen",
    ],
    {
      cwd: root,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw new Error(`não foi possível executar o grok: ${result.error.message}`);
  }

  return "";
}
