import { Paperclip } from "lucide-react";
import { Button } from "@cimpress-ui/react";
import { AllowedFileTypes } from "./constants";
import { useDispatch, useSelector } from "react-redux";
import { RootDispatch } from "../state/store";
import { docActions, selectLoadingDocs, selectSavedDocs, selectSelectedDocs } from "@/state/slices/documentSlice";
import { useRef } from "react";
import { onCancelSave, onSaveDocuments, onSelectFiles } from "@/helper/documentHelper";
import { SavedDocPanel } from "./SavedDocPanel";
import { UnSavedDocsPanel } from "./UnSavedDocsPanel";
import { DocumentState } from "@/state/model";

export default function DocumentsPanel() {
    const allowedFileTypesString = Object.values(AllowedFileTypes).join(",");
    const dispatch: RootDispatch = useDispatch();

    const savedDocs = useSelector(selectSavedDocs);
    const selectedDocs = useSelector(selectSelectedDocs);
    const loadingDocs = useSelector(selectLoadingDocs);
    const unSavedDocs: DocumentState[] = [...selectedDocs, ...loadingDocs];
    const totalDocs = [...savedDocs, ...unSavedDocs];

    const abortControllerRef = useRef<AbortController>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filesRef = useRef<Map<string, File>>(new Map());

    return (
        <section className="panel documents-panel">
            <h2>Documents</h2>
            <ul className="doc-list">
                {totalDocs.length === 0 && <li className="doc-empty">No documents yet.</li>}
                <SavedDocPanel docs={savedDocs} />
            </ul>

            <Button variant="primary" iconStart={<Paperclip size={14} />} onPress={() => fileInputRef.current?.click()}>
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
                    dispatch(docActions.addNewDocument(files));
                }}
            />

            {unSavedDocs.length > 0 && (
                <div className="pending-list">
                    <p className="pending-hint">
                        Knowledge base is auto-detected - adjust it or add metadata before saving.
                    </p>
                    <UnSavedDocsPanel docs={unSavedDocs} />
                    <div className="pending-actions">
                        <Button
                            variant="primary"
                            onPress={async () => {
                                abortControllerRef.current = new AbortController();
                                const { docs, errorMessage } = await onSaveDocuments(
                                    abortControllerRef.current,
                                    totalDocs,
                                    filesRef.current,
                                    dispatch,
                                );
                                abortControllerRef.current = null;
                                dispatch(docActions.addDocument(docs));
                            }}
                            isDisabled={loadingDocs.length > 0}
                        >
                            {loadingDocs.length > 0 ? "Saving to knowledge base…" : "Save to knowledge base"}
                        </Button>
                        {loadingDocs.length > 0 && (
                            <Button variant="secondary" onPress={() => onCancelSave(abortControllerRef.current)}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
