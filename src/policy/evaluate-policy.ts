import type {
  ExecutionPolicyV2,
  PolicyEvalContext,
  PolicyEvalResult,
} from "./policy-types";

export function evaluatePolicy(
  policy: ExecutionPolicyV2,
  ctx: PolicyEvalContext,
): PolicyEvalResult {
  const rule = policy.rules.find(r => r.intent === ctx.intent);

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
    if (!rule.allowCapabilities.includes(cap)) {
      return {
        decision: "deny",
        reason_code: "capability_not_allowed",
        detail: { capability: cap },
      };
    }
  }

  return { decision: "allow", reason_code: "ok" };
}