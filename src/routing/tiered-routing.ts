import { inferIntent } from "../intent/infer";
import type { IntentLabel } from "../intent/schema";

export type RoutingDecision = {
  tier: "local-intent";
  executable: boolean;
  label: IntentLabel;
  confidence: number;
};

export function decideRouting(message?: string): RoutingDecision {
  const { label, confidence } = inferIntent(message);

  switch (label) {
    case "system_query":
      return {
        tier: "local-intent",
        executable: confidence >= 0.8,
        label,
        confidence,
      };

    case "user_message":
      return {
        tier: "local-intent",
        executable: false,
        label,
        confidence,
      };

    case "unknown":
      return {
        tier: "local-intent",
        executable: false,
        label,
        confidence,
      };

    default: {
      const _exhaustive: never = label;
      throw new Error(`Unhandled intent: ${_exhaustive}`);
    }
  }
}