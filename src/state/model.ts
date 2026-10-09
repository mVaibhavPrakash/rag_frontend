import {
  ChatMessage,
  DocCategory,
  ResponsePhase,
  Status,
} from "@/components/types";

export interface ChatBotState {
  categories: DocCategory[];
  isResponding: boolean;
  responsePhase: ResponsePhase;
  lastError: string | null;
  lastFailedQuestion: string;
  messages: ChatMessage[];
}

export interface DocMetadata {
  id: string;
  key: string;
  value: string;
}

export interface RAGDocument {
  id: string;
  name: string;
  category: DocCategory;
  metadata: DocMetadata[];
  createdAt: string;
}

export interface DocumentState extends RAGDocument {
  processingStatus: Status;
}
