import { afterEach, describe, expect, it } from "vitest";
import { grokArgs, grokSchema, parseGrokStdout } from "../src/grok";
import { resolveProvider } from "../src/model";
import type { AgentTool } from "../src/tools";

const applyPatch: AgentTool = {
  name: "apply_patch",
  description: "patch",
  input_schema: { type: "object", properties: {} },
};

describe("grok provider", () => {
  const previous = process.env.AUTOFIX_PROVIDER;

  afterEach(() => {
    if (previous === undefined) delete process.env.AUTOFIX_PROVIDER;
    else process.env.AUTOFIX_PROVIDER = previous;
  });

  it("uses grok when the provider variable is unset", () => {
    delete process.env.AUTOFIX_PROVIDER;
    expect(resolveProvider()).toBe("grok");
  });

  it("asks for text only when the harness passes no tools", () => {
    const schema = grokSchema([]);
    expect(schema.required).toEqual(["text"]);
    expect(JSON.stringify(schema)).not.toContain("calls");
  });

  it("asks for tool calls when the harness passes tools", () => {
    const schema = grokSchema([applyPatch]);
    expect(schema.required).toEqual(["text", "calls"]);
  });

  it("keeps the CLI out of the repo and caps it at one turn", () => {
    const args = grokArgs("/tmp/prompt.txt", grokSchema([]), "/tmp/autofix-grok");
    expect(args).toContain("--verbatim");
    expect(args).toContain("--max-turns");
    expect(args).toContain("1");
    expect(args).toContain("--cwd");
    expect(args).toContain("/tmp/autofix-grok");
    expect(args).not.toContain("--tools");
  });

  it("reads the structured reply and the token usage", () => {
    const reply = parseGrokStdout(
      JSON.stringify({
        text: "{\"text\":\"Oi\"}",
        structuredOutput: { text: "Oi" },
        usage: { input_tokens: 20, output_tokens: 2 },
      }),
    );
    expect(reply.text).toBe("Oi");
    expect(reply.calls).toEqual([]);
    expect(reply.usage).toEqual({ inputTokens: 20, outputTokens: 2 });
  });

  it("maps an apply_patch call into the harness shape", () => {
    const reply = parseGrokStdout(
      JSON.stringify({
        structuredOutput: {
          text: "troco o comparador",
          calls: [
            {
              name: "apply_patch",
              path: "apps/api/src/domain/overlap.ts",
              old_string: "<=",
              new_string: "<",
              reason: "",
            },
          ],
        },
        usage: { input_tokens: 10, output_tokens: 4 },
      }),
    );
    expect(reply.calls).toEqual([
      {
        name: "apply_patch",
        input: { path: "apps/api/src/domain/overlap.ts", old_string: "<=", new_string: "<" },
      },
    ]);
  });
});
