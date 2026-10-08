import { useContext } from "react";
import { RagWorkspaceContext } from "./ragWorkspaceContext";

export const useRagWorkspace = () => {
    const context = useContext(RagWorkspaceContext);
    if (!context) {
        throw new Error("useRagWorkspace must be used within a RagWorkspaceProvider");
    }
    return context;
};
