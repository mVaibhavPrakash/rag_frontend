import { RootDispatch } from "@/state/store";
import { JSX } from "react";
import { useDispatch } from "react-redux";
import { DocumentState } from "./types";
import { removeDocument } from "@/state/slices/documentSlice";
import { IconButton, Tooltip } from "@cimpress-ui/react";
import { FileText, X } from "lucide-react";

interface SavedDocPanelProps {
    docs: DocumentState[];
}

export const SavedDocPanel = ({ docs }: SavedDocPanelProps): JSX.Element => {
    const dispatch: RootDispatch = useDispatch();

    return (
        <>
            {docs.map((doc) => (
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
            ))
            }
        </>
    );

}