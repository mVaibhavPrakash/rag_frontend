import { DocumentContextProvider } from "../context/documentContext";
import { RagWorkspaceProvider } from "../context/ragWorkspaceContext";
import RagWorkspace from "./RagWorkspace";

export default function Home() {
  return (
    <RagWorkspaceProvider>
      <DocumentContextProvider>
        <RagWorkspace />
      </DocumentContextProvider>
    </RagWorkspaceProvider>
  );
}
