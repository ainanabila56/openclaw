import type { ExecutionPolicyDecision } from "../policy/execution-policy-types";

export type AgentExecInput = {
  readonly message: string;
  readonly agentId?: string;
  readonly sessionId?: string;
  readonly plannedTool?: string;


  // Phase 19 additions (authoritative)
  readonly intent: string;
  readonly requestId: string;
  readonly policyDecision: ExecutionPolicyDecision;
};