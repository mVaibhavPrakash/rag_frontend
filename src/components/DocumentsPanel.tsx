import { FileText, Paperclip, Plus, X } from "lucide-react";
import { Button, IconButton, Select, SelectItem, TextField, Tooltip } from "@cimpress-ui/react";
import { useDocumentContext } from "../context/root";
import { AllowedFileTypes, CATEGORIES } from "./constants";
import { DocCategory } from "./types";

export default function DocumentsPanel() {
    const {
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
    } = useDocumentContext();

    const allowedFileTypesString = Object.values(AllowedFileTypes).join(",");

    return (
        <section className="panel documents-panel">
            <h2>Documents</h2>

            <Button variant="primary" iconStart={<Paperclip size={14} />} onPress={() => fileInputRef.current?.click()}>
                Add files
            </Button>
            <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept={allowedFileTypesString}
                multiple
                onChange={onSelectFiles}
            />

            {pendingFiles.length > 0 && (
                <div className="pending-list">
                    <p className="pending-hint">Knowledge base is auto-detected - adjust it or add metadata before saving.</p>
                    {pendingFiles.map((pending) => (
                        <div key={pending.id} className="pending-item">
                            <div className="pending-item-head">
                                <FileText size={14} />
                                <strong className="pending-file-name">{pending.name}</strong>
                                <Tooltip label={`Remove ${pending.name}`}>
                                    <IconButton variant="tertiary"
                                        tone="critical"
                                        size="small"
                                        aria-label={`Remove ${pending.name}`}
                                        icon={<X size={13} />}
                                        onPress={() => onRemovePendingFile(pending.id)} />
                                </Tooltip>
                            </div>

                            <div className="pending-select">
                                <Select
                                    label="Knowledge base"
                                    value={pending.category}
                                    onChange={(value) => onUpdatePendingFile(pending.id, { category: value as DocCategory })}
                                >
                                    {CATEGORIES.map((category) => (
                                        <SelectItem key={category} id={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <div className="metadata-list">
                                {pending.metadata.map((entry) => (
                                    <div key={entry.id} className="metadata-row">
                                        <TextField
                                            label="Metadata key"
                                            aria-label="Metadata key"
                                            value={entry.key}
                                            onChange={(value) => onUpdateMetadataField(pending.id, entry.id, { key: value })}
                                            placeholder="Key (e.g. Owner)"
                                        />
                                        <TextField
                                            label="Metadata value"
                                            aria-label="Metadata value"
                                            value={entry.value}
                                            onChange={(value) => onUpdateMetadataField(pending.id, entry.id, { value })}
                                            placeholder="Value"
                                        />
                                        <Tooltip label="Remove metadata field">
                                            <IconButton variant="tertiary"
                                                tone="critical"
                                                size="small"
                                                aria-label="Remove metadata field"
                                                icon={<X size={13} />}
                                                onPress={() => onRemoveMetadataField(pending.id, entry.id)} />
                                        </Tooltip>
                                    </div>
                                ))}
                                <Button
                                    variant="secondary"
                                    size="small"
                                    iconStart={<Plus size={12} />}
                                    onPress={() => onAddMetadataField(pending.id)}
                                >
                                    Add metadata
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className="pending-actions">
                        <Button variant="primary" onPress={onSaveDocuments} isDisabled={isSaving}>
                            {isSaving ? "Saving to knowledge base…" : "Save to knowledge base"}
                        </Button>
                        {isSaving && (
                            <Button variant="secondary" onPress={onCancelSave}>
                                Cancel
                            </Button>
                        )}
                    </div>
                    {saveError && <p className="pending-error" role="alert">{saveError}</p>}
                </div>
            )}

            <ul className="doc-list">
                {documents.length === 0 && <li className="doc-empty">No documents yet.</li>}
                {documents.map((doc) => (
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
                                onPress={() => onRemoveDocument(doc.id)} />
                        </Tooltip>
                    </li>
                ))}
            </ul>
        </section>
    );
}
