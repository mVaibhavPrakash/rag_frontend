"use client";

import { Fragment, useEffect, useRef } from "react";
import { Bot, CircleStopIcon, CornerDownLeftIcon, Database, RotateCcw } from "lucide-react";
import { Button, IconButton, Tooltip, ToggleButton, ToggleButtonGroup } from "@cimpress-ui/react";
import { CATEGORIES } from "./constants";
import { useRagWorkspace } from "../context/root";
import { useState } from "react";

const MAX_QUESTION_HEIGHT = 300;
const AGENT_STEPS = [
    { phase: "searching", label: "Searching indexed documents" },
    { phase: "reviewing", label: "Reviewing relevant sections" },
    { phase: "writing",   label: "Drafting a grounded answer" },
] as const;

function getPhaseLabel(phase: "searching" | "reviewing" | "writing" | undefined) {
    return AGENT_STEPS.find((step) => step.phase === phase)?.label.toLowerCase() ?? "processing your request";
}

export default function ChatPanel() {
    const {
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
    } = useRagWorkspace();

    const [knowledgeOpen, setKnowledgeOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messageEndRef = useRef<HTMLDivElement | null>(null);
    const activeStepIndex = AGENT_STEPS.findIndex((step) => step.phase === responsePhase);
    const activeStepLabel = AGENT_STEPS[activeStepIndex]?.label ?? "Working on your answer";

    const resizeTextarea = (textarea: HTMLTextAreaElement) => {
        textarea.style.height = "auto";
        const nextHeight = Math.min(textarea.scrollHeight, MAX_QUESTION_HEIGHT);
        textarea.style.height = `${nextHeight}px`;
        textarea.style.overflowY = textarea.scrollHeight > MAX_QUESTION_HEIGHT ? "auto" : "hidden";
    };

    useEffect(() => {
        if (textareaRef.current) resizeTextarea(textareaRef.current);
    }, [question]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isResponding, responsePhase]);

    return (
        <section className="panel chat-panel">
            <h2>Ask</h2>

            <div className="rag-message-list">
                {messages.map((message) => (
                    <Fragment key={message.id}>
                        <div
                            className={`rag-message ${message.role === "user" ? "rag-message-user" : "rag-message-assistant"}`}
                        >
                            {message.content}
                        </div>
                        {message.status === "canceled" && (
                            <div className="canceled-response-status">
                                <CircleStopIcon size={14} aria-hidden="true" />
                                <span>Stopped while {getPhaseLabel(message.canceledAtPhase)}. Later steps were not run.</span>
                            </div>
                        )}
                    </Fragment>
                ))}
                {isResponding && (
                    <div className="agent-progress" role="status" aria-live="polite">
                        <span className="response-indicator" aria-hidden="true" />
                        <span>{activeStepLabel}</span>
                    </div>
                )}
                {lastError && !isResponding && (
                    <div className="agent-error" role="alert">
                        <span>{lastError}</span>
                        <Tooltip label="Retry last question">
                            <IconButton
                                variant="tertiary"
                                size="small"
                                aria-label="Retry last question"
                                icon={<RotateCcw size={15} />}
                                onPress={retryLastQuestion}
                            />
                        </Tooltip>
                    </div>
                )}
                <div ref={messageEndRef} className="message-end" aria-hidden="true" />
            </div>

            <div className="composer">
                <div className="composer-toolbar">
                    <label className="model-picker">
                        <Bot size={13} aria-hidden="true" />
                        <span>GPT-4o mini</span>
                    </label>
                    <Button
                        variant={selectedCategories.length > 0 ? "primary" : "secondary"}
                        size="small"
                        iconStart={<Database size={13} />}
                        onPress={() => setKnowledgeOpen((v) => !v)}
                    >
                        {selectedCategories.length > 0
                            ? `Knowledge base (${selectedCategories.length})`
                            : "Knowledge base"}
                    </Button>
                </div>

                {knowledgeOpen && (
                    <div className="tool-popover">
                        <ToggleButtonGroup
                            aria-label="Knowledge base categories"
                            selectionMode="multiple"
                            selectedKeys={new Set(selectedCategories)}
                            onSelectionChange={(keys) => {
                                const next = new Set(keys as Set<string | number>);
                                CATEGORIES.forEach((category) => {
                                    const has = selectedCategories.includes(category);
                                    const should = next.has(category);
                                    if (has !== should) toggleCategory(category);
                                });
                            }}
                            wrap
                        >
                            {CATEGORIES.map((category) => (
                                <ToggleButton key={category} value={category}>
                                    {category}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                        <p className="composer-hint">
                            {selectedCategories.length === 0
                                ? "Nothing selected — RAG will decide automatically."
                                : "RAG will still check other categories if needed."}
                        </p>
                    </div>
                )}

                <div className="composer-input-row">
                    <textarea
                        ref={textareaRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        placeholder="Ask a question about your documents..."
                        rows={2}
                    />
                    <Tooltip
                        label={isResponding ? "Stop generating" : "Send question"}
                        isDisabled={!isResponding && !question.trim()}
                    >
                        <IconButton
                            variant={isResponding ? "secondary" : "primary"}
                            UNSAFE_className="send-btn"
                            aria-label={isResponding ? "Stop generating" : "Send"}
                            icon={isResponding ? <CircleStopIcon size={13} /> : <CornerDownLeftIcon size={15} />}
                            onPress={isResponding ? onCancel : onSend}
                            isDisabled={!isResponding && !question.trim()}
                        />
                    </Tooltip>
                </div>
            </div>
        </section>
    );
}
