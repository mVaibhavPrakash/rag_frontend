import { docActions } from "@/state/slices/documentSlice";
import { Button, IconButton, TextField, Tooltip } from "@cimpress-ui/react";
import { Plus, X } from "lucide-react";
import { JSX, useState } from "react";
import { RootDispatch } from "@/state/store";
import { useDispatch } from "react-redux";
import { DocMetadata, DocumentState } from "@/state/model";

interface MetaDataProps {
  doc: DocumentState;
  isDisabled: boolean;
}

export const MetaData = ({ doc, isDisabled }: MetaDataProps): JSX.Element => {
  const dispatch: RootDispatch = useDispatch();
  const [state, setState] = useState<
    { id: string; key: string; value: string }[]
  >([...doc.metadata.map((m) => ({ id: m.id, key: m.key, value: m.value }))]);

  const onBlur = (
    id: string,
    field: Partial<Pick<DocMetadata, "key" | "value">>,
  ) => {
    dispatch(
      docActions.updateMetadata({ id: doc.id, metadataId: id, field: field }),
    );
  };

  const onChange = (
    id: string,
    field: Partial<Pick<DocMetadata, "key" | "value">>,
  ) => {
    setState((prev) => prev.map((p) => (p.id === id ? { ...p, ...field } : p)));
  };

  return (
    <div className="metadata-list">
      {doc.metadata.map((entry) => (
        <div key={entry.id} className="metadata-row" aria-disabled={isDisabled}>
          <TextField
            isDisabled={isDisabled}
            label="Metadata key"
            aria-label="Metadata key"
            value={state.find((s) => s.id === entry.id)?.key}
            onBlur={() =>
              onBlur(entry.id, {
                key: state.find((s) => s.id === entry.id)?.key,
              })
            }
            onChange={(value) => onChange(entry.id, { key: value })}
            placeholder="Key (e.g. Owner)"
          />
          <TextField
            isDisabled={isDisabled}
            label="Metadata value"
            aria-label="Metadata value"
            value={state.find((s) => s.id === entry.id)?.value}
            onBlur={() =>
              onBlur(entry.id, {
                key: state.find((s) => s.id === entry.id)?.value,
              })
            }
            onChange={(value) => onChange(entry.id, { value: value })}
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
                dispatch(
                  docActions.removeMetadata({
                    id: doc.id,
                    metadataId: entry.id,
                  }),
                )
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
        onPress={() => dispatch(docActions.addMetadata({ id: doc.id }))}
      >
        Add metadata
      </Button>
    </div>
  );
};
