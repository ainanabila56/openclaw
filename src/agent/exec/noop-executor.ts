import type { AgentExecutor, AgentExecInput, AgentExecOutput } from "./agent-executor";

export class NoopExecutor implements AgentExecutor {
  async execute(_input: AgentExecInput): Promise<AgentExecOutput> {
    return { payloads: [], meta: { disabled: true } };
  }
}