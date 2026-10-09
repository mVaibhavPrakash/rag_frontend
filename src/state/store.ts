import { configureStore } from "@reduxjs/toolkit";
import { docListenerMiddleware } from "./middleware";
import documentReducer from "./slices/documentSlice";
import chatBotReducer from "./slices/chatBotSlice";

export const appStore = configureStore({
  reducer: {
    documents: documentReducer,
    chatbot: chatBotReducer,
  },
  middleware: (getDefaultMiddleWares) =>
    getDefaultMiddleWares().prepend(docListenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof appStore.getState>;
export type RootDispatch = typeof appStore.dispatch;
