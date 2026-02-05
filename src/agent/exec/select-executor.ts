import type { AgentExecutor } from "./agent-executor";
import { NoopExecutor } from "./noop-executor";

export function selectExecutor(): AgentExecutor {
  throw new Error("Executor selection is disabled by policy");
}