export type PineconeMetadata = {
  namespace?: string;
  doc_id?: string;
  doc_type?: string;
  is_shared?: boolean;
  applicable_tags?: string[];
  section_title?: string;
  parent_text?: string;
  [key: string]: unknown;
};

export type VectorMatch = {
  id: string;
  score: number;
  metadata?: PineconeMetadata;
};

export type PineconeFilter = {
  namespace?: string;
  doc_type?: string;
  applicable_tags?: { $in: string[] };
};

export type PineconeClientConfig = {
  apiKey: string;
  indexHost?: string;
  indexName?: string;
  cloud?: string;
  region?: string;
  dimensions?: number;
  namespace?: string;
};

export type PineconeVector = {
  id: string;
  values: number[];
  metadata: PineconeMetadata;
};

const PINECONE_CONTROL_PLANE_URL = "https://api.pinecone.io";

async function resolveIndexHost(config: PineconeClientConfig, signal?: AbortSignal): Promise<string> {
  if (config.indexHost) {
    return config.indexHost;
  }
  if (!config.indexName || !config.dimensions) {
    throw new Error("PINECONE_INDEX_HOST or PINECONE_INDEX_NAME with EMBEDDING_DIMENSIONS is required for Pinecone.");
  }

  const headers = { "Api-Key": config.apiKey, "Content-Type": "application/json" };
  let response = await fetch(`${PINECONE_CONTROL_PLANE_URL}/indexes/${encodeURIComponent(config.indexName)}`, { headers, signal });

  if (response.status === 404) {
    response = await fetch(`${PINECONE_CONTROL_PLANE_URL}/indexes`, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        name: config.indexName,
        dimension: config.dimensions,
        metric: "cosine",
        spec: { serverless: { cloud: config.cloud || "aws", region: config.region || "us-east-1" } },
      }),
    });
  }

  if (!response.ok) {
    throw new Error(`Pinecone index provisioning failed: ${response.status}`);
  }

  const index = (await response.json()) as { host?: string; status?: { ready?: boolean } };
  if (!index.host) {
    throw new Error("Pinecone is creating the index. Retry the request once provisioning completes.");
  }
  if (index.status?.ready === false) {
    throw new Error("Pinecone is creating the index. Retry the request once provisioning completes.");
  }
  return `https://${index.host.replace(/^https?:\/\//, "")}`;
}

export async function queryPinecone(
  config: PineconeClientConfig,
  vector: number[],
  topK = 5,
  filter?: PineconeFilter,
  signal?: AbortSignal,
): Promise<VectorMatch[]> {
  const safeVector = Array.isArray(vector) ? vector : [];
  if (safeVector.length === 0) {
    return [];
  }

  const indexHost = await resolveIndexHost(config, signal);
  const response = await fetch(`${indexHost.replace(/\/$/, "")}/query`, {
    method: "POST",
    signal,
    headers: { "Api-Key": config.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ vector: safeVector, topK, includeMetadata: true, namespace: config.namespace, filter }),
  });

  if (!response.ok) {
    throw new Error(`Pinecone query failed: ${response.status}`);
  }

  const data = (await response.json()) as { matches?: Array<{ id: string; score?: number; metadata?: PineconeMetadata }> };
  return (data.matches ?? []).map((match) => ({ id: match.id, score: match.score ?? 0, metadata: match.metadata }));
}

export async function upsertPineconeVectors(config: PineconeClientConfig, vectors: PineconeVector[], signal?: AbortSignal): Promise<void> {
  if (vectors.length === 0) {
    return;
  }

  const indexHost = await resolveIndexHost(config, signal);
  const response = await fetch(`${indexHost.replace(/\/$/, "")}/vectors/upsert`, {
    method: "POST",
    signal,
    headers: { "Api-Key": config.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ vectors, namespace: config.namespace }),
  });

  if (!response.ok) {
    throw new Error(`Pinecone upsert failed: ${response.status}`);
  }
}

export async function deletePineconeVectors(
  config: PineconeClientConfig,
  filter: Record<string, string>,
  signal?: AbortSignal,
): Promise<void> {
  const indexHost = await resolveIndexHost(config, signal);
  const response = await fetch(`${indexHost.replace(/\/$/, "")}/vectors/delete`, {
    method: "POST",
    signal,
    headers: { "Api-Key": config.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ filter, namespace: config.namespace }),
  });

  if (!response.ok) {
    throw new Error(`Pinecone delete failed: ${response.status}`);
  }
}
