import { describe, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const BANNED = [
  "fs",
  "node:fs",
  "http",
  "https",
  "node:http",
  "node:https",
  "net",
  "node:net",
  "tls",
  "crypto",
  "node:crypto",
  "child_process",
  "node:child_process",
  "Date.now",
  "new Date",
  "Math.random",
];

// HARD anchor: src/tools
const TOOLS_DIR = path.resolve(__dirname);

function scanTools(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // NEVER leave src/tools
      files.push(...scanTools(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      entry.name !== "registry.ts" &&
      entry.name !== "index.ts" &&
      entry.name !== "pure-tool.ts"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("tool import purity", () => {
  it("no banned imports or globals are used in tools", () => {
    const files = scanTools(TOOLS_DIR);

    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");

      for (const banned of BANNED) {
        if (src.includes(banned)) {
          throw new Error(
            `Banned token "${banned}" found in tool file: ${file}`
          );
        }
      }
    }
  });
});