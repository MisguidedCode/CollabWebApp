import { CollaborationPermission } from './permissions';

export type DocumentType = 'text' | 'spreadsheet' | 'presentation' | 'pdf' | 'other';
export type DocumentStatus = 'draft' | 'published' | 'archived';

export interface DocumentComment {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  position?: {
    page?: number;
    selection?: {
      from: number;
      to: number;
    };
  };
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  replies?: DocumentComment[];
}

export interface DocumentVersion {
  id: string;
  createdBy: string;
  createdAt: string;
  name?: string;
  description?: string;
  contentUrl?: string;
  contentHash?: string;
}

export interface DocumentPermissions {
  owner: string;
  readers: string[]; // User IDs
  editors: string[]; // User IDs
  commenters: string[]; // User IDs
  public: boolean;
  publicPermission?: CollaborationPermission;
  workspaceId?: string;
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  status: DocumentStatus;
  tags?: string[];
  size?: number;
  starred?: boolean;
  versions?: DocumentVersion[];
  currentVersionId?: string;
  permissions: DocumentPermissions;
  comments?: DocumentComment[];
  workspace?: {
    id: string;
    name: string;
  };
  folder?: string;
  metadata?: Record<string, any>;
}

export interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  recentDocuments: Document[];
  starredDocuments: Document[];
  loading: boolean;
  error: string | null;
}