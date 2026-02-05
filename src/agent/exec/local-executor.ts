import { Capability } from "./capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

import { allowModelUsage } from "../model/policy";
import { allowToolUsage } from "../../tools/policy";
import { LocalRuleModel } from "../model/local-model";
import { NullMemory } from "../../memory/null-memory";
import { UppercaseTool } from "../../tools/uppercase-tool";

export class LocalExecutor implements AgentExecutor {
  readonly capabilities = [
    Capability.Execute,
    Capability.ReadOnly,
    Capability.ModelInference,
    Capability.MemoryRead,
    Capability.ToolInvoke,
  ];

  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    const memory = new NullMemory();
    const summary = memory.getSummary(input.sessionId);

    // 1) Model path (still policy-gated)
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

    // 2) Tool path (pure, policy-gated)
    if (
      this.capabilities.includes(Capability.ToolInvoke) &&
      allowToolUsage()
    ) {
      const tool = new UppercaseTool();
      const toolOut = tool.run({ text: input.message });

      if (summary) {
        return {
          payloads: [{ text: `Context: ${summary.text}\n\n${toolOut.text}` }],
          meta: { executor: "local", tool: tool.id, memory: "read-only" },
        };
      }

      return {
        payloads: [{ text: toolOut.text }],
        meta: { executor: "local", tool: tool.id },
      };
    }

    // 3) Deterministic fallback
    if (summary) {
      return {
        payloads: [
          {
            text: `Context: ${summary.text}\n\nLocal executor response for intent-only path`,
          },
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