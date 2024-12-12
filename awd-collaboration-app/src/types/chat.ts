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
  type: ChatType;
  name: string; // Channel name or user name for direct messages
  participants: string[]; // User IDs
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ChatState {
  activeChats: Chat[];
  messages: Record<string, Message[]>; // Keyed by chat ID
  currentChatId: string | null;
  loading: boolean;
  error: string | null;
}