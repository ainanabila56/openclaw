import type { AgentExecutor } from "./agent-executor";
import { NoopExecutor } from "./noop-executor";

export function selectExecutor(): AgentExecutor {
  return new NoopExecutor();
}