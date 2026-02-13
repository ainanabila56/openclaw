import { z } from "zod";
import type { PureTool } from "./pure-tool";

export const UppercaseTool: PureTool<{ text: string }, { text: string }> = {
  name: "uppercase",
  description: "Convert text to uppercase",
  capability: "text_transform",

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
