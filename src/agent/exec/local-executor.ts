import { Capability } from "../exec/capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

import { allowModelUsage } from "../model/policy";
import { allowToolUsage } from "../../tools/policy";

import { LocalRuleModel } from "../model/local-model";

import { getTool } from "../../tools/registry";
import type { PureToolContext } from "../../tools/tool";

import { InMemorySummary } from "../../memory/in-memory-summary";
import type { WritableMemory } from "../../memory/memory-types";

export class LocalExecutor implements AgentExecutor {
  readonly id = "local";

  readonly capabilities = [
    Capability.Execute,
    Capability.ReadOnly,
    Capability.ModelInference,
    Capability.MemoryRead,
    Capability.MemoryWrite,
    Capability.ToolInvoke,
  ];

  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    const memory: WritableMemory = new InMemorySummary();
    const summary = memory.getSummary(input.sessionId);

    const toolContext: PureToolContext = {
      request_id: input.requestId,
      session_id: input.sessionId,
      intent: input.intent,
    };

    // ------------------------------------------------------------
    // 1) MODEL PATH (policy-gated, memory-write allowed)
    // ------------------------------------------------------------
    if (allowModelUsage()) {
      const model = new LocalRuleModel();
      const output = await model.run({ prompt: input.message });

      let memoryWritten = false;

      if (this.capabilities.includes(Capability.MemoryWrite)) {
        memory.writeSummary(input.sessionId, {
          text: output.text.slice(0, 500),
          tokens: Math.min(output.text.length, 256),
        });
        memoryWritten = true;
      }

      return {
        payloads: [
          {
            text: summary
              ? `Context: ${summary.text}\n\n${output.text}`
              : output.text,
          },
        ],
        meta: {
          executor: "local",
          model: "rule-based",
          memory: "bounded",
          memory_write: memoryWritten,
        },
      };
    }

    // ------------------------------------------------------------
    // 2) TOOL PATH (pure, sync, NO memory write)
    // ------------------------------------------------------------
    if (
      this.capabilities.includes(Capability.ToolInvoke) &&
      allowToolUsage()
    ) {
      const tool = getTool("uppercase");
      if (!tool) {
        throw new Error("Uppercase tool not registered");
      }

      const toolOutput = tool.run(
        { text: input.message },
        toolContext
      );

      return {
        payloads: [
          {
            text: summary
              ? `Context: ${summary.text}\n\n${toolOutput.text}`
              : toolOutput.text,
          },
        ],
        meta: {
          executor: "local",
          tool: tool.id,
          memory: "read-only",
          memory_write: false,
        },
      };
    }

    // ------------------------------------------------------------
    // 3) DETERMINISTIC FALLBACK (no model, no tool, no memory write)
    // ------------------------------------------------------------
    return {
      payloads: [
        {
          text: summary
            ? `Context: ${summary.text}\n\nLocal executor response for intent-only path`
            : "Local executor response for intent-only path",
        },
      ],
      meta: {
        executor: "local",
        deterministic: true,
        memory: "read-only",
        memory_write: false,
      },
    };
  }
}