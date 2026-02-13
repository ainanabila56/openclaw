import { getTool } from "./registry";
import type { PureToolContext } from "./pure-tool";

import type {
  ExecutionPolicyV2,
  PolicyEvalContext,
  PolicyEvalResult,
} from "../policy/policy-types";

import { evaluatePolicy } from "../policy/evaluate-policy";

/**
 * Result of attempting to execute a governed tool.
 */
export type GuardedExecutionResult<O> =
  | { decision: "allow"; output: O }
  | { decision: "deny"; reason_code: string; detail?: unknown };

/**
 * Execute a tool ONLY if policy allows it.
 * This is the single governed execution entrypoint.
 */
export function executeGuardedTool<I, O>(
  policy: ExecutionPolicyV2,
  toolName: string,
  input: I,
  ctx: PureToolContext,
): GuardedExecutionResult<O> {
  const tool = getTool(toolName);

  if (!tool) {
    return {
      decision: "deny",
      reason_code: "tool_not_found",
      detail: { toolName },
    };
  }

  const policyCtx: PolicyEvalContext = {
    intent: ctx.intent,
    executorId: "pure-tool",
    requestedCapabilities: [tool.capability],
  };

  const decision: PolicyEvalResult = evaluatePolicy(policy, policyCtx);

  if (decision.decision === "deny") {
    return decision;
  }

  const output = tool.run(input, ctx);

  return {
    decision: "allow",
    output,
  };
}
