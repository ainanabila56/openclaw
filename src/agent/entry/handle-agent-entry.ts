import type { AgentExecOutput } from "../exec/agent-executor";
import type { AgentEntryRequest } from "./agent-entry";

import { getExecutionPolicy } from "../../policy/execution-policy";
import { evaluatePolicy } from "../../policy/evaluate-policy";

import { executionTrace } from "../exec/trace";
import { Capability } from "../exec/capabilities";

// Phase 23 carry-over: intent authority
import { LocalSmlStub } from "../intent-authority";

// Phase 24: governed main model
import { LocalDevModel } from "../main-model/local-dev-model";

export async function handleAgentEntry(
  req: AgentEntryRequest
): Promise<AgentExecOutput> {
  const message = req.message ?? "";

  // reset trace per request
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
  // Policy Evaluation
  // -----------------------------
  const policyDef = getExecutionPolicy();
  const policy = evaluatePolicy(policyDef, {
    intent: intentResult.intent,
    executorId: "local",
    requestedCapabilities: [Capability.RespondText],
  });

  executionTrace.push({
    intent: intentResult.intent,
    allowed: policy.decision === "allow",
  });

  // -----------------------------
  // Capability Gate (Phase 24)
  // -----------------------------
  if (policy.decision !== "allow") {
    return {
      payloads: [{ text: "Execution denied." }],
      meta: { trace: executionTrace },
    };
  }

  executionTrace.push({
    intent: intentResult.intent,
    allowed: true,
  });

  // -----------------------------
  // Single Governed Model Reply
  // -----------------------------
  const reply = await LocalDevModel.generate({
    message,
    intent: intentResult.intent,
  });

  return {
    payloads: [{ text: reply.text }],
    meta: { trace: executionTrace },
  };
}