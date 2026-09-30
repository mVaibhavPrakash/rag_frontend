import { assertConfigured, getAppConfig, type AppConfig } from "@/lib/config";
import { OpenAiCompatibleClient } from "@/lib/llm/openai-compatible-client";
import { OllamaClient } from "@/lib/llm/ollama-client";
import type { LlmClient } from "@/lib/llm/interfaces";
import { HybridRetriever } from "@/lib/retrieval/hybrid-retriever";
import type { RetrievalProvider } from "@/lib/retrieval/interfaces";
import { DefaultToolExecutor } from "@/lib/tools/tool-executor";
import type { ToolExecutor } from "@/lib/tools/interfaces";

export function createLlmClient(appConfig: AppConfig = getAppConfig()): LlmClient {
  const config = appConfig.llm;
  if (config.provider === "openai-compatible") {
    if (!config.apiKey) {
      throw new Error("LLM_API_KEY or OPENAI_API_KEY is required for openai-compatible LLMs.");
    }
    return new OpenAiCompatibleClient(config.baseUrl, config.model, config.apiKey);
  }

  return new OllamaClient(config.baseUrl, config.model);
}

export function createRetrievalProvider(appConfig: AppConfig = getAppConfig()): RetrievalProvider {
  if (appConfig.retrieval.provider === "hybrid") {
    return new HybridRetriever(appConfig);
  }

  throw new Error(`Unsupported retrieval provider: ${appConfig.retrieval.provider}`);
}

export function createToolExecutor(appConfig: AppConfig = getAppConfig()): ToolExecutor {
  if (appConfig.tools.provider === "default") {
    return new DefaultToolExecutor();
  }

  throw new Error(`Unsupported tool provider: ${appConfig.tools.provider}`);
}

export function createAppProviders(appConfig: AppConfig = getAppConfig()) {
  assertConfigured(appConfig);

  return {
    llm: createLlmClient(appConfig),
    retriever: createRetrievalProvider(appConfig),
    tools: createToolExecutor(appConfig),
  };
}