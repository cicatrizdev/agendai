import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { closedInterval, halfOpenInterval, overlapPath, replayBug001 } from "../src/fixtures/bug-001";
import { LOOP_CEILING, runLoop } from "../src/loop";
import { applyPatch, isAllowedPath, refusedPaths } from "../src/patch";
import { loadTask } from "../src/tasks";
import type { ToolReply } from "../src/model";
import { tools } from "../src/tools";

const closedSource = `/** True when two half-open intervals share at least one instant. */
export function overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return ${closedInterval};
}
`;

function fake(calls: ToolReply["calls"][]): (prompt: string, toolList: typeof tools) => Promise<ToolReply> {
  let index = 0;
  return async (prompt) => {
    const next = calls[index] ?? [];
    index += 1;
    return { text: prompt.slice(0, 20), usage: { inputTokens: 1, outputTokens: 1 }, calls: next };
  };
}

describe("isAllowedPath", () => {
  const prefixes = ["apps/api/src/domain/", "apps/api/test/"];

  it("allows the overlap file and rejects secrets", () => {
    expect(isAllowedPath(overlapPath, prefixes)).toBe(true);
    expect(isAllowedPath(".env", prefixes)).toBe(false);
    expect(isAllowedPath("apps/api/src/domain/../.env", prefixes)).toBe(false);
    expect(isAllowedPath("apps/api/src/domain/.env", prefixes)).toBe(false);
  });
});

describe("refusedPaths", () => {
  const prefixes = ["apps/api/src/domain/", "apps/api/test/"];

  it("refuses .env even when the rest of the diff is in the contract", () => {
    expect(refusedPaths(["apps/api/src/domain/cancellation.ts", ".env"], prefixes)).toEqual([".env"]);
  });

  it("refuses a file outside the allowed prefixes", () => {
    expect(refusedPaths(["README.md"], prefixes)).toEqual(["README.md"]);
  });

  it("keeps an in-contract path", () => {
    expect(refusedPaths(["apps/api/src/domain/cancellation.ts"], prefixes)).toEqual([]);
  });

  it("still refuses .env when the task has no path contract", () => {
    expect(refusedPaths([".env", "apps/api/src/domain/overlap.ts"], [])).toEqual([".env"]);
  });
});

describe("runLoop", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function sandbox(): { root: string; file: string } {
    const root = mkdtempSync(join(tmpdir(), "autofix-"));
    dirs.push(root);
    const file = join(root, overlapPath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, closedSource);
    return { root, file };
  }

  function senseFile(file: string) {
    return () => {
      const text = readFileSync(file, "utf8");
      const passed = text.includes(halfOpenInterval);
      return { passed, output: passed ? "ok" : "AssertionError: 10:00 still overlaps" };
    };
  }

  it("applies the plausible miss then the half-open fix", async () => {
    const { root, file } = sandbox();
    const task = loadTask("bug-001");
    const result = await runLoop(root, task, {
      complete: fake([
        [
          {
            name: "apply_patch",
            input: {
              path: overlapPath,
              old_string: "at least one instant.",
              new_string: "at least one moment.",
            },
          },
        ],
        [
          {
            name: "apply_patch",
            input: {
              path: overlapPath,
              old_string: closedInterval,
              new_string: halfOpenInterval,
            },
          },
        ],
      ]),
      readOverlap: () => readFileSync(file, "utf8"),
      sensor: senseFile(file),
    });
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[0]?.passed).toBe(false);
    expect(result.stop).toBe("passou");
    expect(readFileSync(file, "utf8")).toContain(halfOpenInterval);
    expect(result.rounds[1]?.toolOutput[0]).toMatch(/patch aplicado/);
  });

  it("stops at the ceiling when patches never fix the sensor", async () => {
    const { root, file } = sandbox();
    const task = loadTask("bug-001");
    const result = await runLoop(root, task, {
      complete: fake([]),
      readOverlap: () => readFileSync(file, "utf8"),
      sensor: senseFile(file),
    });
    expect(result.rounds).toHaveLength(LOOP_CEILING);
    expect(result.stop).toBe("teto");
  });

  it("puts the test output in the next prompt", async () => {
    const { root, file } = sandbox();
    const prompts: string[] = [];
    const result = await runLoop(root, loadTask("bug-001"), {
      complete: async (prompt) => {
        prompts.push(prompt);
        return replayBug001(prompt);
      },
      readOverlap: () => readFileSync(file, "utf8"),
      sensor: senseFile(file),
    });
    expect(result.stop).toBe("passou");
    expect(prompts[0]).toContain("10:00 still overlaps");
    expect(prompts[1]).toContain("Resultado das ferramentas");
    expect(prompts[1]).toContain("10:00 still overlaps");
  });

  it("escalates without applying a patch from the same reply", async () => {
    const { root, file } = sandbox();
    const before = readFileSync(file, "utf8");
    const result = await runLoop(root, loadTask("escalate-001"), {
      complete: async () => ({
        text: "devolvo a issue",
        usage: { inputTokens: 1, outputTokens: 1 },
        calls: [
          {
            name: "apply_patch",
            input: {
              path: overlapPath,
              old_string: "at least one instant.",
              new_string: "at least one moment.",
            },
          },
          { name: "escalate", input: { reason: "decisão de produto" } },
        ],
      }),
      readOverlap: () => readFileSync(file, "utf8"),
      sensor: senseFile(file),
    });
    expect(result.stop).toBe("escalado");
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("replay second prompt applies the real fix", async () => {
    const first = replayBug001("Use apply_patch no arquivo do domínio.");
    const second = replayBug001("Resultado das ferramentas:\npatch aplicado");
    expect(first.calls[0]?.input).toMatchObject({ old_string: "True when two half-open intervals share at least one instant." });
    expect(second.calls[0]?.input).toMatchObject({
      old_string: closedInterval,
      new_string: halfOpenInterval,
    });
  });
});

describe("applyPatch", () => {
  it("replaces one snippet on disk", () => {
    const root = mkdtempSync(join(tmpdir(), "patch-"));
    try {
      const file = join(root, overlapPath);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, closedSource);
      applyPatch(root, overlapPath, closedInterval, halfOpenInterval, ["apps/api/src/domain/"]);
      expect(readFileSync(file, "utf8")).toContain(halfOpenInterval);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
