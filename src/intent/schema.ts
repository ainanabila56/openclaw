export type IntentLabel =
  | "unknown"
  | "system_query"
  | "user_message";

export type IntentResult = {
  label: IntentLabel;
  confidence: number;
};