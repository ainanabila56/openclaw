import { Capability } from "./capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

export class AltLocalExecutor implements AgentExecutor {
  readonly capabilities = [
    Capability.Execute,
    Capability.ReadOnly,
    Capability.ModelInference,
    Capability.MemoryRead,
  ];

  async execute(_input: AgentExecInput): Promise<AgentExecOutput> {
    return {
      payloads: [{ text: "Alternate local executor response" }],
      meta: { executor: "alt-local", deterministic: true },
    };
  }
}