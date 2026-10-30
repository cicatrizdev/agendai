import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discardDiff, enforceContract, snapshotSecrets } from "../src/runner";
import { loadTask } from "../src/tasks";

describe("discardDiff", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("restores tracked files and drops untracked ones", () => {
    const root = mkdtempSync(join(tmpdir(), "autofix-discard-"));
    dirs.push(root);
    writeFileSync(join(root, "keep.txt"), "original\n");
    git(root, ["init", "-q"]);
    git(root, ["add", "keep.txt"]);
    git(root, ["-c", "user.name=autofix", "-c", "user.email=autofix@test", "commit", "-qm", "base"]);
    writeFileSync(join(root, "keep.txt"), "edited by grok\n");
    writeFileSync(join(root, "extra.ts"), "untracked\n");
    mkdirSync(join(root, "new-dir"));
    writeFileSync(join(root, "new-dir", "file.ts"), "also untracked\n");

    discardDiff(root);

    expect(readFileSync(join(root, "keep.txt"), "utf8")).toBe("original\n");
    expect(git(root, ["status", "--porcelain"])).toBe("");
  });
});

describe("enforceContract", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("returns the .env file and restores its previous contents", () => {
    const root = repo();
    writeFileSync(join(root, ".env"), "SECRET=before\n");
    const secrets = snapshotSecrets(root);
    writeFileSync(join(root, ".env"), "SECRET=leaked\n");
    writeFileSync(join(root, "apps/api/src/domain/cancellation.ts"), "ok\n");

    const refused = enforceContract(root, loadTask("security-001"), secrets);

    expect(refused).toEqual([".env"]);
    expect(readFileSync(join(root, ".env"), "utf8")).toBe("SECRET=before\n");
    expect(readFileSync(join(root, "apps/api/src/domain/cancellation.ts"), "utf8")).toBe("ok\n");
  });

  it("deletes an untracked file outside the contract", () => {
    const root = repo();
    const secrets = snapshotSecrets(root);
    writeFileSync(join(root, "leaked.txt"), "nope\n");

    const refused = enforceContract(root, loadTask("security-001"), secrets);

    expect(refused).toEqual(["leaked.txt"]);
    expect(git(root, ["status", "--porcelain"])).toBe("");
  });

  it("keeps an in-contract diff", () => {
    const root = repo();
    const secrets = snapshotSecrets(root);
    writeFileSync(join(root, "apps/api/src/domain/cancellation.ts"), "fixed\n");

    expect(enforceContract(root, loadTask("security-001"), secrets)).toEqual([]);
    expect(readFileSync(join(root, "apps/api/src/domain/cancellation.ts"), "utf8")).toBe("fixed\n");
  });

  function repo(): string {
    const root = mkdtempSync(join(tmpdir(), "autofix-contract-"));
    dirs.push(root);
    mkdirSync(join(root, "apps/api/src/domain"), { recursive: true });
    writeFileSync(join(root, "apps/api/src/domain/cancellation.ts"), "original\n");
    git(root, ["init", "-q"]);
    git(root, ["add", "."]);
    git(root, ["-c", "user.name=autofix", "-c", "user.email=autofix@test", "commit", "-qm", "base"]);
    return root;
  }
});

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return (result.stdout ?? "").trim();
}
