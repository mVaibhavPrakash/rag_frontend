import { PayloadAction } from "@reduxjs/toolkit";
import { ChatBotState} from '../model';
import { ChatMessage, DocCategory, ResponsePhase } from "@/components/types";

export const setCategories = (state: ChatBotState, action: PayloadAction<DocCategory[]>) => {
    state.categories = action.payload;
};

export const setMessage = (state: ChatBotState, action: PayloadAction<ChatMessage[]>) => {
    state.messages = action.payload;
};

export const addMessage = (state: ChatBotState, action: PayloadAction<ChatMessage>) => {
    state.messages.push(action.payload);
};


export const setResponseStatus = (state: ChatBotState, action: PayloadAction<boolean>) => {
    state.isResponding = action.payload;
};

export const setResponsePhase = (state: ChatBotState, action: PayloadAction<ResponsePhase>) => {
    state.responsePhase = action.payload;
};

export const setLastError = (state: ChatBotState, action: PayloadAction<string | null>) => {
    state.lastError = action.payload;
};

export const setLastFailedQuestion = (state: ChatBotState, action: PayloadAction<string>) => {
    state.lastFailedQuestion = action.payload;
};
