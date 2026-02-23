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
import { writeMemory, readMemory } from "../../memory/store";

import { buildModelInput, runModelIfEnabled } from "../model/model-gate";

import { IntentResult } from "../../intent/schema.ts";


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
  try {

  // ------------------------------------------------------------
  // Trace — execution start (authoritative)
  // ------------------------------------------------------------
  input.trace?.push({
    stage: "execute_start",
    timestamp: new Date().toISOString(),
    request_id: input.requestId,
  });

    const memory: ReadOnlyMemory = createMemory();
    const summary = memory.getSummary(input.sessionId);

    const toolContext: PureToolContext = {
      request_id: input.requestId,
      session_id: input.sessionId ?? "unknown",
      intent: input.intent,
    };

    // ------------------------------------------------------------
    // 1) TOOL PATH (pure, sync, NO memory write)
    // ------------------------------------------------------------
    if (
      input.allowedCapabilities?.includes(Capability.ToolInvoke) &&
      input.plannedTool
    ) {
      const tool = getTool(input.plannedTool);
      if (!tool) throw new Error(`Planned tool not registered: ${input.plannedTool}`);

      const toolOut = tool.run({ text: input.message }, toolContext);

      const executeEnd = new Date().toISOString();

      input.trace?.push({
        stage: "execute_end",
        timestamp: executeEnd,
	      request_id: input.requestId,
        executor_outcome: "success",
        path: "tool",
      });

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
	        path: "tool",
          tool: tool.name,
          memory: "sealed",
          memory_write: false,
	        trace: input.trace
        },
      };
    }

    // ------------------------------------------------------------
    // 2) MODEL PATH (isolated; NO memory writes in Phase 20)
    // ------------------------------------------------------------
    const prompt = summary
      ? `Context: ${summary.text}\n\nUser: ${input.message}`
      : `User: ${input.message}`;

    // ------------------------------------
    // MEMORY READ
    // ------------------------------------
    const memoryRecord = readMemory();

    // Normalize summary (string or object)
    const memorySummary =
      typeof memoryRecord === "string"
        ? memoryRecord
        : memoryRecord?.summary;

    if (memorySummary) {
      input.trace.push({
        stage: "memory_read",
        timestamp: new Date().toISOString(),
        summary: memorySummary,
      });
    }

    // ------------------------------------
    // CLEAN CHAT PREFIX (if present)
    // ------------------------------------
    const cleanedMessage =
      input.intent === "chat"
        ? input.message.replace(/^chat:\s*/i, "")
        : input.message;

    // ------------------------------------
    // MODEL CALL
    // ------------------------------------
    const modelOut = await runModelIfEnabled({
      message: cleanedMessage,
      intent: input.intent ?? "unknown",
      memorySummary: memorySummary,
    });

    if (modelOut) {

      if (modelOut.summary) {
    writeMemory(modelOut.summary);

    input.trace.push({
      stage: "memory_write",
      timestamp: new Date().toISOString(),
      summary: modelOut.summary,
    });
  }

    const executeEnd = new Date().toISOString();

    input.trace?.push({
      stage: "execute_end",
      timestamp: executeEnd,
      request_id: input.requestId,
      executor_outcome: "success",
      path: "model",
    });

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
	        path: "model",
          model: "rule-based",
          memory: "controlled",
          memory_write: !!modelOut.summary,
	        trace: input.trace
        },
      };
    }

    // ------------------------------------------------------------
    // 3) DETERMINISTIC FALLBACK
    // ------------------------------------------------------------
    const executeEnd = new Date().toISOString();

    input.trace?.push({
      stage: "execute_end",
      timestamp: executeEnd,
      request_id: input.requestId,
      executor_outcome: "success",
      path: "fallback",
    });

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
	      path: "fallback",
        deterministic: true,
        memory: "sealed",
        memory_write: false,
	      trace: input.trace
      },
    };
    } catch (err: any) {
    const executeEnd = new Date().toISOString();

    input.trace?.push({
      stage: "execute_end",
      timestamp: executeEnd,
      request_id: input.requestId,
      executor_outcome: "error",
      error: String(err?.message ?? err),
    });

    throw err; // preserve original behavior
  }
} 
}
