export const INTENTS = [
  "unknown",
  "system_query",
  "user_message",
  "transform_text",
  "chat",
] as const;

export type IntentLabel = (typeof INTENTS)[number];

export type IntentResult = {
  label: IntentLabel;
  confidence: number;
};