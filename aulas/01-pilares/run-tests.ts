import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsx = require.resolve("tsx");

export interface TestResult {
  passed: boolean;
  output: string;
}

/** Runs only the interval test. The lab bug is expected to fail this, not `pnpm verify`. */
export function runTests(dir: string): TestResult {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("NODE_TEST") || key === "NODE_CHANNEL_FD") delete env[key];
  }
  const result = spawnSync(process.execPath, ["--import", tsx, "--test", "is-overlapping.test.ts"], {
    cwd: dir,
    encoding: "utf8",
    env,
  });
  return {
    passed: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}
