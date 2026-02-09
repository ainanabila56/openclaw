import type { AgentExecOutput } from "../exec/agent-executor";
import type { AgentEntryRequest } from "./agent-entry";

import { decideRouting } from "../../routing/tiered-routing";
import { getExecutionPolicy } from "../../policy/execution-policy";
import { evaluatePolicy } from "../../policy/evaluate-policy";
import { selectExecutor } from "../exec/select-executor";

import { executionTrace } from "../exec/trace";
import { nextRequestId } from "../trace";

export async function handleAgentEntry(
  req: AgentEntryRequest
): Promise<AgentExecOutput> {
  const message = req.message ?? "";

  // reset trace per request
  executionTrace.length = 0;

  const route = decideRouting(message);
  executionTrace.push({
    intent: route.intent,
    allowed: route.executable,
  });

  const policyDef = getExecutionPolicy();
  const policy = evaluatePolicy(
    policyDef,
    {
      intent: route.intent,
      executorId: route.executable ? "local" : "no_executor",
      requestedCapabilities: [],
    }
  );

  executionTrace.push({
    intent: route.intent,
    allowed: policy.decision === "allow",
  });

  if (req.traceOnly) {
    return {
      payloads: [{ text: "trace-only" }],
      meta: { trace: executionTrace },
    };
  }

  if (policy.decision !== "allow" || !route.executable) {
    return {
      payloads: [{ text: "Execution denied." }],
      meta: { trace: executionTrace },
    };
  }

  const executor = selectExecutor(policy.executorId);
  executionTrace.push({
    intent: route.intent,
    allowed: Boolean(executor),
  });

  if (!executor) {
    return {
      payloads: [{ text: "No executor available." }],
      meta: { trace: executionTrace },
    };
  }

  const out = await executor.execute({
    message,
    agentId: req.agentId,
    sessionId: req.sessionId ?? "cli",
    intent: route.intent,
    requestId: nextRequestId(),
    policyDecision: policy,
  });

  return {
    ...out,
    meta: {
      ...(out.meta ?? {}),
      trace: executionTrace,
    },
  };
}