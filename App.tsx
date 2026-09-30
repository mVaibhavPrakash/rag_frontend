import { createRoot } from "react-dom/client";
import "./globals.css";
import "@fontsource-variable/open-sans/wght.css";
import "@fontsource-variable/open-sans/wght-italic.css";
import "@cimpress-ui/react/styles.css";
import Home from "./components/Home";

const app = document.getElementById("app");
if(app){
    const root = createRoot(app);
    root.render(
        <Home/>
    );
}