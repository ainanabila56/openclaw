import type { IntentAuthority, IntentAuthorityResult } from "./intent-authority";

function classify(message: string): IntentAuthorityResult {
  const m = message.trim().toLowerCase();

  // ------------------------------------------------------------
  // Empty message → unknown
  // ------------------------------------------------------------
  if (m.length === 0) {
    return { intent: "unknown", confidence: 0.0 };
  }

  // ------------------------------------------------------------
  // TEXT TRANSFORMATION (Phase 26 tool intent)
  // Detect requests like:
  // "make this uppercase: hello"
  // "uppercase hello"
  // ------------------------------------------------------------
  if (
    m.includes("uppercase") ||
    m.includes("lowercase") ||
    m.includes("transform text")
  ) {
    return { intent: "transform_text", confidence: 0.9 };
  }

  // ------------------------------------------------------------
  // Normal greeting / system query
  // ------------------------------------------------------------
  if (m.includes("hello") || m.includes("hi")) {
    return { intent: "system_query", confidence: 0.55 };
  }

  // ------------------------------------------------------------
  // Default bucket → proves fail-closed policy
  // ------------------------------------------------------------
  return { intent: "unknown", confidence: 0.2 };
}

export const LocalSmlStub: IntentAuthority = {
  inferIntent: ({ message }) => classify(message),
};
