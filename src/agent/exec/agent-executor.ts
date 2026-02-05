import type { Capability } from "./capabilities";


export type AgentExecInput = {
  message: string;
  agentId?: string;
  sessionId?: string;
};

export type AgentExecOutput = {
  payloads?: Array<{ text?: string }>;
  meta?: unknown;
};

export interface AgentExecutor {
  readonly capabilities: Capability[];
  execute(input: AgentExecInput): Promise<AgentExecOutput>;
}