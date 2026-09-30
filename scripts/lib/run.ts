import { spawnSync } from "node:child_process";

export interface RunResult {
  code: number;
  output: string;
}

/** Runs a command, streaming its output to the terminal. */
export function runInherit(command: string, args: string[], cwd = process.cwd()): number {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  return result.status ?? 1;
}

/** Runs a command and captures stdout + stderr together. */
export function runCapture(command: string, args: string[], cwd = process.cwd()): RunResult {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { code: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

/** Reads `--name=value` flags from argv. */
export function readFlag(name: string, argv = process.argv.slice(2)): string | undefined {
  const prefix = `--${name}=`;
  return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

export function hasFlag(name: string, argv = process.argv.slice(2)): boolean {
  return argv.includes(`--${name}`);
}
