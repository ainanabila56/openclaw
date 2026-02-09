import type { ModelInput, ModelOutput } from "./model-types";

export class LocalRuleModel {
  async run(input: ModelInput): Promise<ModelOutput> {
    // The model is deliberately constrained:
    // - sees only input.prompt and policy metadata
    // - cannot see raw user message object
    // - cannot access tools/memory/fs/net

    const text = input.prompt.includes("status")
      ? "Status: ok (rule model)"
      : "Rule model response";

    return { text };
  }
}