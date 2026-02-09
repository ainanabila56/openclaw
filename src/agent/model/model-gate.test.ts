import { describe, it, expect } from "vitest";
import { runModelIfEnabled } from "./model-gate";
import type { ModelInput } from "./model-types";

describe("model gate", () => {
  it("returns null when model usage disabled", async () => {
    const input: ModelInput = {
      policy: {
        request_id: "r",
        session_id: "s",
        intent: "system_query",
        allowed_tools: [],
        allowed_memory_write: false,
      },
      prompt: "status",
    };

    const out = await runModelIfEnabled(input);
    expect(out).toBeNull();
  });
});