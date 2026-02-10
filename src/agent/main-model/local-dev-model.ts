import type { MainModel } from "./main-model";

export const LocalDevModel: MainModel = {
  async generate({ message, intent }) {
    // Deterministic, side-effect free
    return {
      text: `OK (${intent}): ${message}`,
    };
  },
};