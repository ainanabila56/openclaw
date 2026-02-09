import { Capability } from "../exec/capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

import { allowToolUsage } from "../../tools/policy";

import { getTool } from "../../tools/registry";
import type { PureToolContext } from "../../tools/tool";

import { InMemorySummary } from "../../memory/in-memory-summary";
import type { WritableMemory } from "../../memory/memory-types";

import { buildModelInput, runModelIfEnabled } from "../model/model-gate";

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
      session_id: input.sessionId ?? "unknown",
      intent: input.intent,
    };

    // ------------------------------------------------------------
    // 1) MODEL PATH (isolated via model gate)
    // ------------------------------------------------------------
    const prompt = summary
      ? `Context: ${summary.text}\n\nUser: ${input.message}`
      : `User: ${input.message}`;

    const modelInput = buildModelInput(input, prompt);
    const modelOut = await runModelIfEnabled(modelInput);

    if (modelOut) {
      let memoryWritten = false;

      if (
        this.capabilities.includes(Capability.MemoryWrite) &&
        modelInput.policy.allowed_memory_write
      ) {
        memory.writeSummary(input.sessionId, {
          text: modelOut.text.slice(0, 500),
          tokens: Math.min(modelOut.text.length, 256),
        });
        memoryWritten = true;
      }

      return {
        payloads: [
          {
            text: summary
              ? `Context: ${summary.text}\n\n${modelOut.text}`
              : modelOut.text,
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
    // 2) TOOL PATH (pure, sync, no memory write)
    // ------------------------------------------------------------
    if (
      this.capabilities.includes(Capability.ToolInvoke) &&
      allowToolUsage()
    ) {
      const tool = getTool("uppercase");
      if (!tool) throw new Error("Uppercase tool not registered");

      const toolOut = tool.run({ text: input.message }, toolContext);

      return {
        payloads: [
          {
            text: summary
              ? `Context: ${summary.text}\n\n${toolOut.text}`
              : toolOut.text,
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
    // 3) DETERMINISTIC FALLBACK
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