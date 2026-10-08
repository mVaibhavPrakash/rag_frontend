import { Provider } from "react-redux";
import { RagWorkspaceProvider } from "../context/ragWorkspaceContext";
import RagWorkspace from "./RagWorkspace";
import { appStore } from "@/state/store";

export default function Home() {
  return (
    <RagWorkspaceProvider>
        <Provider store={appStore}>
          <RagWorkspace />
        </Provider>
    </RagWorkspaceProvider>
  );
}
