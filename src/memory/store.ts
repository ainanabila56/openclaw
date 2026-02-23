import fs from "fs";
import path from "path";

export interface MemoryRecord {
  summary: string;
  updatedAt: string;
}

const MEMORY_PATH = path.join(__dirname, "../../.openclaw-memory.json");

export function writeMemory(summary: string) {
  const record: MemoryRecord = {
    summary,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(MEMORY_PATH, JSON.stringify(record, null, 2), "utf8");
}

export function readMemory(): MemoryRecord | null {
  if (!fs.existsSync(MEMORY_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(MEMORY_PATH, "utf8");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}