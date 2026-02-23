import { Capability } from "../agent/exec/capabilities.js";
import type { ExecutionPolicyV2, IntentPolicyRule  } from "./policy-types.js";
import type { IntentLabel } from "../intent/schema.js";

const RULES: Record<IntentLabel, IntentPolicyRule> = {
  unknown: {
    intent: "unknown",
    allowExecutors: [],
    allowCapabilities: [],
  },

  system_query: {
    intent: "system_query",
    allowExecutors: ["local", "cli"],
    allowCapabilities: [
      Capability.RespondText,
    ],
  },

  user_message: {
    intent: "user_message",
    allowExecutors: ["local", "cli"],
    allowCapabilities: [
      Capability.RespondText,
      Capability.MemoryRead,
      Capability.MemoryWrite,
    ],
  },

  transform_text: {
    intent: "transform_text",
    allowExecutors: ["local", "cli"],
    allowCapabilities: [
      Capability.RespondText,
      Capability.ToolInvoke,
      Capability.MemoryRead,
    ],
  },

};

const POLICY: ExecutionPolicyV2 = {
  version: 2,
  defaultDecision: "deny",
  rules: RULES,
};

export function getExecutionPolicy(): ExecutionPolicyV2 {
  return POLICY;
}
