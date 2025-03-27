import { documentStorage } from '../documentStorage';
import { StorageManager } from '../StorageManager';
import type { Document } from '../../types/document';

// Create mock instance
const mockSet = jest.fn().mockReturnValue(true);
const mockGet = jest.fn();
const mockRemove = jest.fn();
const mockClear = jest.fn();
const mockGetStats = jest.fn();

const mockStorageManager = {
  set: mockSet,
  get: mockGet,
  remove: mockRemove,
  clear: mockClear,
  getStats: mockGetStats,
};

// Mock StorageManager
jest.mock('../StorageManager', () => ({
  StorageManager: jest.fn().mockImplementation(() => mockStorageManager),
}));

describe('Document Storage', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Draft Management', () => {
    it('should save document draft', async () => {
      const documentId = 'test-doc-1';
      const content = '<p>Draft content</p>';

      const result = await documentStorage.saveDraft(documentId, content);

      expect(result).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        'draft:test-doc-1',
        expect.objectContaining({
          documentId,
          content,
          lastModified: expect.any(Number),
        }),
        2 // Priority
      );
    });

    it('should get document draft', () => {
      const documentId = 'test-doc-1';
      const mockDraft = {
        documentId,
        content: '<p>Draft content</p>',
        lastModified: Date.now(),
      };

      mockGet.mockReturnValue(mockDraft);

      const draft = documentStorage.getDraft(documentId);

      expect(draft).toEqual(mockDraft);
      expect(mockGet).toHaveBeenCalledWith('draft:test-doc-1');
    });

    it('should return null for non-existent draft', () => {
      const documentId = 'non-existent';
      mockGet.mockReturnValue(null);

      const draft = documentStorage.getDraft(documentId);

      expect(draft).toBeNull();
    });

    it('should remove document draft', () => {
      const documentId = 'test-doc-1';

      documentStorage.removeDraft(documentId);

      expect(mockRemove).toHaveBeenCalledWith('draft:test-doc-1');
    });

    it('should correctly check if draft exists', () => {
      const documentId = 'test-doc-1';
      mockGet.mockReturnValue({ content: 'test' });

      const hasDraft = documentStorage.hasDraft(documentId);

      expect(hasDraft).toBe(true);
    });
  });

  describe('Metadata Management', () => {
    it('should save document metadata', async () => {
      const result = await documentStorage.saveMetadata(mockDocument);

      expect(result).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        'metadata:test-doc-1',
        expect.objectContaining({
          id: mockDocument.id,
          title: mockDocument.title,
          updatedAt: mockDocument.updatedAt,
        }),
        1 // Priority
      );
    });

    it('should get document metadata', () => {
      const mockMetadata = {
        id: mockDocument.id,
        title: mockDocument.title,
        updatedAt: mockDocument.updatedAt,
        size: 0,
      };

      mockGet.mockReturnValue(mockMetadata);

      const metadata = documentStorage.getMetadata(mockDocument.id);

      expect(metadata).toEqual(mockMetadata);
      expect(mockGet).toHaveBeenCalledWith('metadata:test-doc-1');
    });
  });

  describe('Recent Documents', () => {
    it('should save recent documents list', async () => {
      const documents = [mockDocument];
      const result = await documentStorage.saveRecentDocuments(documents);

      expect(result).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        'recent',
        expect.arrayContaining([
          expect.objectContaining({
            id: mockDocument.id,
            title: mockDocument.title,
            updatedAt: mockDocument.updatedAt,
          }),
        ]),
        1 // Priority
      );
    });

    it('should get recent documents list', () => {
      const mockRecent = [{
        id: mockDocument.id,
        title: mockDocument.title,
        updatedAt: mockDocument.updatedAt,
      }];

      mockGet.mockReturnValue(mockRecent);

      const recent = documentStorage.getRecentDocuments();

      expect(recent).toEqual(mockRecent);
      expect(mockGet).toHaveBeenCalledWith('recent');
    });
  });

  describe('Storage Management', () => {
    it('should return storage statistics', () => {
      const mockStats = {
        totalSize: 1024,
        itemCount: 5,
        oldestItem: new Date(),
      };

      mockGetStats.mockReturnValue(mockStats);

      const stats = documentStorage.getStorageStats();

      expect(stats).toEqual(mockStats);
    });

    it('should clear all document storage', () => {
      documentStorage.clearAll();

      expect(mockClear).toHaveBeenCalled();
    });

    it('should clear expired drafts', () => {
      // Mock localStorage
      const mockLocalStorage: { [key: string]: string } = {
        'draft:test-1': JSON.stringify({ lastModified: Date.now() - 8 * 24 * 60 * 60 * 1000 }), // 8 days old
        'draft:test-2': JSON.stringify({ lastModified: Date.now() }), // Current
      };

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => mockLocalStorage[key],
          removeItem: jest.fn(),
          key: (index: number) => Object.keys(mockLocalStorage)[index],
          length: Object.keys(mockLocalStorage).length,
        },
        writable: true,
      });

      documentStorage.clearExpiredDrafts();

      expect(localStorage.removeItem).toHaveBeenCalledWith('draft:test-1');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('draft:test-2');
    });
  });
});
