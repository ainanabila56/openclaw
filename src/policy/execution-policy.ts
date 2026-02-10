import { Capability } from "../agent/exec/capabilities";
import type { ExecutionPolicyV2 } from "./policy-types";
import type { IntentLabel } from "../intent/schema";

const POLICY: ExecutionPolicyV2 = {
  version: 2,
  defaultDecision: "deny",
  rules: [
    {
      // exact parity with Phase 13 behavior
      intent: "system_query" as IntentLabel,
      allowExecutors: ["local"], // must match executor.id
      allowCapabilities: [
        Capability.RespondText,
      ],
    },
  ],
};

export function getExecutionPolicy(): ExecutionPolicyV2 {
  return POLICY;
}