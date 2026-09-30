import { queryPinecone, type PineconeFilter } from "@/lib/vector/pinecone";
import { createEmbedding } from "@/lib/ai/embeddings";
import { getAppConfig, type AppConfig } from "@/lib/config";
import type { RetrievalProvider, RetrievalResult } from "@/lib/retrieval/interfaces";

export class HybridRetriever implements RetrievalProvider {
  constructor(private readonly appConfig: AppConfig = getAppConfig()) {}

  async search(query: string, filters?: Record<string, unknown>, topK?: number, signal?: AbortSignal): Promise<RetrievalResult[]> {
    const normalized = query.trim();
    if (!normalized) {
      return [];
    }

    const embedding = await createEmbedding(normalized, signal);
    const pineconeFilter: PineconeFilter = {};

    if (typeof filters?.namespace === "string" || this.appConfig.vector.namespace) {
      pineconeFilter.namespace = typeof filters?.namespace === "string" ? filters.namespace : this.appConfig.vector.namespace;
    }

    if (typeof filters?.doc_type === "string" || this.appConfig.vector.docType) {
      pineconeFilter.doc_type = typeof filters?.doc_type === "string" ? filters.doc_type : this.appConfig.vector.docType;
    }

    if (!this.appConfig.vector.apiKey) {
      throw new Error("PINECONE_API_KEY is required for hybrid Pinecone retrieval.");
    }

    const vectorResults = await queryPinecone(
      {
        apiKey: this.appConfig.vector.apiKey,
        indexHost: this.appConfig.vector.indexHost,
        indexName: this.appConfig.vector.indexName,
        cloud: this.appConfig.vector.cloud,
        region: this.appConfig.vector.region,
        dimensions: this.appConfig.embedding.dimensions,
        namespace: this.appConfig.vector.namespace,
      },
      embedding,
      topK || this.appConfig.retrieval.topK,
      pineconeFilter,
      signal,
    );
    const semanticResults = vectorResults.map((entry, index) => {
      const normalizedQuery = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
      const haystack = [
        String(entry.metadata?.section_title ?? ""),
        String(entry.metadata?.parent_text ?? ""),
        String(entry.metadata?.doc_type ?? ""),
        String(entry.metadata?.namespace ?? ""),
        Array.isArray(entry.metadata?.applicable_tags) ? entry.metadata.applicable_tags.join(" ") : "",
      ].join(" ").toLowerCase();

      const keywordMatches = normalizedQuery
        .split(/\s+/)
        .filter(Boolean)
        .reduce((count, token) => (haystack.includes(token) ? count + 1 : count), 0);

      const keywordScore = normalizedQuery ? keywordMatches / Math.max(1, normalizedQuery.split(/\s+/).filter(Boolean).length) : 0;
      const semanticScore = entry.score || Number((1 - index * 0.12).toFixed(3));
      const metadataBoost = pineconeFilter.namespace && entry.metadata?.namespace === pineconeFilter.namespace ? 0.2 : 0;
      const score = Math.min(1, semanticScore * 0.7 + keywordScore * 0.8 + metadataBoost);

      return {
        id: entry.id,
        content: String(entry.metadata?.parent_text ?? ""),
        score: Number(score.toFixed(3)),
        metadata: entry.metadata,
        source: keywordMatches > 0 ? "keyword" : "vector",
      } satisfies RetrievalResult;
    });

    return semanticResults.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
