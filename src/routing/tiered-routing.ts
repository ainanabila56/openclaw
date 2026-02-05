import { inferIntent } from "../intent/infer.js";

export type RoutingDecision =
  | { tier: "none" }
  | { tier: "local-intent"; intent: string; executable: boolean };

export function decideRouting(message?: string): RoutingDecision {
  const intent = inferIntent(message);

  if (intent.label === "system_query" && intent.confidence >= 0.8) {
    return { tier: "local-intent", intent: intent.label, executable: true };
  }

  return { tier: "local-intent", intent: intent.label, executable: false };
}