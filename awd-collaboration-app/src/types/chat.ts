export interface EditHistory {
  content: string;
  timestamp: string;
}

export type MessageType = 'text' | 'file' | 'system';

export interface Message {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: MessageType;
  edited?: boolean;
  editedAt?: string;
  editHistory?: EditHistory[];
  isDeleted?: boolean;
  deletedAt?: string;
}

export type ChatType = 'direct' | 'channel';

export interface Chat {
  id: string;
  workspaceId: string;
  type: ChatType;
  name: string;
  description?: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
    type: MessageType;
  };
  lastUpdated: string;
  createdAt: string;
  meta?: Record<string, any>;
}
