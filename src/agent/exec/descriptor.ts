import type { AgentExecutor } from "./agent-executor";

export type ExecutorDescriptor = {
  id: string;
  executor: AgentExecutor;
};