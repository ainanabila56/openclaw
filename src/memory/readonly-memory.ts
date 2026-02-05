import type { MemorySummary } from "./types";

export interface ReadonlyMemory {
  getSummary(sessionId?: string): MemorySummary | null;
}