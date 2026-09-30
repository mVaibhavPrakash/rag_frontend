export type LlmMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type LlmResponse = {
  content: string;
  provider: string;
  model: string;
};

export interface LlmClient {
  generate(messages: LlmMessage[], options?: Record<string, unknown>, signal?: AbortSignal): Promise<LlmResponse>;
}
