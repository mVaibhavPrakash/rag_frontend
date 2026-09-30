import { createContext, useState } from "react";
import { AllowedFileTypes } from "../components/constants";

export type ChatFileType = typeof AllowedFileTypes[keyof typeof AllowedFileTypes];

export interface ChatFileItem {
    type: ChatFileType;
    file: File;
}

interface ChatState {
    chatText: string;
    fileList: ChatFileItem[];
}

const defaultState: ChatState = {
    chatText: "",
    fileList: [],
};

export const ChatContext = createContext<{ chatState: ChatState,
    setChatState: (chatState: ChatState) => void,
} | null>(null);

const ChatContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [chatState, setChatState] = useState(defaultState);

    return (
        <ChatContext.Provider value={{ chatState,setChatState }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContextProvider;