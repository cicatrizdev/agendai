import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { closedInterval, overlapPath, replayBug001 } from "../src/fixtures/bug-001";
import { runLoop } from "../src/loop";
import { loadTask } from "../src/tasks";
import { runRound } from "../src/stages";

const closedSource = `/** True when two half-open intervals share at least one instant. */
export function overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return ${closedInterval};
}
`;

const failingTest = "uma reserva que termina às 10:00 não conflita com outra que começa às 10:00";

describe("stage harness", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function sandbox(): { root: string; file: string } {
    const root = mkdtempSync(join(tmpdir(), "autofix-stage-"));
    dirs.push(root);
    const file = join(root, overlapPath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, closedSource);
    return { root, file };
  }

  it("round applies the comment once and leaves the 10:00 bug red", async () => {
    const { root, file } = sandbox();
    const task = loadTask("bug-001");
    const result = await runRound(root, task, {
      complete: async (prompt) => replayBug001(prompt),
      readOverlap: () => readFileSync(file, "utf8"),
      testSource: failingTest,
      sensor: () => ({ passed: false, output: "AssertionError: 10:00 still overlaps" }),
    });
    const after = readFileSync(file, "utf8");
    expect(result.toolOutput).toHaveLength(1);
    expect(result.toolOutput[0]).toMatch(/patch aplicado/);
    expect(after).toContain("moment");
    expect(after).toContain(closedInterval);
    expect(result.passed).toBe(false);
    expect(result.output).toContain("10:00");
  });

  it("run escalates the cancellation fee without editing", async () => {
    const { root, file } = sandbox();
    const before = readFileSync(file, "utf8");
    const result = await runLoop(root, loadTask("escalate-001"), {
      complete: async (prompt) => replayBug001(prompt),
      readOverlap: () => readFileSync(file, "utf8"),
    });
    expect(result.stop).toBe("escalado");
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0]?.toolOutput[0]).toMatch(/escalado/);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("round refuses a patch on .env", async () => {
    const { root, file } = sandbox();
    const before = readFileSync(file, "utf8");
    const result = await runRound(root, loadTask("security-001"), {
      complete: async (prompt) => replayBug001(prompt),
      readOverlap: () => readFileSync(file, "utf8"),
      testSource: failingTest,
      sensor: () => ({ passed: false, output: "AssertionError: cancellation allowed" }),
    });
    expect(result.toolOutput[0]).toMatch(/caminho fora do contrato: \.env/);
    expect(result.passed).toBe(false);
    expect(readFileSync(file, "utf8")).toBe(before);
  });
});
