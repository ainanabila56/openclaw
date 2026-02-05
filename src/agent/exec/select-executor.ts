import type { AgentExecutor } from "./agent-executor";
import { LocalExecutor } from "./local-executor";

export function selectExecutor(): AgentExecutor {
  return new LocalExecutor();
}