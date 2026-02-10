export type IntentAuthorityResult = {
  intent: string;
  confidence: number; // informational only
};

export interface IntentAuthority {
  inferIntent(input: { message: string }): IntentAuthorityResult;
}