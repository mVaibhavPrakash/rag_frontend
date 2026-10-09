import { Provider } from "react-redux";
import RagWorkspace from "./RagWorkspace";
import { appStore } from "@/state/store";
import { JSX } from "react";

const Home = (): JSX.Element => {
  return (
    <Provider store={appStore}>
      <RagWorkspace />
    </Provider>
  );
};

export default Home;
