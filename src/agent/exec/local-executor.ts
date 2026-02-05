import type { AgentExecutor, AgentExecInput, AgentExecOutput } from "./agent-executor";

export class LocalExecutor implements AgentExecutor {
  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    return {
      payloads: [{ text: Local executor response for intent-only path }],
      meta: { executor: "local", deterministic: true },
    };
  }
}