export interface DocumentVersion {
  id: string;
  number: number;
  content: string;
  createdAt: string;
  createdBy: string;
  comment?: string;
}

export interface DocumentComment {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  replyTo?: string;
}

export interface Document {
  id: string;
  title: string;
  content?: string;
  contentUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  collaborators: string[];
  isPublic: boolean;
  version: number;
  currentVersionId?: string;
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
    workspaceId: string;
    owner: string;
    admin: string[];
    write: string[];
    read: string[];
    editors: string[];
    readers: string[];
    commenters: string[];
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
