import type { WritableMemory, MemorySummary } from "./memory-types";

const MAX_TOKENS = 256;

export class InMemorySummary implements WritableMemory {
  private store = new Map<string, MemorySummary>();

  getSummary(sessionId: string): MemorySummary | null {
    return this.store.get(sessionId) ?? null;
  }

  writeSummary(sessionId: string, summary: MemorySummary): void {
    if (summary.tokens > MAX_TOKENS) {
      throw new Error("Memory summary exceeds token limit");
    }
    this.store.set(sessionId, summary);
  }
}