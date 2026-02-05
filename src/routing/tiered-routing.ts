export type RoutingDecision =
  | { tier: "none" }
  | { tier: "local-intent" }
  | { tier: "executor" };

export function decideRouting(): RoutingDecision {
  return { tier: "none" };
}