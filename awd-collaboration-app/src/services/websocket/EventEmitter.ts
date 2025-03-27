import { WebSocketEventCallback, WebSocketEventMap } from './types';

export class EventEmitter {
  private events: Map<keyof WebSocketEventMap, Set<WebSocketEventCallback>>;
  private maxListeners: number;

  constructor(maxListeners = 10) {
    this.events = new Map();
    this.maxListeners = maxListeners;
  }

  public on<K extends keyof WebSocketEventMap>(
    event: K,
    callback: WebSocketEventCallback<WebSocketEventMap[K]>
  ): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const listeners = this.events.get(event)!;
    if (listeners.size >= this.maxListeners) {
      console.warn(
        `Max listeners (${this.maxListeners}) exceeded for event '${String(event)}'`
      );
    }

    listeners.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  public once<K extends keyof WebSocketEventMap>(
    event: K,
    callback: WebSocketEventCallback<WebSocketEventMap[K]>
  ): () => void {
    const unsubscribe = this.on(event, (data: WebSocketEventMap[K]) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }

  public off<K extends keyof WebSocketEventMap>(
    event: K,
    callback: WebSocketEventCallback<WebSocketEventMap[K]>
  ): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  public emit<K extends keyof WebSocketEventMap>(
    event: K,
    data: WebSocketEventMap[K]
  ): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${String(event)}':`, error);
        }
      });
    }
  }

  public removeAllListeners(event?: keyof WebSocketEventMap): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  public listenerCount(event: keyof WebSocketEventMap): number {
    return this.events.get(event)?.size || 0;
  }

  public getMaxListeners(): number {
    return this.maxListeners;
  }

  public setMaxListeners(n: number): void {
    this.maxListeners = n;
  }
}
