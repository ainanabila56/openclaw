import type { ReadonlyMemory } from "./readonly-memory";
import type { MemorySummary } from "./types";

export class NullMemory implements ReadonlyMemory {
  getSummary(): MemorySummary | null {
    return null;
  }
}