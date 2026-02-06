import type { IntentResult, IntentLabel } from "./schema";
import { ALL_INTENTS } from "./schema";

function assertValidIntent(label: string): asserts label is IntentLabel {
  if (!ALL_INTENTS.includes(label as IntentLabel)) {
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