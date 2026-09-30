import { ChangeEvent, createContext, useEffect, useRef, useState } from "react";
import { isAbortError } from "../lib/http/abort";
import { guessCategory } from "../components/constants";
import { RagDocument, PendingDocument, MetadataEntry } from "../components/types";

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

export function DocumentContextProvider({ children }: { children: React.ReactNode}) {
    const [documents, setDocuments] = useState<RagDocument[]>([]);
        const [pendingFiles, setPendingFiles] = useState<PendingDocument[]>([]);
        const [isSaving, setIsSaving] = useState(false);
        const [saveError, setSaveError] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const abortControllerRef = useRef<AbortController | null>(null);

        useEffect(() => {
            return () => abortControllerRef.current?.abort();
        }, []);
    
        const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || files.length === 0) {
                return;
            }
    
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
    
        const onUpdateMetadataField = (
            pendingId: string,
            metadataId: string,
            patch: Partial<Pick<MetadataEntry, "key" | "value">>,
        ) => {
            setPendingFiles((prev) =>
                prev.map((item) => {
                    if (item.id !== pendingId) {
                        return item;
                    }
    
                    const metadata = item.metadata.map((entry) => (entry.id === metadataId ? { ...entry, ...patch } : entry));
                    return { ...item, metadata };
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
    
        const onSaveDocuments = async () => {
            if (pendingFiles.length === 0 || isSaving) {
                return;
            }
    
            setIsSaving(true);
            setSaveError(null);
            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                const formData = new FormData();
                pendingFiles.forEach((pending) => formData.append("files", pending.file));
                formData.append("documents", JSON.stringify(pendingFiles.map((pending) => ({
                    category: pending.category,
                    metadata: pending.metadata
                        .filter((entry) => entry.key.trim().length > 0)
                        .map(({ key, value }) => ({ key, value })),
                }))));
                const response = await fetch("/api/documents", {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
                    throw new Error(errorBody.error || "Failed to save documents");
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

                const processedDocuments = (data.documents ?? []).map((doc, index) => {
                    const pending = pendingFiles[index] ?? pendingFiles[0];
                    const metadataEntries = Object.entries(doc.metadata ?? {}).map(([key, value], metaIndex) => ({
                        id: `meta-${doc.doc_id}-${metaIndex}`,
                        key,
                        value: String(value),
                    }));

                    return {
                        id: `doc-${Date.now()}-${index}`,
                        name: doc.name ?? pending?.name ?? "Uploaded document",
                        category: pending?.category ?? "General",
                        metadata: [...metadataEntries, { id: `meta-${doc.doc_id}-namespace`, key: "namespace", value: doc.namespace }, { id: `meta-${doc.doc_id}-doc-type`, key: "doc_type", value: doc.doc_type }],
                        addedAt: "just now",
                    };
                });

                const uploadedNames = new Set(processedDocuments.map((document) => document.name));
                setDocuments((prev) => [...processedDocuments, ...prev.filter((document) => !uploadedNames.has(document.name))]);
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