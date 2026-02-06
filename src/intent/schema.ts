export type IntentLabel =
  | "unknown"
  | "system_query"
  | "user_message";

export const ALL_INTENTS: readonly IntentLabel[] = [
  "unknown",
  "system_query",
  "user_message",
] as const;

export type IntentResult = {
  label: IntentLabel;
  confidence: number;
};