import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import documentSlice, { removeDocument } from './slices/documentSlice';
import { DocumentState, Status } from '@/components/types';
import { docListenerMiddleware } from './middleware';

export const appStore = configureStore({
    reducer: {
        documents: documentSlice
    }, middleware: (getDefaultMiddleWares) => getDefaultMiddleWares().prepend(docListenerMiddleware.middleware)
});

export type RootState = ReturnType<typeof appStore.getState>;
export type RootDispatch = typeof appStore.dispatch;
