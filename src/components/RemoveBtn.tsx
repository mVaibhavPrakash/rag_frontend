import { JSX } from "react";
import { DocumentState } from "./types";
import { removeDocument } from "@/state/slices/documentSlice";
import { IconButton, Tooltip } from "@cimpress-ui/react";
import { X } from "lucide-react";
import { RootDispatch } from "@/state/store";
import { useDispatch } from "react-redux";

interface RemoveBtnProps {
    doc: DocumentState;
    isDisabled? : boolean;
}

export const RemoveBtn = ({ doc, isDisabled = false }: RemoveBtnProps): JSX.Element => {
    const dispatch: RootDispatch = useDispatch();

    return (<Tooltip label={`Remove ${doc.name}`}>
        <IconButton
            variant="tertiary"
            tone="critical"
            size="small"
            aria-label={`Remove ${doc.name}`}
            icon={<X size={13} />}
            isDisabled={isDisabled}
            onPress={() => dispatch(removeDocument({ id: doc.id }))}
        />
    </Tooltip>
    )
}