import { StorageManager } from './StorageManager';
import type { Document } from '../types/document';

// Constants for storage keys and configuration
const STORAGE_CONFIG = {
  maxSize: 2 * 1024 * 1024, // 2MB
  cleanupThreshold: 0.8, // 80%
  itemTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  namespace: 'doc'
};

const STORAGE_KEYS = {
  DRAFT: 'draft',
  RECENT: 'recent',
  METADATA: 'metadata'
} as const;

// Create storage manager instance
const storageManager = new StorageManager(STORAGE_CONFIG);

export interface DocumentDraft {
  documentId: string;
  content: string;
  lastModified: number;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  updatedAt: string;
  size: number;
}

class DocumentStorageManager {
  // Save document draft
  public async saveDraft(documentId: string, content: string): Promise<boolean> {
    const draft: DocumentDraft = {
      documentId,
      content,
      lastModified: Date.now()
    };
    
    return storageManager.set(
      `${STORAGE_KEYS.DRAFT}:${documentId}`,
      draft,
      2 // Higher priority for drafts
    );
  }

  // Get document draft
  public getDraft(documentId: string): DocumentDraft | null {
    return storageManager.get(`${STORAGE_KEYS.DRAFT}:${documentId}`);
  }

  // Remove document draft
  public removeDraft(documentId: string): void {
    storageManager.remove(`${STORAGE_KEYS.DRAFT}:${documentId}`);
  }

  // Save document metadata
  public async saveMetadata(document: Document): Promise<boolean> {
    const metadata: DocumentMetadata = {
      id: document.id,
      title: document.title,
      updatedAt: document.updatedAt,
      size: document.size || 0
    };

    return storageManager.set(
      `${STORAGE_KEYS.METADATA}:${document.id}`,
      metadata,
      1 // Normal priority for metadata
    );
  }

  // Get document metadata
  public getMetadata(documentId: string): DocumentMetadata | null {
    return storageManager.get(`${STORAGE_KEYS.METADATA}:${documentId}`);
  }

  // Save recent documents list
  public async saveRecentDocuments(documents: Document[]): Promise<boolean> {
    const recentList = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt
    }));

    return storageManager.set(
      STORAGE_KEYS.RECENT,
      recentList,
      1 // Normal priority
    );
  }

  // Get recent documents list
  public getRecentDocuments(): Array<Pick<Document, 'id' | 'title' | 'updatedAt'>> | null {
    return storageManager.get(STORAGE_KEYS.RECENT);
  }

  // Check if a draft exists
  public hasDraft(documentId: string): boolean {
    return this.getDraft(documentId) !== null;
  }

  // Get storage statistics
  public getStorageStats() {
    return storageManager.getStats();
  }

  // Subscribe to storage events
  public subscribeToEvents(callback: Parameters<typeof storageManager.addEventListener>[0]) {
    return storageManager.addEventListener(callback);
  }

  // Clear all document storage
  public clearAll(): void {
    storageManager.clear();
  }

  // Clear expired drafts
  public clearExpiredDrafts(): void {
    const prefix = `${STORAGE_KEYS.DRAFT}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const draft = storageManager.get<DocumentDraft>(key.slice(prefix.length));
        if (!draft) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

export const documentStorage = new DocumentStorageManager();
