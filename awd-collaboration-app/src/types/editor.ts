export interface ProviderAwarenessState {
  name: string;
  color: string;
  user: {
    id: string;
    name: string;
    photoURL?: string;
  };
}

export interface CollaborationState {
  connected: boolean;
  usersOnline: ProviderAwarenessState[];
}

export interface DocumentChange {
  type: 'content' | 'metadata';
  timestamp: number;
  userId: string;
  changes: any; // Y.js changes for content, or metadata changes
}

export interface EditorState {
  initialized: boolean;
  collaborationState: CollaborationState;
  unsavedChanges: boolean;
  lastSavedAt?: Date;
  error: string | null;
}

export interface WebSocketStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  error?: string;
}

export interface AutoSaveState {
  nextSaveIn: number;
  lastAttempt?: Date;
  error?: string;
}

export interface DocumentMetadata {
  version: number;
  lastModifiedBy: string;
  lastModifiedAt: string;
  status: 'draft' | 'published';
}

export interface WebSocketMessage {
  type: 'presence' | 'sync' | 'error';
  payload: any;
}

export interface MetaClientState {
  cursor?: {
    anchor: number;
    head: number;
  };
  [key: string]: any;
}

export interface AwarenessState {
  name: string;
  clientID: string;
  color: string;
  states: Map<number, MetaClientState>;
  meta: Record<string, any>;
  version: number;
  doc: any;
  localState: any;
}
