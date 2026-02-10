import type { MemoryKey, MemoryRecord, MemoryStore } from "./memory-store";

function keyToString(k: MemoryKey): string {
  return `${k.agentId}::${k.sessionId}`;
}

export class InMemoryStore implements MemoryStore {
  private readonly db = new Map<string, MemoryRecord>();

  async read(key: MemoryKey): Promise<MemoryRecord | null> {
    return this.db.get(keyToString(key)) ?? null;
  }

  async write(key: MemoryKey, record: MemoryRecord): Promise<void> {
    this.db.set(keyToString(key), record);
  }
}