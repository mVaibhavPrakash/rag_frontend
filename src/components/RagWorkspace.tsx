import ChatPanel from "./ChatPanel";
import DocumentsPanel from "./DocumentsPanel";

export default function RagWorkspace() {
  return (
    <main className="app-shell">
      <DocumentsPanel />
      <ChatPanel />
    </main>
  );
}
