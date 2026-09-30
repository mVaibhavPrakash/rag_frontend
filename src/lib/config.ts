import "server-only";

import type { ChatModel } from "@/components/rag/types";

export type LlmProvider = "ollama" | "openai-compatible";
export type EmbeddingProvider = "ollama" | "openai-compatible" | "demo";
export type VectorProvider = "pinecone";
export type RetrievalProviderName = "hybrid";
export type ToolProviderName = "default";

function readProvider<T extends string>(name: string, value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) {
    return fallback;
  }

  if (!allowed.includes(value as T)) {
    throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
  }

  return value as T;
}

export function getAppConfig(chatModel: ChatModel = "ollama") {
  const llmProvider = readProvider("LLM_PROVIDER", process.env.LLM_PROVIDER, ["ollama", "openai-compatible"] as const, "ollama");
  const embeddingProvider = readProvider("EMBEDDING_PROVIDER", process.env.EMBEDDING_PROVIDER, ["ollama", "openai-compatible", "demo"] as const, "ollama");
  const vectorProvider = readProvider("VECTOR_PROVIDER", process.env.VECTOR_PROVIDER, ["pinecone"] as const, "pinecone");
  const retrievalProvider = readProvider("RETRIEVAL_PROVIDER", process.env.RETRIEVAL_PROVIDER, ["hybrid"] as const, "hybrid");
  const toolProvider = readProvider("TOOL_PROVIDER", process.env.TOOL_PROVIDER, ["default"] as const, "default");
  const useLuna = chatModel === "gpt-5.6-luna";

  return {
    llm: {
      provider: useLuna ? "openai-compatible" as const : llmProvider,
      baseUrl: useLuna
        ? process.env.LUNA_BASE_URL || "https://api.openai.com/v1"
        : process.env.LLM_BASE_URL || (llmProvider === "ollama" ? process.env.OLLAMA_BASE_URL || "http://localhost:11434" : "https://api.openai.com/v1"),
      apiKey: useLuna
        ? process.env.LUNA_API_KEY || process.env.OPENAI_API_KEY
        : process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
      model: useLuna
        ? process.env.LUNA_MODEL || "gpt-5.6-luna"
        : process.env.LLM_MODEL || process.env.OLLAMA_MODEL || "qwen3:4b",
    },
    vector: {
      provider: vectorProvider,
      apiKey: process.env.PINECONE_API_KEY,
      indexHost: process.env.PINECONE_INDEX_HOST,
      indexName: process.env.PINECONE_INDEX_NAME,
      cloud: process.env.PINECONE_CLOUD || "aws",
      region: process.env.PINECONE_REGION || "us-east-1",
      namespace: process.env.PINECONE_NAMESPACE,
      docType: process.env.PINECONE_DOC_TYPE,
    },
    retrieval: {
      provider: retrievalProvider,
      topK: Number(process.env.RETRIEVAL_TOP_K || 5),
    },
    tools: {
      provider: toolProvider,
    },
    processor: {
      baseUrl: process.env.PYTHON_PROCESSOR_URL,
    },
    embedding: {
      provider: embeddingProvider,
      baseUrl: process.env.EMBEDDING_BASE_URL || process.env.OLLAMA_BASE_URL || (embeddingProvider === "ollama" ? "http://localhost:11434" : "https://api.openai.com/v1"),
      apiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
      model: process.env.EMBEDDING_MODEL || (embeddingProvider === "ollama" ? "nomic-embed-text:v1.5" : "text-embedding-3-small"),
      dimensions: Number(process.env.EMBEDDING_DIMENSIONS || (embeddingProvider === "ollama" ? 768 : 1536)),
    },
  };
}

export function assertConfigured(config = getAppConfig()): void {
  if (config.llm.provider === "openai-compatible" && !config.llm.apiKey) {
    throw new Error("LLM_API_KEY or OPENAI_API_KEY is required for openai-compatible LLMs.");
  }

  if (config.embedding.provider === "openai-compatible" && !config.embedding.apiKey) {
    throw new Error("EMBEDDING_API_KEY, LLM_API_KEY, or OPENAI_API_KEY is required for OpenAI-compatible embeddings.");
  }

  if (config.vector.provider === "pinecone" && (!config.vector.apiKey || (!config.vector.indexHost && !config.vector.indexName))) {
    throw new Error("PINECONE_API_KEY and either PINECONE_INDEX_HOST or PINECONE_INDEX_NAME are required for Pinecone.");
  }

}

export function assertDocumentProcessorConfigured(config = getAppConfig()): void {
  if (!config.processor.baseUrl) {
    throw new Error("PYTHON_PROCESSOR_URL is required to process uploaded documents.");
  }
}

export type AppConfig = ReturnType<typeof getAppConfig>;