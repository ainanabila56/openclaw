import { Capability } from "../agent/exec/capabilities";
import type { ExecutionPolicyV2 } from "./policy-types";
import type { IntentLabel } from "../intent/schema";

const POLICY: ExecutionPolicyV2 = {
  version: 2,
  defaultDecision: "deny",

  rules: [
    // ------------------------------------------------------------
    // SYSTEM QUERY (normal chat)
    // ------------------------------------------------------------
    {
      intent: "system_query" as IntentLabel,
      allowExecutors: ["local", "cli"],
      allowCapabilities: [
        Capability.RespondText,
        Capability.MemoryRead,
        Capability.MemoryWrite,
      ],
    },

    // ------------------------------------------------------------
    // TRANSFORM TEXT (Phase 26 tools)
    // Must also allow memory read/write because
    // handleAgentEntry ALWAYS checks them.
    // ------------------------------------------------------------
    {
      intent: "transform_text" as IntentLabel,
      allowExecutors: ["local", "cli"],
      allowCapabilities: [
        Capability.RespondText,
        Capability.ToolInvoke,
        Capability.MemoryRead,
        Capability.MemoryWrite,
      ],
    },
  ],
};

export function getExecutionPolicy(): ExecutionPolicyV2 {
  return POLICY;
}
