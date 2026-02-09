export type MemorySummary = {
  text: string;
  tokens: number;
};

export interface ReadOnlyMemory {
  getSummary(sessionId: string): MemorySummary | null;
}

export interface WritableMemory extends ReadOnlyMemory {
  writeSummary(sessionId: string, summary: MemorySummary): void;
}