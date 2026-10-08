export type DocCategory = "General" | "Policy" | "Product" | "Engineering" | "Support";
export type ResponsePhase = "searching" | "reviewing" | "writing";

export interface DocMetadata {
    id: string;
    key: string;
    value: string;
}

export interface RAGDocument {
    id: string;
    name: string;
    category: DocCategory;
    metadata: DocMetadata[];
    createdAt: string;
}

export interface DocumentState extends RAGDocument {
    processingStatus: Status
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    status?: "completed" | "canceled" | "error";
    canceledAtPhase?: ResponsePhase;
}

export const Status = {
    Selected: "Selected",
    Loading: "Loading",
    Saved: "Saved"
} as const;

export type Status = typeof Status[keyof typeof Status];