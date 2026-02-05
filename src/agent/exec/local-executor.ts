import { Capability } from "./capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

import { allowModelUsage } from "../model/policy";
import { LocalRuleModel } from "../model/local-model";

export class LocalExecutor implements AgentExecutor {
  readonly capabilities = [
    Capability.Execute,
    Capability.ReadOnly,
    Capability.ModelInference,
  ];

  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    if (allowModelUsage()) {
      const model = new LocalRuleModel();
      const output = await model.run({ prompt: input.message });

      return {
        payloads: [{ text: output.text }],
        meta: { executor: "local", model: "rule-based" },
      };
    }

    return {
      payloads: [{ text: "Local executor response for intent-only path" }],
      meta: { executor: "local", deterministic: true },
    };
  }
}