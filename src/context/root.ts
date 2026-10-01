import { useContext } from "react";
import { RagWorkspaceContext } from "./ragWorkspaceContext";
import { DocumentContext } from "./documentContext";

export const useRagWorkspace = () => {
    const context = useContext(RagWorkspaceContext);
    if (!context) {
        throw new Error("useRagWorkspace must be used within a RagWorkspaceProvider");
    }
    return context;
};

export const useDocumentContext = () => {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error("useDocumentContext must be used within a DocumentContextProvider");
    }
    return context;
};
