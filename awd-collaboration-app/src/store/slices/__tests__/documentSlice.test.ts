import { configureStore, AnyAction } from '@reduxjs/toolkit';
import { ThunkDispatch } from 'redux-thunk';
import documentReducer, {
  fetchUserDocumentsThunk,
  fetchSharedDocumentsThunk,
  fetchDocumentByIdThunk,
  createDocumentThunk,
  updateDocumentThunk,
  uploadDocumentContentThunk
} from '../documentSlice';
import { Document, DocumentType } from '../../../types/document';

// Mock the document service
jest.mock('../../../services/documentService', () => ({
  getWorkspaceDocuments: jest.fn(),
  getSharedWorkspaceDocuments: jest.fn(),
  getDocumentById: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  uploadDocumentContent: jest.fn(),
}));

interface RootState {
  documents: ReturnType<typeof documentReducer>;
}

describe('documentSlice', () => {
  let store: ReturnType<typeof configureStore>;
  let dispatch: ThunkDispatch<RootState, undefined, AnyAction>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        documents: documentReducer,
      },
    });
    dispatch = store.dispatch as ThunkDispatch<RootState, undefined, AnyAction>;
  });

  const mockDocument: Document = {
    id: '1',
    title: 'Test Document',
    type: 'text' as DocumentType,
    createdBy: 'user1',
    updatedBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    permissions: {
      owner: 'user1',
      workspaceId: 'workspace1',
      readers: [],
      editors: [],
      commenters: [],
      public: false,
    },
    workspace: {
      id: 'workspace1',
      name: 'Test Workspace'
    }
  };

  describe('fetchUserDocumentsThunk', () => {
    it('should fetch user documents successfully', async () => {
      const { getWorkspaceDocuments } = require('../../../services/documentService');
      getWorkspaceDocuments.mockResolvedValueOnce([mockDocument]);

      await dispatch(fetchUserDocumentsThunk({ 
        workspaceId: 'workspace1', 
        userId: 'user1' 
      }));

      expect(getWorkspaceDocuments).toHaveBeenCalledWith('workspace1', 'user1');
      expect(store.getState().documents.documents).toEqual([mockDocument]);
    });
  });

  describe('fetchSharedDocumentsThunk', () => {
    it('should fetch shared documents successfully', async () => {
      const { getSharedWorkspaceDocuments } = require('../../../services/documentService');
      getSharedWorkspaceDocuments.mockResolvedValueOnce([mockDocument]);

      await dispatch(fetchSharedDocumentsThunk({ 
        workspaceId: 'workspace1', 
        userId: 'user1' 
      }));

      expect(getSharedWorkspaceDocuments).toHaveBeenCalledWith('workspace1', 'user1');
      expect(store.getState().documents.documents).toContainEqual(mockDocument);
    });
  });

  describe('fetchDocumentByIdThunk', () => {
    it('should fetch a document by id successfully', async () => {
      const { getDocumentById } = require('../../../services/documentService');
      getDocumentById.mockResolvedValueOnce(mockDocument);

      await dispatch(fetchDocumentByIdThunk({ 
        documentId: '1', 
        userId: 'user1' 
      }));

      expect(getDocumentById).toHaveBeenCalledWith('1', 'user1');
      expect(store.getState().documents.currentDocument).toEqual(mockDocument);
    });
  });

  describe('createDocumentThunk', () => {
    it('should create a document successfully', async () => {
      const { createDocument } = require('../../../services/documentService');
      createDocument.mockResolvedValueOnce(mockDocument);

      const documentData = {
        document: {
          title: 'Test Document',
          type: 'text' as DocumentType,
          createdBy: 'user1',
          updatedBy: 'user1',
          status: 'draft',
          permissions: {
            owner: 'user1',
            workspaceId: 'workspace1',
            readers: [],
            editors: [],
            commenters: [],
            public: false,
          },
          workspace: {
            id: 'workspace1',
            name: 'Test Workspace'
          }
        },
        userId: 'user1'
      };

      await dispatch(createDocumentThunk(documentData));

      expect(createDocument).toHaveBeenCalledWith(documentData.document, documentData.userId);
      expect(store.getState().documents.currentDocument).toEqual(mockDocument);
    });
  });

  describe('updateDocumentThunk', () => {
    it('should update a document successfully', async () => {
      const { updateDocument } = require('../../../services/documentService');
      const updatedDoc = { ...mockDocument, title: 'Updated Title' };
      updateDocument.mockResolvedValueOnce(updatedDoc);

      await dispatch(updateDocumentThunk({ 
        document: updatedDoc, 
        userId: 'user1' 
      }));

      expect(updateDocument).toHaveBeenCalledWith(updatedDoc, 'user1');
      expect(store.getState().documents.currentDocument).toEqual(updatedDoc);
    });
  });

  describe('uploadDocumentContentThunk', () => {
    it('should upload document content successfully', async () => {
      const { uploadDocumentContent } = require('../../../services/documentService');
      const contentUrl = 'https://example.com/content';
      uploadDocumentContent.mockResolvedValueOnce(contentUrl);

      await dispatch(uploadDocumentContentThunk({ 
        documentId: '1', 
        content: 'test content',
        userId: 'user1' 
      }));

      const state = store.getState().documents;
      expect(uploadDocumentContent).toHaveBeenCalledWith('1', 'test content', 'user1');
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });
});
