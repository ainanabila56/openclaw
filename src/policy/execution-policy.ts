import { Capability } from "../agent/exec/capabilities";
import type { ExecutionPolicyV2 } from "./policy-types";

const POLICY: ExecutionPolicyV2 = {
  version: 2,
  defaultDecision: "deny",
  rules: [
    {
      // exact parity with Phase 13 behavior
      intent: "system_query",
      allowExecutors: ["local"], // must match executor.id
      allowCapabilities: [
        Capability.Execute,
        Capability.ReadOnly,
        Capability.ModelInference,
        Capability.MemoryRead,
        Capability.ToolInvoke,
      ],
    },
  ],
};

export function getExecutionPolicy(): ExecutionPolicyV2 {
  return POLICY;
}