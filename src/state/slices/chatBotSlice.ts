import { createSlice } from "@reduxjs/toolkit";
import { ChatBotState } from "../model";
import {
    setMessage,
    setResponseStatus,
    setLastError,
    setLastFailedQuestion,
    setResponsePhase,
    addMessage,
    setCategories,
} from "../reducers/chatBotReducers";

const initialState: ChatBotState = {
    categories: [],
    isResponding: false,
    responsePhase: "searching",
    lastError: null,
    lastFailedQuestion: "",
    messages: [
        {
            id: "welcome",
            role: "assistant",
            content:
                "Add a few documents, then ask a question. I will pick the most relevant knowledge automatically unless you tell me where to look.",
        },
    ],
};

const chatBotSlice = createSlice({
    name: "chatbot",
    initialState,
    reducers: {
        setCategories,
        addMessage,
        setResponseStatus,
        setMessage,
        setLastError,
        setLastFailedQuestion,
        setResponsePhase,
    },
});

export const chatActions = chatBotSlice.actions;
export default chatBotSlice.reducer;
