export type ToolPlan = {
  readonly toolName: string;
} | null;

export function planTool(_: string, message: string): ToolPlan {
  // deterministic message pattern → tool suggestion
  if (message.startsWith("uppercase")) {
    return { toolName: "uppercase" };
  }

  // ------------------------------------------------------------
  // all other intents → no tool
  // ------------------------------------------------------------
  return null;
}
