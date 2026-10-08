import { FileText, Paperclip, Plus, X } from "lucide-react";
import {
    Button,
    IconButton,
    Select,
    SelectItem,
    TextField,
    Tooltip
} from "@cimpress-ui/react";
import { AllowedFileTypes, CATEGORIES } from "./constants";
import { DocCategory, DocumentState, Status } from "./types";
import { useDispatch, useSelector } from "react-redux";
import { appStore, RootDispatch, RootState } from "../state/store";
import {
    addDocument,
    addMetadata,
    addNewDocument,
    removeDocument,
    removeMetadata,
    selectLoadingDocs,
    selectSavedDocs,
    selectSelectedDocs,
    updateDocCategory,
    updateMetadata,
} from "@/state/slices/documentSlice";
import { useRef } from "react";
import { onCancelSave, onSaveDocuments, onSelectFiles } from "@/helper/documentHelper";

export default function DocumentsPanel() {
    const allowedFileTypesString = Object.values(AllowedFileTypes).join(",");
    const dispatch: RootDispatch = useDispatch();

    const savedDocs = useSelector(selectSavedDocs);
    const selectedDocs = useSelector(selectSelectedDocs);
    const loadingDocs = useSelector(selectLoadingDocs);
    const unSavedDocs: DocumentState[] = [...selectedDocs, ...loadingDocs,];
    const totalDocs = [...savedDocs, ...unSavedDocs];

    const abortControllerRef = useRef<AbortController>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filesRef = useRef<Map<string, File>>(new Map());

    return (
        <section className="panel documents-panel">
            <h2>Documents</h2>
            <ul className="doc-list">
                {totalDocs.length === 0 && <li className="doc-empty">No documents yet.</li>}
                {savedDocs.map((doc) => (
                    <li key={doc.id} className="doc-item">
                        <span className="doc-icon">
                            <FileText size={14} />
                        </span>
                        <span className="doc-info">
                            <strong>{doc.name}</strong>
                            <span className="doc-meta">
                                <span className="doc-category">{doc.category}</span>
                                {doc.metadata.map((entry) => (
                                    <span key={entry.id} className="doc-notes">
                                        {entry.key}: {entry.value}
                                    </span>
                                ))}
                            </span>
                        </span>
                        <Tooltip label={`Remove ${doc.name}`}>
                            <IconButton variant="tertiary"
                                tone="critical"
                                size="small"
                                aria-label={`Remove ${doc.name}`}
                                icon={<X size={13} />}
                                onPress={() => dispatch(removeDocument({ id: doc.id }))} />
                        </Tooltip>
                    </li>
                ))}
            </ul>

            <Button
                variant="primary"
                iconStart={<Paperclip size={14} />}
                onPress={() => fileInputRef.current?.click()}
            >
                Add files
            </Button>
            <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept={allowedFileTypesString}
                multiple
                onChange={(e) => {
                    const files = onSelectFiles(e, filesRef.current);
                    dispatch(addNewDocument(files));
                }}
            />

            {unSavedDocs.length > 0 && (
                <div className="pending-list">
                    <p className="pending-hint">
                        Knowledge base is auto-detected - adjust it or add metadata before saving.
                    </p>
                    {unSavedDocs.map((file) => {
                        const isDisabled = file.processingStatus === Status.Loading;
                        return (
                            <div key={file.id} className="pending-item">
                                <div className="pending-item-head">
                                    <FileText size={14} />
                                    <strong className="pending-file-name">{file.name}</strong>
                                    <Tooltip label={`Remove ${file.name}`}>
                                        <IconButton
                                            variant="tertiary"
                                            tone="critical"
                                            size="small"
                                            aria-label={`Remove ${file.name}`}
                                            icon={<X size={13} />}
                                            isDisabled={isDisabled}
                                            onPress={() => dispatch(removeDocument({ id: file.id }))}
                                        />
                                    </Tooltip>
                                </div>

                                <div className="pending-select">
                                    <Select
                                        label="Knowledge base"
                                        value={file.category}
                                        isDisabled={isDisabled}
                                        onChange={(e) => {
                                            if (e) {
                                                dispatch(
                                                    updateDocCategory({
                                                        id: file.id,
                                                        category: e.toString() as DocCategory,
                                                    }),
                                                );
                                            }
                                        }}
                                    >
                                        {CATEGORIES.map((category) => (
                                            <SelectItem key={category} id={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="metadata-list">
                                    {file.metadata.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="metadata-row"
                                            aria-disabled={isDisabled}
                                        >
                                            <TextField
                                                isDisabled={isDisabled}
                                                label="Metadata key"
                                                aria-label="Metadata key"
                                                value={entry.key}
                                                onChange={(value) =>
                                                    dispatch(updateMetadata({
                                                        id: file.id,
                                                        metadataId: entry.id,
                                                        field: { key: value },
                                                    }))
                                                }
                                                placeholder="Key (e.g. Owner)"
                                            />
                                            <TextField
                                                isDisabled={isDisabled}
                                                label="Metadata value"
                                                aria-label="Metadata value"
                                                value={entry.value}
                                                onChange={(value) =>
                                                    dispatch(updateMetadata({
                                                        id: file.id,
                                                        metadataId: entry.id,
                                                        field: { value },
                                                    }))
                                                }
                                                placeholder="Value"
                                            />
                                            <Tooltip label="Remove metadata field">
                                                <IconButton
                                                    variant="tertiary"
                                                    isDisabled={isDisabled}
                                                    tone="critical"
                                                    size="small"
                                                    aria-label="Remove metadata field"
                                                    icon={<X size={13} />}
                                                    onPress={() =>
                                                        dispatch(removeMetadata({
                                                            id: file.id,
                                                            metadataId: entry.id,
                                                        }))
                                                    }
                                                />
                                            </Tooltip>
                                        </div>
                                    ))}
                                    <Button
                                        isDisabled={isDisabled}
                                        variant="secondary"
                                        size="small"
                                        iconStart={<Plus size={12} />}
                                        onPress={() => dispatch(addMetadata({ id: file.id }))}
                                    >
                                        Add metadata
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    <div className="pending-actions">
                        <Button
                            variant="primary"
                            onPress={async () => {
                                abortControllerRef.current = new AbortController();
                                const { docs, errorMessage } = await onSaveDocuments(abortControllerRef.current, totalDocs, filesRef.current, dispatch);
                                dispatch(addDocument(docs));
                            }}
                            isDisabled={loadingDocs.length > 0}
                        >
                            {loadingDocs.length > 0
                                ? "Saving to knowledge base…"
                                : "Save to knowledge base"}
                        </Button>
                        {loadingDocs.length > 0 && (
                            <Button variant="secondary" onPress={() => {
                                onCancelSave(abortControllerRef.current);
                                abortControllerRef.current = null;
                            }}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
