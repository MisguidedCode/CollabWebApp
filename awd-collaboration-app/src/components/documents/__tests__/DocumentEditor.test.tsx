import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DocumentEditor from '../DocumentEditor';
import { documentStorage } from '../../../utils/documentStorage';
import documentReducer, { updateDocumentThunk } from '../../../store/slices/documentSlice';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Mock Firebase config
jest.mock('../../../config/firebase', () => ({
  default: {
    apiKey: 'test-api-key',
    authDomain: 'test-domain',
    projectId: 'test-project',
    storageBucket: 'test-bucket',
    messagingSenderId: 'test-sender',
    appId: 'test-app-id'
  }
}));

// Mock WebSocket Provider
jest.mock('y-websocket', () => ({
  WebsocketProvider: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    disconnect: jest.fn(),
    awareness: {
      setLocalStateField: jest.fn(),
      on: jest.fn(),
      getStates: jest.fn().mockReturnValue(new Map()),
    },
  })),
}));

// Create properly typed mock functions
const mockGetDraft = jest.fn();
const mockSaveDraft = jest.fn();
const mockRemoveDraft = jest.fn();
const mockSaveMetadata = jest.fn();

// Mock document storage
jest.mock('../../../utils/documentStorage', () => ({
  documentStorage: {
    getDraft: (...args: any[]) => mockGetDraft(...args),
    saveDraft: (...args: any[]) => mockSaveDraft(...args),
    removeDraft: (...args: any[]) => mockRemoveDraft(...args),
    saveMetadata: (...args: any[]) => mockSaveMetadata(...args),
  },
}));

// Mock Firebase functions
jest.mock('../../../services/documentService', () => ({
  uploadDocumentContent: jest.fn().mockResolvedValue('https://example.com/doc.html'),
  updateDocument: jest.fn().mockResolvedValue(true),
}));

// Re-export the mocks for use in tests
export const documentStorageMocks = {
  getDraft: mockGetDraft,
  saveDraft: mockSaveDraft,
  removeDraft: mockRemoveDraft,
  saveMetadata: mockSaveMetadata,
};

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      documents: documentReducer,
      auth: () => ({ user: { uid: 'test-user', email: 'test@example.com' } }),
    },
    preloadedState: initialState,
  });
};

const mockDocument = {
  id: 'test-doc-1',
  title: 'Test Document',
  content: '<p>Test content</p>',
  createdBy: 'test-user',
  createdAt: new Date().toISOString(),
  updatedBy: 'test-user',
  updatedAt: new Date().toISOString(),
  type: 'text',
  status: 'published',
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

describe('DocumentEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset WebSocket mock
    (WebsocketProvider as jest.Mock).mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render editor with toolbar when not in readonly mode', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <DocumentEditor documentId={mockDocument.id} />
        </Provider>
      );

      // Check for toolbar buttons
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should render editor without toolbar in readonly mode', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <DocumentEditor documentId={mockDocument.id} readOnly={true} />
        </Provider>
      );

      // Toolbar buttons should not be present
      expect(screen.queryByRole('button', { name: /bold/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /italic/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });
  });

  describe('Draft Management', () => {
    it('should detect and prompt to restore existing draft', async () => {
      const draftContent = '<p>Draft content</p>';
      mockGetDraft.mockReturnValue({
        content: draftContent,
        lastModified: new Date().toISOString(),
      });

      const store = createMockStore();
      
      // Mock window.confirm
      const mockConfirm = jest.spyOn(window, 'confirm');
      mockConfirm.mockImplementation(() => true);

      render(
        <Provider store={store}>
          <DocumentEditor documentId={mockDocument.id} />
        </Provider>
      );

      // Verify draft detection
      expect(mockGetDraft).toHaveBeenCalledWith(mockDocument.id);
      expect(mockConfirm).toHaveBeenCalled();
      
      // After confirming, draft should be removed
      await waitFor(() => {
        expect(mockRemoveDraft).toHaveBeenCalledWith(mockDocument.id);
      });

      mockConfirm.mockRestore();
    });

    it('should save drafts periodically while editing', async () => {
      const store = createMockStore();
      
      // Mock timer
      jest.useFakeTimers();

      render(
        <Provider store={store}>
          <DocumentEditor documentId={mockDocument.id} />
        </Provider>
      );

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      // Check if draft was saved
      expect(mockSaveDraft).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Collaboration Features', () => {
    it('should initialize WebSocket connection for collaboration', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <DocumentEditor documentId={mockDocument.id} />
        </Provider>
      );

      // Verify WebSocket connection was initialized
      expect(WebsocketProvider).toHaveBeenCalledWith(
        'ws://localhost:4444',
        `document-${mockDocument.id}`,
        expect.any(Y.Doc)
      );
    });

    it('should show connected status when WebSocket connects', async () => {
      // Mock WebSocket connected status
      (WebsocketProvider as jest.Mock).mockImplementation(() => ({
        on: (event: string, callback: (data: any) => void) => {
          if (event === 'status') {
            callback({ status: 'connected' });
          }
        },
        disconnect: jest.fn(),
        awareness: {
          setLocalStateField: jest.fn(),
          on: jest.fn(),
          getStates: jest.fn().mockReturnValue(new Map()),
        },
      }));

      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <DocumentEditor documentId={mockDocument.id} />
        </Provider>
      );

      // Check for connected status
      expect(await screen.findByText('Connected')).toBeInTheDocument();
    });
  });
});
