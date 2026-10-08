import { DocCategory, DocMetadata, DocumentState, Status } from '@/components/types';
import { createSelector, createSlice,  PayloadAction} from '@reduxjs/toolkit';
import { RootState } from '../store';

const initialState: DocumentState[] = []

const documentSlice = createSlice({
    name: "document",
    initialState,
    reducers: {
        addDocument: (state: DocumentState[], action: PayloadAction<DocumentState[]>) => {
            state = action.payload;
            return state;
        },
        addNewDocument: (state: DocumentState[], action: PayloadAction<DocumentState[]>) => {
            state.push(...action.payload)
        },
        removeDocument: (state: DocumentState[], action: PayloadAction<{id: string}>) => {
            // Must return the new array when replacing state
            return state.filter(value => value.id !== action.payload.id)
        },
        updateDocCategory: (state: DocumentState[], action: PayloadAction<{id: string, category: DocCategory}>) => {
            const {id, category} = action.payload;
            const filteredState = state.find(s => s.id === id);
            if(filteredState){
                filteredState.category = category;
            }
        },
        addMetadata: (state: DocumentState[], action: PayloadAction<{id: string}>) => {
            const stateSlice = state.find(s => s.id === action.payload.id);
            if(stateSlice) {
                stateSlice.metadata.push({ id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key: "", value: "" });
            }
        },
        updateMetadata: (state: DocumentState[], action: PayloadAction<{id: string; metadataId: string; field: Partial<Pick<DocMetadata, "key" | "value">>}>) => {
            const {id, metadataId, field} = action.payload;
            const stateSlice = state.find(s => s.id === id);
            if(stateSlice) {
                stateSlice.metadata?.forEach(m => {
                    if(m.id === metadataId){
                        m = {...m, ...field}
                    }
                })
            }
        },
        removeMetadata: (state: DocumentState[], action: PayloadAction<{id: string, metadataId: string}>) => {
            const {id, metadataId} = action.payload;
            const stateSlice = state.find(s => s.id === id);
            if(stateSlice) {
                stateSlice.metadata = stateSlice.metadata.filter(m => m.id !== metadataId)
            }
        },
        updateDocumentStatus: (state: DocumentState[], action: PayloadAction<{id: string, status: Status}[]>) => {
            const payload = action.payload;
            return state.filter(s => {
                const value= payload.find(p => p.id === s.id);
                if(value) {
                    return {...s, processingStatus: value};
                } else {
                    return s;
                }
            });
        }
    }
});

const selectDocuments = (state: RootState) => state.documents;

export const selectSavedDocs = createSelector(
    [selectDocuments],
    documents => documents.filter(
        doc => doc.processingStatus === Status.Saved
    )
);

export const selectSelectedDocs = createSelector(
    [selectDocuments],
    documents => documents.filter(
        doc => doc.processingStatus === Status.Selected
    )
);

export const selectLoadingDocs = createSelector(
    [selectDocuments],
    documents => documents.filter(
        doc => doc.processingStatus === Status.Loading
    )
);

export const {addDocument,addNewDocument, removeDocument, updateDocCategory, addMetadata, updateMetadata,removeMetadata, updateDocumentStatus} = documentSlice.actions;
export default documentSlice.reducer;
