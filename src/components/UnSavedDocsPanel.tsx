import { docActions } from "@/state/slices/documentSlice";
import { Select, SelectItem } from "@cimpress-ui/react";
import { FileText } from "lucide-react";
import { JSX } from "react";
import { CATEGORIES } from "./constants";
import { MetaData } from "./MetaData";
import { DocCategory, Status } from "./types";
import { RootDispatch } from "@/state/store";
import { useDispatch } from "react-redux";
import { RemoveBtn } from "./RemoveBtn";
import { DocumentState } from "@/state/model";

interface UnSavedDocsProps {
  docs: DocumentState[];
}

export const UnSavedDocsPanel = ({ docs }: UnSavedDocsProps): JSX.Element => {
  const dispatch: RootDispatch = useDispatch();

  return (
    <>
      {docs.map((file) => {
        const isDisabled = file.processingStatus === Status.Loading;
        return (
          <div key={file.id} className="pending-item">
            <div className="pending-item-head">
              <FileText size={14} />
              <strong className="pending-file-name">{file.name}</strong>
              <RemoveBtn doc={file} />
            </div>

            <div className="pending-select">
              <Select
                label="Knowledge base"
                value={file.category}
                isDisabled={isDisabled}
                onChange={(e) => {
                  if (e) {
                    dispatch(
                      docActions.updateDocCategory({
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
            <MetaData doc={file} isDisabled={isDisabled} />
          </div>
        );
      })}
    </>
  );
};
