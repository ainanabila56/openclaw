export type MainModelInput = {
  message: string;
  intent: string;
  memorySummary?: string;
};

export type MainModelOutput = {
  text: string;
  summary?: string;
};

export interface MainModel {
  generate(input: MainModelInput): Promise<MainModelOutput>;
}