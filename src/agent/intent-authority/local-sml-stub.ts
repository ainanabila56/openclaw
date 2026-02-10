import type { IntentAuthority, IntentAuthorityResult } from "./intent-authority";

function classify(message: string): IntentAuthorityResult {
  const m = message.trim().toLowerCase();

  // Deterministic, rule-based stub. Keep intentionally dumb.
  if (m.length === 0) return { intent: "unknown", confidence: 0.0 };

  if (m.includes("hello") || m.includes("hi")) {
    return { intent: "system_query", confidence: 0.55 };
  }

  // Default bucket to prove fail-closed policy behavior.
  return { intent: "unknown", confidence: 0.2 };
}

export const LocalSmlStub: IntentAuthority = {
  inferIntent: ({ message }) => classify(message),
};