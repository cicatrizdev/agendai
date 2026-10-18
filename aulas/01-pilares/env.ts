import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Walks up to the workspace root so the lab can run from any directory. */
export function repoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/** Fills empty variables from `.env`. Never overrides the environment, never prints a value. */
export function loadEnv(root = repoRoot()): void {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
