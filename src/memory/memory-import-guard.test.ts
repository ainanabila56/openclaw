import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src");
const MEMORY_DIR = path.resolve(ROOT, "memory");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else if (ent.isFile() && ent.name.endsWith(".ts") && !ent.name.endsWith(".test.ts"))
      out.push(full);
  }
  return out;
}

describe("Phase 20 memory import guard", () => {
  it("WritableMemory is not imported outside src/memory", () => {
    const files = walk(ROOT).filter((f) => !f.startsWith(MEMORY_DIR));
    const offenders: string[] = [];

    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      if (src.includes("WritableMemory")) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });
});