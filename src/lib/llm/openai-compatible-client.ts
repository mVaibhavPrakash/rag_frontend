import type { LlmClient, LlmMessage, LlmResponse } from "@/lib/llm/interfaces";

export class OpenAiCompatibleClient implements LlmClient {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly apiKey: string,
  ) {}

  async generate(messages: LlmMessage[], options?: Record<string, unknown>, signal?: AbortSignal): Promise<LlmResponse> {
    const { num_predict: maxCompletionTokens, temperature, ...compatibleOptions } = options ?? {};
    const payload: Record<string, unknown> = {
      model: this.model,
      messages,
      ...compatibleOptions,
      ...(typeof temperature === "number" ? { temperature } : {}),
      ...(typeof maxCompletionTokens === "number" ? { max_completion_tokens: maxCompletionTokens } : {}),
    };
    const endpoint = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    let response: Response;

    while (true) {
      response = await fetch(endpoint, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        break;
      }

      const errorBody = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      const detail = errorBody?.error?.message;
      const unsupportedField = detail?.match(/(?:unsupported (?:value|parameter)|unknown parameter)[^'"]*['"]([^'"]+)['"]/i)?.[1];
      if (unsupportedField && unsupportedField !== "model" && unsupportedField !== "messages" && unsupportedField in payload) {
        delete payload[unsupportedField];
        continue;
      }

      throw new Error(`LLM request failed: ${response.status}${detail ? ` - ${detail}` : ""}`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      provider: "openai-compatible",
      model: this.model,
    };
  }
}