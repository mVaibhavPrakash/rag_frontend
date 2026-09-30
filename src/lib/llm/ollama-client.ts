import type { LlmClient, LlmMessage, LlmResponse } from "@/lib/llm/interfaces";
import { combineSignals } from "@/lib/http/abort";

export class OllamaClient implements LlmClient {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async generate(messages: LlmMessage[], options?: Record<string, unknown>, signal?: AbortSignal): Promise<LlmResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      signal: combineSignals([signal, AbortSignal.timeout(120_000)]),
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        think: false,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = (await response.json()) as { message?: { content?: string; thinking?: string } };
    const content = data.message?.content?.trim() ?? "";
    if (!content) {
      throw new Error("The configured Ollama model returned reasoning without a final answer. Use an Ollama version that supports think: false or choose a non-reasoning chat model.");
    }

    return {
      content,
      provider: "ollama",
      model: this.model,
    };
  }
}
