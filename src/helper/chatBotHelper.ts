import { ChatMessage, DocCategory, ResponsePhase } from "@/components/types";
import { ChatBotState } from "@/state/model";
import { chatActions } from "@/state/slices/chatBotSlice";
import { RootDispatch } from "@/state/store";
import { Action } from "@reduxjs/toolkit";
import { isAbortError } from "./documentHelper";

export const submitQuestion = async (
    rawQuestion: string,
    abortController: React.RefObject<AbortController | null>,
    state: ChatBotState,
    dispatch: RootDispatch,
): Promise<void> => {
    const { addMessage, setLastError, setLastFailedQuestion, setMessage, setResponsePhase, setResponseStatus } =
        chatActions;
    const actions: Action[] = [];

    const trimmed = rawQuestion.trim();
    if (!trimmed || state.isResponding) {
        return;
    }

    const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
    };
    if (state.messages[0]?.id === "welcome") {
        actions.push(setMessage([...state.messages.slice(1), userMessage]));
    } else {
        actions.push(addMessage(userMessage));
    }

    actions.push(...[setResponseStatus(true), setLastError(null), setResponsePhase("searching")]);
    actions.forEach((action) => dispatch(action));

    // Simulate phase progression for UX while the backend works
    const reviewingTimer = window.setTimeout(() => dispatch(setResponsePhase("reviewing")), 500);
    const writingTimer = window.setTimeout(() => dispatch(setResponsePhase("writing")), 1200);

    const controller = new AbortController();
    abortController.current = controller;

    try {
        // Build optional metadata filter from selected categories
        const filter = state.categories.length > 0 ? { doc_type: { $in: state.categories } } : undefined;

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: trimmed, filter }),
            signal: controller.signal,
        });

        const body = (await response.json().catch(() => ({}))) as {
            answer?: string;
            detail?: string;
            error?: string;
        };

        if (!response.ok) {
            throw new Error(body.detail ?? body.error ?? "Unable to generate an answer.");
        }

        dispatch(
            addMessage({
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: body.answer || "I couldn't find a grounded answer in the current index.",
                status: "completed",
            }),
        );
    } catch (error) {
        const actions: Action[] = [];
        if (isAbortError(error)) {
            dispatch(
                chatActions.addMessage({
                    id: `assistant-canceled-${Date.now()}`,
                    role: "assistant",
                    content: "Response canceled.",
                    status: "canceled",
                    canceledAtPhase: state.responsePhase,
                }),
            );
            return;
        }
        const msg = error instanceof Error ? error.message : "Unable to generate an answer.";

        actions.push(
            chatActions.addMessage({
                id: `assistant-error-${Date.now()}`,
                role: "assistant",
                content: msg,
                status: "error",
            }),
        );
        actions.push(chatActions.setLastError(msg));
        actions.push(setLastFailedQuestion(trimmed));
        actions.forEach((action) => dispatch(action));
    } finally {
        window.clearTimeout(reviewingTimer);
        window.clearTimeout(writingTimer);
        abortController.current = null;
        dispatch(setResponseStatus(false));
    }
};

export const onCancel = (abortController: React.RefObject<AbortController | null>) => abortController.current?.abort();

export const toggleCategory = (category: DocCategory, state: ChatBotState) => {
    chatActions.setCategories(
        state.categories.includes(category)
            ? state.categories.filter((c) => c !== category)
            : [...state.categories, category],
    );
};

export const setPhase = (phase: ResponsePhase, dispatch: RootDispatch) => {
    dispatch(chatActions.setResponsePhase(phase));
};
