import type {
  ExecutionPolicyV2,
  PolicyEvalContext,
  PolicyEvalResult,
} from "./policy-types.js";

import { isCapabilityAllowed } from "../agent/governance/intentCapabilities.js";


export function evaluatePolicy(
  policy: ExecutionPolicyV2,
  ctx: PolicyEvalContext,
): PolicyEvalResult {
  const rule = policy.rules[ctx.intent];

  if (!rule) {
    return {
      decision: "deny",
      reason_code: "intent_not_allowed",
      detail: { intent: ctx.intent },
    };
  }

  if (!rule.allowExecutors.includes(ctx.executorId)) {
    return {
      decision: "deny",
      reason_code: "executor_not_allowed",
      detail: { executorId: ctx.executorId },
    };
  }

  for (const cap of ctx.requestedCapabilities) {
  // Check rule-level allow list
  if (!rule.allowCapabilities.includes(cap)) {
    return {
      decision: "deny",
      reason_code: "capability_not_allowed",
      detail: { capability: cap },
    };
  }

  // NEW: check global intent → capability governance
  if (!isCapabilityAllowed(ctx.intent, cap)) {
    return {
      decision: "deny",
      reason_code: "capability_not_allowed_by_intent_map",
      detail: { intent: ctx.intent, capability: cap },
    };
  }
}


  return { decision: "allow", reason_code: "ok" };
}