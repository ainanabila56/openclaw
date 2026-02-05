import { inferIntent } from "../intent/infer.js";

export type RoutingDecision =
  | { tier: "none" }
  | { tier: "local-intent"; intent: string }
  | { tier: "executor" };

export function decideRouting(message?: string): RoutingDecision {
  const intent = inferIntent(message);

  if (intent.confidence < 0.5) {
    return { tier: "none" };
  }

  return { tier: "local-intent", intent: intent.label };
}