import type { IntentResult, IntentLabel } from "./schema.js";
import { INTENTS } from "./schema.js";

function assertValidIntent(label: string): asserts label is IntentLabel {
  if (!INTENTS.includes(label as IntentLabel)) {
    throw new Error(`Invalid intent emitted: ${label}`);
  }
}

export function inferIntent(message?: string): IntentResult {
  let label: string;
  let confidence: number;

  if (!message || message.trim().length === 0) {
    label = "unknown";
    confidence = 0;
  } else if (/^(status|health|help)\b/i.test(message)) {
    label = "system_query";
    confidence = 0.9;
  } else {
    label = "user_message";
    confidence = 0.6;
  }

  assertValidIntent(label);

  return { label, confidence };
}