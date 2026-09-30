import { throwIfAborted } from "../http/abort";
import { LlmMessage } from "../llm/interfaces";
import { RetrievalResult } from "../retrieval/interfaces";
import { Orchestrator, OrchestrationDependencies, OrchestrationInput, OrchestrationResult } from "./interfaces";


export class RagOrchestrator implements Orchestrator {
  constructor(private readonly deps: OrchestrationDependencies) {}

  async run(input: OrchestrationInput): Promise<OrchestrationResult> {
    const { signal } = input;
    const retrievalResults = await this.deps.retriever.search(input.query, input.filters, 3, signal);

    const toolResults = [] as Array<{ name: string; output: Record<string, unknown> | string }>;
    for (const call of input.toolCalls ?? []) {
      throwIfAborted(signal);
      const result = await this.deps.tools.run(call, signal);
      toolResults.push(result);
    }

    throwIfAborted(signal);
    const context = this.buildContext(retrievalResults, input.context);
    const messages: LlmMessage[] = [
      {
        role: "system",
        content:
          "You are a precise assistant. Answer directly from the supplied context and any tool results. Do not reveal analysis, chain-of-thought, reasoning steps, or describe your search process. Prefer a short factual answer with bullets when useful. If relevant context is missing, say so clearly.",
      },
      {
        role: "user",
        content: `Query: ${input.query}\n\nContext:\n${context}\n\nTool results:\n${JSON.stringify(toolResults, null, 2)}`,
      },
    ];

    const llmResponse = await this.deps.llm.generate(messages, {
      temperature: 0.2,
      num_predict: 180,
    }, signal);

    return {
      answer: llmResponse.content,
      sources: retrievalResults,
      toolResults,
    } satisfies OrchestrationResult;
  }

  private buildContext(results: RetrievalResult[], extraContext?: string): string {
    const chunks = results.map((result, index) => `[#${index + 1}] ${result.content.slice(0, 1_200)}`);
    if (extraContext) {
      chunks.push(`Additional context:\n${extraContext}`);
    }

    return chunks.join("\n\n");
  }
}
