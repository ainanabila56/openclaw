import type { ExecutorDescriptor } from "./descriptor";
import { LocalExecutor } from "./local-executor";
import { AltLocalExecutor } from "./alt-local-executor";

export const executorRegistry: ExecutorDescriptor[] = [
  { id: "local-default", executor: new LocalExecutor() },
  { id: "local-alt", executor: new AltLocalExecutor() },
];