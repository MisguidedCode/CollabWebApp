import { 
  getStringSize, 
  getTotalStorageSize, 
  parseStoredItem, 
  isStorageAvailable,
  getRemainingStorage,
  formatBytes
} from './storageHelpers';

export interface StorageConfig {
  maxSize: number;
  cleanupThreshold: number;
  itemTTL: number;
  namespace?: string;
}

export interface StorageItem<T> {
  value: T;
  size: number;
  timestamp: number;
  priority: number;
}

export type StorageEventType = 'quota-exceeded' | 'cleanup-started' | 'cleanup-completed' | 'error';

export interface StorageEventDetail {
  type: StorageEventType;
  message: string;
  data?: any;
}

const DEFAULT_CONFIG: StorageConfig = {
  maxSize: 1024 * 1024, // 1MB
  cleanupThreshold: 0.8, // 80% of maxSize
  itemTTL: 24 * 60 * 60 * 1000, // 24 hours
  namespace: 'app'
};

export class StorageManager {
  private config: StorageConfig;
  private eventTarget: EventTarget;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventTarget = new EventTarget();

    if (!isStorageAvailable()) {
      this.emitEvent('error', 'localStorage is not available');
      throw new Error('localStorage is not available');
    }
  }

  private getKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private emitEvent(type: StorageEventType, message: string, data?: any) {
    const event = new CustomEvent<StorageEventDetail>('storage', {
      detail: { type, message, data }
    });
    this.eventTarget.dispatchEvent(event);
  }

  public addEventListener(callback: (event: StorageEventDetail) => void) {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<StorageEventDetail>;
      callback(customEvent.detail);
    };
    this.eventTarget.addEventListener('storage', handler);
    return () => this.eventTarget.removeEventListener('storage', handler);
  }

  public async set<T>(key: string, value: T, priority: number = 1): Promise<boolean> {
    const fullKey = this.getKey(key);
    const item: StorageItem<T> = {
      value,
      size: getStringSize(JSON.stringify(value)),
      timestamp: Date.now(),
      priority
    };

    try {
      // Check if we need to clean up
      if (this.shouldCleanup()) {
        await this.cleanup();
      }

      // Check if we have enough space
      if (item.size > this.getRemainingSpace()) {
        this.emitEvent('quota-exceeded', `Not enough space to store ${key}`);
        return false;
      }

      localStorage.setItem(fullKey, JSON.stringify(item));
      return true;
    } catch (error) {
      this.emitEvent('error', `Failed to store ${key}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  public get<T>(key: string): T | null {
    const fullKey = this.getKey(key);
    const item = parseStoredItem<StorageItem<T>>(localStorage.getItem(fullKey));

    if (!item) return null;

    // Check if item has expired
    if (this.hasExpired(item)) {
      this.remove(key);
      return null;
    }

    return item.value;
  }

  public remove(key: string): void {
    const fullKey = this.getKey(key);
    localStorage.removeItem(fullKey);
  }

  public clear(): void {
    const prefix = this.getKey('');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  private shouldCleanup(): boolean {
    const currentSize = getTotalStorageSize();
    return currentSize >= this.config.maxSize * this.config.cleanupThreshold;
  }

  private getRemainingSpace(): number {
    return this.config.maxSize - getTotalStorageSize();
  }

  private hasExpired(item: StorageItem<any>): boolean {
    return Date.now() - item.timestamp > this.config.itemTTL;
  }

  private async cleanup(): Promise<void> {
    this.emitEvent('cleanup-started', 'Storage cleanup started');

    const items: Array<{ key: string; item: StorageItem<any> }> = [];
    const prefix = this.getKey('');

    // Collect all items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const item = parseStoredItem<StorageItem<any>>(localStorage.getItem(key));
        if (item) {
          items.push({ key, item });
        }
      }
    }

    // Sort items by priority (ascending) and timestamp (oldest first)
    items.sort((a, b) => {
      if (a.item.priority !== b.item.priority) {
        return a.item.priority - b.item.priority;
      }
      return a.item.timestamp - b.item.timestamp;
    });

    // Remove items until we're under threshold
    let currentSize = getTotalStorageSize();
    const targetSize = this.config.maxSize * this.config.cleanupThreshold;

    for (const { key } of items) {
      if (currentSize <= targetSize) break;
      
      const itemSize = getStringSize(localStorage.getItem(key) || '');
      localStorage.removeItem(key);
      currentSize -= itemSize;
    }

    this.emitEvent('cleanup-completed', 'Storage cleanup completed', {
      remainingSize: formatBytes(this.getRemainingSpace())
    });
  }

  public getStats() {
    return {
      totalSize: formatBytes(getTotalStorageSize()),
      remainingSpace: formatBytes(this.getRemainingSpace()),
      itemCount: localStorage.length,
      isNearingCapacity: this.shouldCleanup()
    };
  }
}
