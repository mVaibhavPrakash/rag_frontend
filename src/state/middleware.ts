import { Status } from "@/components/types";
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { docActions } from './slices/documentSlice';

export const docListenerMiddleware = createListenerMiddleware();

docListenerMiddleware.startListening({
  // Listen for specific actions that remove values
  matcher: isAnyOf(docActions.removeDocument),
  
  effect: async (action, listenerApi) => {
    const previousState = listenerApi.getOriginalState() as RootState;
    const currentState = listenerApi.getState() as RootState;

    if(action.type === "document/removeDocument"){
        const prevDocState = previousState.documents;
        const currDocState = currentState.documents;
        const removedItems = prevDocState.filter(prevItem => !currDocState.some(currItem => currItem.id === prevItem.id));
        const savedItems = removedItems?.filter(item => item.processingStatus === Status.Saved) ?? [];

        if (savedItems.length > 0) {
            try {
                // API call to remove items
                await fetch('/api/remove-items', {
                    method: 'POST',
                    body: JSON.stringify({ removed: removedItems }),
                });
            } catch (error) {
                console.error("Sync failed:", error);
            }
        }
    }
  },
});