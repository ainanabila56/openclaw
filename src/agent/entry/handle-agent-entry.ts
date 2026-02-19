import type { AgentExecOutput } from "../exec/agent-executor";
import type { AgentEntryRequest } from "./agent-entry";

import { getExecutionPolicy } from "../../policy/execution-policy";
import { evaluatePolicy } from "../../policy/evaluate-policy";

import { executionTrace } from "../exec/trace";
import { Capability } from "../exec/capabilities";

import { LocalSmlStub } from "../intent-authority";
import { LocalDevModel } from "../main-model/local-dev-model";

import { InMemoryStore } from "../memory/in-memory-store";
import { createMemory } from "../../memory/memory-gate";
import type { WritableMemory } from "../memory/memory-types";

import { planTool } from "../tools/tool-planner";

import { LocalExecutor } from "../exec/local-executor";
import * as crypto from "node:crypto";

import { listTools } from "../../tools/registry";

const memoryStore = new InMemoryStore();
const SUMMARY_MAX_LEN = 500;

function clampSummary(s: string): string {
  if (s.length <= SUMMARY_MAX_LEN) return s;
  return s.slice(0, SUMMARY_MAX_LEN);
}

export async function handleAgentEntry(
  req: AgentEntryRequest
): Promise<AgentExecOutput> {
  const message = req.message ?? "";
  const agentId = req.agentId ?? "cli";
  const sessionId = req.sessionId ?? "cli";

  executionTrace.length = 0;

// ------------------------------------------------------------
// Trace bootstrap (authority start)
// ------------------------------------------------------------
const requestId = crypto.randomUUID();

function pushTrace(stage: string, data: Record<string, any> = {}) {
  executionTrace.push({
    stage,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

pushTrace("trace_start", {
  request_id: requestId,
});


  // -----------------------------
  // Intent Authority
  // -----------------------------
  const intentResult = LocalSmlStub.inferIntent({ message });

  pushTrace("intent_authority", {
    intent: intentResult.intent,
    allowed: true,
  });

  // -----------------------------
  // Tool Planning
  // -----------------------------
  const toolPlan = planTool(intentResult.intent, message);

  pushTrace("tool_planning", {
    intent: intentResult.intent,
    allowed: toolPlan !== null,
  });

  const policyDef = getExecutionPolicy();

  // -----------------------------
  // Policy: respond:text (required)
  // -----------------------------
  const respondPolicy = evaluatePolicy(policyDef, {
    intent: intentResult.intent,
    executorId: "local",
    requestedCapabilities: [Capability.RespondText],
  });

  pushTrace("policy_respond", {
    intent: intentResult.intent,
    allowed: respondPolicy.decision === "allow",
  });

  pushTrace("policy_decision", {
    request_id: requestId,
    decision: respondPolicy.decision, // explicit authority decision
  });

  if (respondPolicy.decision !== "allow") {
    return {
      payloads: [{ text: "Execution denied." }],
      meta: { trace: executionTrace },
    };
  }

  // -----------------------------
  // Policy: memory read (optional)
  // -----------------------------
  const memory = createMemory();
  
  let memorySummary: string | undefined;

  const memReadPolicy = evaluatePolicy(policyDef, {
    intent: intentResult.intent,
    executorId: "local",
    requestedCapabilities: [Capability.RespondText, Capability.MemoryRead],
  });

  const memReadAllowed = memReadPolicy.decision === "allow";

  if (memReadAllowed) {
    const rec = await memoryStore.read({ agentId, sessionId });
    memorySummary = rec?.summary;
  }

  pushTrace("memory_read", {
    intent: intentResult.intent,
    allowed: memReadAllowed,
  });

  // -----------------------------
  // Governed model reply
  // -----------------------------
  const reply = await LocalDevModel.generate({
    message,
    intent: intentResult.intent,
    memorySummary,
  });

  // -----------------------------
  // Policy: memory write (optional)
  // -----------------------------
  const memWritePolicy = evaluatePolicy(policyDef, {
    intent: intentResult.intent,
    executorId: "local",
    requestedCapabilities: [Capability.RespondText, Capability.MemoryWrite],
  });


   let memWriteAllowed = false;

try {
  if (memWritePolicy.decision === "allow") {
    memWriteAllowed = true;

    const rawSummary =
      typeof reply.summary === "string" && reply.summary.length > 0
        ? reply.summary
        : `last_user_message=${message.slice(0, 200)}`;

    const clamped = clampSummary(rawSummary);

    memory.writeSummary(sessionId, {
      text: clamped,
      tokens: clamped.length,
    });
  }
} catch (err) {
  pushTrace("memory_write_error", {
    error: String(err),
  });

  throw err; // REQUIRED for Phase 20
}

pushTrace("memory_write", {
  intent: intentResult.intent,
  allowed: memWriteAllowed,
});

  const executor = new LocalExecutor(); 
   
  const execResult = await executor.execute({
  message,
  intent: intentResult.intent,
  requestId,
  policyDecision: respondPolicy.decision,
  sessionId,
  agentId,
  plannedTool: toolPlan?.toolName,
  allowedCapabilities: [
    Capability.RespondText,
    Capability.ToolInvoke,
    Capability.MemoryRead,
  ],
  trace: executionTrace,
});

// ------------------------------------------------------------
// Phase 26 FINAL — executor authority trace
// ------------------------------------------------------------
pushTrace("executor_path", {
  intent: intentResult.intent,
  allowed: true,
  path: toolPlan ? "tool" : "model_or_fallback",
});

return {
  ...execResult,
  meta: {
    ...execResult.meta,
    trace: executionTrace,
  },
};

}
