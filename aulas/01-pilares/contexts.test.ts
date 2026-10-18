import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { contextDump } from "./contexts";

describe("contextDump", () => {
  it("skips the env file and dependencies", () => {
    const root = mkdtempSync(join(tmpdir(), "pilares-dump-"));
    try {
      writeFileSync(join(root, ".env"), "ANTHROPIC_API_KEY=sk-ant-secret\n");
      writeFileSync(join(root, "note.ts"), "export const n = 1;\n");
      mkdirSync(join(root, "node_modules"));
      writeFileSync(join(root, "node_modules", "secret.ts"), "export const leaked = true;\n");
      const dump = contextDump("instrução", root);
      assert.equal(dump.includes("sk-ant-secret"), false);
      assert.equal(dump.includes("note.ts"), true);
      assert.equal(dump.includes("leaked"), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
