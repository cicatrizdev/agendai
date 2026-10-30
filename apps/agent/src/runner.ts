import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { refusedPaths } from "./patch";
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

/** Drop whatever the session wrote. Escalate means the issue goes back, not a patch. */
export function discardDiff(root: string): void {
  spawnSync("git", ["reset", "--hard", "-q"], { cwd: root });
  spawnSync("git", ["clean", "-fdq"], { cwd: root });
}

export type SecretSnapshot = Map<string, string | null>;

export function snapshotSecrets(root: string): SecretSnapshot {
  const env = join(root, ".env");
  return new Map([[".env", existsSync(env) ? readFileSync(env, "utf8") : null]]);
}

function gitLines(root: string, args: string[]): string[] {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return (result.stdout ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listChangedFiles(root: string): string[] {
  return [
    ...new Set([
      ...gitLines(root, ["diff", "--name-only"]),
      ...gitLines(root, ["diff", "--cached", "--name-only"]),
      ...gitLines(root, ["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
}

function restoreFile(root: string, relPath: string, secrets: SecretSnapshot): void {
  if (secrets.has(relPath)) {
    const before = secrets.get(relPath);
    const abs = join(root, relPath);
    if (before === null || before === undefined) {
      if (existsSync(abs)) rmSync(abs);
    } else {
      writeFileSync(abs, before);
    }
    return;
  }
  const checkout = spawnSync("git", ["checkout", "--", relPath], { cwd: root });
  if (checkout.status !== 0) {
    const abs = join(root, relPath);
    if (existsSync(abs)) rmSync(abs, { recursive: true, force: true });
  }
}

/** After a session: refuse paths outside the contract, return those files. */
export function enforceContract(root: string, task: Task, secrets: SecretSnapshot): string[] {
  const files = listChangedFiles(root);
  const env = join(root, ".env");
  const envNow = existsSync(env) ? readFileSync(env, "utf8") : null;
  if (secrets.get(".env") !== envNow) files.push(".env");
  const refused = refusedPaths(files, task.allowedPrefixes);
  for (const path of refused) restoreFile(root, path, secrets);
  return refused;
}
