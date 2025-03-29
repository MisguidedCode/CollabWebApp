import { EventEmitter } from '../services/websocket/EventEmitter';
import { WebSocketConfig, WebSocketEventMap } from '../services/websocket/types';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

interface Connection {
  provider: WebsocketProvider;
  doc: Y.Doc;
  listeners: Set<string>;
  lastUsed: number;
}

class MonitoredEventEmitter extends EventEmitter {
  private listenerCounts: Map<string, number>;
  private componentIds: Map<string, Set<string>>;
  
  constructor(maxListeners = 30) {
    super(maxListeners);
    this.listenerCounts = new Map();
    this.componentIds = new Map();
  }
  
  on<K extends keyof WebSocketEventMap>(
    event: K,
    callback: (data: WebSocketEventMap[K]) => void,
    componentId?: string
  ): () => void {
    this.updateListenerCount(event as string, 1);
    if (componentId) {
      this.trackComponentListener(event as string, componentId);
    }
    
    // Get the current count for this event
    const currentCount = this.listenerCounts.get(event as string) || 0;
    
    // Warn if approaching limit (80% of max)
    if (currentCount >= this.getMaxListeners() * 0.8) {
      console.warn(
        `Warning: Event '${String(event)}' is approaching max listeners (${currentCount}/${this.getMaxListeners()})`,
        componentId ? `Component: ${componentId}` : ''
      );
    }
    
    const unsubscribe = super.on(event, callback);
    return () => {
      unsubscribe();
      this.updateListenerCount(event as string, -1);
      if (componentId) {
        this.removeComponentListener(event as string, componentId);
      }
    };
  }
  
  private updateListenerCount(event: string, delta: number): void {
    const currentCount = this.listenerCounts.get(event) || 0;
    const newCount = Math.max(0, currentCount + delta);
    this.listenerCounts.set(event, newCount);
  }
  
  private trackComponentListener(event: string, componentId: string): void {
    if (!this.componentIds.has(event)) {
      this.componentIds.set(event, new Set());
    }
    this.componentIds.get(event)!.add(componentId);
  }
  
  private removeComponentListener(event: string, componentId: string): void {
    const components = this.componentIds.get(event);
    if (components) {
      components.delete(componentId);
      if (components.size === 0) {
        this.componentIds.delete(event);
      }
    }
  }
  
  getListenerStats(): { [event: string]: { count: number; components: string[] } } {
    const stats: { [event: string]: { count: number; components: string[] } } = {};
    this.listenerCounts.forEach((count, event) => {
      stats[event] = {
        count,
        components: Array.from(this.componentIds.get(event) || [])
      };
    });
    return stats;
  }
}

export class WebSocketConnectionManager {
  private static instance: WebSocketConnectionManager;
  private connections: Map<string, Connection>;
  private maxInactiveTime: number = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;
  private eventEmitter: MonitoredEventEmitter;
  
  private constructor() {
    this.connections = new Map();
    this.eventEmitter = new MonitoredEventEmitter(50); // Increased limit with monitoring
    this.startCleanupInterval();
  }
  
  static getInstance(): WebSocketConnectionManager {
    if (!WebSocketConnectionManager.instance) {
      WebSocketConnectionManager.instance = new WebSocketConnectionManager();
    }
    return WebSocketConnectionManager.instance;
  }
  
  getConnection(documentId: string, wsUrl: string = 'ws://localhost:4444'): Connection {
    const existing = this.connections.get(documentId);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing;
    }
    
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(wsUrl, `document-${documentId}`, ydoc);
    
    const connection: Connection = {
      provider,
      doc: ydoc,
      listeners: new Set(),
      lastUsed: Date.now()
    };
    
    this.connections.set(documentId, connection);
    return connection;
  }
  
  disposeConnection(documentId: string): void {
    const connection = this.connections.get(documentId);
    if (connection) {
      this.cleanupConnection(connection, documentId);
    }
  }
  
  registerListener(documentId: string, listenerId: string): void {
    const connection = this.connections.get(documentId);
    if (connection) {
      connection.listeners.add(listenerId);
      connection.lastUsed = Date.now();
    }
  }
  
  unregisterListener(documentId: string, listenerId: string): void {
    const connection = this.connections.get(documentId);
    if (connection) {
      connection.listeners.delete(listenerId);
      if (connection.listeners.size === 0) {
        this.disposeConnection(documentId);
      }
    }
  }
  
  private cleanupConnection(connection: Connection, documentId: string): void {
    connection.provider.disconnect();
    connection.doc.destroy();
    this.connections.delete(documentId);
  }
  
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      this.connections.forEach((connection, documentId) => {
        if (now - connection.lastUsed > this.maxInactiveTime && connection.listeners.size === 0) {
          this.cleanupConnection(connection, documentId);
        }
      });
    }, 60000); // Check every minute
  }
  
  getEventEmitter(): MonitoredEventEmitter {
    return this.eventEmitter;
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.connections.forEach((connection, documentId) => {
      this.cleanupConnection(connection, documentId);
    });
    
    this.connections.clear();
  }
  
  getConnectionStats(): { [documentId: string]: { listeners: string[]; lastUsed: Date } } {
    const stats: { [documentId: string]: { listeners: string[]; lastUsed: Date } } = {};
    this.connections.forEach((connection, documentId) => {
      stats[documentId] = {
        listeners: Array.from(connection.listeners),
        lastUsed: new Date(connection.lastUsed)
      };
    });
    return stats;
  }
}

export const connectionManager = WebSocketConnectionManager.getInstance();
