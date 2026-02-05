import type { IntentResult } from "./schema";

export function inferIntent(message?: string): IntentResult {
  if (!message || message.trim().length === 0) {
    return { label: "unknown", confidence: 0 };
  }

  if (/^(status|health|help)\b/i.test(message)) {
    return { label: "system_query", confidence: 0.9 };
  }

  return { label: "user_message", confidence: 0.6 };
}