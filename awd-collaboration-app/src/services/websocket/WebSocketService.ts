import {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessage,
  WebSocketEventMap,
  UserPresence
} from './types';
import { MessageQueue } from './MessageQueue';
import { PresenceManager } from './PresenceManager';
import { connectionManager } from '../../utils/WebSocketConnectionManager';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private config: WebSocketConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private eventEmitter: ReturnType<typeof connectionManager.getEventEmitter>;
  private messageQueue: MessageQueue;
  private presenceManager?: PresenceManager;

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.eventEmitter = connectionManager.getEventEmitter(); // Use the monitored event emitter
    this.messageQueue = new MessageQueue(
      async (message) => this.sendMessage(message),
      {
        processingInterval: 100,
        maxRetries: 3,
        retryTimeout: 1000
      }
    );
  }

  public async connect(workspaceId: string, authToken: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.updateStatus(ConnectionStatus.CONNECTING);

    try {
      const url = new URL(this.config.url);
      url.searchParams.append('workspaceId', workspaceId);
      url.searchParams.append('token', authToken);

      this.socket = new WebSocket(url.toString());
      this.setupSocketHandlers();

      // Initialize presence manager
      const userId = this.parseUserId(authToken); // Implement token parsing
      this.initializePresenceManager(userId, workspaceId);

    } catch (error) {
      this.handleError(error as Error);
      this.scheduleReconnect();
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.onConnectionEstablished();
    };

    this.socket.onclose = () => {
      this.onConnectionClosed();
    };

    this.socket.onerror = (event) => {
      const error = new Error('WebSocket error occurred');
      this.handleError(error);
    };

    this.socket.onmessage = (event) => {
      this.handleIncomingMessage(event);
    };
  }

  private onConnectionEstablished(): void {
    this.updateStatus(ConnectionStatus.CONNECTED);
    this.reconnectAttempts = 0;
    this.eventEmitter.emit('connect', undefined);

    // Start presence system
    this.presenceManager?.start();
  }

  private onConnectionClosed(): void {
    this.updateStatus(ConnectionStatus.DISCONNECTED);
    this.eventEmitter.emit('disconnect', undefined);
    this.scheduleReconnect();

    // Stop presence system
    this.presenceManager?.stop();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.updateStatus(ConnectionStatus.ERROR);
      return;
    }

    const delay = this.calculateReconnectDelay();
    this.updateStatus(ConnectionStatus.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(
        this.presenceManager!.getCurrentWorkspaceId(),
        this.getStoredAuthToken()
      );
    }, delay);
  }

  private calculateReconnectDelay(): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.reconnectInterval;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  public async sendMessage(message: WebSocketMessage): Promise<boolean> {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.messageQueue.enqueue(message);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageQueue.enqueue(message);
      return false;
    }
  }

  private handleIncomingMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle presence updates
      if (message.type === 'presence') {
        this.presenceManager?.updatePresence(
          message.payload.userId,
          message.payload
        );
      }

      this.eventEmitter.emit('message', message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  private handleError(error: Error): void {
    this.updateStatus(ConnectionStatus.ERROR);
    this.eventEmitter.emit('error', error);
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.eventEmitter.emit('statusChange', status);
  }

  public on<K extends keyof WebSocketEventMap>(
    event: K,
    callback: (data: WebSocketEventMap[K]) => void,
    componentId?: string
  ): () => void {
    return this.eventEmitter.on(event, callback, componentId);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private initializePresenceManager(userId: string, workspaceId: string): void {
    this.presenceManager = new PresenceManager(userId, workspaceId, {
      heartbeatInterval: 30000,
      inactivityTimeout: 60000
    });

    this.presenceManager.onPresenceChange((presence: UserPresence) => {
      this.sendMessage({
        type: 'presence',
        payload: presence,
        timestamp: Date.now()
      });
    });
  }

  // Helper methods
  private parseUserId(token: string): string {
    // TODO: Implement proper JWT token parsing
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId;
    } catch {
      throw new Error('Invalid auth token');
    }
  }

  private getStoredAuthToken(): string {
    // TODO: Implement proper token storage/retrieval
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No auth token found');
    return token;
  }

  public disconnect(): void {
    this.presenceManager?.cleanup();
    this.messageQueue.clear();
    this.eventEmitter.removeAllListeners();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  public getCurrentWorkspaceId(): string | undefined {
    return this.presenceManager?.getCurrentWorkspaceId();
  }

  public setPresenceAway(): void {
    this.presenceManager?.setAway();
  }

  public setPresenceOnline(): void {
    this.presenceManager?.setOnline();
  }

  public updateWorkspace(workspaceId: string): void {
    this.presenceManager?.updateWorkspace(workspaceId);
  }

  public getPresenceManager(): PresenceManager | undefined {
    return this.presenceManager;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService({
  url: 'ws://localhost:3001', // Should be configured from environment
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  connectionTimeout: 10000
});
