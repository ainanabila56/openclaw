import type { Tool } from "./tool";
import type { ToolInput, ToolOutput } from "./types";

export class UppercaseTool implements Tool {
  readonly id = "uppercase";

  run(input: ToolInput): ToolOutput {
    return { text: input.text.toUpperCase() };
  }
}