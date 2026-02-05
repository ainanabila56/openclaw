import { executorRegistry } from "./registry";

export function selectExecutor(intent: string) {
  if (intent === "system_query") {
    return executorRegistry[0].executor;
  }

  return executorRegistry[1].executor;
}