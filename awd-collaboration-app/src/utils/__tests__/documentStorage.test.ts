import { StorageManager } from '../StorageManager';
import { documentStorage } from '../documentStorage';
import type { Document } from '../../types/document';
import type { DocumentDraft } from '../documentStorage';

// Mock the StorageManager module
jest.mock('../StorageManager', () => {
  const mockStorageManager = {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockReturnValue(null),
    remove: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn().mockReturnValue({
      totalSize: '500 B',
      remainingSpace: '500 KB',
      itemCount: 5,
      isNearingCapacity: false
    }),
    addEventListener: jest.fn().mockReturnValue(() => {})
  };

  return {
    __esModule: true,
    StorageManager: jest.fn(() => mockStorageManager),
    default: jest.fn(() => mockStorageManager)
  };
});

describe('Document Storage', () => {
  const mockDocument: Document = {
    id: 'test-doc-1',
    title: 'Test Document',
    content: 'Test content',
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedBy: 'user1',
    updatedAt: new Date().toISOString(),
    collaborators: [],
    isPublic: false,
    version: 1,
    metadata: {
      status: 'draft',
      lastModifiedBy: 'user1',
      lastModifiedAt: new Date().toISOString(),
      collaborativeEditingEnabled: false
    },
    permissions: {
      workspaceId: 'workspace1',
      owner: 'user1',
      admin: ['user1'],
      write: ['user1'],
      read: ['user1'],
      editors: ['user1'],
      readers: ['user1'],
      commenters: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Draft Management', () => {
    it('should save document draft', async () => {
      const result = await documentStorage.saveDraft(mockDocument.id, mockDocument.content!);
      expect(result).toBe(true);
      
      const mockStorageManager = new StorageManager();
      expect(mockStorageManager.set).toHaveBeenCalledWith(
        expect.stringContaining(mockDocument.id),
        expect.objectContaining({
          documentId: mockDocument.id,
          content: mockDocument.content
        }),
        2
      );
    });

    it('should get document draft', () => {
      const mockDraft: DocumentDraft = {
        documentId: mockDocument.id,
        content: mockDocument.content!,
        lastModified: Date.now()
      };

      const mockStorageManager = new StorageManager();
      mockStorageManager.get = jest.fn().mockReturnValueOnce(mockDraft);

      const draft = documentStorage.getDraft(mockDocument.id);
      expect(draft).toEqual(mockDraft);
      expect(mockStorageManager.get).toHaveBeenCalledWith(expect.stringContaining(mockDocument.id));
    });

    it('should return null for non-existent draft', () => {
      const draft = documentStorage.getDraft('non-existent');
      expect(draft).toBeNull();
    });

    it('should remove document draft', () => {
      documentStorage.removeDraft(mockDocument.id);
      const mockStorageManager = new StorageManager();
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.stringContaining(mockDocument.id));
    });

    it('should correctly check if draft exists', () => {
      const mockStorageManager = new StorageManager();
      mockStorageManager.get = jest.fn().mockReturnValueOnce({ content: 'test' });

      const exists = documentStorage.hasDraft(mockDocument.id);
      expect(exists).toBe(true);
    });
  });

  describe('Metadata Management', () => {
    it('should save document metadata', async () => {
      const mockStorageManager = new StorageManager();
      mockStorageManager.set = jest.fn().mockResolvedValueOnce(true);

      const result = await documentStorage.saveMetadata(mockDocument);
      expect(result).toBe(true);
      expect(mockStorageManager.set).toHaveBeenCalledWith(
        expect.stringContaining(mockDocument.id),
        expect.objectContaining({
          id: mockDocument.id,
          title: mockDocument.title
        }),
        1
      );
    });

    it('should get document metadata', () => {
      const mockMetadata = {
        id: mockDocument.id,
        title: mockDocument.title,
        updatedAt: mockDocument.updatedAt,
        size: mockDocument.size
      };

      const mockStorageManager = new StorageManager();
      mockStorageManager.get = jest.fn().mockReturnValueOnce(mockMetadata);

      const metadata = documentStorage.getMetadata(mockDocument.id);
      expect(metadata).toEqual(mockMetadata);
    });
  });

  describe('Recent Documents', () => {
    it('should save recent documents list', async () => {
      const documents = [mockDocument];
      const result = await documentStorage.saveRecentDocuments(documents);
      expect(result).toBe(true);

      const mockStorageManager = new StorageManager();
      expect(mockStorageManager.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            id: mockDocument.id,
            title: mockDocument.title,
            updatedAt: mockDocument.updatedAt
          })
        ]),
        1
      );
    });

    it('should get recent documents list', () => {
      const mockRecentList = [{
        id: mockDocument.id,
        title: mockDocument.title,
        updatedAt: mockDocument.updatedAt
      }];

      const mockStorageManager = new StorageManager();
      mockStorageManager.get = jest.fn().mockReturnValueOnce(mockRecentList);

      const recentDocs = documentStorage.getRecentDocuments();
      expect(recentDocs).toEqual(mockRecentList);
    });
  });

  describe('Storage Management', () => {
    it('should return storage statistics', () => {
      const mockStats = {
        totalSize: '500 B',
        remainingSpace: '500 KB',
        itemCount: 5,
        isNearingCapacity: false
      };

      const mockStorageManager = new StorageManager();
      mockStorageManager.getStats = jest.fn().mockReturnValueOnce(mockStats);

      const stats = documentStorage.getStorageStats();
      expect(stats).toEqual(mockStats);
    });

    it('should clear all document storage', () => {
      documentStorage.clearAll();
      const mockStorageManager = new StorageManager();
      expect(mockStorageManager.clear).toHaveBeenCalled();
    });

    it('should clear expired drafts', () => {
      const mockStorageManager = new StorageManager();
      mockStorageManager.get = jest.fn().mockReturnValue(null);
      
      documentStorage.clearExpiredDrafts();
      expect(mockStorageManager.get).toHaveBeenCalled();
    });
  });
});
