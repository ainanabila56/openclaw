import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src");
const ENTRY_DIR = path.resolve(ROOT, "agent", "entry");

const FORBIDDEN = [
  "../exec/select-executor",
  "/exec/select-executor",
  "LocalExecutor",
  "../model/model-gate",
  "/model/model-gate",
  "../../tools/registry",
  "/tools/registry",
];

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

describe("Phase 21 entry surface freeze", () => {
  it("forbids direct runtime imports outside entry layer", () => {
    const AGENT_DIR = path.resolve(ROOT, "agent");

const files = walk(ROOT).filter(
  (f) =>
    !f.startsWith(ENTRY_DIR) && // entry itself allowed
    !f.startsWith(AGENT_DIR)    // agent internals allowed
);
    const offenders: { file: string; token: string }[] = [];

    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      for (const token of FORBIDDEN) {
        if (src.includes(token)) offenders.push({ file, token });
      }
    }

    expect(offenders).toEqual([]);
  });
});