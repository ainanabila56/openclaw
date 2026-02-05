import { Capability } from "./capabilities";
import type { Model } from "../model/model";
import { allowModelUsage } from "../model/policy";

import type { AgentExecutor, AgentExecInput, AgentExecOutput } from "./agent-executor";


export class LocalExecutor implements AgentExecutor {
  readonly capabilities = [Capability.Execute, Capability.ReadOnly];

  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    return {
      payloads: [{ text: "Local executor response for intent-only path" }],
      meta: { executor: "local", deterministic: true },
    };
  }
}