import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Task } from "./tasks";

export interface TestResult {
  passed: boolean;
  output: string;
}

/** Copies the hidden test into the product tree for the duration of a run. */
export function installSensor(root: string, task: Task): () => void {
  const dest = resolve(root, task.sensorRelPath);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(resolve(root, task.hiddenSource), dest);
  return () => rmSync(dest, { force: true });
}

/** Runs only the task test. `pnpm verify` stays the repo oracle, not the loop sensor. */
export function runTaskTest(root: string, task: Task): TestResult {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("NODE_TEST") || key === "NODE_CHANNEL_FD") delete env[key];
  }
  const vitestFile = task.sensorRelPath.replace(/^apps\/api\//, "");
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", vitestFile],
    {
      cwd: resolve(root, "apps/api"),
      encoding: "utf8",
      env,
    },
  );
  return {
    passed: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}
