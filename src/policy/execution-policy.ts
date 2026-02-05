import { Capability } from "../agent/exec/capabilities";

export type ExecutionPolicy = {
  allow: Capability[];
};

export function getExecutionPolicy(): ExecutionPolicy {
  return {
    allow: [],
  };
}