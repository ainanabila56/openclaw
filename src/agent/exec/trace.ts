export type ExecutionTrace = {
  intent: string;
  allowed: boolean;
};

export const executionTrace: ExecutionTrace[] = [];