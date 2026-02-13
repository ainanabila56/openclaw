import type { AgentExecOutput } from "../exec/agent-executor";
import type { AgentEntryRequest } from "./agent-entry";

import { getExecutionPolicy } from "../../policy/execution-policy";
import { evaluatePolicy } from "../../policy/evaluate-policy";

import { executionTrace } from "../exec/trace";
import { Capability } from "../exec/capabilities";

import { LocalSmlStub } from "../intent-authority";
import { LocalDevModel } from "../main-model/local-dev-model";

import { InMemoryStore } from "../memory/in-memory-store";
import { planTool } from "../tools/tool-planner";

import { LocalExecutor } from "../exec/local-executor";
import * as crypto from "node:crypto";

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

  // -----------------------------
  // Intent Authority
  // -----------------------------
  const intentResult = LocalSmlStub.inferIntent({ message });

  executionTrace.push({
    intent: intentResult.intent,
    allowed: true,
  });

  // -----------------------------
  // Tool Planning
  // -----------------------------
  const toolPlan = planTool(intentResult.intent, message);

  executionTrace.push({
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

  executionTrace.push({
    intent: intentResult.intent,
    allowed: respondPolicy.decision === "allow",
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

  executionTrace.push({
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

  const memWriteAllowed = memWritePolicy.decision === "allow";

if (memWriteAllowed) {
  const summary =
    typeof reply.summary === "string" && reply.summary.length > 0
      ? reply.summary
      : `last_user_message=${message.slice(0, 200)}`;

  await memoryStore.write(
    { agentId, sessionId },
    {
      summary: clampSummary(summary),
      updatedAtIso: new Date().toISOString(),
    }
  );
}


  executionTrace.push({
    intent: intentResult.intent,
    allowed: memWriteAllowed,
  });

  // ------------------------------------------------------------
  // 🔥 Phase 26 — Authoritative execution via LocalExecutor
  // ------------------------------------------------------------
  const executor = new LocalExecutor();

  return await executor.execute({
  message,
  intent: intentResult.intent,
  requestId: crypto.randomUUID(),
  policyDecision: respondPolicy.decision,
  sessionId,
  agentId,
  plannedTool: toolPlan?.toolName,
  allowedCapabilities: [
    Capability.RespondText,
    Capability.ToolInvoke,
    Capability.MemoryRead,
  ],
});

}
