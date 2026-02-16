import type { Capability } from "../agent/exec/capabilities.js";
import type { IntentLabel } from "../intent/schema.js";


export type IntentValue = string;

export type PolicyDecision = "allow" | "deny";

export type PolicyReasonCode =
  | "ok"
  | "intent_not_allowed"
  | "executor_not_allowed"
  | "capability_not_allowed";

export interface PolicyEvalContext {
  intent: IntentLabel;
  executorId: string;
  requestedCapabilities: readonly Capability[];
}

export interface PolicyEvalResult {
  decision: PolicyDecision;
  reason_code: PolicyReasonCode;
  detail?: Record<string, unknown>;
}

export interface IntentPolicyRule {
  intent: IntentLabel;
  allowExecutors: readonly string[];
  allowCapabilities: readonly Capability[];
}

export interface ExecutionPolicyV2 {
  version: 2;
  defaultDecision: "deny";
  rules: Readonly<Record<IntentLabel, IntentPolicyRule>>;
}