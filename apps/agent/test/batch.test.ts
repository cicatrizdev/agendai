import { describe, expect, it } from "vitest";
import { parseTaskIds, summarizeRun } from "../src/batch";

describe("parseTaskIds", () => {
  it("reads one id", () => {
    expect(parseTaskIds("bug-001")).toEqual(["bug-001"]);
  });

  it("splits a comma-separated list and trims spaces", () => {
    expect(parseTaskIds("bug-001, bug-002,bug-003")).toEqual(["bug-001", "bug-002", "bug-003"]);
  });

  it("rejects an empty slot in the list", () => {
    expect(() => parseTaskIds("bug-001,,bug-002")).toThrow(/tarefa vazia/);
  });

  it("rejects a blank flag", () => {
    expect(() => parseTaskIds("  ")).toThrow(/tarefa vazia/);
  });
});

describe("summarizeRun", () => {
  it("is passou only when every task passou", () => {
    const summary = summarizeRun([
      { id: "bug-001", stop: "passou" },
      { id: "bug-002", stop: "passou" },
    ]);
    expect(summary.overall).toBe("passou");
    expect(summary.failed).toEqual([]);
  });

  it("is não passou when any task did not pass, and lists those reasons", () => {
    const summary = summarizeRun([
      { id: "bug-001", stop: "passou" },
      { id: "bug-002", stop: "teto" },
      { id: "escalate-001", stop: "escalado" },
      { id: "bug-003", stop: "recusado" },
    ]);
    expect(summary.overall).toBe("não passou");
    expect(summary.failed).toEqual([
      { id: "bug-002", stop: "teto" },
      { id: "escalate-001", stop: "escalado" },
      { id: "bug-003", stop: "recusado" },
    ]);
  });
});
