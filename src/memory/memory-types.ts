export type MemorySummary = {
  readonly text: string;
  readonly tokens: number;
};

export interface ReadOnlyMemory {
  getSummary(sessionId?: string): MemorySummary | null;
}

// Writable is defined here but must not be imported outside src/memory.
// Phase 20 will enforce this via tests.
export interface WritableMemory extends ReadOnlyMemory {
  writeSummary(sessionId: string | undefined, summary: MemorySummary): void;
}