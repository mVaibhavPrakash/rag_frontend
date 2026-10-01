export type DocCategory = "General" | "Policy" | "Product" | "Engineering" | "Support";
export type ResponsePhase = "searching" | "reviewing" | "writing";

export interface MetadataEntry {
    id: string;
    key: string;
    value: string;
}

export interface RagDocument {
    id: string;
    name: string;
    category: DocCategory;
    metadata: MetadataEntry[];
    addedAt: string;
}

export interface PendingDocument {
    id: string;
    file: File;
    name: string;
    category: DocCategory;
    metadata: MetadataEntry[];
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    status?: "completed" | "canceled" | "error";
    canceledAtPhase?: ResponsePhase;
}
