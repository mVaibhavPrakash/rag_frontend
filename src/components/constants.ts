import { DocCategory } from "./types";

export const CATEGORIES: DocCategory[] = ["General", "Policy", "Product", "Engineering", "Support"];

// Lightweight keyword heuristic; a real backend would classify this during ingestion.
export function guessCategory(fileName: string): DocCategory {
    const lower = fileName.toLowerCase();

    if (lower.includes("policy") || lower.includes("legal") || lower.includes("compliance")) {
        return "Policy";
    }
    if (lower.includes("spec") || lower.includes("feature") || lower.includes("product")) {
        return "Product";
    }
    if (lower.includes("pipeline") || lower.includes("runbook") || lower.includes("architecture") || lower.includes("engineering")) {
        return "Engineering";
    }
    if (lower.includes("support") || lower.includes("faq") || lower.includes("ticket")) {
        return "Support";
    }

    return "General";
}

export const AllowedFileTypes = {
    PDF: "application/pdf",
    Markdown: "text/markdown",
    Text: "text/plain",
    Word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;