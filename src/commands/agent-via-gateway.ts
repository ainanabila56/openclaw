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
  const res = await handleAgentEntry({
    message: opts.message,
    agentId: opts.agent,
    sessionId: runtime.sessionId ?? "cli",
    channel: "cli",
    traceOnly: Boolean(opts.trace),
  });

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