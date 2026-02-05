import type { IntentResult } from "./schema";

export function inferIntent(): IntentResult {
  return { label: "unknown", confidence: 0 };
}