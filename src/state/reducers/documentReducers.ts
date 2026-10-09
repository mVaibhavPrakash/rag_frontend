import { DocCategory, Status } from "@/components/types";
import { PayloadAction } from "@reduxjs/toolkit";
import { DocMetadata, DocumentState } from "../model";

export const addDocument = (state: DocumentState[], action: PayloadAction<DocumentState[]>): DocumentState[] => {
    state = action.payload;
    return state;
};

export const addNewDocument = (state: DocumentState[], action: PayloadAction<DocumentState[]>) => {
    /**
     * No need to return the state as here we are mutating the existing state and not recreating it,
     * so Immer tracks the mutation and creates the next immutable state automatically.
    */
    state.push(...action.payload);
};

export const removeDocument = (state: DocumentState[], action: PayloadAction<{ id: string }>): DocumentState[] => {
    /**
     * Must return the new array when replacing state(filter creates an entire new state), so that Immer replace the current redux state with this new array.
     * If we would have used state.splice then there was not need of returning a new state as splice() modifies the draft array directly, so Immer tracks it.
     * 
     * Here, `state = state.filter(...)` also won't work without returning it
     * This is because `state` is a local function parameter, and reassigning it
     * only changes the local reference, not the actual Immer draft.
     * Since we are neither modifying the draft nor returning a new array,
     * Redux state remains unchanged.
     * 
     * Rule: Either modify the Immer draft directly or return a new state.
     */
    return state.filter(value => value.id !== action.payload.id);
};

export const updateDocCategory = (state: DocumentState[], action: PayloadAction<{ id: string, category: DocCategory }>) => {
    const { id, category } = action.payload;
    const filteredState = state.find(s => s.id === id);
    if (filteredState) {
        filteredState.category = category;
    }
};

export const addMetadata = (state: DocumentState[], action: PayloadAction<{ id: string }>) => {
    const stateSlice = state.find(s => s.id === action.payload.id);
    if (stateSlice) {
        stateSlice.metadata.push({ id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key: "", value: "" });
    }
};

export const updateMetadata = (state: DocumentState[], action: PayloadAction<{ id: string; metadataId: string; field: Partial<Pick<DocMetadata, "key" | "value">> }>) => {
    const { id, metadataId, field } = action.payload;
    const stateSlice = state.find(s => s.id === id);
    if (stateSlice) {
        stateSlice.metadata?.forEach(m => {
            if (m.id === metadataId) {
                m = { ...m, ...field };
            }
        });
    }
};

export const removeMetadata = (state: DocumentState[], action: PayloadAction<{ id: string, metadataId: string }>) => {
    const { id, metadataId } = action.payload;
    const stateSlice = state.find(s => s.id === id);
    if (stateSlice) {
        stateSlice.metadata = stateSlice.metadata.filter(m => m.id !== metadataId);
    }
};

export const updateDocumentStatus = (state: DocumentState[], action: PayloadAction<{ id: string, status: Status }[]>): DocumentState[] => {
    const payload = action.payload;
    return state.filter(s => {
        const value = payload.find(p => p.id === s.id);
        if (value) {
            return { ...s, processingStatus: value };
        } else {
            return s;
        }
    });
};
