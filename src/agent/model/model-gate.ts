import { Capability } from "../exec/capabilities";
import type { ModelInput, ModelOutput } from "./model-types";
import { LocalRuleModel } from "./local-model";
import { allowModelUsage } from "./policy";
import type { AgentExecInput } from "../exec/agent-executor";

export function buildModelInput(
  execInput: AgentExecInput,
  prompt: string
): ModelInput {
  const decision = execInput.policyDecision;

  return {
    policy: {
      request_id: execInput.requestId,
      session_id: execInput.sessionId,
      intent: execInput.intent,
      allowed_tools: decision.allowedTools ?? [],
      allowed_memory_write:
        decision.allowedCapabilities?.includes(Capability.MemoryWrite) ??
        false,
    },
    prompt,
  };
}

export async function runModelIfEnabled(
  input: ModelInput
): Promise<ModelOutput | null> {
  if (!allowModelUsage()) return null;

  const model = new LocalRuleModel();
  return model.run(input);
}