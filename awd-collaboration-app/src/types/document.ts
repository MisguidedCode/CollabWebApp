export interface Document {
  id: string;
  title: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  collaborators: string[];
  isPublic: boolean;
  version: number;
  size?: number;
  metadata: {
    status: 'draft' | 'published';
    lastModifiedBy: string;
    lastModifiedAt: string;
    collaborativeEditingEnabled: boolean;
    shareableLink?: string;
  };
  ydoc?: {
    state: Uint8Array;  // Y.js document state
    updates: Array<{
      timestamp: number;
      state: Uint8Array;
    }>;
  };
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
}

export interface DocumentDraft {
  documentId: string;
  content: string;
  version: number;
  timestamp: string;
  conflictWith?: {
    version: number;
    timestamp: string;
    userId: string;
  };
}

export interface DocumentUpdate {
  type: 'content' | 'metadata' | 'permissions';
  changes: Partial<Document>;
  userId: string;
  timestamp: number;
}

export interface CollaborativeDocument extends Document {
  collaborativeState: {
    usersOnline: string[];
    lastSync: string;
    lockedBy?: string;
  };
}
