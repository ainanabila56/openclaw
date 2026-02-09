import { InMemorySummary } from "./in-memory-summary";
import { SealedMemory } from "./sealed-memory";
import type { ReadOnlyMemory } from "./memory-types";

export function createMemory(): ReadOnlyMemory {
  // Phase 20: always sealed. No writes allowed.
  return new SealedMemory(new InMemorySummary());
}