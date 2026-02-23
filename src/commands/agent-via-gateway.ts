import type { CliDeps } from "../cli/deps.js";
import type { RuntimeEnv } from "../runtime.js";

import { handleAgentEntry } from "../agent/entry/handle-agent-entry.js";

export async function agentCliCommand(
  deps: CliDeps,
  runtime: RuntimeEnv,
  opts: {
    message: string;
    agent?: string;
    channel?: string;
    trace?: boolean;
  }
) {

let res;

try {
  res = await handleAgentEntry({
    message: opts.message ?? "",
    agentId: opts.agent,
    sessionId: "cli",
    channel: "cli",
    traceOnly: Boolean(opts.trace),
  });
} catch (err) {
  if (opts.trace && err && typeof err === "object") {
    const maybeTrace = (err as any).__trace;
    if (Array.isArray(maybeTrace)) {
      console.log(JSON.stringify(maybeTrace, null, 2));
    }
  }

  console.error(
    err instanceof Error ? err.message : String(err)
  );

  process.exit(1);
}

  // -----------------------------
  // Phase 23: explicit rendering
  // -----------------------------
  for (const p of res.payloads ?? []) {
    if (typeof p.text === "string") {
      console.log(p.text);
    }
  }

  //always print trace when present
  if (res.meta?.trace) {
    console.log(JSON.stringify(res.meta.trace, null, 2));
  }

  return res;
}