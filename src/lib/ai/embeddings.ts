import { getAppConfig } from "../config";

export async function createEmbeddings(texts: string[], signal?: AbortSignal): Promise<number[][]> {
  const normalizedTexts = texts.map((text) => text.trim());
  const config = getAppConfig();

  if (config.embedding.provider === "ollama") {
    const response = await fetch(`${config.embedding.baseUrl.replace(/\/$/, "")}/api/embed`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.embedding.model, input: normalizedTexts }),
    });
    if (!response.ok) {
      throw new Error(`Ollama embedding request failed: ${response.status}`);
    }
    const data = (await response.json()) as { embeddings?: number[][]; embedding?: number[] };
    const embeddings = data.embeddings ?? (data.embedding ? [data.embedding] : []);
    if (embeddings.length !== normalizedTexts.length || embeddings.some((embedding) => embedding.length === 0)) {
      throw new Error("Ollama returned incomplete embeddings.");
    }
    return embeddings;
  }

  if (config.embedding.provider === "openai-compatible") {
    if (!config.embedding.apiKey) {
      throw new Error("EMBEDDING_API_KEY, LLM_API_KEY, or OPENAI_API_KEY is required for OpenAI-compatible embeddings.");
    }
    const response = await fetch(`${config.embedding.baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${config.embedding.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.embedding.model, input: normalizedTexts }),
    });
    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.status}`);
    }
    const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const embeddings = data.data?.map((item) => item.embedding ?? []) ?? [];
    if (embeddings.length !== normalizedTexts.length || embeddings.some((embedding) => embedding.length === 0)) {
      throw new Error("Embedding provider returned incomplete embeddings.");
    }
    return embeddings;
  }

  return Promise.all(normalizedTexts.map(async (text) => {
    const digest = await getByteArray(text);
    const vector = new Array<number>(384).fill(0);

    for (let index = 0; index < vector.length; index += 1) {
      const byte = digest[index % digest.length];
      const score = (byte / 255) * 2 - 1;
      vector[index] = Number((score + (index / vector.length) * 0.2).toFixed(6));
    }

    return vector;
  }));
}

export async function createEmbedding(text: string, signal?: AbortSignal): Promise<number[]> {
  if (!text.trim()) {
    return [];
  }

  return (await createEmbeddings([text], signal))[0];
}
