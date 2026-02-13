import { Capability } from "../exec/capabilities";
import type {
  AgentExecutor,
  AgentExecInput,
  AgentExecOutput,
} from "./agent-executor";

import { getTool } from "../../tools/registry";
import type { PureToolContext } from "../../tools/tool";

import { createMemory } from "../../memory/memory-gate";
import type { ReadOnlyMemory } from "../../memory/memory-types";

import { buildModelInput, runModelIfEnabled } from "../model/model-gate";

export class LocalExecutor implements AgentExecutor {
  readonly id = "local";

  // Phase 20: remove MemoryWrite capability.
  readonly capabilities = [
    Capability.Execute,
    Capability.ReadOnly,
    Capability.ModelInference,
    Capability.MemoryRead,
    Capability.ToolInvoke,
  ];

  async execute(input: AgentExecInput): Promise<AgentExecOutput> {
    const memory: ReadOnlyMemory = createMemory();
    const summary = memory.getSummary(input.sessionId);

    const toolContext: PureToolContext = {
      request_id: input.requestId,
      session_id: input.sessionId ?? "unknown",
      intent: input.intent,
    };

    // ------------------------------------------------------------
    // 1) MODEL PATH (isolated; NO memory writes in Phase 20)
    // ------------------------------------------------------------
    const prompt = summary
      ? `Context: ${summary.text}\n\nUser: ${input.message}`
      : `User: ${input.message}`;

    const modelInput = buildModelInput(input, prompt);
    const modelOut = await runModelIfEnabled(modelInput);

    if (modelOut) {
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
          memory: "sealed",
          memory_write: false,
        },
      };
    }

    // ------------------------------------------------------------
    // 2) TOOL PATH (pure, sync, NO memory write)
    // ------------------------------------------------------------
    if (
      input.allowedCapabilities?.includes(Capability.ToolInvoke) &&
      input.plannedTool
    ) {
      const tool = getTool(input.plannedTool);
      if (!tool) throw new Error(`Planned tool not registered: ${input.plannedTool}`);

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
          tool: tool.name,
          memory: "sealed",
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
        memory: "sealed",
        memory_write: false,
      },
    };
  }
}
