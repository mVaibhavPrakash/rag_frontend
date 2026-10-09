export type DocCategory = "General" | "Policy" | "Product" | "Engineering" | "Support";
export type ResponsePhase = "searching" | "reviewing" | "writing";

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
    Saved: "Saved",
} as const;

export type Status = (typeof Status)[keyof typeof Status];
