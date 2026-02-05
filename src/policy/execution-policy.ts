import { Capability } from "../agent/exec/capabilities";

export type ExecutionPolicy = {
  allow: Capability[];
  intents: string[];
};

export function getExecutionPolicy(): ExecutionPolicy {
  return {
    allow: [Capability.Execute],
    intents: ["system_query"],
  };
}