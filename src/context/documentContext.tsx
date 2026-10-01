import { ChangeEvent, createContext, useRef, useState } from "react";
import { guessCategory } from "../components/constants";
import { MetadataEntry, PendingDocument, RagDocument } from "../components/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

type DocumentContextValue = {
    documents: RagDocument[];
    pendingFiles: PendingDocument[];
    isSaving: boolean;
    saveError: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onSelectFiles: (event: ChangeEvent<HTMLInputElement>) => void;
    onUpdatePendingFile: (id: string, patch: Partial<Pick<PendingDocument, "name" | "category">>) => void;
    onRemovePendingFile: (id: string) => void;
    onAddMetadataField: (pendingId: string) => void;
    onUpdateMetadataField: (pendingId: string, metadataId: string, patch: Partial<Pick<MetadataEntry, "key" | "value">>) => void;
    onRemoveMetadataField: (pendingId: string, metadataId: string) => void;
    onSaveDocuments: () => void;
    onCancelSave: () => void;
    onRemoveDocument: (id: string) => void;
};

export const DocumentContext = createContext<DocumentContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DocumentContextProvider({ children }: { children: React.ReactNode }) {
    const [documents, setDocuments] = useState<RagDocument[]>([]);
    const [pendingFiles, setPendingFiles] = useState<PendingDocument[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // ------------------------------------------------------------------
    // File staging
    // ------------------------------------------------------------------

    const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const staged: PendingDocument[] = Array.from(files).map((file, index) => ({
            id: `pending-${Date.now()}-${index}`,
            file,
            name: file.name,
            category: guessCategory(file.name),
            metadata: [],
        }));

        setPendingFiles((prev) => [...prev, ...staged]);
        event.target.value = "";
    };

    const onUpdatePendingFile = (id: string, patch: Partial<Pick<PendingDocument, "name" | "category">>) => {
        setPendingFiles((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const onRemovePendingFile = (id: string) => {
        setPendingFiles((prev) => prev.filter((item) => item.id !== id));
    };

    const onAddMetadataField = (pendingId: string) => {
        setPendingFiles((prev) =>
            prev.map((item) =>
                item.id === pendingId
                    ? { ...item, metadata: [...item.metadata, { id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key: "", value: "" }] }
                    : item,
            ),
        );
    };

    const onUpdateMetadataField = (pendingId: string, metadataId: string, patch: Partial<Pick<MetadataEntry, "key" | "value">>) => {
        setPendingFiles((prev) =>
            prev.map((item) => {
                if (item.id !== pendingId) return item;
                return { ...item, metadata: item.metadata.map((entry) => (entry.id === metadataId ? { ...entry, ...patch } : entry)) };
            }),
        );
    };

    const onRemoveMetadataField = (pendingId: string, metadataId: string) => {
        setPendingFiles((prev) =>
            prev.map((item) =>
                item.id === pendingId
                    ? { ...item, metadata: item.metadata.filter((entry) => entry.id !== metadataId) }
                    : item,
            ),
        );
    };

    // ------------------------------------------------------------------
    // Save — one fetch per file, all go to the backend /api/documents
    // ------------------------------------------------------------------

    const onSaveDocuments = async () => {
        if (pendingFiles.length === 0 || isSaving) return;

        setIsSaving(true);
        setSaveError(null);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const saved: RagDocument[] = [];

        try {
            for (const pending of pendingFiles) {
                if (controller.signal.aborted) break;

                // Build metadata as a flat object for the backend
                const metadataObj = Object.fromEntries(
                    pending.metadata
                        .filter((e) => e.key.trim().length > 0)
                        .map(({ key, value }) => [key, value]),
                );

                const formData = new FormData();
                formData.append("file", pending.file);
                formData.append("doc_type", pending.category);
                if (Object.keys(metadataObj).length > 0) {
                    formData.append("metadata_json", JSON.stringify(metadataObj));
                }

                const response = await fetch("/api/documents", {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const errorBody = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
                    throw new Error(errorBody.detail ?? errorBody.error ?? `Failed to save ${pending.name}`);
                }

                const data = (await response.json()) as {
                    documents?: Array<{
                        name: string;
                        doc_id: string;
                        namespace: string;
                        doc_type: string;
                        metadata: Record<string, string>;
                        chunk_count: number;
                    }>;
                };

                const doc = data.documents?.[0];
                if (!doc) continue;

                const metadataEntries: MetadataEntry[] = [
                    ...Object.entries(doc.metadata ?? {}).map(([key, value], i) => ({
                        id: `meta-${doc.doc_id}-${i}`,
                        key,
                        value: String(value),
                    })),
                    ...(doc.namespace ? [{ id: `meta-${doc.doc_id}-ns`, key: "namespace", value: doc.namespace }] : []),
                    ...(doc.doc_type ? [{ id: `meta-${doc.doc_id}-dt`, key: "doc_type", value: doc.doc_type }] : []),
                    { id: `meta-${doc.doc_id}-chunks`, key: "chunks", value: String(doc.chunk_count) },
                ];

                saved.push({
                    id: `doc-${doc.doc_id}`,
                    name: doc.name || pending.name,
                    category: pending.category,
                    metadata: metadataEntries,
                    addedAt: new Date().toLocaleTimeString(),
                });
            }

            const savedNames = new Set(saved.map((d) => d.name));
            setDocuments((prev) => [...saved, ...prev.filter((d) => !savedNames.has(d.name))]);
            setPendingFiles([]);
        } catch (error) {
            if (isAbortError(error)) {
                setSaveError("Upload canceled.");
                return;
            }
            console.error("Document save failed", error);
            setSaveError(error instanceof Error ? error.message : "Failed to save documents.");
        } finally {
            abortControllerRef.current = null;
            setIsSaving(false);
        }
    };

    const onCancelSave = () => {
        abortControllerRef.current?.abort();
    };

    const onRemoveDocument = (id: string) => {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    };

    // ------------------------------------------------------------------

    const value: DocumentContextValue = {
        documents,
        pendingFiles,
        isSaving,
        saveError,
        fileInputRef,
        onSelectFiles,
        onUpdatePendingFile,
        onRemovePendingFile,
        onAddMetadataField,
        onUpdateMetadataField,
        onRemoveMetadataField,
        onSaveDocuments,
        onCancelSave,
        onRemoveDocument,
    };

    return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}
