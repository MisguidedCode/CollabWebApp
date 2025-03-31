export enum ConnectionStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE'
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: number;
  workspaceId: string;
  meta?: Record<string, any>;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  room?: string;
  timestamp: number;
  id?: string; // For message deduplication
  retry?: boolean; // For messages that should be retried on failure
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  debug?: boolean;
}

export interface WebSocketEventMap {
  connect: void;
  disconnect: void;
  message: WebSocketMessage;
  error: Error;
  statusChange: ConnectionStatus;
  presence: UserPresence;
  connectionStatus: boolean;
}

export interface WebSocketEvents extends WebSocketEventMap {
  [key: string]: any;
}

export type WebSocketEventCallback<T = any> = (data: T) => void;
