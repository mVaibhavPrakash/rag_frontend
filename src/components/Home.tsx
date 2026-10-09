import { Provider } from "react-redux";
import RagWorkspace from "./RagWorkspace";
import { appStore } from "@/state/store";

export default function Home() {
  return (
    <Provider store={appStore}>
      <RagWorkspace />
    </Provider>
  );
}
