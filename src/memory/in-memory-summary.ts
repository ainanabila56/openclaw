import type { WritableMemory, MemorySummary } from "./memory-types";

const MAX_TOKENS = 256;

export class InMemorySummary implements WritableMemory {
  private store = new Map<string, MemorySummary>();

  getSummary(sessionId: string): MemorySummary | null {
    return this.store.get(sessionId) ?? null;
  }

  writeSummary(sessionId: string, summary: MemorySummary): void {
  throw new Error("Memory write blocked by Phase 20 memory seal");
}
}