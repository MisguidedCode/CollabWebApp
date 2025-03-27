import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  DocumentState, 
  Document, 
  DocumentComment,
  DocumentVersion 
} from '../../types/document';
import {
  createDocument as createDocumentInFirestore,
  getWorkspaceDocuments,
  getSharedWorkspaceDocuments,
  getRecentDocuments,
  getDocumentById,
  updateDocument as updateDocumentInFirestore,
  deleteDocument as deleteDocumentFromFirestore,
  uploadDocumentContent,
  addDocumentComment,
  resolveComment,
  createDocumentVersion,
  subscribeToDocument,
  subscribeToDocumentComments
} from '../../services/documentService';
import { 
  registerSubscription,
  unregisterSubscriptionsByPrefix 
} from '../../utils/subscriptionManager';

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  recentDocuments: [],
  starredDocuments: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUserDocumentsThunk = createAsyncThunk(
  'documents/fetchUserDocuments',
  async ({ workspaceId, userId }: { workspaceId: string; userId: string }, { rejectWithValue }) => {
    try {
      return await getWorkspaceDocuments(workspaceId, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchSharedDocumentsThunk = createAsyncThunk(
  'documents/fetchSharedDocuments',
  async ({ workspaceId, userId }: { workspaceId: string; userId: string }, { rejectWithValue }) => {
    try {
      return await getSharedWorkspaceDocuments(workspaceId, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchRecentDocumentsThunk = createAsyncThunk(
  'documents/fetchRecentDocuments',
  async ({ userId, maxCount = 10 }: { userId: string; maxCount?: number }, { rejectWithValue }) => {
    try {
      return await getRecentDocuments(userId, maxCount);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchDocumentByIdThunk = createAsyncThunk(
  'documents/fetchDocumentById',
  async ({ documentId, userId }: { documentId: string; userId: string }, { dispatch, rejectWithValue }) => {
    try {
      const document = await getDocumentById(documentId, userId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Setup subscription for real-time updates
      const unsubscribe = await subscribeToDocument(documentId, userId, (updatedDocument: Document | null) => {
        if (updatedDocument) {
          dispatch(updateCurrentDocument(updatedDocument));
        }
      });
      
      registerSubscription(`document-${documentId}`, unsubscribe);
      
      return document;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createDocumentThunk = createAsyncThunk(
  'documents/createDocument',
  async ({ document, userId }: { document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>; userId: string }, { rejectWithValue }) => {
    try {
      return await createDocumentInFirestore(document, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateDocumentThunk = createAsyncThunk(
  'documents/updateDocument',
  async ({ document, userId }: { document: Document; userId: string }, { rejectWithValue }) => {
    try {
      await updateDocumentInFirestore(document, userId);
      return document;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteDocumentThunk = createAsyncThunk(
  'documents/deleteDocument',
  async ({ documentId, userId }: { documentId: string; userId: string }, { rejectWithValue }) => {
    try {
      await deleteDocumentFromFirestore(documentId, userId);
      return documentId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const uploadDocumentContentThunk = createAsyncThunk(
  'documents/uploadDocumentContent',
  async ({ 
    documentId, 
    content, 
    userId,
    onProgress 
  }: { 
    documentId: string; 
    content: string | Blob | File;
    userId: string;
    onProgress?: (progress: number) => void 
  }, { rejectWithValue }) => {
    try {
      const contentUrl = await uploadDocumentContent(documentId, content, userId);
      return { documentId, contentUrl };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addDocumentCommentThunk = createAsyncThunk(
  'documents/addDocumentComment',
  async ({ 
    documentId, 
    comment,
    userId 
  }: { 
    documentId: string; 
    comment: Omit<DocumentComment, 'id' | 'createdAt'>;
    userId: string 
  }, { dispatch, rejectWithValue }) => {
    try {
      const newComment = await addDocumentComment(documentId, comment, userId);
      
      // Setup subscription for comments if not already set up
      const unsubscribe = await subscribeToDocumentComments(documentId, userId, (comments: DocumentComment[]) => {
        dispatch(setDocumentComments({ documentId, comments }));
      });
      
      registerSubscription(`document-comments-${documentId}`, unsubscribe);
      
      return { documentId, comment: newComment };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const resolveDocumentCommentThunk = createAsyncThunk(
  'documents/resolveDocumentComment',
  async ({ 
    documentId, 
    commentId, 
    resolvedBy,
    userId 
  }: { 
    documentId: string; 
    commentId: string; 
    resolvedBy: string;
    userId: string 
  }, { rejectWithValue }) => {
    try {
      await resolveComment(documentId, commentId, resolvedBy, userId);
      return { documentId, commentId, resolvedBy };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createDocumentVersionThunk = createAsyncThunk(
  'documents/createDocumentVersion',
  async ({ 
    documentId, 
    version,
    userId 
  }: { 
    documentId: string; 
    version: Omit<DocumentVersion, 'id' | 'createdAt'>;
    userId: string 
  }, { rejectWithValue }) => {
    try {
      const newVersion = await createDocumentVersion(documentId, version, userId);
      return { documentId, version: newVersion };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Function to unsubscribe from document subscriptions
export const unsubscribeDocuments = () => {
  unregisterSubscriptionsByPrefix('document-');
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    
    setCurrentDocument: (state, action: PayloadAction<Document | null>) => {
      state.currentDocument = action.payload;
    },
    
    updateCurrentDocument: (state, action: PayloadAction<Document>) => {
      state.currentDocument = action.payload;
      
      // Also update document in the documents array if it exists
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
    },
    
    setDocumentComments: (state, action: PayloadAction<{ documentId: string; comments: DocumentComment[] }>) => {
      if (state.currentDocument && state.currentDocument.id === action.payload.documentId) {
        state.currentDocument.comments = action.payload.comments;
      }
    },
    
    starDocument: (state, action: PayloadAction<string>) => {
      const documentId = action.payload;
      
      // Update in documents array
      const index = state.documents.findIndex(doc => doc.id === documentId);
      if (index !== -1) {
        state.documents[index].starred = true;
      }
      
      // Update in current document
      if (state.currentDocument && state.currentDocument.id === documentId) {
        state.currentDocument.starred = true;
      }
      
      // Update starred documents array
      const document = state.documents.find(doc => doc.id === documentId);
      if (document) {
        state.starredDocuments.push(document);
      }
    },
    
    unstarDocument: (state, action: PayloadAction<string>) => {
      const documentId = action.payload;
      
      // Update in documents array
      const index = state.documents.findIndex(doc => doc.id === documentId);
      if (index !== -1) {
        state.documents[index].starred = false;
      }
      
      // Update in current document
      if (state.currentDocument && state.currentDocument.id === documentId) {
        state.currentDocument.starred = false;
      }
      
      // Update starred documents array
      state.starredDocuments = state.starredDocuments.filter(doc => doc.id !== documentId);
    },
    
    resetDocumentState: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchUserDocumentsThunk
    builder.addCase(fetchUserDocumentsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserDocumentsThunk.fulfilled, (state, action) => {
      state.documents = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUserDocumentsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // fetchSharedDocumentsThunk
    builder.addCase(fetchSharedDocumentsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSharedDocumentsThunk.fulfilled, (state, action) => {
      // Merge with existing documents, avoiding duplicates
      const existingIds = new Set(state.documents.map(doc => doc.id));
      const newDocs = action.payload.filter(doc => !existingIds.has(doc.id));
      state.documents = [...state.documents, ...newDocs];
      state.loading = false;
    });
    builder.addCase(fetchSharedDocumentsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // fetchRecentDocumentsThunk
    builder.addCase(fetchRecentDocumentsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRecentDocumentsThunk.fulfilled, (state, action) => {
      state.recentDocuments = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchRecentDocumentsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // fetchDocumentByIdThunk
    builder.addCase(fetchDocumentByIdThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDocumentByIdThunk.fulfilled, (state, action) => {
      state.currentDocument = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchDocumentByIdThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // createDocumentThunk
    builder.addCase(createDocumentThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createDocumentThunk.fulfilled, (state, action) => {
      state.documents.push(action.payload);
      state.currentDocument = action.payload;
      state.loading = false;
    });
    builder.addCase(createDocumentThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // updateDocumentThunk
    builder.addCase(updateDocumentThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateDocumentThunk.fulfilled, (state, action) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
      if (state.currentDocument && state.currentDocument.id === action.payload.id) {
        state.currentDocument = action.payload;
      }
      state.loading = false;
    });
    builder.addCase(updateDocumentThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // deleteDocumentThunk
    builder.addCase(deleteDocumentThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteDocumentThunk.fulfilled, (state, action) => {
      // Add null checks and default to empty arrays if undefined
      state.documents = (state.documents || []).filter(doc => doc.id !== action.payload);
      state.recentDocuments = (state.recentDocuments || []).filter(doc => doc.id !== action.payload);
      state.starredDocuments = (state.starredDocuments || []).filter(doc => doc.id !== action.payload);

      // Clean up currentDocument if it's the deleted document
      if (state.currentDocument?.id === action.payload) {
        state.currentDocument = null;
      }

      state.loading = false;
      state.error = null; // Clear any previous errors
    });
    builder.addCase(deleteDocumentThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // uploadDocumentContentThunk
    builder.addCase(uploadDocumentContentThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(uploadDocumentContentThunk.fulfilled, (state, action) => {
      const { documentId, contentUrl } = action.payload;
      
      // Update in documents array
      const index = state.documents.findIndex(doc => doc.id === documentId);
      if (index !== -1) {
        state.documents[index].contentUrl = contentUrl;
      }
      
      // Update in current document
      if (state.currentDocument && state.currentDocument.id === documentId) {
        state.currentDocument.contentUrl = contentUrl;
      }
      
      state.loading = false;
    });
    builder.addCase(uploadDocumentContentThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const {
  setDocuments,
  setCurrentDocument,
  updateCurrentDocument,
  setDocumentComments,
  starDocument,
  unstarDocument,
  resetDocumentState
} = documentSlice.actions;

export default documentSlice.reducer;
