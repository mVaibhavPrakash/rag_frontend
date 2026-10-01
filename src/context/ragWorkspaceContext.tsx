import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChatMessage, DocCategory, ResponsePhase } from "../components/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

type RagWorkspaceContextValue = {
    selectedCategories: DocCategory[];
    toggleCategory: (category: DocCategory) => void;
    question: string;
    setQuestion: (value: string) => void;
    messages: ChatMessage[];
    isResponding: boolean;
    responsePhase: ResponsePhase;
    lastError: string | null;
    onSend: () => void;
    onCancel: () => void;
    retryLastQuestion: () => void;
};

export const RagWorkspaceContext = createContext<RagWorkspaceContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function RagWorkspaceProvider({ children }: { children: ReactNode }) {
    const [selectedCategories, setSelectedCategories] = useState<DocCategory[]>([]);
    const [question, setQuestion] = useState("");
    const [isResponding, setIsResponding] = useState(false);
    const [responsePhase, setResponsePhase] = useState<ResponsePhase>("searching");
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Add a few documents, then ask a question. I will pick the most relevant knowledge automatically unless you tell me where to look.",
        },
    ]);

    const abortControllerRef = useRef<AbortController | null>(null);
    // Keep a ref so the cancel handler can read the live phase without stale closure
    const responsePhaseRef = useRef<ResponsePhase>("searching");

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    const toggleCategory = (category: DocCategory) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
        );
    };

    const setPhase = (phase: ResponsePhase) => {
        responsePhaseRef.current = phase;
        setResponsePhase(phase);
    };

    // ------------------------------------------------------------------
    // Core submit
    // ------------------------------------------------------------------

    const submitQuestion = async (rawQuestion: string) => {
        const trimmed = rawQuestion.trim();
        if (!trimmed || isResponding) return;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed };

        setMessages((prev) => {
            const withoutWelcome = prev[0]?.id === "welcome" ? prev.slice(1) : prev;
            return [...withoutWelcome, userMessage];
        });

        setQuestion("");
        setIsResponding(true);
        setLastError(null);
        setPhase("searching");

        // Simulate phase progression for UX while the backend works
        const reviewingTimer = window.setTimeout(() => setPhase("reviewing"), 500);
        const writingTimer = window.setTimeout(() => setPhase("writing"), 1200);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Build optional metadata filter from selected categories
            const filter =
                selectedCategories.length > 0
                    ? { doc_type: { $in: selectedCategories } }
                    : undefined;

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed, filter }),
                signal: controller.signal,
            });

            const body = (await response.json().catch(() => ({}))) as { answer?: string; detail?: string; error?: string };

            if (!response.ok) {
                throw new Error(body.detail ?? body.error ?? "Unable to generate an answer.");
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: body.answer || "I couldn't find a grounded answer in the current index.",
                    status: "completed",
                },
            ]);
            setLastFailedQuestion(null);
        } catch (error) {
            if (isAbortError(error)) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `assistant-canceled-${Date.now()}`,
                        role: "assistant",
                        content: "Response canceled.",
                        status: "canceled",
                        canceledAtPhase: responsePhaseRef.current,
                    },
                ]);
                return;
            }

            const msg = error instanceof Error ? error.message : "Unable to generate an answer.";
            setMessages((prev) => [
                ...prev,
                { id: `assistant-error-${Date.now()}`, role: "assistant", content: msg, status: "error" },
            ]);
            setLastError(msg);
            setLastFailedQuestion(trimmed);
        } finally {
            window.clearTimeout(reviewingTimer);
            window.clearTimeout(writingTimer);
            abortControllerRef.current = null;
            setIsResponding(false);
        }
    };

    // Zero-arg wrappers (UI event handlers pass event objects we must discard)
    const onSend = () => void submitQuestion(question);
    const onCancel = () => abortControllerRef.current?.abort();
    const retryLastQuestion = () => {
        if (lastFailedQuestion) void submitQuestion(lastFailedQuestion);
    };

    // ------------------------------------------------------------------

    const value: RagWorkspaceContextValue = {
        selectedCategories,
        toggleCategory,
        question,
        setQuestion,
        messages,
        isResponding,
        responsePhase,
        lastError,
        onSend,
        onCancel,
        retryLastQuestion,
    };

    return <RagWorkspaceContext.Provider value={value}>{children}</RagWorkspaceContext.Provider>;
}
