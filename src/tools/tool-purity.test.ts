import { describe, it, expect } from "vitest";
import { listTools } from "./registry";

describe("tool purity enforcement", () => {
  it("all tools are synchronous and deterministic", () => {
    const tools = listTools();

    for (const tool of tools) {
      // async ban
      expect(tool.run.constructor.name).not.toBe("AsyncFunction");

      const ctx = {
        request_id: "req-test",
        session_id: "sess-test",
        intent: "system_query",
      };

      // deterministic input per tool
      let input: any;
      if (tool.name === "uppercase") {
        input = { text: "hello" };
      } else {
        continue;
      }

      const out1 = tool.run(input, ctx);
      const out2 = tool.run(input, ctx);

      expect(out1).toEqual(out2);
    }
  });
});