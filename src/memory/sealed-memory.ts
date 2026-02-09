import type { MemorySummary, ReadOnlyMemory, WritableMemory } from "./memory-types";

export class SealedMemory implements WritableMemory {
  constructor(private readonly inner: ReadOnlyMemory) {}

  getSummary(sessionId?: string): MemorySummary | null {
    const s = this.inner.getSummary(sessionId);
    if (!s) return null;
    // Deep-freeze the returned object
    return Object.freeze({ text: s.text, tokens: s.tokens });
  }

  writeSummary(): void {
    throw new Error("Memory writes are sealed (Phase 20).");
  }
}