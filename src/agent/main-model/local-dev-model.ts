import type { MainModel } from "./main-model";
import type { ModelInput } from "./model-types";


export const LocalDevModel = {
  async generate(
    { message, intent, memorySummary }: ModelInput
  ) {
    const prefix = memorySummary
      ? `MEMORY: ${memorySummary}\n`
      : "";

    return {
      text: `${prefix}OK (${intent}): ${message}`,
      summary: `last_user_message=${message.slice(0, 200)}`,
    };
  },
};