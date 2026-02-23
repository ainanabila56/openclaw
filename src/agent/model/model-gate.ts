import { Capability } from "../exec/capabilities";
import type { ModelInput, ModelOutput } from "./model-types";
import { LocalRuleModel } from "./local-model";
import { allowModelUsage } from "./policy";
import type { AgentExecInput } from "../exec/agent-executor";
import { LocalDevModel } from "../main-model/local-dev-model";
import { Input } from "@mariozechner/pi-tui";

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
    intent: execInput.intent,
  };
}

export async function runModelIfEnabled(input: ModelInput) {
  return await LocalDevModel.generate({
    message: input.prompt ?? input.message ?? "",
    intent: input.intent ?? "unknown",
    memorySummary: undefined,
  });
}