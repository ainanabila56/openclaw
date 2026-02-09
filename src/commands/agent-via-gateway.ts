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

  return res;
}