export type RetrievalResult = {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
  source?: "vector" | "keyword" | "metadata";
};

export interface RetrievalProvider {
  search(query: string, filters?: Record<string, unknown>, topK?: number, signal?: AbortSignal): Promise<RetrievalResult[]>;
}
