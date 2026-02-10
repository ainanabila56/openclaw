// tests/governance.invariants.test.ts
// Governance enforcement tests for Phase 22
// These tests are intentionally strict and fail-fast.
// Any failure indicates a governance violation, not a functional bug.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const GOVERNED_DIRS = [
  "src/agent",
  "src/commands",
  "src/executors",
  "src/tools",
];

const FORBIDDEN_IMPORTS = [
  "http",
  "https",
  "net",
  "tls",
  "undici",
  "axios",
  "node:fs",
  "fs",
  "child_process",
  "worker_threads",
];

function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, acc);
    } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("Governance invariants — forbidden surfaces", () => {
  const files = GOVERNED_DIRS.flatMap(d =>
    collectFiles(path.join(ROOT, d)),
  );

  for (const forbidden of FORBIDDEN_IMPORTS) {
    test(must not import "${forbidden}" in governed code, () => {
      const offenders = files.filter(file => {
        const src = fs.readFileSync(file, "utf8");
        return src.includes(from "${forbidden}") ||
               src.includes(require("${forbidden}"));
      });

      expect(offenders).toEqual([]);
    });
  }
});

describe("Governance invariants — execution spine integrity", () => {
  test("executor.execute must not be called outside the spine", () => {
    const offenders: string[] = [];

    for (const file of collectFiles(ROOT)) {
      if (file.includes("select-executor") || file.includes("handleAgentEntry")) {
        continue;
      }
      const src = fs.readFileSync(file, "utf8");
      if (src.includes(".execute(")) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });

  test("trace-printer must not be imported into runtime path", () => {
    const offenders = collectFiles(ROOT).filter(file => {
      const src = fs.readFileSync(file, "utf8");
      return src.includes("trace-printer");
    });

    expect(offenders).toEqual([]);
  });
});

describe("Governance invariants — fail-closed behavior (structural)", () => {
  test("policy evaluator must not default-allow", () => {
    const policyFiles = collectFiles(path.join(ROOT, "src"))
      .filter(f => f.toLowerCase().includes("policy"));

    const offenders = policyFiles.filter(file => {
      const src = fs.readFileSync(file, "utf8");
      return src.includes("defaultAllow") || src.includes("allow = true");
    });

    expect(offenders).toEqual([]);
  });
});