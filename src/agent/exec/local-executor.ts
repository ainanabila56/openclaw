import { Capability } from "./capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

import { allowModelUsage } from "../model/policy";
import { LocalRuleModel } from "../model/local-model";
import { NullMemory } from "../../memory/null-memory";

export class LocalExecutor implements AgentExecutor {
  readonly capabilities = [
    Capability.Execute,
    Capability.ReadOnly,
    Capability.ModelInference,
    Capability.MemoryRead,
  ];

  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    const memory = new NullMemory();
    const summary = memory.getSummary(input.sessionId);

    if (allowModelUsage()) {
      const model = new LocalRuleModel();
      const output = await model.run({ prompt: input.message });

      if (summary) {
        return {
          payloads: [{ text: `Context: ${summary.text}\n\n${output.text}` }],
          meta: { executor: "local", model: "rule-based", memory: "read-only" },
        };
      }

      return {
        payloads: [{ text: output.text }],
        meta: { executor: "local", model: "rule-based" },
      };
    }

    if (summary) {
      return {
        payloads: [
          { text: `Context: ${summary.text}\n\nLocal executor response for intent-only path`},
        ],
        meta: { executor: "local", deterministic: true, memory: "read-only" },
      };
    }

    return {
      payloads: [{ text: "Local executor response for intent-only path" }],
      meta: { executor: "local", deterministic: true },
    };
  }
}