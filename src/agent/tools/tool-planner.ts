export type ToolPlan = {
  readonly toolName: string;
} | null;

/**
 * Deterministic tool planner.
 * Phase 26 requirement:
 * - NO AI
 * - NO guessing
 * - Intent → fixed tool mapping only
 */
export function planTool(intent: string, message: string): ToolPlan {
  // ------------------------------------------------------------
  // transform_text → uppercase tool
  // ------------------------------------------------------------
  if (intent === "transform_text") {
    return { toolName: "uppercase" };
  }

  // ------------------------------------------------------------
  // all other intents → no tool
  // ------------------------------------------------------------
  return null;
}
