import type { AgentExecOutput } from "../exec/agent-executor";

export type AgentEntryRequest = {
  readonly message: string;
  readonly sessionId?: string;
  readonly agentId?: string;
  readonly channel: "cli" | "server";
  readonly traceOnly: boolean;
};

export interface AgentEntry {
  handle(req: AgentEntryRequest): Promise<AgentExecOutput>;
}