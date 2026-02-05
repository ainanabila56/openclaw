import type { Model, ModelInput, ModelOutput } from "./model";

export class LocalRuleModel implements Model {
  async run(input: ModelInput): Promise<ModelOutput> {
    if (/status|health/i.test(input.prompt)) {
      return { text: "System is running normally." };
    }

    return { text: "Message received." };
  }
}