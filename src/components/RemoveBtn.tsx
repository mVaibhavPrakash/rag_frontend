import { JSX } from "react";
import { docActions } from "@/state/slices/documentSlice";
import { IconButton, Tooltip } from "@cimpress-ui/react";
import { X } from "lucide-react";
import { RootDispatch } from "@/state/store";
import { useDispatch } from "react-redux";
import { DocumentState } from "@/state/model";

interface RemoveBtnProps {
    doc: DocumentState;
    isDisabled?: boolean;
}

export const RemoveBtn = ({ doc, isDisabled = false }: RemoveBtnProps): JSX.Element => {
    const dispatch: RootDispatch = useDispatch();

    return (
        <Tooltip label={`Remove ${doc.name}`}>
            <IconButton
                variant="tertiary"
                tone="critical"
                size="small"
                aria-label={`Remove ${doc.name}`}
                icon={<X size={13} />}
                isDisabled={isDisabled}
                onPress={() => dispatch(docActions.removeDocument({ id: doc.id }))}
            />
        </Tooltip>
    );
};
