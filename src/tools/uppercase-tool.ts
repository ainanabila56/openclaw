import { z } from "zod";
import type { PureTool } from "./pure-tool";
import type { ToolInput, ToolOutput } from "./types";

export const UppercaseTool: PureTool<ToolInput, ToolOutput> = {
  name: "uppercase",                 // must be "name"
  description: "Convert text to uppercase",
  capability: "transform_text",      // REQUIRED

  schema: {
    input: z.object({
      text: z.string(),
    }),
    output: z.object({
      text: z.string(),
    }),
  },

  run(input) {
    return { text: input.text.toUpperCase() };
  },
};
