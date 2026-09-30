import type { RetrievalProvider, RetrievalResult } from "@/lib/retrieval/interfaces";
import type { ToolExecutor } from "@/lib/tools/interfaces";
import type { LlmClient, LlmMessage } from "@/lib/llm/interfaces";

export type OrchestrationInput = {
  query: string;
  context?: string;
  filters?: Record<string, unknown>;
  messages?: LlmMessage[];
  toolCalls?: Array<{ name: string; args?: Record<string, unknown> }>;
  signal?: AbortSignal;
};

export type OrchestrationResult = {
  answer: string;
  sources: RetrievalResult[];
  toolResults?: Array<{ name: string; output: Record<string, unknown> | string }>;
};

export interface Orchestrator {
  run(input: OrchestrationInput): Promise<OrchestrationResult>;
}

export type OrchestrationDependencies = {
  retriever: RetrievalProvider;
  llm: LlmClient;
  tools: ToolExecutor;
};
