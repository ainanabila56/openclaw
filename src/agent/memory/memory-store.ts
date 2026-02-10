export type MemoryKey = {
  agentId: string;
  sessionId: string;
};

export type MemoryRecord = {
  summary: string;
  updatedAtIso: string;
};

export interface MemoryStore {
  read(key: MemoryKey): Promise<MemoryRecord | null>;
  write(key: MemoryKey, record: MemoryRecord): Promise<void>;
}