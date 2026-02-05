import type { ToolInput, ToolOutput } from "./types";

export interface Tool {
  readonly id: string;
  run(input: ToolInput): ToolOutput;
}