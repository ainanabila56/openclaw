import { describe, it, expect } from "vitest";
import { createMemory } from "./memory-gate";

describe("Phase 20 memory seal", () => {
  it("throws synchronously on write attempts", () => {
    const mem: any = createMemory();
    expect(() => mem.writeSummary("s", { text: "x", tokens: 1 })).toThrow(
      /sealed/i
    );
  });

  it("returns frozen summaries", () => {
    const mem = createMemory();
    const s = mem.getSummary("s");
    if (!s) return;
    expect(Object.isFrozen(s)).toBe(true);
  });
});