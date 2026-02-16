import { executorRegistry } from "./registry";
import { evaluatePolicy } from "../../policy/evaluate-policy";
import { getExecutionPolicy } from "../../policy/get-execution-policy";
import { Capability } from "../capabilities";

export function selectExecutor(intent: string) {
  const policy = getExecutionPolicy();

  for (const { executor } of executorRegistry) {
    const result = evaluatePolicy(policy, {
      intent,
      executorId: executor.id,
      requestedCapabilities: [Capability.RespondText],
    });

    if (result.decision === "allow") {
      return executor;
    }
  }

  throw new Error("No policy-allowed executor found");
}