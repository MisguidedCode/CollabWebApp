import type { StorageConfig, StorageEventDetail } from '../StorageManager';

interface StorageItem<T> {
  value: T;
  size: number;
  timestamp: number;
  priority: number;
}

// Create mock storage container
const mockStorage = new Map<string, any>();

// Create mock functions with proper implementations
const mockFunctions = {
  set: jest.fn().mockImplementation((key: string, value: any) => {
    mockStorage.set(key, value);
    return Promise.resolve(true);
  }),
  get: jest.fn().mockImplementation((key: string) => {
    return mockStorage.get(key) || null;
  }),
  remove: jest.fn().mockImplementation((key: string) => {
    mockStorage.delete(key);
  }),
  clear: jest.fn().mockImplementation(() => {
    mockStorage.clear();
  }),
  getStats: jest.fn().mockReturnValue({
    totalSize: '500 B',
    remainingSpace: '500 KB',
    itemCount: mockStorage.size,
    isNearingCapacity: false
  }),
  addEventListener: jest.fn().mockReturnValue(() => {})
};

export class StorageManager {
  private static instance: StorageManager | null = null;
  private config: StorageConfig;
  private eventTarget: EventTarget;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      maxSize: 1024 * 1024,
      cleanupThreshold: 0.8,
      itemTTL: 24 * 60 * 60 * 1000,
      namespace: 'test',
      ...config
    };
    this.eventTarget = new EventTarget();
  }

  public static getInstance(config?: Partial<StorageConfig>): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager(config);
    }
    return StorageManager.instance;
  }

  public static clearInstance(): void {
    StorageManager.instance = null;
  }

  public async set<T>(key: string, value: T, priority: number = 1): Promise<boolean> {
    return mockFunctions.set(key, value, priority);
  }

  public get<T>(key: string): T | null {
    return mockFunctions.get(key);
  }

  public remove(key: string): void {
    mockFunctions.remove(key);
  }

  public clear(): void {
    mockFunctions.clear();
  }

  public getStats() {
    return mockFunctions.getStats();
  }

  public addEventListener(callback: (event: StorageEventDetail) => void) {
    return mockFunctions.addEventListener(callback);
  }
}

// Export mock functions for test assertions
export const mockStorageFunctions = mockFunctions;

export default StorageManager;
