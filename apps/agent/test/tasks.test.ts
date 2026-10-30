import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadIssue } from "../src/issue";
import { loadTask } from "../src/tasks";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function issueFile(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), "autofix-issue-"));
  dirs.push(dir);
  const file = join(dir, "abc-1.md");
  writeFileSync(file, contents);
  return file;
}

describe("task catalog", () => {
  it("reads the task from the eval: prompt, contract and hidden test", () => {
    const task = loadTask("bug-001");
    expect(task.id).toBe("bug-001");
    expect(task.report).toBe("Não consigo marcar às 10h se já tem alguém até as 10h.");
    expect(task.prompt).toContain("Escreva primeiro um teste");
    expect(task.bug).toBe("bug-001");
    expect(task.allowedPrefixes).toEqual(["apps/api/src/domain/", "apps/api/test/"]);
    expect(task.sensorRelPath).toBe("apps/api/test/hidden/overlap-boundary.test.ts");
    expect(task.hiddenSource).toBe(
      "evals/tasks/bug-001/hidden-tests/apps/api/test/hidden/overlap-boundary.test.ts",
    );
    expect(task.origin).toBe("eval");
  });

  it("keeps the security task's bug and oracle from the eval", () => {
    const task = loadTask("security-001");
    expect(task.bug).toBe("bug-003");
    expect(task.sensorRelPath).toBe("apps/api/test/hidden/cancellation-window.test.ts");
    expect(task.allowedPrefixes).toEqual(["apps/api/src/domain/", "apps/api/test/"]);
  });

  it("loads an escalation task without a test", () => {
    const task = loadTask("escalate-001");
    expect(task.bug).toBe("");
    expect(task.sensorRelPath).toBe("");
    expect(task.expectedOutcome).toBe("escalate");
  });

  it("keeps a bug task as a fix", () => {
    expect(loadTask("bug-001").expectedOutcome).toBe("fix");
  });

  it("refuses a family that does not run in the class harness", () => {
    expect(() => loadTask("build-001")).toThrow(/não roda no harness de sala/);
  });

  it("refuses an unknown task", () => {
    expect(() => loadTask("bug-999")).toThrow(/tarefa desconhecida/);
  });
});

describe("issue adapter", () => {
  it("uses the issue words and the eval oracle", () => {
    const file = issueFile(
      ["---", "task: bug-001", "origin: linear", "---", 'Issue ABC-1: "some às 10h"', ""].join("\n"),
    );
    const issue = loadIssue(file);
    expect(issue.task.id).toBe("bug-001");
    expect(issue.task.prompt).toBe('Issue ABC-1: "some às 10h"');
    expect(issue.task.origin).toBe("issue");
    expect(issue.task.sensorRelPath).toBe("apps/api/test/hidden/overlap-boundary.test.ts");
  });

  it("resolves a Linear ticket through the map", () => {
    const file = issueFile(
      ["---", "ticket: AGE-1", "origin: linear", "---", 'Issue AGE-1: "some às 10h"'].join("\n"),
    );
    const issue = loadIssue(file);
    expect(issue.task.id).toBe("bug-001");
    expect(issue.task.origin).toBe("issue");
  });

  it("refuses a ticket that is not in the map", () => {
    const file = issueFile(["---", "ticket: AGE-999", "---", "texto"].join("\n"));
    expect(() => loadIssue(file)).toThrow(/não está em evals\/linear-map.json/);
  });

  it("refuses an issue without a task mapping", () => {
    const file = issueFile("Issue ABC-2: sem frontmatter\n");
    expect(() => loadIssue(file)).toThrow(/não declara "task:"/);
  });

  it("refuses an issue mapped to an unknown task", () => {
    const file = issueFile(["---", "task: bug-999", "---", "texto"].join("\n"));
    expect(() => loadIssue(file)).toThrow(/tarefa desconhecida/);
  });
});
