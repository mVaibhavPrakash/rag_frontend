
import { Status } from "@/components/types";
import { DocMetadata, DocumentState } from "@/state/model";
import { ChangeEvent } from "react";
import { guessCategory } from "../components/constants";
import { RootDispatch } from "@/state/store";
import { docActions } from '../state/slices/documentSlice';

export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

export const onSelectFiles = (event: ChangeEvent<HTMLInputElement>, filesMap: Map<string, File>): DocumentState[] => {
    const files = event.target.files;
    if (!files || files.length === 0) return [];

    const staged: DocumentState[] = Array.from(files).map((file, index) => {
        const id = `pending-${Date.now()}-${index}`;
        filesMap.set(id, file);
        return {
            id,
            processingStatus: Status.Selected,
            name: file.name,
            category: guessCategory(file.name),
            metadata: [],
            createdAt: new Date().toLocaleTimeString()
        }
    });

    event.target.value = "";
    return staged;
};

export const onSaveDocuments = async (controller: AbortController, docState: DocumentState[], filesMap: Map<string, File>, dispatch: RootDispatch): Promise<{ docs: DocumentState[]; errorMessage: string }> => {
    const unProcessedDocs: DocumentState[] = [];
    const remainingDocs: DocumentState[] = [];

    docState.forEach(s => {
        if (s.processingStatus === Status.Selected) {
            unProcessedDocs.push({ ...s, processingStatus: Status.Loading });
        } else {
            remainingDocs.push(s);
        }
    });
    dispatch(docActions.updateDocumentStatus(unProcessedDocs.map(doc => ({id:doc.id, status: doc.processingStatus}))));

    if (unProcessedDocs.length === 0) return { docs: remainingDocs, errorMessage: "" };

    try {
        for (const docs of unProcessedDocs) {
            const file = filesMap.get(docs.id);
            if (controller.signal.aborted || !docs || !file) break;

            // Build metadata as a flat object for the backend
            const metadataObj = Object.fromEntries(
                docs.metadata
                    ?.filter((e) => e.key.trim().length > 0)
                    .map(({ key, value }) => [key, value]) ?? [],
            );

            const formData = new FormData();
            formData.append("file", file);
            formData.append("doc_type", docs.category);
            if (Object.keys(metadataObj).length > 0) {
                formData.append("metadata_json", JSON.stringify(metadataObj));
            }

            const response = await fetch("/api/documents", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            filesMap.delete(docs.id);

            if (!response.ok) {
                const errorBody = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
                throw new Error(errorBody.detail ?? errorBody.error ?? `Failed to save ${docs.name}`);
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

            const metadataEntries: DocMetadata[] = [
                ...Object.entries(doc.metadata ?? {}).map(([key, value], i) => ({
                    id: `meta-${doc.doc_id}-${i}`,
                    key,
                    value: String(value),
                })),
                ...(doc.namespace ? [{ id: `meta-${doc.doc_id}-ns`, key: "namespace", value: doc.namespace }] : []),
                ...(doc.doc_type ? [{ id: `meta-${doc.doc_id}-dt`, key: "doc_type", value: doc.doc_type }] : []),
                { id: `meta-${doc.doc_id}-chunks`, key: "chunks", value: String(doc.chunk_count) },
            ];

            remainingDocs.push({
                id: `doc-${doc.doc_id}`,
                name: doc.name || docs.name,
                category: docs.category,
                metadata: metadataEntries,
                processingStatus: Status.Saved,
                createdAt: new Date().toLocaleTimeString(),
            });
        }

        remainingDocs.sort((s1, s2) => s2.createdAt.localeCompare(s1.createdAt));
        return { docs: remainingDocs, errorMessage: "" };
    } catch (error) {
        remainingDocs.sort((s1, s2) => s2.createdAt.localeCompare(s1.createdAt));
        let errorMessage = "";
        if (isAbortError(error)) {
            errorMessage = "Upload Cancelled";
        }
        errorMessage = error instanceof Error ? error.message : "Failed to save documents.";
        return { docs: remainingDocs, errorMessage };
    }
};

export const onCancelSave = (controller: AbortController | null) => {
    controller?.abort();
};
