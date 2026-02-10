import type { AgentExecOutput } from "../exec/agent-executor";
import type { AgentEntryRequest } from "./agent-entry";

import { getExecutionPolicy } from "../../policy/execution-policy";
import { evaluatePolicy } from "../../policy/evaluate-policy";

import { executionTrace } from "../exec/trace";
import { nextRequestId } from "../trace";

// Phase 23: local intent authority (simulated)
import { LocalSmlStub } from "../intent-authority";

const PHASE_23_HARD_BLOCK = true;

export async function handleAgentEntry(
  req: AgentEntryRequest
): Promise<AgentExecOutput> {
  const message = req.message ?? "";

  // reset trace per request
  executionTrace.length = 0;

  // -----------------------------
  // Phase 23 — Intent Authority
  // -----------------------------
  const intentResult = LocalSmlStub.inferIntent({ message });

  executionTrace.push({
    intent: intentResult.intent,
    allowed: true, // intent resolution itself is not a permission
  });

  // -----------------------------
  // Policy Evaluation
  // -----------------------------
  const policyDef = getExecutionPolicy();
  const policy = evaluatePolicy(policyDef, {
    intent: intentResult.intent,
    executorId: "local",
    requestedCapabilities: [],
  });

  executionTrace.push({
    intent: intentResult.intent,
    allowed: policy.decision === "allow",
  });


  // -----------------------------
  // Phase 23 Hard Block
  // -----------------------------
  if (PHASE_23_HARD_BLOCK) {
    return {
      payloads: [
        {
          text: "Execution blocked (Phase 23: intent authority proof).",
        },
      ],
      meta: {
        trace: executionTrace,
        intent: intentResult,
        policy,
        requestId: nextRequestId(),
      },
    };
  }

  // ----------------------------------------------------
  // NOTE:
  // No executor selection
  // No executor execution
  // No tools
  // No memory
  // No side effects
  // ----------------------------------------------------
}