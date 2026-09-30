import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isAbortError } from "../lib/http/abort";
import { ChatModel, ChatMessage, DocCategory, ResponsePhase } from "../components/types";

interface Attributes {
	class: string;
	attributeKey: string;
	attributeValue: string;
}

interface ProductConfig {
	attributes: Attributes[];
	mcpSku: string;
}

type RagWorkspaceContextValue = {
    selectedCategories: DocCategory[];
    toggleCategory: (category: DocCategory) => void;
    url: string;
    setUrl: (value: string) => void;
    productDetail: ProductConfig | undefined;
    setProductDetail: (value: ProductConfig) => void;
    onAddUrl: () => void;
    question: string;
    setQuestion: (value: string) => void;
    chatModel: ChatModel;
    setChatModel: (model: ChatModel) => void;
    messages: ChatMessage[];
    isResponding: boolean;
    responsePhase: ResponsePhase;
    lastError: string | null;
    onSend: () => void;
    onCancel: () => void;
    retryLastQuestion: () => void;
};

export const RagWorkspaceContext = createContext<RagWorkspaceContextValue | null>(null);

export function RagWorkspaceProvider({ children }: { children: ReactNode }) {
    const [selectedCategories, setSelectedCategories] = useState<DocCategory[]>([]);
    const [url, setUrl] = useState<string>("");
    const [productDetail, setProductDetail] = useState<ProductConfig | undefined>(undefined);

    const [question, setQuestion] = useState("");
    const [chatModel, setChatModel] = useState<ChatModel>("ollama");
    const [isResponding, setIsResponding] = useState(false);
    const [responsePhase, setResponsePhase] = useState<ResponsePhase>("searching");
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Add a few documents, then ask a question. I will pick the most relevant knowledge automatically unless you tell me where to look.",
        },
    ]);
    const abortControllerRef = useRef<AbortController | null>(null);
    // Response phase is only readable live via a ref: the async submitQuestion
    // closure captures stale state, but a cancel needs the phase at abort time.
    const responsePhaseRef = useRef<ResponsePhase>("searching");

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    const toggleCategory = (category: DocCategory) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
        );
    };

    const onAddUrl = async () => {
        const result = await fetch(url, {method: "GET"});
        const data: ProductConfig = await result.json();
        if(data.attributes) {
            setProductDetail(data);
        }
        setUrl("");
    };

    const setPhase = (phase: ResponsePhase) => {
        responsePhaseRef.current = phase;
        setResponsePhase(phase);
    };

    const submitQuestion = async (rawQuestion: string) => {
        const trimmed = rawQuestion.trim();
        if (!trimmed || isResponding) {
            return;
        }

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed };

        // Remove welcome message if user has asked any question.
        setMessages((prev) => {
            if(prev[0].id === "welcome"){
                prev.shift();
            }
            return [...prev, userMessage];
        });

        setQuestion("");
        setIsResponding(true);
        setLastError(null);
        setPhase("searching");
        const reviewingTimer = setTimeout(() => setPhase("reviewing"), 500);
        const writingTimer = setTimeout(() => setPhase("writing"), 1200);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed, model: chatModel }),
                signal: controller.signal,
            });
            const body = (await response.json().catch(() => ({}))) as { answer?: string; error?: string };
            if (!response.ok) {
                throw new Error(body.error || "Unable to generate an answer.");
            }

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: body.answer || "I couldn’t find a grounded answer in the current index.",
                status: "completed",
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setLastFailedQuestion(null);
        } catch (error) {
            if (isAbortError(error)) {
                setMessages((prev) => [...prev, {
                    id: `assistant-canceled-${Date.now()}`,
                    role: "assistant",
                    content: "Response canceled.",
                    status: "canceled",
                    canceledAtPhase: responsePhaseRef.current,
                }]);
                return;
            }

            const errorMessage = error instanceof Error ? error.message : "Unable to generate an answer.";
            setMessages((prev) => [...prev, {
                id: `assistant-error-${Date.now()}`,
                role: "assistant",
                content: errorMessage,
                status: "error",
            }]);
            setLastError(errorMessage);
            setLastFailedQuestion(trimmed);
        } finally {
            window.clearTimeout(reviewingTimer);
            window.clearTimeout(writingTimer);
            abortControllerRef.current = null;
            setIsResponding(false);
        }
    };

    // Zero-arg on purpose: UI event handlers (onPress, onKeyDown) invoke this
    // with event objects as arguments, which must never reach submitQuestion.
    const onSend = () => {
        void submitQuestion(question);
    };

    const onCancel = () => {
        abortControllerRef.current?.abort();
    };

    const retryLastQuestion = () => {
        if (lastFailedQuestion) {
            void submitQuestion(lastFailedQuestion);
        }
    };

    const value: RagWorkspaceContextValue = {
        selectedCategories,
        toggleCategory,
        url,
        setUrl,
        productDetail,
        setProductDetail,
        onAddUrl,
        question,
        setQuestion,
        chatModel,
        setChatModel,
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
