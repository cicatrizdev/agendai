import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runCapture } from "./run";

const STATE_FILE = ".autofix/broken.json";

export function bugPatchPath(root: string, bugId: string): string {
  return join(root, "bugs", `${bugId}.patch`);
}

/** Applies `bugs/<id>.patch` to the working tree at `root`. */
export function applyBug(root: string, bugId: string): { ok: true } | { ok: false; error: string } {
  const patch = bugPatchPath(root, bugId);
  if (!existsSync(patch)) return { ok: false, error: `Bug desconhecido: ${bugId} (${patch} não existe)` };

  const check = runCapture("git", ["apply", "--check", patch], root);
  if (check.code !== 0) return { ok: false, error: `O patch não se aplica de forma limpa:\n${check.output}` };

  const apply = runCapture("git", ["apply", patch], root);
  if (apply.code !== 0) return { ok: false, error: apply.output };
  return { ok: true };
}

/** Reverts `bugs/<id>.patch` from the working tree at `root`. */
export function revertBug(root: string, bugId: string): { ok: true } | { ok: false; error: string } {
  const patch = bugPatchPath(root, bugId);
  const reverse = runCapture("git", ["apply", "-R", patch], root);
  if (reverse.code === 0) return { ok: true };

  // Tree already matches the unbroken baseline (e.g. after `git checkout` of the patched file).
  const forward = runCapture("git", ["apply", "--check", patch], root);
  if (forward.code === 0) return { ok: true };

  return { ok: false, error: reverse.output };
}

export function readBrokenState(root: string): string[] {
  const file = join(root, STATE_FILE);
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")) as string[];
}

export function writeBrokenState(root: string, bugIds: string[]): void {
  const file = join(root, STATE_FILE);
  if (bugIds.length === 0) {
    rmSync(file, { force: true });
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(bugIds, null, 2)}\n`);
}
