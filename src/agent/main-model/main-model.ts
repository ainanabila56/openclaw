export type MainModelInput = {
  message: string;
  intent: string;
};

export type MainModelOutput = {
  text: string;
};

export interface MainModel {
  generate(input: MainModelInput): Promise<MainModelOutput>;
}