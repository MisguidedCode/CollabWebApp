import { configureStore } from '@reduxjs/toolkit';
import documentReducer, {
  setDocuments,
  setCurrentDocument,
  updateCurrentDocument,
  setDocumentComments,
  starDocument,
  unstarDocument,
  resetDocumentState,
  fetchUserDocumentsThunk,
  uploadDocumentContentThunk,
} from '../documentSlice';
import type { Document, DocumentComment } from '../../../types/document';

// Mock document service
jest.mock('../../../services/documentService', () => ({
  getWorkspaceDocuments: jest.fn(),
  uploadDocumentContent: jest.fn(),
}));

describe('Document Slice', () => {
  const mockDocument: Document = {
    id: 'test-doc-1',
    title: 'Test Document',
    content: '<p>Test content</p>',
    type: 'text',
    status: 'published',
    createdBy: 'test-user',
    createdAt: new Date().toISOString(),
    updatedBy: 'test-user',
    updatedAt: new Date().toISOString(),
    permissions: {
      owner: 'test-user',
      readers: [],
      editors: [],
      commenters: [],
      public: false,
      workspaceId: 'test-workspace',
    },
    workspace: {
      id: 'test-workspace',
      name: 'Test Workspace',
    },
  };

  const mockComment: DocumentComment = {
    id: 'comment-1',
    content: 'Test comment',
    createdBy: 'test-user',
    createdAt: new Date().toISOString(),
  };

  type RootState = {
    documents: ReturnType<typeof documentReducer>;
  };

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        documents: documentReducer,
      },
    });
  });

  describe('Reducers', () => {
    it('should set documents', () => {
      store.dispatch(setDocuments([mockDocument]));
      const documents = store.getState().documents;
      expect(documents.documents).toEqual([mockDocument]);
    });

    it('should set current document', () => {
      store.dispatch(setCurrentDocument(mockDocument));
      const documents = store.getState().documents;
      expect(documents.currentDocument).toEqual(mockDocument);
    });

    it('should update current document', () => {
      store.dispatch(setCurrentDocument(mockDocument));
      const updatedDocument = {
        ...mockDocument,
        title: 'Updated Title',
      };
      store.dispatch(updateCurrentDocument(updatedDocument));
      const documents = store.getState().documents;
      expect(documents.currentDocument).toEqual(updatedDocument);
    });

    it('should set document comments', () => {
      store.dispatch(setCurrentDocument(mockDocument));
      store.dispatch(setDocumentComments({
        documentId: mockDocument.id,
        comments: [mockComment],
      }));
      const documents = store.getState().documents;
      expect(documents.currentDocument?.comments).toEqual([mockComment]);
    });

    it('should star document', () => {
      store.dispatch(setDocuments([mockDocument]));
      store.dispatch(starDocument(mockDocument.id));
      const documents = store.getState().documents;
      expect(documents.documents[0].starred).toBe(true);
      expect(documents.starredDocuments).toContainEqual({
        ...mockDocument,
        starred: true,
      });
    });

    it('should unstar document', () => {
      const starredDoc = { ...mockDocument, starred: true };
      store.dispatch(setDocuments([starredDoc]));
      store.dispatch(setCurrentDocument(starredDoc));
      store.dispatch(unstarDocument(mockDocument.id));
      const documents = store.getState().documents;
      expect(documents.documents[0].starred).toBe(false);
      expect(documents.starredDocuments).not.toContainEqual(starredDoc);
    });

    it('should reset document state', () => {
      store.dispatch(setDocuments([mockDocument]));
      store.dispatch(setCurrentDocument(mockDocument));
      store.dispatch(resetDocumentState());
      const documents = store.getState().documents;
      expect(documents).toEqual({
        documents: [],
        currentDocument: null,
        recentDocuments: [],
        starredDocuments: [],
        loading: false,
        error: null,
      });
    });
  });

  describe('Thunks', () => {
    it('should fetch user documents', async () => {
      const mockDocuments = [mockDocument];
      const getWorkspaceDocuments = require('../../../services/documentService').getWorkspaceDocuments;
      getWorkspaceDocuments.mockResolvedValue(mockDocuments);

      await (store.dispatch as any)(fetchUserDocumentsThunk({
        workspaceId: 'test-workspace',
        userId: 'test-user',
      }));

      const documents = store.getState().documents;
      expect(documents.documents).toEqual(mockDocuments);
      expect(documents.loading).toBe(false);
      expect(documents.error).toBeNull();
    });

    it('should handle fetch user documents error', async () => {
      const getWorkspaceDocuments = require('../../../services/documentService').getWorkspaceDocuments;
      getWorkspaceDocuments.mockRejectedValue(new Error('Failed to fetch'));

      await (store.dispatch as any)(fetchUserDocumentsThunk({
        workspaceId: 'test-workspace',
        userId: 'test-user',
      }));

      const documents = store.getState().documents;
      expect(documents.loading).toBe(false);
      expect(documents.error).toBe('Failed to fetch');
    });

    it('should upload document content', async () => {
      const uploadDocumentContent = require('../../../services/documentService').uploadDocumentContent;
      const contentUrl = 'https://example.com/doc.html';
      uploadDocumentContent.mockResolvedValue(contentUrl);

      store.dispatch(setDocuments([mockDocument]));
      store.dispatch(setCurrentDocument(mockDocument));

      await (store.dispatch as any)(uploadDocumentContentThunk({
        documentId: mockDocument.id,
        content: '<p>New content</p>',
        userId: 'test-user',
      }));

      const documents = store.getState().documents;
      expect(documents.loading).toBe(false);
      expect(documents.error).toBeNull();
      expect(documents.currentDocument?.contentUrl).toBe(contentUrl);
    });

    it('should handle upload document content error', async () => {
      const uploadDocumentContent = require('../../../services/documentService').uploadDocumentContent;
      uploadDocumentContent.mockRejectedValue(new Error('Failed to upload'));

      await (store.dispatch as any)(uploadDocumentContentThunk({
        documentId: mockDocument.id,
        content: '<p>New content</p>',
        userId: 'test-user',
      }));

      const documents = store.getState().documents;
      expect(documents.loading).toBe(false);
      expect(documents.error).toBe('Failed to upload');
    });
  });
});
