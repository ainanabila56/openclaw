export type ModelPolicyContext = {
  readonly request_id: string;
  readonly session_id: string;
  readonly intent: string;
  readonly allowed_tools: readonly string[];
  readonly allowed_memory_write: boolean;
};

export type ModelInput = {
  readonly policy: ModelPolicyContext;
  readonly prompt: string; // already constructed, sanitized, executor-owned
  readonly intent: string;
};

export type ModelOutput = {
  readonly text: string;
};