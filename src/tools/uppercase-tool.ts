import { z } from "zod";
import type { PureTool } from "./tool";
import type { ToolInput, ToolOutput } from "./types";

export const UppercaseTool: PureTool<ToolInput, ToolOutput> = {
  id: "uppercase",

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