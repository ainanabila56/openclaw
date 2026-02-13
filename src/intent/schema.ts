export type IntentLabel =
  | "unknown"
  | "system_query"
  | "user_message"
  | "transform_text";   

export const ALL_INTENTS: readonly IntentLabel[] = [
  "unknown",
  "system_query",
  "user_message",
  "transform_text",     
] as const;

export type IntentResult = {
  label: IntentLabel;
  confidence: number;
};
