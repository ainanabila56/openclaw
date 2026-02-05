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
  execute(input: AgentExecInput): Promise<AgentExecOutput>;
}