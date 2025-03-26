export type MessageType = 'text' | 'file';
export type ChatType = 'channel' | 'direct';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  senderId: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Chat {
  id: string;
  workspaceId: string; // Workspace this chat belongs to
  type: ChatType;
  name: string; // Channel name or user name for direct messages
  description?: string;
  participants: string[]; // User IDs
  lastMessage?: Partial<Message>;
  unreadCount?: number;
  createdAt?: string;
  lastUpdated?: string;
  meta?: Record<string, any>; // For storing additional metadata like user details for DMs
}

export interface ChatState {
  activeChats: Chat[];
  messages: Record<string, Message[]>; // Keyed by chat ID
  currentChatId: string | null;
  loading: boolean;
  error: string | null;
}
