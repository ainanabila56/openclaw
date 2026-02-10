import type { MainModel } from "./main-model";

export const LocalDevModel: MainModel = {
  async generate({ message, intent, memorySummary }) {
    const prefix = memorySummary ? `MEMORY: ${memorySummary}\n` :"";
    return {
      text: `${prefix}OK (${intent}): ${message}`,
      summary: `last_user_message=${message.slice(0, 200)}`,
    };
  },
};