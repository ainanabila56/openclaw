import type { ModelInput, ModelOutput } from "./model-types";

export interface Model {
  run(input: ModelInput): Promise<ModelOutput>;
}