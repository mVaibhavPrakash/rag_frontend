import { ChatModel } from "../../components/rag/types";
import { getAppConfig } from "../config";
import { RagOrchestrator } from "../orchestration/rag-orchestrator";
import { createAppProviders } from "../providers";


export async function runRagPipeline(question: string, chatModel: ChatModel, signal?: AbortSignal): Promise<string> {
  const appConfig = getAppConfig(chatModel);
  const orchestrator = new RagOrchestrator({
    ...createAppProviders(appConfig),
  });

  const result = await orchestrator.run({
    query: question,
    signal,
  });

  return result.answer;
}
