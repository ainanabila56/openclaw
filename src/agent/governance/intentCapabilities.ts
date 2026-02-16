import { Capability } from "../exec/capabilities";
import type { IntentLabel } from "../../intent/schema.js";

const INTENT_CAPABILITIES: Record<IntentLabel, Capability[]> = {
  unknown: [],

  system_query: [
    Capability.RespondText,
    Capability.MemoryRead,
    Capability.MemoryWrite,
  ],

  transform_text: [
    Capability.RespondText,
    Capability.MemoryRead,
    Capability.MemoryWrite,
    Capability.ToolInvoke,
  ],

  user_message: [
    Capability.RespondText,
  ],
};

export function isCapabilityAllowed(
  intent: IntentLabel,
  capability: Capability,
): boolean {
  return INTENT_CAPABILITIES[intent]?.includes(capability) ?? false;
}

