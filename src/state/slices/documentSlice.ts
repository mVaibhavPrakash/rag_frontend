import {  Status } from '@/components/types';
import { createSelector, createSlice} from '@reduxjs/toolkit';
import { RootState } from '../store';
import { addDocument, addMetadata, addNewDocument, removeDocument, removeMetadata, updateDocCategory, updateDocumentStatus, updateMetadata } from '../reducers/documentReducers';
import { DocumentState } from '../model';

const initialState: DocumentState[] = [];

const documentSlice = createSlice({
    name: "document",
    initialState,
    reducers: {
        addDocument,
        addNewDocument, 
        removeDocument, 
        updateDocCategory, 
        addMetadata, 
        updateMetadata,
        removeMetadata, 
        updateDocumentStatus
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

export const docActions = documentSlice.actions;
export default documentSlice.reducer;
